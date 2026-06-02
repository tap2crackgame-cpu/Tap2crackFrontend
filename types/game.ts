export type EggType =
  | "normal"
  | "silver"
  | "golden"
  | "company"
  | "business"
  | "no-powerup";

export interface EggSession {
  roundId: string;
  roundNumber: number;
  totalTaps: number;
  currentTaps: number;
  isActive: boolean;

  egg: {
    id: string;
    type: EggType;
  };

  prize: Prize,
  
  cooldownEndTime: number | null;
  isCooldown?: boolean;
}

export type AllEggSessions = Partial<Record<EggType, EggSession>>;

export interface Prize {
  type: 'airtime' | 'coupon' | 'cash' | 'sponsor';
  value: number;
  description: string;
  currency: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logo?: string;
  color: string;
}

export type PowerUpType = '2x' | '3x' | 'X2' | 'X3';

export interface PowerUp {
  type: PowerUpType;
  count?: number;
  multiplier: number;
  cost: number;
  active: boolean;
}

export interface User {
  id: string;
  email: string | null ;
  name: string | null;
  avatar: string | null;
  phone?: string| null;
  isGuest: boolean;
  isAdmin: boolean;
  stats: UserStats;
  powerUps: PowerUp[];
  powerUpInventory: Record<PowerUpType, number>;
  free2xAvailable: boolean;
  roundsUntilFree2x: number;
}

export interface UserProfile {
  id: string;
  email: string | null ;
  name: string | null;
  avatar: string | null;
  phone_number?: string| null;
  isGuest: boolean;
  isAdmin: boolean;
  cracked: number;
  wins: number;
  rank: EggRank;
  createdAt: string;
  balance: number;
  lifetime_taps: number;
}

export interface UserStats {
  eggsCracked: number;
  totalTaps: number;
  wins: number;
  rank: EggRank;
  weeklyEggsCracked: number;
}

export type GameState = {
  currentEgg: EggSession | null;
  round: number;
  isCooldown: boolean;
  cooldownEndTime: number | null;
};

export type DbRound = {
  id: string;
  egg_id: string;
  egg_type: string;
  total_taps_required: number;
  current_total_taps: number;
  prize_type: string | null;
  prize_value: number | null;
  prize_description: string | null;
  round_number: number;
  is_active: boolean;
};

export type EggRank = 
  | 'Egg Novice' 
  | 'Shell Breaker' 
  | 'Yolk Hunter' 
  | 'Crack Master' 
  | 'Egg Legend';

export  type DbWinner = {
  id: string;
  user_name?: string;
  prize_description: string;
  prize_value: number;
  prize_code?: string | null;
  prize_type?: string;
  egg_type: string;
  company_name?: string | null;
  won_at: string;
  settlement_status?: 'PENDING' | 'CLAIMED';
  price_id?: string | null;
};

export function isPrizeSettled(status?: string | null): boolean {
  return String(status ?? 'PENDING').toUpperCase() === 'CLAIMED';
}

export function getUserSettlementLabel(status?: string | null): 'Pending' | 'Sent' {
  return isPrizeSettled(status) ? 'Sent' : 'Pending';
}

export interface Winner {
  id: string;
  user_name: string;
  user_id?: string;
  user_avatar: string | null;
  egg_id: string;
  egg_type: string;
  prize_type: string;
  prize_description: string;
  prize_value?: number;
  prize_code?: string | null;
  company_name?: string | null;
  won_at: string;
  screenshot_url?: string | null;
}

export function formatWinnerPrizeLabel(w: {
  prize_type?: string;
  prize_description?: string;
  prize_value?: number;
  prize_code?: string | null;
  company_name?: string | null;
}): string {
  if (w.prize_type === 'coupon') {
    const parts = [
      w.company_name,
      w.prize_description,
    ].filter(Boolean);
    return parts.join(' · ') || 'Coupon';
  }

  const value =
    w.prize_value && Number(w.prize_value) > 0
      ? ` · ₦${Number(w.prize_value).toLocaleString()}`
      : '';
  return `${w.prize_description || 'Prize'}${value}`;
}

/** Normalize API/socket winner payloads to a consistent Winner shape. */
export function normalizeWinner(raw: Record<string, unknown> | null | undefined): Winner {
  const w = raw ?? {};
  const wonAt = w.won_at ?? w.wonAt;
  const user = w.user as { name?: string; avatar?: string } | undefined;

  return {
    id: String(w.id ?? w.user_id ?? ""),
    user_id: String(w.user_id ?? w.userId ?? w.id ?? ""),
    user_name: String(
      w.user_name ?? w.username ?? user?.name ?? "Anonymous"
    ),
    user_avatar: (w.user_avatar as string | null) ?? user?.avatar ?? null,
    egg_id: String(w.egg_id ?? w.eggId ?? ""),
    egg_type: String(
      w.egg_type ?? w.eggType ?? (w.egg as { eggType?: string })?.eggType ?? "normal"
    ),
    prize_type: String(w.prize_type ?? w.prizeType ?? "cash"),
    prize_description: String(
      w.prize_description ?? w.prizeDescription ?? "Prize"
    ),
    prize_value: Number(w.prize_value ?? w.prizeValue ?? 0),
    prize_code: (w.prize_code as string | null) ?? (w.couponCode as string | null) ?? null,
    company_name: (w.company_name as string | null) ?? null,
    won_at:
      wonAt instanceof Date
        ? wonAt.toISOString()
        : String(wonAt ?? new Date().toISOString()),
    screenshot_url: (w.screenshot_url as string | null) ?? null,
  };
}

