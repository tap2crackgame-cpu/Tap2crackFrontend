import { getAuthApi } from "@/utils/api";
import type { LeaderboardEntry } from "@/types/game";
import { normalizeWinner, type Winner } from "@/types/game";

export async function fetchLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${getAuthApi()}/leaderboard?limit=${limit}`);

  if (!res.ok) {
    const text = await res.text();
    console.log("ERROR RESPONSE:", text);
    throw new Error("Failed to fetch leaderboard");
  }

  const data = await res.json();
  if (Array.isArray(data)) {
    return data as LeaderboardEntry[];
  }
  if (data && Array.isArray(data.leaderboard)) {
    return data.leaderboard as LeaderboardEntry[];
  }
  return [];
}

export async function fetchWinners(limit = 50): Promise<Winner[]> {
  const res = await fetch(`${getAuthApi()}/winners?limit=${limit}`);

  if (!res.ok) {
    throw new Error("Failed to fetch winners");
  }

  const data = await res.json();
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row) =>
    normalizeWinner(row as Record<string, unknown>)
  );
}
