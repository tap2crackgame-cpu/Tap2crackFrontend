import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import type { OutfitId } from "@/utils/progression";

const INK = "#1A1A2E";

export type CluckyMood = "idle" | "focus" | "sweat" | "panic" | "cool" | "happy" | "sad";

/**
 * Expressive Clucky (same art as the videos): moods change the eyes / brows / beak,
 * outfits add the unlockable accessories. viewBox 0 0 200 200.
 */
export const CluckyFace = memo(function CluckyFace({
  size = 96,
  mood = "idle",
  outfit = "plain",
  wingUp = 0,
}: {
  size?: number;
  mood?: CluckyMood;
  outfit?: OutfitId;
  /** 0..1 raises the right wing (waving / cheering) */
  wingUp?: number;
}) {
  const o = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const shades = outfit === "shades" || outfit === "cap" || outfit === "legend" || mood === "cool";
  const beakOpen = mood === "panic" || mood === "happy";
  const uid = "cb";

  let eyes: React.ReactNode;
  if (shades) {
    eyes = (
      <G>
        <Path d="M58 92H142" stroke={INK} strokeWidth={5} />
        <Path d="M60 90h34l-3 18q-2 8-14 8q-14 0-17-12z" fill={INK} />
        <Path d="M106 90h34l-3 14q-3 12-17 12q-12 0-14-8z" fill={INK} />
        <Path d="M66 96l10 0M112 96l10 0" stroke="#7FD3FF" strokeWidth={4} strokeLinecap="round" />
      </G>
    );
  } else if (mood === "happy") {
    eyes = <Path d="M67 104Q80 88 93 104M107 104Q120 88 133 104" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
  } else if (mood === "sad") {
    eyes = (
      <G>
        <Path d="M68 100Q80 108 92 100M108 100Q120 108 132 100" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <Path d="M70 114Q62 130 70 136Q80 132 74 114Z" fill="#7FD3FF" stroke={INK} strokeWidth={2.5} />
      </G>
    );
  } else {
    const r = mood === "panic" ? 5.5 : 8;
    eyes = (
      <G>
        <Ellipse cx={80} cy={100} rx={12} ry={14} fill="#fff" stroke={INK} strokeWidth={3} />
        <Ellipse cx={120} cy={100} rx={12} ry={14} fill="#fff" stroke={INK} strokeWidth={3} />
        <Circle cx={82} cy={102} r={r} fill={INK} />
        <Circle cx={118} cy={102} r={r} fill={INK} />
        <Circle cx={84} cy={98} r={2.6} fill="#fff" />
        <Circle cx={120} cy={98} r={2.6} fill="#fff" />
      </G>
    );
  }

  const brows =
    mood === "focus" || mood === "panic" ? (
      <Path d="M66 82L92 90M134 82L108 90" stroke={INK} strokeWidth={6} strokeLinecap="round" />
    ) : mood === "sweat" ? (
      <Path d="M68 78Q80 70 92 78M108 78Q120 70 132 78" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    ) : null;

  const sweat =
    mood === "sweat" || mood === "panic" ? (
      <G stroke={INK} strokeWidth={2.5}>
        <Path d="M150 62Q158 74 154 82Q146 84 146 76Q146 70 150 62Z" fill="#7FD3FF" />
        <Path d="M160 92Q166 101 163 107Q157 108 157 102Q157 98 160 92Z" fill="#7FD3FF" />
      </G>
    ) : null;

  const hat =
    outfit === "party" ? (
      <G {...o}>
        <Path d="M72 66L100 6L128 66Z" fill="#FF6B6B" />
        <Path d="M84 40L116 40M90 24L110 24" stroke="#FFD700" strokeWidth={5} />
        <Circle cx={100} cy={8} r={8} fill="#FFD700" strokeWidth={3} />
      </G>
    ) : outfit === "cap" ? (
      <G {...o}>
        <Path d="M54 74Q56 30 100 28Q144 30 146 74Z" fill="#FF3B5C" />
        <Path d="M140 56L186 46Q190 58 182 66L144 72Z" fill="#C81E3A" />
      </G>
    ) : outfit === "crown" || outfit === "legend" ? (
      <G {...o}>
        <Path d="M62 52L66 14L84 34L100 4L116 34L134 14L138 52Z" fill={`url(#${uid}G)`} />
        <Circle cx={100} cy={36} r={6} fill="#FF6B6B" strokeWidth={3} />
      </G>
    ) : null;

  const chain =
    outfit === "legend" ? (
      <G>
        <Path d="M66 140Q100 180 134 140" fill="none" stroke="#FFC81E" strokeWidth={6} strokeDasharray="6 4" />
        <Circle cx={100} cy={168} r={15} fill={`url(#${uid}G)`} stroke={INK} strokeWidth={3} />
      </G>
    ) : null;

  return (
    <Svg width={size} height={size} viewBox="-10 -10 220 210">
      <Defs>
        <RadialGradient id={`${uid}B`} cx="0.35" cy="0.3" r="0.8"><Stop offset="0" stopColor="#fff" /><Stop offset="0.7" stopColor="#FFF1D6" /><Stop offset="1" stopColor="#F6D9A6" /></RadialGradient>
        <LinearGradient id={`${uid}C`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FF8A8A" /><Stop offset="1" stopColor="#EE4B4B" /></LinearGradient>
        <LinearGradient id={`${uid}K`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FFC04D" /><Stop offset="1" stopColor="#FF8C00" /></LinearGradient>
        <LinearGradient id={`${uid}G`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FFF08A" /><Stop offset="0.5" stopColor="#FFC81E" /><Stop offset="1" stopColor="#E88A00" /></LinearGradient>
      </Defs>
      <Ellipse cx={100} cy={186} rx={52} ry={8} fill="#000" opacity={0.22} />
      <G {...o}>
        <Path d="M146 120C170 84 196 96 188 130C182 146 164 150 148 144Z" fill={`url(#${uid}K)`} />
        <Path d="M84 170L80 188M70 188L92 188M116 170L120 188M108 188L130 188" fill="none" stroke={`url(#${uid}K)`} strokeWidth={7} />
        <Ellipse cx={100} cy={114} rx={66} ry={60} fill={`url(#${uid}B)`} />
        <Path d="M42 108C16 90 8 126 30 142C46 144 54 126 42 108Z" fill="#FFE2A8" />
        <G rotation={-110 * wingUp} origin="152, 116">
          <Path d="M158 112C184 98 192 132 170 146C154 148 146 130 158 112Z" fill="#FFE2A8" />
        </G>
        <Circle cx={86} cy={40} r={12} fill={`url(#${uid}C)`} />
        <Circle cx={102} cy={32} r={14} fill={`url(#${uid}C)`} />
        <Circle cx={118} cy={42} r={11} fill={`url(#${uid}C)`} />
        <Path d="M50 80C50 44 150 44 150 80L139 71L127 82L114 70L100 82L86 70L73 82L61 71Z" fill="#FFF8E7" />
      </G>
      {chain}
      <Circle cx={64} cy={118} r={10} fill="#FF9AA2" opacity={0.7} />
      <Circle cx={136} cy={118} r={10} fill="#FF9AA2" opacity={0.7} />
      {eyes}
      {brows}
      {beakOpen ? (
        <G>
          <Path d="M88 112Q100 104 112 112L100 118Z" fill={`url(#${uid}K)`} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <Path d="M90 120L100 118L110 120Q106 136 100 136Q94 136 90 120Z" fill={`url(#${uid}K)`} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <Rect x={95} y={120} width={10} height={6} rx={3} fill="#C2410C" />
        </G>
      ) : (
        <Path d="M88 114Q100 106 112 114Q108 130 100 132Q92 130 88 114Z" fill={`url(#${uid}K)`} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      )}
      <Ellipse cx={100} cy={142} rx={6} ry={8} fill={`url(#${uid}C)`} stroke={INK} strokeWidth={3} />
      {sweat}
      {hat}
    </Svg>
  );
});

/* ---------------- tips ---------------- */
function pickTip(progress: number, boosted: boolean, share: number, seed: number): string {
  const pools: string[][] = [];
  if (progress >= 95) pools.push(["ANYONE'S EGG NOW! 😱", "LAST TAP WINS! 👆", "Don't stop now!! 🔥"]);
  else if (progress >= 80) pools.push(["It's HOT! Keep going 🔥", "So close… tap tap tap 😤", "Who's taking this one? 👀"]);
  else if (progress >= 50) pools.push(["It's heating up 🔥", "Boosts = more cracks per tap ⚡", "Halfway there! 🥚"]);
  else pools.push(["Tap tap tap! 👆", "Every tap counts 🥚", "Lock in early next round 👀", "I believe in you 🐔"]);
  if (boosted) pools.push(["Boost ON, let's GO 😎", "Your taps hit harder now ⚡"]);
  if (share >= 20) pools.push(["You're carrying this egg 💪", "Big tapper energy 💪"]);
  const all = pools.flat();
  return all[seed % all.length];
}

/**
 * Clucky sits beside the egg, reacts to the round (calm → focused → sweating → panicking)
 * and drops a tip in a speech bubble every few seconds. Purely cosmetic; never blocks taps.
 */
function CluckyBuddy({
  size,
  progress,
  boosted,
  share,
  outfit,
}: {
  size: number;
  progress: number;
  boosted: boolean;
  /** your % of this egg's cracks */
  share: number;
  outfit: OutfitId;
}) {
  const mood: CluckyMood =
    progress >= 95 ? "panic" : progress >= 80 ? "sweat" : boosted ? "cool" : progress >= 50 ? "focus" : "idle";

  const bob = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const bubble = useRef(new Animated.Value(0)).current;
  const [tip, setTip] = useState<string | null>(null);
  const seedRef = useRef(Math.floor(Math.random() * 100));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: mood === "panic" ? 220 : 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: mood === "panic" ? 220 : 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob, mood]);

  useEffect(() => {
    if (mood !== "panic" && mood !== "sweat") {
      shake.setValue(0);
      return;
    }
    const amp = mood === "panic" ? 3 : 1.5;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: amp, duration: 45, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -amp, duration: 45, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shake, mood]);

  // Tip bubble: show a new one every ~8s (and right away when the mood changes), for ~3.5s.
  const stateRef = useRef({ progress, boosted, share });
  stateRef.current = { progress, boosted, share };
  useEffect(() => {
    let hideT: ReturnType<typeof setTimeout> | null = null;
    const show = () => {
      const s = stateRef.current;
      seedRef.current += 1;
      setTip(pickTip(s.progress, s.boosted, s.share, seedRef.current));
      bubble.setValue(0);
      Animated.spring(bubble, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
      if (hideT) clearTimeout(hideT);
      hideT = setTimeout(() => {
        Animated.timing(bubble, { toValue: 0, duration: 220, useNativeDriver: true }).start();
      }, 3500);
    };
    const first = setTimeout(show, 700);
    const iv = setInterval(show, 8000);
    return () => {
      clearTimeout(first);
      clearInterval(iv);
      if (hideT) clearTimeout(hideT);
    };
  }, [bubble, mood]);

  const bubbleW = Math.max(120, Math.min(170, size * 1.9));
  const translateY = useMemo(() => bob.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.06] }), [bob, size]);

  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      <Animated.View style={{ transform: [{ translateY }, { translateX: shake }] }}>
        <CluckyFace size={size} mood={mood} outfit={outfit} wingUp={mood === "panic" ? 0.6 : 0} />
      </Animated.View>
      {tip ? (
        <Animated.View
          style={[
            styles.bubble,
            { width: bubbleW, left: size * 0.62, top: -size * 0.32 },
            { opacity: bubble, transform: [{ scale: bubble.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] },
          ]}
        >
          <Text style={[styles.bubbleText, size < 72 && styles.bubbleTextSm]}>
            {tip}
          </Text>
          <View style={styles.tail} />
        </Animated.View>
      ) : null}
    </View>
  );
}

export default memo(CluckyBuddy);

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: INK,
    paddingVertical: 6,
    paddingHorizontal: 10,
    zIndex: 10,
  },
  bubbleText: { color: INK, fontSize: 12, fontWeight: "800", textAlign: "center" },
  bubbleTextSm: { fontSize: 11 },
  tail: {
    position: "absolute",
    left: 10,
    bottom: -8,
    width: 12,
    height: 12,
    backgroundColor: "#fff",
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: INK,
    transform: [{ rotate: "45deg" }],
  },
});
