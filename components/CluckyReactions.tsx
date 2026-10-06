import React, { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";
import { Circle, Ellipse, Path } from "react-native-svg";
import { Clucky, INK } from "./landing/Mascot";

/** false when the phone/browser asks for reduced motion */
function useMotionOk() {
  const [ok, setOk] = useState(true);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((r) => setOk(!r)).catch(() => {});
  }, []);
  return ok;
}

/** 0 -> 1 -> 0 forever */
function usePingPong(ms: number, enabled: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) return;
    const e = Easing.inOut(Easing.quad);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: ms, easing: e, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: ms, easing: e, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [enabled, ms, v]);
  return v;
}

/** Clucky in a party hat with happy eyes, hopping and wiggling. */
export function CluckyCheer({ size = 140 }: { size?: number }) {
  const ok = useMotionOk();
  const v = usePingPong(300, ok);
  const hat = (
    <>
      <Ellipse cx={80} cy={101} rx={14} ry={16} fill="#FFF1D6" />
      <Ellipse cx={120} cy={101} rx={14} ry={16} fill="#FFF1D6" />
      <Path d="M67 104Q80 88 93 104M107 104Q120 88 133 104" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <Path d="M72 66L100 6L128 66Z" fill="#FF6B6B" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <Path d="M84 40L116 40M90 24L110 24" stroke="#FFD700" strokeWidth={5} strokeLinecap="round" />
      <Circle cx={100} cy={8} r={8} fill="#FFD700" stroke={INK} strokeWidth={3} />
    </>
  );
  return (
    <Animated.View
      style={{
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.12] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["-9deg", "9deg"] }) },
        ],
      }}
    >
      <Clucky size={size} label="Clucky celebrating in a party hat" overlay={hat} />
    </Animated.View>
  );
}

function Tear({ size, x, delay }: { size: number; x: number; delay: number }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: 1, duration: 1100, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, y]);
  const w = size * 0.045;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute", left: (x / 200) * size, top: (120 / 200) * size,
        width: w, height: w * 1.7, borderRadius: w, backgroundColor: "#6EC1FF",
        opacity: y.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 0.8, 0] }),
        transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.2] }) }],
      }}
    />
  );
}

/** Clucky under a rain cloud, brows down, crying and swaying. */
export function CluckySad({ size = 110 }: { size?: number }) {
  const ok = useMotionOk();
  const v = usePingPong(1400, ok);
  const gloom = (
    <>
      <Path d="M66 82L94 92M134 82L106 92" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <Ellipse cx={80} cy={110} rx={9} ry={3.5} fill="#BDE6FF" opacity={0.9} />
      <Ellipse cx={120} cy={110} rx={9} ry={3.5} fill="#BDE6FF" opacity={0.9} />
      <Path d="M56 26Q54 8 76 10Q88 -2 108 8Q132 2 134 24Q150 28 142 40L62 40Q48 36 56 26Z" fill="#8AA0B8" stroke={INK} strokeWidth={3} />
      <Path d="M80 46v8M100 46v8M120 46v8" stroke="#6EC1FF" strokeWidth={3} strokeLinecap="round" />
    </>
  );
  return (
    <Animated.View
      style={{
        width: size, height: size,
        transform: [
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["-5deg", "4deg"] }) },
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [2, size * 0.04] }) },
        ],
      }}
    >
      <Clucky size={size} label="Clucky crying under a rain cloud" overlay={gloom} />
      {ok && (
        <>
          <Tear size={size} x={74} delay={0} />
          <Tear size={size} x={126} delay={550} />
        </>
      )}
    </Animated.View>
  );
}

function Drop({ emoji, left, delay, duration, height, spin, fontSize }: any) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, duration, y]);
  return (
    <Animated.Text
      style={{
        position: "absolute", top: 0, left: `${left}%`, fontSize,
        opacity: y.interpolate({ inputRange: [0, 0.08, 0.85, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateY: y.interpolate({ inputRange: [0, 1], outputRange: [-30, height] }) },
          { rotate: y.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${spin}deg`] }) },
        ],
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

/** Emojis drifting down behind the content. Put inside a clipped container. */
export function EmojiRain({ emojis, count = 14, height = 520, minMs = 2600, maxMs = 4600 }: {
  emojis: string[]; count?: number; height?: number; minMs?: number; maxMs?: number;
}) {
  const ok = useMotionOk();
  const items = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      key: i, emoji: emojis[i % emojis.length], left: Math.random() * 92,
      delay: Math.random() * 2400, duration: minMs + Math.random() * (maxMs - minMs),
      spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360), fontSize: 16 + Math.random() * 12,
    })),
    [count, emojis, minMs, maxMs]
  );
  if (!ok) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {items.map((it) => <Drop key={it.key} {...it} height={height} />)}
    </View>
  );
}
