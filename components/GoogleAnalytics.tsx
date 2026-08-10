import { useEffect } from "react";
import { Platform } from "react-native";
import { usePathname } from "expo-router";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID;

function loadGoogleAnalytics() {
  if (Platform.OS !== "web" || typeof document === "undefined" || !MEASUREMENT_ID) return;

  if (document.getElementById("ga-script")) return;

  const script = document.createElement("script");
  script.id = "ga-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, {
    anonymize_ip: true,
    send_page_view: false,
  });
}

export function trackAnalyticsEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (Platform.OS !== "web" || !MEASUREMENT_ID || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

export default function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    loadGoogleAnalytics();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || !MEASUREMENT_ID || typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: typeof window !== "undefined" ? window.location.href : pathname,
      page_title: document.title,
    });
  }, [pathname]);

  return null;
}
