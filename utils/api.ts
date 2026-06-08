import { Platform } from "react-native";
import Constants from "expo-constants";

const PRODUCTION_API_URL =
  "https://tap2crackmaingame-production.up.railway.app";

const DEFAULT_DEV_API_PORT = "8000";

function normalizeBase(url: string) {
  return url.replace(/\/$/, "");
}

function isLoopbackHost(host: string) {
  return host === "localhost" || host === "127.0.0.1";
}

function hostFromUri(hostUri: string): string | null {
  const host = hostUri.split(":")[0]?.trim();
  if (!host || isLoopbackHost(host)) return null;
  return host;
}

/** LAN IP of the dev machine from Expo / Metro (physical device + Expo Go). */
export function getExpoDevHost(): string | null {
  const candidates: (string | undefined)[] = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost,
    (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string }; expoClient?: { hostUri?: string } } } })
      .manifest2?.extra?.expoGo?.debuggerHost,
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } })
      .manifest2?.extra?.expoClient?.hostUri,
  ];

  for (const uri of candidates) {
    if (!uri || typeof uri !== "string") continue;
    const host = hostFromUri(uri);
    if (host) return host;
  }

  return null;
}

function getDevApiPort(): string {
  const fromEnv = process.env.EXPO_PUBLIC_DEV_API_PORT?.trim();
  if (fromEnv) return fromEnv;

  const explicit = process.env.EXPO_PUBLIC_DEV_API_URL?.trim();
  if (explicit) {
    try {
      const port = new URL(explicit).port;
      if (port) return port;
    } catch {
      /* ignore */
    }
  }

  return DEFAULT_DEV_API_PORT;
}

function rewriteLoopbackForLan(url: string): string {
  const expoHost = getExpoDevHost();
  if (!expoHost) return url;

  try {
    const parsed = new URL(url);
    if (!isLoopbackHost(parsed.hostname)) return url;
    const port = parsed.port || getDevApiPort();
    return normalizeBase(`http://${expoHost}:${port}`);
  } catch {
    return url;
  }
}

function getDefaultDevApiUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_DEV_API_URL?.trim();
  const expoHost = getExpoDevHost();
  const port = getDevApiPort();

  if (explicit) {
    try {
      const parsed = new URL(explicit);
      if (expoHost && isLoopbackHost(parsed.hostname)) {
        return normalizeBase(`http://${expoHost}:${parsed.port || port}`);
      }
      return normalizeBase(explicit);
    } catch {
      return normalizeBase(explicit);
    }
  }

  if (expoHost) {
    return `http://${expoHost}:${port}`;
  }

  // 10.0.2.2 only works on Android emulator, not physical phones
  const isAndroidEmulator = Platform.OS === "android" && !Constants.isDevice;
  if (isAndroidEmulator) {
    return `http://10.0.2.2:${port}`;
  }

  return `http://localhost:${port}`;
}

function resolveApiBase(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (__DEV__) {
    const base = getDefaultDevApiUrl() || configured || PRODUCTION_API_URL;
    return normalizeBase(rewriteLoopbackForLan(base));
  }

  return normalizeBase(configured || PRODUCTION_API_URL);
}

let cachedApiBase: string | null = null;

/**
 * Resolve API base lazily so Expo LAN host is available on physical devices.
 * (Module-load resolution often runs before hostUri exists → stuck on localhost.)
 */
export function getApiBase(): string {
  const fresh = resolveApiBase();

  if (__DEV__) {
    const expoHost = getExpoDevHost();
    if (expoHost) {
      try {
        const parsed = new URL(fresh);
        if (isLoopbackHost(parsed.hostname)) {
          const port = parsed.port || getDevApiPort();
          cachedApiBase = normalizeBase(`http://${expoHost}:${port}`);
          console.log("[API] Dev base URL (LAN):", cachedApiBase);
          return cachedApiBase;
        }
      } catch {
        /* fall through */
      }
    }
    if (cachedApiBase !== fresh) {
      console.log("[API] Dev base URL:", fresh);
    }
    cachedApiBase = fresh;
    return fresh;
  }

  if (!cachedApiBase) cachedApiBase = fresh;
  return cachedApiBase;
}

export function getAuthApi(): string {
  return `${getApiBase()}/api/auth`;
}

/** Shown in dev error toasts when the backend is unreachable. */
export function getApiConnectionHint(): string {
  const base = getApiBase();
  const expoHost = getExpoDevHost();
  const port = getDevApiPort();
  let hint = `Cannot reach server at ${base}.`;
  hint += ` Start the backend (npm run dev in TAP2CRACK-BACKEND) on port ${port}.`;
  if (__DEV__) {
    try {
      if (!expoHost && isLoopbackHost(new URL(base).hostname)) {
        hint += ` On a phone, set EXPO_PUBLIC_DEV_API_URL=http://YOUR_PC_IP:${port} in expo/.env and restart Expo.`;
      }
    } catch {
      /* ignore */
    }
  }
  return hint;
}
