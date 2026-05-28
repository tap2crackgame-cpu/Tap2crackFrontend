import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@/types/game";

const PROFILE_KEY = "tap2crack_profile_v1";
const PROFILE_TS_KEY = "tap2crack_profile_ts_v1";

/** How long cached profile is treated as fresh before a background refresh. */
export const PROFILE_STALE_MS = 5 * 60 * 1000;

export async function loadCachedProfile(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function saveCachedProfile(user: User): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [PROFILE_KEY, JSON.stringify(user)],
      [PROFILE_TS_KEY, String(Date.now())],
    ]);
  } catch {
    // non-fatal
  }
}

export async function getProfileCacheAge(): Promise<number | null> {
  try {
    const ts = await AsyncStorage.getItem(PROFILE_TS_KEY);
    if (!ts) return null;
    return Date.now() - Number(ts);
  } catch {
    return null;
  }
}

export async function clearCachedProfile(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([PROFILE_KEY, PROFILE_TS_KEY]);
  } catch {
    // non-fatal
  }
}
