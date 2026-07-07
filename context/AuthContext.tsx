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
import { getAuthApi } from "@/utils/api";
import { isOAuthReturnPending } from "@/utils/oauth";
import { resolveUserStats, mergeUserStats } from "@/utils/userStats";

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
  refreshProfile: (force?: boolean, tokenOverride?: string) => Promise<void>;
  completePhoneSetup: (payload: {
    token?: string;
    user: {
      id: string;
      email?: string | null;
      name?: string;
      avatar?: string | null;
      isGuest?: boolean;
      phone?: string | null;
    };
  }) => Promise<void>;
  setAuthUser: React.Dispatch<React.SetStateAction<User | null>>;
  setToken: (token: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Older cached profiles may omit `stats`; map legacy flat fields. */
function normalizeCachedUser(raw: User & Record<string, unknown>): User {
  return { ...raw, stats: resolveUserStats(raw as User) };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [authReady, setAuthReady] = useState(false);
  const lastProfileFetchRef = useRef(0);

  /* ---------------- MAP USER ---------------- */

  const mapUser = (backend: any): User => {
    const pUps = backend.powerUps ?? [];
    const stats = resolveUserStats({
      ...backend,
      stats: backend.stats,
      wins: backend.stats?.wins ?? backend.wins,
      cracked: backend.stats?.eggsCracked ?? backend.cracked,
      weekly: backend.stats?.weeklyEggsCracked ?? backend.weekly,
      lifetime_taps: backend.stats?.totalTaps ?? backend.lifetime_taps,
    } as User & Record<string, unknown>);

    const draft: User = {
      id: backend.id,
      isAdmin: backend.isAdmin ?? false,
      email: backend.email ?? null,
      name: backend.name ?? "Unknown",
      avatar: backend.avatarUrl ?? backend.avatar ?? null,
      isGuest: backend.isGuest ?? false,
      phone: backend.phone ?? backend.phone_number ?? null,
      stats,
      powerUps: pUps,
      powerUpInventory: buildPowerUpInventoryFromList(pUps),
      free2xAvailable: backend.free2xAvailable ?? false,
      roundsUntilFree2x: backend.roundsUntilFree2x ?? 0,
    };
    return draft;
  };

  const applyProfileUser = useCallback((prev: User | null, mapped: User): User => {
    if (!prev) return mapped;
    return {
      ...mapped,
      stats: mergeUserStats(prev.stats, mapped.stats),
    };
  }, []);

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
    let res = await fetch(`${getAuthApi()}/profile`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });

      
    if (res.status === 401) {
      console.log("Token expired, attempting refresh...");
      const newToken = await refreshAccessToken();

      if (!newToken) {
        console.warn("Refresh failed. User must log in again.");
        return null; 
      }

      const retryRes = await fetch(`${getAuthApi()}/profile`, {
        headers: { Authorization: `Bearer ${newToken}` },
      });

      if (!retryRes.ok) return null;
      const data = await retryRes.json();
      const user = mapUser(data.user);
      setAuthUser((prev) => {
        const merged = applyProfileUser(prev, user);
        void saveCachedProfile(merged);
        return merged;
      });
      lastProfileFetchRef.current = Date.now();
      return { user, activeToken: newToken };
    }

    if (!res.ok) {
      if (__DEV__) {
        console.warn("[Profile] fetch failed:", res.status, await res.text().catch(() => ""));
      }
      return null;
    }

    const data = await res.json();
    if (!data.user) return null;
    const user = mapUser(data.user);
    setAuthUser((prev) => {
      const merged = applyProfileUser(prev, user);
      void saveCachedProfile(merged);
      return merged;
    });
    lastProfileFetchRef.current = Date.now();
    return { user, activeToken: currentToken };
  } catch (e) {
    if (__DEV__) {
      console.warn("[Profile] network error:", e);
    }
    return null;
  }
}, [applyProfileUser]);

  /* ---------------- COMPUTE STATUS ---------------- */

  const computeStatus = (user: User | null, token: string | null): AuthStatus => {
    if (!token || !user) return "unauthenticated";
    if (user.isGuest) return "guest";
    if (user.isAdmin) return "ready";
    if (!user.phone) return "needs_phone";
    return "ready";
  };

  /* ---------------- BOOTSTRAP ---------------- */

 useEffect(() => {
  const bootstrap = async () => {
    try {
      if (isOAuthReturnPending()) {
        setAuthStatus("loading");
        setAuthReady(true);
        return;
      }

      const storedToken = await AsyncStorage.getItem("token");

      if (!storedToken) {
        setAuthStatus("unauthenticated");
        setAuthReady(true);
        return;
      }

      setToken(storedToken);

      const cached = await loadCachedProfile();
      if (cached) {
        const normalized = normalizeCachedUser(
          cached as User & Record<string, unknown>
        );
        setAuthUser(normalized);
        setAuthStatus(computeStatus(normalized, storedToken));
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
  setAuthStatus("loading");
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

  const refreshProfile = useCallback(async (force = false, tokenOverride?: string) => {
  const activeToken = tokenOverride ?? token;
  if (!activeToken) return;

  const age = Date.now() - lastProfileFetchRef.current;
  if (!force && lastProfileFetchRef.current > 0 && age < PROFILE_STALE_MS) {
    return;
  }

  const result = await fetchProfile(activeToken);
  
  if (result) {
    if (result.activeToken !== activeToken) {
      setToken(result.activeToken);
      await AsyncStorage.setItem("token", result.activeToken);
    }
    setAuthStatus(computeStatus(result.user, result.activeToken));
  } else if (force && __DEV__) {
    console.warn("[Profile] refresh failed — keeping cached user");
  }
}, [token, fetchProfile]);

  const completePhoneSetup = useCallback(
    async (payload: {
      token?: string;
      user: {
        id: string;
        email?: string | null;
        name?: string;
        avatar?: string | null;
        isGuest?: boolean;
        phone?: string | null;
      };
    }) => {
      const nextToken = payload.token ?? token;
      if (nextToken) {
        await AsyncStorage.setItem("token", nextToken);
        setToken(nextToken);
      }

      const user = mapUser({
        id: payload.user.id,
        email: payload.user.email,
        name: payload.user.name,
        avatarUrl: payload.user.avatar,
        isGuest: payload.user.isGuest ?? false,
        phone: payload.user.phone,
        stats: authUser?.stats,
        wins: authUser?.stats?.wins,
        cracked: authUser?.stats?.eggsCracked,
        weekly: authUser?.stats?.weeklyEggsCracked,
        lifetime_taps: authUser?.stats?.totalTaps,
        powerUps: authUser?.powerUps,
      });

      setAuthUser(user);
      await saveCachedProfile(user);
      lastProfileFetchRef.current = Date.now();
      setAuthStatus(computeStatus(user, nextToken));

      if (nextToken) {
        void fetchProfile(nextToken);
      }
    },
    [token, authUser, fetchProfile]
  );

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
      completePhoneSetup,
      setAuthUser,
      setToken,
      setAuthStatus,
    }),
    [
      authUser,
      setAuthUser,
      token,
      setToken,
      authStatus,
      authReady,
      setAuthStatus,
      loginWithGoogle,
      loginWithGuestToken,
      loginAsGuest,
      logout,
      refreshProfile,
      completePhoneSetup,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}