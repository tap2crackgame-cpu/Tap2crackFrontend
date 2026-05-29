import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUTH_API } from "@/utils/api";
import { showAlertAsToast } from "@/context/ToastContext";
import {
  clearOAuthQueryFromUrl,
  getOAuthReturnCode,
  getOAuthReturnError,
} from "@/utils/oauth";

type Tokens = { accessToken: string; refreshToken: string };

export function useGoogleOAuthCallback(
  loginWithGoogle: (tokens: Tokens) => Promise<void>,
  setAuthStatus: (status: "loading" | "unauthenticated") => void
) {
  const processingRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    if (processingRef.current) return;

    const oauthError = getOAuthReturnError();
    const code = getOAuthReturnCode();

    if (oauthError) {
      showAlertAsToast(
        "Google sign-in",
        new URLSearchParams(window.location.search).get("error_description") ||
          oauthError
      );
      clearOAuthQueryFromUrl();
      setAuthStatus("unauthenticated");
      return;
    }

    if (!code) return;

    processingRef.current = true;
    setAuthStatus("loading");
    clearOAuthQueryFromUrl();

    (async () => {
      try {
        const redirectUri = window.location.origin;
        const storedPhone = await AsyncStorage.getItem("temp_phone");

        const res = await fetch(`${AUTH_API}/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            phone: storedPhone || null,
            redirectUri,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg =
            data.error ||
            data.hint ||
            `Google login failed (${res.status})`;
          showAlertAsToast("Google sign-in", msg);
          setAuthStatus("unauthenticated");
          return;
        }

        if (!data.accessToken || !data.refreshToken) {
          showAlertAsToast("Google sign-in", "Missing tokens from server");
          setAuthStatus("unauthenticated");
          return;
        }

        await loginWithGoogle({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        await AsyncStorage.removeItem("temp_phone");
      } catch (err) {
        console.error("Google login error:", err);
        showAlertAsToast(
          "Google sign-in",
          "Could not reach the server. Check your connection."
        );
        setAuthStatus("unauthenticated");
      } finally {
        processingRef.current = false;
      }
    })();
  }, [loginWithGoogle, setAuthStatus]);
}
