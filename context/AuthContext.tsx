import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, getUserRank, buildPowerUpInventoryFromList } from "@/types/game";
import { refreshAccessToken } from "@/auth/refreshAceestoke";
import {
  clearCachedProfile,
  loadCachedProfile,
  PROFILE_STALE_MS,
  saveCachedProfile,
} from "@/utils/cache";
import { AUTH_API } from "@/utils/api";

type AuthStatus =
  | "loading"
  | "unauthenticated"
  | "needs_phone"
  | "ready"
  | "guest";

type AuthContextType = {
  authUser: User | null;
  token: string | null;

  authStatus: AuthStatus;
  authReady: boolean;

  setAuthStatus: (status: AuthStatus) => void;

  loginWithGoogle: (tokens: {
    accessToken: string;
    refreshToken: string;
  }) => Promise<void>;
  loginWithGuestToken: (guestToken: string) => Promise<boolean>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  refreshProfile: (force?: boolean) => Promise<void>;
  setAuthUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [authReady, setAuthReady] = useState(false);
  const lastProfileFetchRef = useRef(0);

  /* ---------------- MAP USER ---------------- */

  const mapUser = (backend: any): User => {
    const wins = backend.stats?.wins ?? 0;

    const pUps = backend.powerUps ?? [];

    return {
      id: backend.id,
      isAdmin: backend.isAdmin ?? false,
      email: backend.email ?? null,
      name: backend.name ?? "Unknown",
      avatar: backend.avatarUrl ?? null,
      isGuest: backend.isGuest ?? false,
      phone: backend.phone ?? null,

      stats: {
        eggsCracked: backend.stats?.eggsCracked ?? 0,
        wins,
        weeklyEggsCracked: backend.stats?.weeklyEggsCracked ?? 0,
        totalTaps: backend.stats?.totalTaps ?? 0,
        rank: getUserRank(wins),
      },

      powerUps: pUps,

      powerUpInventory: buildPowerUpInventoryFromList(pUps),

      free2xAvailable: backend.free2xAvailable ?? false,
      roundsUntilFree2x: backend.roundsUntilFree2x ?? 0,
    };
  };

  /* ---------------- LOGOUT ---------------- */

  const logout = useCallback(async () => {
    setAuthUser(null);
    setToken(null);
    setAuthStatus("unauthenticated");
    lastProfileFetchRef.current = 0;
    await AsyncStorage.multiRemove(["token", "refreshToken"]);
    await clearCachedProfile();
  }, []);

  /* ---------------- FETCH PROFILE ---------------- */

  const fetchProfile = useCallback(async (currentToken: string) => {
  try {
    let res = await fetch(`${AUTH_API}/profile`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });

      
    if (res.status === 401) {
      console.log("Token expired, attempting refresh...");
      const newToken = await refreshAccessToken();

      if (!newToken) {
        console.warn("Refresh failed. User must log in again.");
        return null; 
      }

      const retryRes = await fetch(`${AUTH_API}/profile`, {
        headers: { Authorization: `Bearer ${newToken}` },
      });

      if (!retryRes.ok) return null;
      const data = await retryRes.json();
      const user = mapUser(data.user);
      setAuthUser(user);
      await saveCachedProfile(user);
      lastProfileFetchRef.current = Date.now();
      return { user, activeToken: newToken };
    }

    if (!res.ok) return null;
     
    const data = await res.json();
    if (!data.user) return null;
    const user = mapUser(data.user);
    setAuthUser(user);
    await saveCachedProfile(user);
    lastProfileFetchRef.current = Date.now();
    return { user, activeToken: currentToken };
  } catch (e) {
    return null;
  }
}, []);

  /* ---------------- COMPUTE STATUS ---------------- */

  const computeStatus = (user: User | null, token: string | null): AuthStatus => {
    if (!token || !user) return "unauthenticated";
    if (user.isGuest) return "guest";
    if (!user.phone) return "needs_phone";
    return "ready";
  };

  /* ---------------- BOOTSTRAP ---------------- */

 useEffect(() => {
  const bootstrap = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");

      if (!storedToken) {
        setAuthStatus("unauthenticated");
        setAuthReady(true);
        return;
      }

      setToken(storedToken);

      const cached = await loadCachedProfile();
      if (cached) {
        setAuthUser(cached);
        setAuthStatus(computeStatus(cached, storedToken));
        setAuthReady(true);
      }

      const result = await fetchProfile(storedToken);

      if (result) {
        setAuthStatus(computeStatus(result.user, result.activeToken));
      } else {
        console.log("Profile fetch failed. Token is likely invalid or DB was reset.");
        await AsyncStorage.multiRemove(["token", "refreshToken"]); 
        setToken(null);
        setAuthStatus("unauthenticated"); 
      }
    } catch (e) {
      console.error("Bootstrap error:", e);
      setAuthStatus("unauthenticated"); 
    } finally {
      setAuthReady(true);
    }
  };

  bootstrap();
}, [fetchProfile]);

  /* ---------------- LOGIN ---------------- */

  const loginWithGoogle = useCallback(async (tokens: {
  accessToken: string;
  refreshToken: string;
}) => {
  await AsyncStorage.setItem("token", tokens.accessToken);
  await AsyncStorage.setItem("refreshToken", tokens.refreshToken);

  setToken(tokens.accessToken);

  const result = await fetchProfile(tokens.accessToken);
  
  if (result) {
    setAuthStatus(computeStatus(result.user, result.activeToken));
  } else {
    setAuthStatus("unauthenticated");
  }
}, [fetchProfile]);

  const loginWithGuestToken = useCallback(async (guestToken: string) => {
    await AsyncStorage.setItem("token", guestToken);
    setToken(guestToken);

    const result = await fetchProfile(guestToken);
    if (!result) {
      await AsyncStorage.removeItem("token");
      setToken(null);
      setAuthUser(null);
      setAuthStatus("unauthenticated");
      return false;
    }

    if (result.activeToken !== guestToken) {
      await AsyncStorage.setItem("token", result.activeToken);
      setToken(result.activeToken);
    }

    setAuthStatus(computeStatus(result.user, result.activeToken));
    return true;
  }, [fetchProfile]);

  /* ---------------- GUEST ---------------- */

  function GuestId() {
    return `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  const loginAsGuest = () => {
    setAuthUser({
      id: GuestId(),
      isAdmin: false,
      email: null,
      name: "Guest",
      avatar: null,
      isGuest: true,
      phone: null,

      stats: {
        eggsCracked: 0,
        wins: 0,
        weeklyEggsCracked: 0,
        totalTaps: 0,
        rank: getUserRank(0),
      },

      powerUps: [],
      powerUpInventory: { "X2": 0, "X3": 0, "2x": 0, "3x": 0 },

      free2xAvailable: false,
      roundsUntilFree2x: 0,
    });

    setToken(null);
    setAuthStatus("needs_phone");
  };

  /* ---------------- REFRESH ---------------- */

  const refreshProfile = useCallback(async (force = false) => {
  if (!token) return;

  const age = Date.now() - lastProfileFetchRef.current;
  if (!force && lastProfileFetchRef.current > 0 && age < PROFILE_STALE_MS) {
    return;
  }

  const result = await fetchProfile(token);
  
  if (result) {
    if (result.activeToken !== token) {
      setToken(result.activeToken);
      await AsyncStorage.setItem("token", result.activeToken);
    }
    setAuthStatus(computeStatus(result.user, result.activeToken));
  } else if (force) {
    setAuthStatus("unauthenticated");
  }
}, [token, fetchProfile]);

  /* ---------------- VALUE ---------------- */

  const value = useMemo(
    () => ({
      authUser,
      token,
      authStatus,
      authReady,
      loginWithGoogle,
      loginWithGuestToken,
      loginAsGuest,
      logout,
      refreshProfile,
      setAuthUser,
      setToken,
      setAuthStatus,
    }),
    [authUser, setAuthUser, token, setToken, authStatus, authReady, setAuthStatus]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}