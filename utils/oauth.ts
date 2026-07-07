import { Platform } from "react-native";

export function getOAuthReturnCode(): string | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("code");
}

export function getOAuthReturnError(): string | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("error");
}

export function clearOAuthQueryFromUrl() {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  window.history.replaceState({}, document.title, window.location.pathname);
}

export function isOAuthReturnPending(): boolean {
  return Boolean(getOAuthReturnCode() || getOAuthReturnError());
}