type UIState = {
  showWinModal: boolean;
  showLoseModal: boolean;
  activePowerUp: PowerUp | null;
  recentTaps: number;
};

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar: string | null;
  eggsCracked: number;
  weeklyEggsCracked: number;
  wins: number;
}

export interface AdminStats {
  total_users: number;
  /** Distinct users who won at least one completed match */
  total_winners: number;
  total_taps: number;
  total_payout: number;
  total_revenue: number;
  active_users_now: number;
  daily_ads_watches?: number;
  daily_rounds_played?: number;
}

export type DbPayment = {
  id: string;
  price_type: 'airtime' | 'cash';
  amount: number;
  user_name: string | null;
  user_phone: string | null;
  user_email?: string | null;
  prize_name?: string;
  settled_at: string;
  created_at: string;
};

export interface Price {
  id: string;
  priceType: 'airtime' | 'cash' | 'coupon';
  priceName: string;
  priceValue: string;
  status: 'PENDING' | 'CLAIMED';
  createdAt: string;
  user?: {
    name: string | null;
    phone_number: string | null;
    email?: string | null;
  };
  user_phone?: string | null;
}

export const EGG_CONFIGS: Record<EggType, { name: string; color: string; multiplier: number; frequency: string }> = {
  'normal': { name: 'Normal Egg', color: '#F4A460', multiplier: 1, frequency: 'Regular' },
  'no-powerup': { name: 'Pure Egg', color: '#E8E8E8', multiplier: 1, frequency: 'Twice monthly' },
  'silver': { name: 'Silver Egg', color: '#C0C0C0', multiplier: 1.5, frequency: '₦200 credit tier' },
  'golden': { name: 'Golden Egg', color: '#FFD700', multiplier: 4, frequency: '₦500 credit tier' },
  'company': { name: 'Company Egg', color: '#FF6B6B', multiplier: 1.5, frequency: 'Coupons/Discounts' },
  'business': { name: 'Business Egg', color: '#4ECDC4', multiplier: 1.5, frequency: 'Coupons/Discounts' },
};

export const EGG_RANKS: { rank: EggRank; minWins: number; color: string }[] = [
  { rank: 'Egg Novice', minWins: 0, color: '#8B7355' },
  { rank: 'Shell Breaker', minWins: 20, color: '#A0A0A0' },
  { rank: 'Yolk Hunter', minWins: 25, color: '#FFD700' },
  { rank: 'Crack Master', minWins: 50, color: '#FF6B6B' },
  { rank: 'Egg Legend', minWins: 90, color: '#9B59B6' },
];

export const getUserRank = (wins: number): EggRank => {
  for (let i = EGG_RANKS.length - 1; i >= 0; i--) {
    if (wins >= EGG_RANKS[i].minWins) {
      return EGG_RANKS[i].rank;
    }
  }
  return 'Egg Novice';
};

export const getRankColor = (rank: EggRank): string => {
  return EGG_RANKS.find(r => r.rank === rank)?.color || '#8B7355';
};

export const calculateRequiredTaps = (onlineUsers: number): number => {
  return Math.max(500, onlineUsers * 500);
};

export const calculatePowerUpCost = (prizeValue: number, multiplier: number): number => {
  if (multiplier === 2) return 40;
  if (multiplier === 3) return 50;
  return 0;
};

type PowerUpCountSource = {
  type?: string;
  count?: number;
  quantity?: number;
};

/** Build display counts from profile powerUps list (any type casing). */
export function buildPowerUpInventoryFromList(
  items: PowerUpCountSource[] = []
): Record<PowerUpType, number> {
  let twoX = 0;
  let threeX = 0;

  for (const item of items) {
    const qty = Number(item.count ?? item.quantity ?? 0);
    if (!qty) continue;
    const t = String(item.type ?? "").trim().toLowerCase();
    if (t === "3x" || t === "x3") threeX += qty;
    else if (t === "2x" || t === "x2") twoX += qty;
  }

  return { X2: twoX, X3: threeX, "2x": twoX, "3x": threeX };
}

/** Merge inventory maps without zeroing real counts from socket defaults. */
export function mergePowerUpInventory(
  ...sources: Array<Record<string, number | undefined> | null | undefined>
): Record<PowerUpType, number> {
  const raw: Record<string, number> = {};

  for (const src of sources) {
    if (!src) continue;
    for (const [key, val] of Object.entries(src)) {
      const n = Number(val);
      if (!Number.isFinite(n)) continue;
      raw[key] = Math.max(raw[key] ?? 0, n);
    }
  }

  const twoX = Math.max(raw["2x"] ?? 0, raw["X2"] ?? 0, raw["x2"] ?? 0);
  const threeX = Math.max(raw["3x"] ?? 0, raw["X3"] ?? 0, raw["x3"] ?? 0);

  return { X2: twoX, X3: threeX, "2x": twoX, "3x": threeX };
}
