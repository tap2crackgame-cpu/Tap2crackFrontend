import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types/game";

/** Profile hook for settings/history screens — avoids network refresh on every mount. */
export default function useUserProfile(options?: { refreshOnFocus?: boolean }) {
  const { authUser, token, refreshProfile } = useAuth();
  const refreshOnFocus = options?.refreshOnFocus ?? true;

  const user: User | null = authUser;

  const refetch = useCallback(() => refreshProfile(true), [refreshProfile]);

  useFocusEffect(
    useCallback(() => {
      if (!token || !refreshOnFocus) return;
      refreshProfile(true);
    }, [token, refreshOnFocus, refreshProfile])
  );

  return {
    user,
    loading: !user && !!token,
    refetch,
  };
}
