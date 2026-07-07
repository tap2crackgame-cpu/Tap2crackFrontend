import { Platform } from "react-native";
import { Image } from "expo-image";
import type { PromoAd } from "@/services/ads";

const PRELOAD_TIMEOUT_MS = 12000;

export function preloadPromoAdMedia(ad: PromoAd | null | undefined): Promise<void> {
  if (!ad?.mediaUrl) return Promise.resolve();

  if (ad.mediaType === "video" && Platform.OS === "web") {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      const timeout = window.setTimeout(finish, PRELOAD_TIMEOUT_MS);
      const v = document.createElement("video");
      v.preload = "auto";
      v.muted = true;
      v.src = ad.mediaUrl;
      v.oncanplaythrough = () => {
        window.clearTimeout(timeout);
        finish();
      };
      v.onloadeddata = () => {
        window.clearTimeout(timeout);
        finish();
      };
      v.onerror = () => {
        window.clearTimeout(timeout);
        finish();
      };
    });
  }

  return Image.prefetch(ad.mediaUrl)
    .then(() => undefined)
    .catch(() => undefined);
}
