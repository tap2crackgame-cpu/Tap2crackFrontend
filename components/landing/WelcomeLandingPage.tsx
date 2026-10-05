import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform,
  Animated, Easing, AccessibilityInfo, TextProps,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import SocialMediaLinks from "@/components/SocialMediaLinks";
import SemanticHeading from "@/components/SemanticHeading";
import { useLandingLayout } from "@/hooks/useLandingLayout";
import { useWinnersQuery } from "@/hooks/useWinnersQuery";
import { displayWinnerName, formatWinnerPrizeLabel } from "@/types/game";
import { HOW_IT_WORKS_STEPS, LANDING_FAQ_PREVIEW, SUPPORT_EMAIL } from "@/constants/seo";
import { EGG_TYPES, PRIZES_SECTION, FOOTER_LINKS } from "@/constants/landingCopy";
import { Clucky, EggArt, INK } from "./Mascot";

// Add <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&display=swap" rel="stylesheet"> in app/+html.tsx
const FONT = Platform.select({ web: "Fredoka, system-ui, sans-serif", default: undefined });
const GOLD = "#FFD700";
const GLASS = { backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 16 };

/** Every piece of text goes through T so the font is uniform. */
const T = ({ style, ...p }: TextProps) => <Text style={[s.base, style]} {...p} />;

function Heading({ children, peek = true }: { children: string; peek?: boolean }) {
  return (
    <View style={s.hd}>
      <SemanticHeading level={2} style={s.h2}>{children}</SemanticHeading>
      {peek && <Clucky size={52} />}
    </View>
  );
}

const EGG_KEY: Record<string, string> = { pure: "no-powerup", gold: "golden" };

