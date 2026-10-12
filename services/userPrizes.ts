import { getAuthApi } from "@/utils/api";
import type { DbWinner } from "@/types/game";

type Raw = Record<string, any>;

/** First non-empty string among the candidates. */
function pick(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

/**
 * The /my endpoint can return the coupon code in different places depending on how the
 * winner row was joined (prize_code, couponCode, coupon.code, price.code …). Normalize it so
 * the "Crack winnings" list and My Prizes page always show the code for past coupons.
 */
export function normalizeUserPrize(r: Raw): DbWinner {
  const coupon: Raw = r.coupon ?? r.Coupon ?? r.couponCode ?? {};
  const price: Raw = r.price ?? r.Price ?? r.prize ?? {};
  const couponObj = typeof coupon === "object" ? coupon : {};
  const priceObj = typeof price === "object" ? price : {};
  const prizeType = pick(r.prize_type, r.prizeType, priceObj.type, couponObj.code ? "coupon" : null) ?? "cash";
  return {
    ...(r as DbWinner),
    id: String(r.id ?? r._id ?? `${r.won_at ?? r.wonAt ?? ""}-${Math.random()}`),
    prize_type: prizeType,
    prize_description: pick(r.prize_description, r.prizeDescription, priceObj.description, couponObj.description, couponObj.name) ?? "Prize",
    prize_value: Number(r.prize_value ?? r.prizeValue ?? priceObj.value ?? priceObj.amount ?? 0),
    prize_code: pick(
      r.prize_code, r.prizeCode, r.coupon_code, r.couponCode && typeof r.couponCode !== "object" ? r.couponCode : null,
      r.code, couponObj.code, couponObj.couponCode, priceObj.code, priceObj.couponCode, priceObj.coupon?.code
    ),
    company_name: pick(r.company_name, r.companyName, couponObj.company_name, couponObj.companyName, couponObj.name, priceObj.company_name, priceObj.companyName),
    expires_at: pick(
      r.expires_at, r.expiresAt, r.coupon_expires_at, r.couponExpiresAt,
      couponObj.expires_at, couponObj.expiresAt, couponObj.expiry, priceObj.expires_at, priceObj.expiresAt
    ),
    egg_type: String(r.egg_type ?? r.eggType ?? r.egg?.eggType ?? "normal"),
    won_at: String(r.won_at ?? r.wonAt ?? r.createdAt ?? new Date().toISOString()),
    settlement_status: (r.settlement_status ?? r.settlementStatus ?? "PENDING") as DbWinner["settlement_status"],
  };
}

export async function fetchUserPrizes(token: string): Promise<DbWinner[]> {
  const res = await fetch(`${getAuthApi()}/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch prizes");
  }

  const json = await res.json();
  const list = (json.data ?? json.prizes ?? json ?? []) as Raw[];
  return (Array.isArray(list) ? list : []).map(normalizeUserPrize);
}
