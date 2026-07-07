import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Animated, ActivityIndicator, useWindowDimensions, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Egg, Zap, Trophy, Users, Phone } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import BengzFooter from "@/components/BengzFooter";
import { useGoogleAuth } from "@/hooks/googleLogin";
import AuthLoadingScreen from "@/components/AuthLoadingScreen";
import { isOAuthReturnPending } from "@/utils/oauth";

export default function Tap2CrackWelcome() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const { authUser, loginAsGuest, authReady, authStatus } = useAuth();
  const { login, loading: googleLoading } = useGoogleAuth();

  const [guestLoading, setGuestLoading] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(50)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const animStartedRef = useRef(false);

  /* ---------------- ANIMATION FIXED BLOCK ---------------- */

  useEffect(() => {
    if (authUser) return;
    if (animStartedRef.current) return;

    animStartedRef.current = true;

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [authUser]);

  /* ---------------- SAVE PROGRESS ---------------- */
  const saveProgress = async (progress: any) => {
    try {
      await AsyncStorage.setItem("game_progress", JSON.stringify(progress));
    } catch (err) {
      console.log("SAVE ERROR:", err);
    }
  };

  /* ---------------- FLOATING EGGS ---------------- */
  const renderFloatingEgg = (x: number, y: number, s: number, c: string, key: string) => (
    <Animated.View
      key={key}
      style={[
        styles.floatEgg,
        {
          left: x,
          top: y,
          backgroundColor: c,
          transform: [
            { scale: s },
            {
              translateY: float.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -20],
              }),
            },
          ],
          opacity: float.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.3, 0.6, 0.3],
          }),
        },
      ]}
    />
  );

  /* ---------------- GUEST LOGIN ---------------- */
  const onGuestPress = async () => {
    setGuestLoading(true);
    loginAsGuest();
  };

  /* ---------------- GOOGLE LOGIN BUTTON FIX ---------------- */
  const onGooglePress = async () => {
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

  const contentMaxW = Math.min(480, width - 32);
  const lockViewport = height < 760 || width < 420;
  const veryCompact = height < 620 || (height < 700 && width < 380);
  const isCompact = width < 380 || height < 640 || lockViewport;
  const titleSize = veryCompact
    ? Math.min(26, Math.max(22, width * 0.065))
    : isCompact
      ? Math.min(32, Math.max(24, width * 0.08))
      : Math.min(42, Math.max(28, width * 0.095));
  const eggIconSize = veryCompact ? 56 : isCompact ? 72 : 120;
  const glowSize = veryCompact ? 68 : isCompact ? 88 : 140;
  const featureGap = veryCompact ? 8 : width < 400 ? 10 : 20;
  const padH = width < 360 ? 12 : 24;
  const topContentPad = Math.max(insets.top, 8) + (Platform.OS === "web" && !lockViewport ? 56 : 12);
  const showFloatEggs = !veryCompact;

  /* ---------------- LOADING UI ---------------- */
  if (blockingLoad) {
    const loadingLabel = 
    isOAuthReturnPending() || googleLoading
      ? "Signing in with Google…"
      : !authReady || authStatus === "loading"
      ? "Loading…"
      : guestLoading
      ? "Starting as guest…"
      : authStatus === "needs_phone" || authStatus === "ready" || authStatus === "guest"
      ? "Loading…"
      : "Loading…";

    return <AuthLoadingScreen message={loadingLabel} />;
  }

  /* ---------------- FLOATING EGGS ARRAY ---------------- */
  const floatEggs = isCompact
    ? [
        { x: width * 0.08, y: height * 0.08, s: 0.65, c: "#FFD700", k: "e1" },
        { x: width * 0.78, y: height * 0.12, s: 0.5, c: "#C0C0C0", k: "e2" },
        { x: width * 0.12, y: height * 0.55, s: 0.45, c: "#4ECDC4", k: "e3" },
        { x: width * 0.82, y: height * 0.62, s: 0.55, c: "#FFD700", k: "e4" },
      ]
    : [
        { x: width * 0.1, y: height * 0.1, s: 0.8, c: "#FFD700", k: "e1" },
        { x: width * 0.8, y: height * 0.15, s: 0.6, c: "#C0C0C0", k: "e2" },
        { x: width * 0.15, y: height * 0.4, s: 0.5, c: "#F4A460", k: "e3" },
        { x: width * 0.75, y: height * 0.5, s: 0.7, c: "#FF6B6B", k: "e4" },
        { x: width * 0.05, y: height * 0.7, s: 0.4, c: "#4ECDC4", k: "e5" },
        { x: width * 0.85, y: height * 0.75, s: 0.5, c: "#FFD700", k: "e6" },
      ];

  const featureRowLayout = lockViewport || width < 420;
  const featureIconSize = veryCompact ? 16 : width < 400 ? 18 : 20;
  const featureIconBox = veryCompact ? 34 : isCompact ? 38 : 44;

  const mainContent = (
    <Animated.View
      style={[
        styles.content,
        lockViewport && styles.contentLocked,
        {
          opacity: fade,
          transform: [{ translateY: slide }],
          maxWidth: contentMaxW,
          width: "100%",
          paddingHorizontal: padH,
          alignSelf: "center",
        },
      ]}
    >
      <Animated.View
        style={[
          styles.eggWrap,
          {
            marginBottom: veryCompact ? 6 : isCompact ? 10 : 28,
            transform: [{ translateY: bounce }],
          },
        ]}
      >
        <View style={[styles.mainEgg, { width: glowSize, height: glowSize }]}>
          <Egg size={eggIconSize} color="#FFD700" strokeWidth={1.5} />
          <View style={[styles.glow, { width: glowSize, height: glowSize, borderRadius: glowSize / 2 }]} />
        </View>
      </Animated.View>

      <Text
        style={[styles.title, { fontSize: titleSize, marginBottom: veryCompact ? 4 : isCompact ? 6 : 10 }]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        Tap2Crack
      </Text>
      <Text
        style={[
          styles.subtitle,
          lockViewport && styles.subtitleLocked,
          {
            marginBottom: veryCompact ? 8 : isCompact ? 12 : 32,
            fontSize: veryCompact ? 11 : width < 400 ? 13 : 16,
            lineHeight: veryCompact ? 15 : width < 400 ? 18 : 22,
          },
        ]}
        numberOfLines={veryCompact ? 2 : lockViewport ? 3 : undefined}
      >
        Tap, crack, and win money, credit, vouchers & coupons.
      </Text>

      <View
        style={[
          styles.features,
          {
            gap: featureGap,
            marginBottom: veryCompact ? 8 : isCompact ? 12 : 40,
            flexDirection: featureRowLayout ? "row" : "row",
            width: "100%",
            justifyContent: featureRowLayout ? "space-around" : "space-between",
          },
        ]}
      >
        <View style={[styles.feature, featureRowLayout && styles.featureRow, featureRowLayout && styles.featureRowCompact]}>
          <View
            style={[
              styles.featureIcon,
              { backgroundColor: "rgba(255,107,107,0.2)", width: featureIconBox, height: featureIconBox, borderRadius: featureIconBox / 2 },
            ]}
          >
            <Zap size={featureIconSize} color="#FF6B6B" />
          </View>
          {!veryCompact ? (
            <Text style={[styles.featureText, featureRowLayout && styles.featureTextRow]} numberOfLines={2}>
              Real-time multiplayer
            </Text>
          ) : null}
        </View>
        <View style={[styles.feature, featureRowLayout && styles.featureRow, featureRowLayout && styles.featureRowCompact]}>
          <View
            style={[
              styles.featureIcon,
              { backgroundColor: "rgba(255,215,0,0.2)", width: featureIconBox, height: featureIconBox, borderRadius: featureIconBox / 2 },
            ]}
          >
            <Trophy size={featureIconSize} color="#FFD700" />
          </View>
          {!veryCompact ? (
            <Text style={[styles.featureText, featureRowLayout && styles.featureTextRow]} numberOfLines={2}>
              Win real prizes
            </Text>
          ) : null}
        </View>
        <View style={[styles.feature, featureRowLayout && styles.featureRow, featureRowLayout && styles.featureRowCompact]}>
          <View
            style={[
              styles.featureIcon,
              { backgroundColor: "rgba(78,205,196,0.2)", width: featureIconBox, height: featureIconBox, borderRadius: featureIconBox / 2 },
            ]}
          >
            <Users size={featureIconSize} color="#4ECDC4" />
          </View>
          {!veryCompact ? (
            <Text style={[styles.featureText, featureRowLayout && styles.featureTextRow]} numberOfLines={2}>
              Play with friends
            </Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.buttons, { gap: veryCompact ? 8 : isCompact ? 10 : 16 }]}>
        <TouchableOpacity
          style={[styles.googleBtn, googleLoading && styles.disabledBtn]}
          onPress={onGooglePress}
          disabled={googleLoading}
        >
          <LinearGradient
            colors={["#4285F4", "#34A853"]}
            style={[styles.gradientBtn, (isCompact || lockViewport) && styles.gradientBtnCompact]}
          >
            {googleLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={[styles.googleText, (isCompact || lockViewport) && styles.googleTextCompact]}>
                Sign in with Google
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.guestBtn, guestLoading && styles.disabledBtn, lockViewport && styles.guestBtnCompact]}
          onPress={onGuestPress}
          disabled={guestLoading}
        >
          {guestLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={[styles.guestText, (isCompact || lockViewport) && styles.guestTextCompact]}>Play as Guest</Text>
          )}
        </TouchableOpacity>
      </View>

      {!veryCompact ? (
        <Text style={[styles.terms, { marginTop: isCompact ? 10 : 28 }]} numberOfLines={2}>
          No payment required to win. Power-ups are optional boosts.
        </Text>
      ) : null}
    </Animated.View>
  );

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
        {lockViewport ? (
          <View
            style={[
              styles.viewportLock,
              Platform.OS === "web" && styles.viewportLockWeb,
              { paddingTop: topContentPad, paddingBottom: Math.max(insets.bottom, 4) },
            ]}
          >
            {showFloatEggs ? (
              <View style={[styles.decorLayer, { height: height * 0.5, marginTop: 0 }]}>
                {floatEggs.map((fe) => renderFloatingEgg(fe.x, fe.y, fe.s, fe.c, fe.k))}
              </View>
            ) : null}
            <View style={styles.viewportBody}>{mainContent}</View>
            <View style={[styles.viewportFooter, veryCompact && styles.viewportFooterCompact]}>
              <BengzFooter />
            </View>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                {
                  paddingTop: topContentPad,
                  paddingBottom: insets.bottom + 88,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={Platform.OS !== "web"}
            >
              <View style={[styles.decorLayer, { height: Math.min(height * 0.75, 480), marginTop: 8 }]}>
                {floatEggs.map((fe) => renderFloatingEgg(fe.x, fe.y, fe.s, fe.c, fe.k))}
              </View>
              {mainContent}
            </ScrollView>
            <View style={[styles.bengzFooterWrap, { paddingBottom: insets.bottom }]}>
              <BengzFooter />
            </View>
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  viewportLock: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
  },
  viewportLockWeb: {
    maxHeight: "100vh",
    height: "100%",
  } as object,
  viewportBody: {
    flex: 1,
    justifyContent: "center",
    minHeight: 0,
    zIndex: 1,
  },
  viewportFooter: {
    flexShrink: 0,
    zIndex: 1,
  },
  viewportFooterCompact: {
    transform: [{ scale: 0.92 }],
    marginTop: -4,
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: "center" },
  contentLocked: {
    flexShrink: 1,
    justifyContent: "center",
  },
  subtitleLocked: {
    paddingHorizontal: 2,
  },
  decorLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    pointerEvents: "none",
  },
  loadingRoot: {
    flex: 1,
    width: "100%",
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingInner: { alignItems: "center", zIndex: 1 },
  loadingText: { color: "rgba(255,255,255,0.7)", marginTop: 12, fontSize: 14 },
  floatEgg: { position: "absolute", width: 36, height: 46, borderRadius: 18 },
  content: { alignItems: "center", zIndex: 1 },
  eggWrap: { alignItems: "center" },
  mainEgg: { justifyContent: "center", alignItems: "center" },
  glow: {
    position: "absolute",
    backgroundColor: "rgba(255,215,0,0.3)",
    transform: [{ scale: 1.2 }],
    zIndex: -1,
  },
  title: { fontWeight: "bold" as const, color: "#FFF", textAlign: "center", textShadowColor: "rgba(255,215,0,0.5)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  subtitle: { color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 22, paddingHorizontal: 4 },
  features: { alignItems: "stretch" },
  feature: { alignItems: "center", gap: 8, flex: 1 },
  featureRow: { flexDirection: "row", flex: 1, alignItems: "center", gap: 8, minWidth: 0, paddingVertical: 2 },
  featureRowCompact: { flex: 0, justifyContent: "center", gap: 4, paddingVertical: 0 },
  featureIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  featureText: { fontSize: 11, color: "rgba(255,255,255,0.65)", textAlign: "center", flex: 1 },
  featureTextRow: { textAlign: "left", fontSize: 13 },
  errorBanner: { backgroundColor: "rgba(255,107,107,0.2)", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, width: "100%" },
  errorText: { color: "#FF6B6B", fontSize: 13, textAlign: "center" },
  buttons: { width: "100%" },
  googleBtn: { borderRadius: 16, overflow: "hidden", width: "100%" },
  gradientBtn: { paddingVertical: 16, paddingHorizontal: 24, alignItems: "center" },
  gradientBtnCompact: { paddingVertical: 12, paddingHorizontal: 14 },
  guestBtnCompact: { paddingVertical: 12 },
  googleText: { color: "#FFF", fontSize: 16, fontWeight: "600" as const, textAlign: "center" },
  googleTextCompact: { fontSize: 15 },
  guestBtn: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", width: "100%" },
  guestText: { color: "#FFF", fontSize: 16, fontWeight: "600" as const },
  guestTextCompact: { fontSize: 15 },
  disabledBtn: { opacity: 0.6 },
  terms: { fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 18, paddingHorizontal: 8 },
  bengzFooterWrap: { position: "absolute", bottom: 0, left: 0, right: 0 },
});
