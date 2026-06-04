import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Winner } from "@/types/game";

const KEY = "tap2crack_recent_winners_v1";
const MAX = 10;

export async function loadCachedRecentWinners(): Promise<Winner[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Winner[]).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export async function saveCachedRecentWinners(winners: Winner[]) {
  try {
    const sorted = [...winners]
      .sort(
        (a, b) =>
          new Date(b.won_at).getTime() - new Date(a.won_at).getTime()
      )
      .slice(0, MAX);
    await AsyncStorage.setItem(KEY, JSON.stringify(sorted));
  } catch {
    /* ignore */
  }
}

export function mergeWinnersByRecency(
  ...lists: Winner[][]
): Winner[] {
  const byId = new Map<string, Winner>();
  for (const list of lists) {
    for (const w of list) {
      if (!w?.id) continue;
      const existing = byId.get(w.id);
      if (
        !existing ||
        new Date(w.won_at).getTime() >= new Date(existing.won_at).getTime()
      ) {
        byId.set(w.id, w);
      }
    }
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.won_at).getTime() - new Date(a.won_at).getTime()
  );
}
