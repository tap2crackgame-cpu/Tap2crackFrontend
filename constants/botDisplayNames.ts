/** Display-only names for the single bot user (matches backend botDisplayNames.js). */
export const BOT_USER_ID = "a1000001-0001-4001-8001-000000000001";

export const BOT_DISPLAY_NAMES = [
  "Emeka",
  "Chinedu",
  "Ngozi",
  "Ifeanyi",
  "Chioma",
  "Aisha",
  "Tunde",
  "Bola",
  "Seyi",
  "Kemi",
  "Nneka",
  "Obinna",
  "Amaka",
  "Uche",
  "Ibrahim",
  "Hauwa",
  "Ade",
  "Kunle",
  "Zainab",
  "Yemi",
  "Femi",
  "Sule",
  "Chisom",
  "Ada",
  "John",
] as const;

export function resolveBotDisplayName(seed: string): string {
  const s = String(seed || "bot");
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return BOT_DISPLAY_NAMES[hash % BOT_DISPLAY_NAMES.length];
}

export function isBotWinnerUserId(userId?: string | null): boolean {
  return String(userId ?? "") === BOT_USER_ID;
}
