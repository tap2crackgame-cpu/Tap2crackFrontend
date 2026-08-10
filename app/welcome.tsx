import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useGoogleAuth } from "@/hooks/googleLogin";
import AuthLoadingScreen from "@/components/AuthLoadingScreen";
import { isOAuthReturnPending } from "@/utils/oauth";
import WelcomeLandingPage from "@/components/landing/WelcomeLandingPage";
import AppInfoSheet from "@/components/AppInfoSheet";
import SeoHead from "@/components/SeoHead";

export default function Tap2CrackWelcome() {
  const { loginAsGuest, authReady, authStatus } = useAuth();
  const { login, loading: googleLoading } = useGoogleAuth();

  const [guestLoading, setGuestLoading] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const onGuestPress = () => {
    setGuestLoading(true);
    loginAsGuest();
  };

  const onGooglePress = () => {
    login();
  };

  const blockingLoad =
    !authReady ||
    authStatus === "loading" ||
    isOAuthReturnPending() ||
    authStatus === "needs_phone" ||
    authStatus === "ready" ||
    authStatus === "guest" ||
    guestLoading ||
    googleLoading;

  if (blockingLoad) {
    const loadingLabel =
      isOAuthReturnPending() || googleLoading
        ? "Signing in with Google…"
        : !authReady || authStatus === "loading"
          ? "Loading…"
          : guestLoading
            ? "Starting as guest…"
            : "Loading…";

    return <AuthLoadingScreen message={loadingLabel} />;
  }

  return (
    <View style={styles.root}>
      <SeoHead page="home" />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <WelcomeLandingPage
          onGooglePress={onGooglePress}
          onGuestPress={onGuestPress}
          googleLoading={googleLoading}
          guestLoading={guestLoading}
          onInfoPress={() => setInfoOpen(true)}
        />
        <AppInfoSheet visible={infoOpen} onClose={() => setInfoOpen(false)} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1a1a2e" },
  safeArea: { flex: 1 },
});
