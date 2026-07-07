// Tap2Crack - Application Entry Point

import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import AuthLoadingScreen from "@/components/AuthLoadingScreen";
import { isOAuthReturnPending } from "@/utils/oauth";

export default function Tap2CrackIndex() {
  const { authReady, authStatus } = useAuth();

  if (!authReady || authStatus === "loading" || isOAuthReturnPending()) {
    return (
      <AuthLoadingScreen
        message={isOAuthReturnPending() ? "Signing in with Google…" : "Loading…"}
      />
    );
  }

  if (authStatus === "ready" || authStatus === "guest") {
    return <Redirect href="/game" />;
  }

  if (authStatus === "needs_phone") {
    return <Redirect href="/phone" />;
  }

  return <Redirect href="/welcome" />;
}
