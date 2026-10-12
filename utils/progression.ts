import AsyncStorage from "@react-native-async-storage/async-storage";

/* =====================================================================
 * Player progression (frontend only)
 * - Levels come from the "Levels of Tappers" Clucky episodes.
 * - XP is worked out from stats the backend already sends (taps + wins),
 *   so nothing new is needed on the server.
 * - A few extra counters (rounds played, boosts used, night owl …) are kept
 *   on this device for badges.
 * - Clucky outfits unlock with levels; the chosen outfit is saved locally.
 * ===================================================================== */

export type LevelInfo = { level: number; name: string; emoji: string; minXp: number; color: string };

export const LEVELS: LevelInfo[] = [
  { level: 1, name: "Egg Rookie", emoji: "🥚", minXp: 0, color: "#FDE68A" },
  { level: 2, name: "Shell Shaker", emoji: "🐣", minXp: 500, color: "#A7F3D0" },
  { level: 3, name: "Yolk Hunter", emoji: "🔍", minXp: 2000, color: "#BAE6FD" },
  { level: 4, name: "Crack Master", emoji: "⚡", minXp: 6000, color: "#DDD6FE" },
  { level: 5, name: "Golden Tapper", emoji: "🏆", minXp: 15000, color: "#FEF08A" },
  { level: 6, name: "Egg Legend", emoji: "👑", minXp: 40000, color: "#FECACA" },
];

export const XP_PER_TAP = 1;
export const XP_PER_WIN = 300;

export type BasicStats = { totalTaps?: number; wins?: number; eggsCracked?: number };

export function getXp(stats?: BasicStats | null): number {
  if (!stats) return 0;
  const taps = Number(stats.totalTaps ?? 0) || 0;
  const wins = Number(stats.wins ?? stats.eggsCracked ?? 0) || 0;
  return Math.max(0, Math.round(taps * XP_PER_TAP + wins * XP_PER_WIN));
}

export function getLevel(xp: number) {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.minXp) cur = l;
  const next = LEVELS.find((l) => l.level === cur.level + 1) ?? null;
  const progress = next ? Math.min(1, (xp - cur.minXp) / (next.minXp - cur.minXp)) : 1;
  return { current: cur, next, progress, xpToNext: next ? next.minXp - xp : 0 };
}

/* ---------------- Clucky outfits ---------------- */
export type OutfitId = "plain" | "party" | "shades" | "cap" | "crown" | "legend";

export const OUTFITS: { id: OutfitId; name: string; unlockLevel: number; emoji: string }[] = [
  { id: "plain", name: "Classic", unlockLevel: 1, emoji: "🐔" },
  { id: "party", name: "Party Hat", unlockLevel: 2, emoji: "🥳" },
  { id: "shades", name: "Shades", unlockLevel: 3, emoji: "😎" },
  { id: "cap", name: "T2C Cap", unlockLevel: 4, emoji: "🧢" },
  { id: "crown", name: "Crown", unlockLevel: 5, emoji: "👑" },
  { id: "legend", name: "Legend Drip", unlockLevel: 6, emoji: "💎" },
];

const OUTFIT_KEY = "t2c_clucky_outfit";
let outfitCache: OutfitId = "plain";
const outfitListeners = new Set<(o: OutfitId) => void>();

export async function loadOutfit(): Promise<OutfitId> {
  try {
    const v = (await AsyncStorage.getItem(OUTFIT_KEY)) as OutfitId | null;
    if (v && OUTFITS.some((o) => o.id === v)) outfitCache = v;
  } catch {}
  return outfitCache;
}

export function getOutfitSync(): OutfitId {
  return outfitCache;
}

export async function saveOutfit(id: OutfitId) {
  outfitCache = id;
  outfitListeners.forEach((fn) => fn(id));
  try {
    await AsyncStorage.setItem(OUTFIT_KEY, id);
  } catch {}
}

export function onOutfitChange(fn: (o: OutfitId) => void) {
  outfitListeners.add(fn);
  return () => {
    outfitListeners.delete(fn);
  };
}

