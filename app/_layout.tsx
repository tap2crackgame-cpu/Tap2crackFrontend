import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter,usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { useDisableZoomAndSelect } from "@/hooks/useDisableZoomAndSelect";
import { SocketProvider } from "@/hooks/SocketContext";
import { GameProvider } from "@/context/GameContext";
import { EggProvider } from "@/context/eggContext";
import { useAuth } from "@/context/AuthContext";
import { useGoogleOAuthCallback } from "@/hooks/useGoogleOAuthCallback";
import AuthLoadingScreen from "@/components/AuthLoadingScreen";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
});

function AppNavigation() {
  const { authStatus, authReady, loginWithGoogle, setAuthStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useGoogleOAuthCallback(loginWithGoogle, setAuthStatus);

  useEffect(() => {
  if (!authReady) return;

  if (authStatus === "loading") return;

  if (authStatus === "unauthenticated") {
    router.replace("/welcome");
    return;
  }

  if (authStatus === "needs_phone") {
    router.replace("/phone");
    return;
  }

  if (authStatus === "ready" || authStatus === "guest") {
    router.replace("/game");
  }
}, [authStatus, authReady, router]);

  const onAuthEntryRoute =
    pathname === "/" ||
    pathname === "" ||
    pathname === "/welcome" ||
    pathname.endsWith("/welcome");

  const showAuthOverlay =
    authReady &&
    (authStatus === "loading" ||
      (onAuthEntryRoute &&
        (authStatus === "needs_phone" ||
          authStatus === "ready" ||
          authStatus === "guest")));

  return (
    <>
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="phone" options={{ headerShown: false }} />
        <Stack.Screen name="game" options={{ headerShown: false }} />
        <Stack.Screen name="leaderboard" options={{ title: "\u{1F3C6} Leaderboard" }} />
        <Stack.Screen name="winners" options={{ title: "\u{1F389} Recent Winners" }} />
        <Stack.Screen name="prizes" options={{ title: "\u{1F381} Your Prizes" }} />
        <Stack.Screen name="profile" options={{ title: "\u{1F464} Your Profile" }} />
        <Stack.Screen name="egglookup" options={{ title: "Egg Lookup" }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen name="privacy-policy" options={{ title: "Privacy Policy" }} />
        <Stack.Screen name="terms" options={{ title: "Terms & Conditions" }} />
        <Stack.Screen name="sponsor" options={{ title: "Be a Sponsor" }} />
        <Stack.Screen name="buy-coffee" options={{ title: "Buy Us a Coffee" }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
      {showAuthOverlay ? (
        <View style={styles.authOverlay}>
          <AuthLoadingScreen
            message={
              authStatus === "loading"
                ? "Signing in with Google…"
                : authStatus === "needs_phone"
                  ? "Loading…"
                  : "Opening game…"
            }
          />
        </View>
      ) : null}
    </>
  );
}

export default function Tap2CrackRootLayout() {
  useDisableZoomAndSelect();

  useEffect(() => {
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };
    hideSplash();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <SocketProvider>
              <EggProvider>
                <GameProvider>
                  <GestureHandlerRootView style={styles.gestureRoot}>
                    <View style={styles.rootContainer}>
                      <AppNavigation />
                    </View>
                  </GestureHandlerRootView>
                </GameProvider>
              </EggProvider>
            </SocketProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  rootContainer: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    ...(Platform.OS === "web"
      ? ({ userSelect: "none", cursor: "default" } as const)
      : null),
  },
  authOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});
