import React, { memo, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";
import { Clucky } from "./landing/Mascot";

/**
 * Shown between rounds, after the countdown, while the server gets the next egg ready:
 * Clucky sits on a nest "laying" the next egg. When the new round starts the game screen
 * switches mode to "laying": Clucky hops off and the fresh egg pops out of the nest.
 */
type Props = {
  mode: "waiting" | "laying";
  /** Egg width on screen; Clucky + nest are sized from it. */
  eggW: number;
  /** Phones: slightly smaller caption. */
  compact?: boolean;
};

/** Back of the nest (drawn behind Clucky). viewBox 200x68 */
function NestBack({ w, h }: { w: number; h: number }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 200 68">
      <Ellipse cx="100" cy="38" rx="96" ry="26" fill="#7A4A1E" />
      <Ellipse cx="100" cy="32" rx="80" ry="15" fill="#4A2A0E" />
      <Path d="M14 30 Q50 18 86 26 M110 24 Q150 16 188 30" stroke="#B07A3C" strokeWidth="4" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/** Front rim of the nest (drawn over Clucky's feet so he sits *in* it). */
function NestFront({ w, h }: { w: number; h: number }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 200 68">
      <Path d="M4 38 Q100 50 196 38 Q194 62 100 66 Q6 62 4 38 Z" fill="#8B5A2B" />
      <Path
        d="M8 42 Q40 54 74 46 M36 56 Q76 46 116 58 M96 50 Q136 42 176 52 M128 60 Q164 50 194 44"
        stroke="#C08A4A"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M30 62 Q100 74 170 62" stroke="#6B3F17" strokeWidth="4" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function CluckyNest({ mode, eggW, compact = false }: Props) {
  const bob = useRef(new Animated.Value(0)).current; // gentle sitting bob
  const push = useRef(new Animated.Value(0)).current; // "pushing" squeeze
  const dots = useRef(new Animated.Value(0)).current; // ... typing dots
  const appear = useRef(new Animated.Value(0)).current;
  const leave = useRef(new Animated.Value(0)).current; // 0 = sitting, 1 = hopped off

  // Sitting + pushing loops while waiting
  useEffect(() => {
    if (mode !== "waiting") return;
    leave.setValue(0);
    Animated.spring(appear, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(900),
          Animated.timing(push, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(push, { toValue: -0.4, duration: 120, useNativeDriver: true }),
          Animated.timing(push, { toValue: 0, duration: 160, useNativeDriver: true }),
        ])
      ),
      Animated.loop(Animated.timing(dots, { toValue: 3, duration: 1200, easing: Easing.linear, useNativeDriver: true })),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [mode, appear, bob, push, dots, leave]);

  // Hop off when the new egg arrives
  useEffect(() => {
    if (mode !== "laying") return;
    Animated.timing(leave, { toValue: 1, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [mode, leave]);

  const cluckySize = Math.round(eggW * 0.95);
  const nestW = Math.round(eggW * 1.25);
  const nestH = Math.round(nestW * 0.34);
  // Sink Clucky so the front rim hides his feet and the bottom of his body (he's *sitting* in the nest).
  const cluckyBottom = Math.round(nestH * 0.35 - cluckySize * 0.13);
  const nestOpacity = leave.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.root,
        {
          opacity: Animated.multiply(appear, leave.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] })),
          transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
        },
      ]}
    >
      <View style={{ width: nestW, height: cluckySize + cluckyBottom }}>
        {/* back of nest */}
        <Animated.View style={[styles.nestPart, { bottom: 0, opacity: nestOpacity }]}>
          <NestBack w={nestW} h={nestH} />
        </Animated.View>

        {/* Clucky sitting in the nest */}
        <Animated.View
          style={{
            position: "absolute",
            left: (nestW - cluckySize) / 2,
            bottom: cluckyBottom,
            transform: [
              // hop up and off to the side when laying
              { translateY: leave.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, -eggW * 0.55, -eggW * 0.35] }) },
              { translateX: leave.interpolate({ inputRange: [0, 1], outputRange: [0, eggW * 0.75] }) },
              { rotate: leave.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "18deg"] }) },
              { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) },
              { scaleX: push.interpolate({ inputRange: [-0.4, 0, 1], outputRange: [0.97, 1, 1.07] }) },
              { scaleY: push.interpolate({ inputRange: [-0.4, 0, 1], outputRange: [1.04, 1, 0.9] }) },
            ],
          }}
        >
          <Clucky size={cluckySize} label="Clucky laying the next egg" />
        </Animated.View>

        {/* front rim covers the feet */}
        <Animated.View style={[styles.nestPart, { bottom: 0, opacity: nestOpacity }]}>
          <NestFront w={nestW} h={nestH} />
        </Animated.View>
      </View>

      {mode === "waiting" && (
        <View style={styles.captionRow}>
          <Text style={[styles.caption, compact && styles.captionSm]}>Clucky is laying a fresh egg</Text>
          {[0, 1, 2].map((i) => (
            <Animated.Text
              key={i}
              style={[
                styles.caption,
                compact && styles.captionSm,
                { opacity: dots.interpolate({ inputRange: [0, i, i + 0.5, 3], outputRange: [0.2, 0.2, 1, 0.2], extrapolate: "clamp" }) },
              ]}
            >
              .
            </Animated.Text>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

export default memo(CluckyNest);

const styles = StyleSheet.create({
  root: { alignItems: "center", justifyContent: "center" },
  nestPart: { position: "absolute", left: 0 },
  captionRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 14 },
  caption: { fontSize: 17, fontWeight: "700", color: "#FFD700", letterSpacing: 0.3 },
  captionSm: { fontSize: 14 },
});