/** Winners drift past on their own. A new winner changes the list and the loop restarts. */
function WinnersMarquee() {
  const { data: winners = [], isLoading } = useWinnersQuery(12);
  const x = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);

  useEffect(() => {
    if (!w) return;
    let loop: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      x.setValue(0);
      loop = Animated.loop(Animated.timing(x, { toValue: -w, duration: w * 28, easing: Easing.linear, useNativeDriver: true }));
      loop.start();
    });
    return () => loop?.stop();
  }, [w, x]);

  if (isLoading) return <ActivityIndicator color={GOLD} />;
  if (!winners.length) return <T style={s.body}>Recent cracks will show up here.</T>;

  const cards = winners.slice(0, 10).map((win) => (
    <View key={win.id} style={[GLASS, s.win]}>
      <EggArt type={win.egg_type ?? "normal"} size={34} />
      <View style={{ flex: 1 }}>
        <T style={s.winName} numberOfLines={1}>{displayWinnerName(win.user_name)}</T>
        <T style={s.winPrize} numberOfLines={2}>{formatWinnerPrizeLabel(win)}</T>
      </View>
    </View>
  ));

  return (
    <View style={{ overflow: "hidden" }}>
      <Animated.View style={{ flexDirection: "row", transform: [{ translateX: x }] }}>
        <View style={{ flexDirection: "row" }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>{cards}</View>
        <View style={{ flexDirection: "row" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{cards}</View>
      </Animated.View>
    </View>
  );
}

type Props = { onGooglePress: () => void; onGuestPress: () => void; googleLoading: boolean; guestLoading: boolean; onInfoPress: () => void };

export default function WelcomeLandingPage({ onGooglePress, onGuestPress, googleLoading, guestLoading, onInfoPress }: Props) {
  const { isMobile, isWide, pagePad, contentMax, eggCardWidthPct } = useLandingLayout();
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const hop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      loop = Animated.loop(Animated.sequence([
        Animated.timing(hop, { toValue: -14, duration: 450, useNativeDriver: true }),
        Animated.timing(hop, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.delay(900),
      ]));
      loop.start();
    });
    return () => loop?.stop();
  }, [hop]);

  const wrap = { maxWidth: contentMax, width: "100%" as const, alignSelf: "center" as const, paddingHorizontal: pagePad };
  const center = !isWide; // phones & tablets: everything in the hero is centred
  const sec = { paddingVertical: 36 };

  return (
    <LinearGradient colors={["#1A1A2E", "#16213E", "#0F3460"]} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={Platform.OS !== "web"}>
        {/* HERO */}
        <View style={[wrap, { paddingTop: 12, flexDirection: isWide ? "row" : "column", alignItems: "center", gap: 20 }]}>
          <View style={{ flex: isWide ? 1 : undefined, alignItems: center ? "center" : "flex-start", width: "100%" }}>
            <SemanticHeading level={1} style={[s.h1, isMobile && { fontSize: 34, lineHeight: 38 }, center && { textAlign: "center" }]}>
              Tap the egg. Crack it. Win real rewards!
            </SemanticHeading>
            <T style={[s.sub, center && { textAlign: "center" }]}>
              Tap, crack, and win airtime, credit, vouchers, coupons, and real rewards. Free to play.
            </T>
            <View style={{ width: "100%", maxWidth: 280, gap: 12, alignItems: "stretch", alignSelf: center ? "center" : "flex-start" }}>
              <TouchableOpacity accessibilityRole="button" onPress={onGuestPress} disabled={guestLoading} style={guestLoading && s.off}>
                <LinearGradient colors={["#FFD700", "#E6A800", "#C99200"]} style={s.btn}>
                  {guestLoading ? <ActivityIndicator color={INK} /> : <T style={[s.btnText, { color: INK }]}>Play Now</T>}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" onPress={onGooglePress} disabled={googleLoading} style={googleLoading && s.off}>
                <LinearGradient colors={["#4285F4", "#34A853"]} style={s.btn}>
                  {googleLoading ? <ActivityIndicator color="#fff" /> : <T style={s.btnText}>Sign in with Google</T>}
                </LinearGradient>
              </TouchableOpacity>
              <T style={[s.note, center && { textAlign: "center" }]}>No payment needed to win. Power-ups are optional.</T>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
            <Animated.View style={{ transform: [{ translateY: hop }] }}><Clucky size={isMobile ? 170 : 230} /></Animated.View>
            <View style={{ marginLeft: -20, marginBottom: 8 }}><EggArt type="golden" size={isMobile ? 66 : 90} label="A golden egg" /></View>
          </View>
        </View>

        {/* HOW IT WORKS */}
        <View style={[wrap, sec]}>
          <Heading peek={false}>How Tap2Crack works</Heading>
          <View style={{ flexDirection: isWide ? "row" : "column", gap: 14 }}>
            {HOW_IT_WORKS_STEPS.map((st, i) => (
              <View key={st.title} style={[GLASS, { flex: 1 }]}>
                <View style={s.badge}><T style={s.badgeText}>{i + 1}</T></View>
                <SemanticHeading level={3} style={s.h3}>{st.title}</SemanticHeading>
                <T style={s.body}>{st.body}</T>
              </View>
            ))}
          </View>
        </View>

        {/* EGGS */}
        <View style={[wrap, sec]}>
          <Heading peek={false}>Meet the eggs</Heading>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 14 }}>
            {EGG_TYPES.map((egg) => (
              <View key={egg.key} style={[GLASS, { width: eggCardWidthPct, alignItems: "center" }]}>
                <EggArt type={EGG_KEY[egg.key] ?? egg.key} size={isMobile ? 52 : 62} label={egg.name} />
                <SemanticHeading level={3} style={[s.h3, { textAlign: "center", marginTop: 8 }]}>{egg.name}</SemanticHeading>
                <T style={[s.body, { textAlign: "center", fontSize: 13 }]}>{egg.copy}</T>
              </View>
            ))}
          </View>
        </View>

        {/* RECENT CRACKS */}
        <View style={[wrap, sec]}>
          <Heading>Recent egg cracks</Heading>
          <WinnersMarquee />
        </View>

        {/* PRIZES */}
        <View style={[wrap, sec]}>
          <Heading>What can you win?</Heading>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 14 }}>
            {PRIZES_SECTION.groups.map((g) => (
              <View key={g.title} style={[GLASS, { width: "48%" }]}>
                <T style={{ fontSize: 28 }}>{g.emoji}</T>
                <SemanticHeading level={3} style={s.h3}>{g.title}</SemanticHeading>
                <T style={[s.body, { fontSize: 13 }]}>{g.items.join(", ")}</T>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ */}
        <View style={[wrap, sec]}>
          <Heading>Questions, answered</Heading>
          {LANDING_FAQ_PREVIEW.map((q) => {
            const open = openFaq === q.question;
            return (
              <TouchableOpacity key={q.question} accessibilityRole="button" accessibilityState={{ expanded: open }}
                onPress={() => setOpenFaq(open ? null : q.question)} style={[GLASS, { marginBottom: 12 }]}>
                <SemanticHeading level={3} style={s.h3}>{q.question}</SemanticHeading>
                {/* stays in the DOM when closed so search engines can read it */}
                <T style={[s.body, !open && (Platform.OS === "web" ? { height: 0, overflow: "hidden" } : { display: "none" })]}>{q.answer}</T>
              </TouchableOpacity>
            );
          })}
          <Link href="/faq" style={s.link}>See all FAQs</Link>
        </View>

        {/* FINAL CTA */}
        <View style={[wrap, sec, { alignItems: "center" }]}>
          <Clucky size={130} />
          <SemanticHeading level={2} style={[s.h2, { textAlign: "center", marginBottom: 6 }]}>Ready to crack?</SemanticHeading>
          <T style={[s.body, { textAlign: "center", marginBottom: 16 }]}>Clucky's keeping the nest warm. Jump in and start tapping.</T>
          <TouchableOpacity accessibilityRole="button" onPress={onGuestPress} disabled={guestLoading}>
            <LinearGradient colors={["#FFD700", "#E6A800", "#C99200"]} style={[s.btn, { minWidth: 240 }]}>
              <T style={[s.btnText, { color: INK }]}>Start Cracking</T>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={[wrap, { alignItems: "center", gap: 12, paddingVertical: 28, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)" }]}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
            {FOOTER_LINKS.map((l) => (<Link key={l.href} href={l.href as never} style={s.footLink}>{l.label}</Link>))}
          </View>
          <T style={s.footText}>{SUPPORT_EMAIL}</T>
          <SocialMediaLinks />
          <TouchableOpacity onPress={onInfoPress} accessibilityLabel="About Tap2Crack"><T style={s.footLink}>About</T></TouchableOpacity>
          <T style={[s.footText, { opacity: 0.6 }]}>© {new Date().getFullYear()} Tap2Crack</T>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  base: { fontFamily: FONT, color: "#fff" },
  hd: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  h1: { fontFamily: FONT, color: "#fff", fontSize: 52, lineHeight: 56, fontWeight: "700" },
  h2: { fontFamily: FONT, color: "#fff", fontSize: 28, fontWeight: "700" },
  h3: { fontFamily: FONT, color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 4 },
  sub: { fontSize: 17, lineHeight: 25, marginVertical: 14, maxWidth: 480, opacity: 0.88 },
  body: { fontSize: 15, lineHeight: 22, opacity: 0.85 },
  note: { fontSize: 13, opacity: 0.7 },
  btn: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24, alignItems: "center" },
  btnText: { fontSize: 17, fontWeight: "700" },
  off: { opacity: 0.6 },
  badge: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#FF6B6B", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  badgeText: { fontWeight: "700" },
  win: { width: 240, marginRight: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  winName: { fontWeight: "700", fontSize: 15 },
  winPrize: { fontSize: 13, opacity: 0.8 },
  link: { fontFamily: FONT, color: GOLD, fontWeight: "700", textDecorationLine: "underline", marginTop: 6 },
  footLink: { fontFamily: FONT, color: GOLD, fontSize: 14 },
  footText: { fontSize: 14, opacity: 0.85 },
});
