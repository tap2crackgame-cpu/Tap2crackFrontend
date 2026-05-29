// Tap2Crack - Application Entry Point
// Auth-aware redirect (avoid flashing welcome when already signed in)

import { Redirect } from "expo-router";
import { Platform } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function Tap2CrackIndex() {
  const { authReady, authStatus } = useAuth();

  if (!authReady || authStatus === "loading") {
    return null;
  }

  if (authStatus === "ready" || authStatus === "guest") {
    return <Redirect href="/game" />;
  }

  if (authStatus === "needs_phone") {
    return <Redirect href="/phone" />;
  }

  let href = "/welcome";
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const search = window.location.search;
    if (search.includes("code=") || search.includes("error=")) {
      href = `/welcome${search}`;
    }
  }

  return <Redirect href={href} />;
}
