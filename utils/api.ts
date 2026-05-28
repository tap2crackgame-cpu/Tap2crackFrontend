/** Live backend (Railway). Override with EXPO_PUBLIC_API_URL in Vercel/local .env if needed. */
const PRODUCTION_API_URL =
  "https://tap2crackmaingame-production.up.railway.app";

const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
const devFallback =
  process.env.EXPO_PUBLIC_DEV_API_URL?.trim() || "http://localhost:8000";

function normalizeBase(url: string) {
  return url.replace(/\/$/, "");
}

export const API_BASE = normalizeBase(
  fromEnv || (__DEV__ ? devFallback : PRODUCTION_API_URL)
);

export const AUTH_API = `${API_BASE}/api/auth`;
