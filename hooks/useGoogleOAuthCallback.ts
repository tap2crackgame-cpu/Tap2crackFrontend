import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUTH_API } from "@/utils/api";
import { showAlertAsToast } from "@/context/ToastContext";

type Tokens = { accessToken: string; refreshToken: string };

/**
 * Completes Google OAuth when the user returns with ?code= in the URL.
 * Must run at app root — index.tsx Redirect used to strip the query string.
 */
export function useGoogleOAuthCallback(
  loginWithGoogle: (tokens: Tokens) => Promise<void>
) {
  const processingRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    if (processingRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const oauthError = params.get("error");

    if (oauthError) {
      showAlertAsToast(
        "Google sign-in",
        params.get("error_description") || oauthError
      );
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (!code) return;

    processingRef.current = true;

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
          return;
        }

        if (!data.accessToken || !data.refreshToken) {
          showAlertAsToast("Google sign-in", "Missing tokens from server");
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
      } finally {
        window.history.replaceState({}, document.title, "/");
        processingRef.current = false;
      }
    })();
  }, [loginWithGoogle]);
}
