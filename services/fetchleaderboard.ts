import { AUTH_API } from "@/utils/api";

export async function fetchLeaderboard(limit = 50) {
  const res = await fetch(`${AUTH_API}/leaderboard?limit=${limit}`);

  if (!res.ok) {
    const text = await res.text();
    console.log("ERROR RESPONSE:", text); 
    throw new Error("Failed to fetch leaderboard");
  }

  return res.json();
}



export async function fetchWinners(limit = 50) {
  const res = await fetch(`${AUTH_API}/winners?limit=${limit}`);

  if (!res.ok) {
    throw new Error("Failed to fetch winners");
  }

  return res.json();
}