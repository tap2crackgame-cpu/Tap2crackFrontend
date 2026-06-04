import type { User, UserStats } from "@/types/game";
import { getUserRank } from "@/types/game";

function toStatNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/** Normalize stats from API payload, cache, or legacy flat user fields. */
export function resolveUserStats(
  user: User | null | undefined
): UserStats {
  if (!user) {
    return {
      eggsCracked: 0,
      wins: 0,
      weeklyEggsCracked: 0,
      totalTaps: 0,
      rank: getUserRank(0),
    };
  }

  const raw = user as User & Record<string, unknown>;
  const nested = (raw.stats ?? {}) as Partial<UserStats> & Record<string, unknown>;

  const wins = toStatNumber(nested.wins ?? raw.wins);
  const eggsCracked = toStatNumber(
    nested.eggsCracked ?? nested.eggs_cracked ?? raw.cracked
  );
  const weeklyEggsCracked = toStatNumber(
    nested.weeklyEggsCracked ?? nested.weekly_eggs_cracked ?? raw.weekly
  );
  const totalTaps = toStatNumber(
    nested.totalTaps ?? nested.total_taps ?? raw.lifetime_taps
  );

  return {
    eggsCracked,
    wins,
    weeklyEggsCracked,
    totalTaps,
    rank: (nested.rank as UserStats["rank"]) || getUserRank(wins),
  };
}

export function formatStat(value: number): string {
  return String(toStatNumber(value));
}