/** Outfit that is actually worn: falls back to the best unlocked one if the saved one is locked. */
export function effectiveOutfit(saved: OutfitId, level: number): OutfitId {
  const o = OUTFITS.find((x) => x.id === saved);
  if (o && o.unlockLevel <= level) return saved;
  return "plain";
}

/* ---------------- local counters for badges ---------------- */
export type LocalProgress = {
  rounds: number; // rounds you tapped in
  boostsUsed: number;
  nightOwl: boolean; // tapped between 00:00 and 04:59
  bigRound: boolean; // did 20%+ of an egg's cracks in one round
  shares: number;
  roundIds: string[]; // last few rounds counted (avoid double counting)
};

const LOCAL_KEY = "t2c_local_progress";
const EMPTY: LocalProgress = { rounds: 0, boostsUsed: 0, nightOwl: false, bigRound: false, shares: 0, roundIds: [] };
let localCache: LocalProgress = { ...EMPTY };
let localLoaded = false;

export async function loadLocalProgress(): Promise<LocalProgress> {
  if (localLoaded) return localCache;
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (raw) localCache = { ...EMPTY, ...JSON.parse(raw) };
  } catch {}
  localLoaded = true;
  return localCache;
}

async function saveLocal() {
  try {
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(localCache));
  } catch {}
}

/** Call on your first tap of a round. */
export async function recordRoundPlayed(roundId: string) {
  await loadLocalProgress();
  if (!roundId || localCache.roundIds.includes(roundId)) return;
  localCache.rounds += 1;
  localCache.roundIds = [...localCache.roundIds.slice(-30), roundId];
  const h = new Date().getHours();
  if (h >= 0 && h < 5) localCache.nightOwl = true;
  void saveLocal();
}

export async function recordBoostUsed() {
  await loadLocalProgress();
  localCache.boostsUsed += 1;
  void saveLocal();
}

export async function recordBigRound() {
  await loadLocalProgress();
  if (localCache.bigRound) return;
  localCache.bigRound = true;
  void saveLocal();
}

export async function recordShare() {
  await loadLocalProgress();
  localCache.shares += 1;
  void saveLocal();
}

/* ---------------- badges ---------------- */
export type Badge = { id: string; emoji: string; name: string; hint: string; earned: boolean };

export function getBadges(stats: BasicStats | null | undefined, local: LocalProgress): Badge[] {
  const wins = Number(stats?.wins ?? stats?.eggsCracked ?? 0) || 0;
  const taps = Number(stats?.totalTaps ?? 0) || 0;
  return [
    { id: "first-crack", emoji: "🐣", name: "First Crack", hint: "Win your first egg", earned: wins >= 1 },
    { id: "hat-trick", emoji: "🎩", name: "Hat Trick", hint: "Win 3 eggs", earned: wins >= 3 },
    { id: "egg-hunter", emoji: "🏆", name: "Egg Hunter", hint: "Win 10 eggs", earned: wins >= 10 },
    { id: "1k-taps", emoji: "👆", name: "1K Taps", hint: "Tap 1,000 times", earned: taps >= 1000 },
    { id: "10k-taps", emoji: "🔥", name: "10K Taps", hint: "Tap 10,000 times", earned: taps >= 10000 },
    { id: "regular", emoji: "📅", name: "Regular", hint: "Play 25 rounds", earned: local.rounds >= 25 },
    { id: "carry", emoji: "💪", name: "Egg Carrier", hint: "Do 20% of one egg's cracks", earned: local.bigRound },
    { id: "booster", emoji: "⚡", name: "Boosted", hint: "Use a 2x or 3x boost", earned: local.boostsUsed >= 1 },
    { id: "night-owl", emoji: "🦉", name: "Night Owl", hint: "Play after midnight", earned: local.nightOwl },
    { id: "hype", emoji: "📣", name: "Hype Chicken", hint: "Share a win", earned: local.shares >= 1 },
  ];
}
