import { getAuthApi } from "@/utils/api";
import type { DbWinner } from "@/types/game";

export async function fetchUserPrizes(token: string): Promise<DbWinner[]> {
  const res = await fetch(`${getAuthApi()}/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch prizes");
  }

  const json = await res.json();
  return (json.data ?? []) as DbWinner[];
}
