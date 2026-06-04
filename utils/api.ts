import { Platform } from "react-native";
import Constants from "expo-constants";

const PRODUCTION_API_URL =
  "https://tap2crackmaingame-production.up.railway.app";

function normalizeBase(url: string) {
  return url.replace(/\/$/, "");
}

/** Dev machine IP from Expo (works on physical device + Expo Go). */
function getExpoDevHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } })
      .manifest2?.extra?.expoClient?.hostUri;

  if (!hostUri || typeof hostUri !== "string") return null;
  const host = hostUri.split(":")[0]?.trim();
  if (!host || host === "localhost" || host === "127.0.0.1") return null;
  return host;
}

function getDefaultDevApiUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_DEV_API_URL?.trim();
  if (explicit) return normalizeBase(explicit);

  const expoHost = getExpoDevHost();
  if (expoHost) return `http://${expoHost}:8000`;

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }

  return "http://localhost:8000";
}

function resolveApiBase(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  const devOverride = process.env.EXPO_PUBLIC_DEV_API_URL?.trim();

  if (__DEV__) {
    const base = devOverride || getDefaultDevApiUrl() || configured || PRODUCTION_API_URL;
    if (__DEV__) {
      console.log("[API] Using base URL:", base);
    }
    return normalizeBase(base);
  }

  return normalizeBase(configured || PRODUCTION_API_URL);
}

export const API_BASE = resolveApiBase();

export const AUTH_API = `${API_BASE}/api/auth`;
