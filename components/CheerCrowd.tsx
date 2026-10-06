import React, { memo, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, useWindowDimensions } from "react-native";
import { Circle, Ellipse, Path } from "react-native-svg";
import { Clucky, INK } from "./landing/Mascot";
import { EmojiRain } from "./CluckyReactions";

/** Happy closed eyes, drawn over Clucky's normal face. */
const FAN_EYES = (
  <>
    <Ellipse cx={80} cy={101} rx={14} ry={16} fill="#FFF1D6" />
    <Ellipse cx={120} cy={101} rx={14} ry={16} fill="#FFF1D6" />
    <Path d="M67 104Q80 88 93 104M107 104Q120 88 133 104" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
  </>
);
const FAN_HAT = (
  <>
    {FAN_EYES}
    <Path d="M72 66L100 6L128 66Z" fill="#FF6B6B" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <Path d="M84 40L116 40M90 24L110 24" stroke="#FFD700" strokeWidth={5} strokeLinecap="round" />
    <Circle cx={100} cy={8} r={8} fill="#FFD700" stroke={INK} strokeWidth={3} />
  </>
);

type Slot = { x: number; b: number; s: number; ms: number; hat?: boolean };
// Order = order they show up: 1st chicken, 2nd, 3rd, 4th, then the rest arrive together as the crowd.
const SLOTS: Slot[] = [
  { x: 8, b: 14, s: 84, ms: 340 },
  { x: 80, b: 14, s: 84, ms: 300, hat: true },
  { x: 24, b: 78, s: 64, ms: 360 },
  { x: 64, b: 84, s: 64, ms: 320, hat: true },
  { x: 42, b: 6, s: 72, ms: 310 },
  { x: 53, b: 96, s: 52, ms: 380 },
  { x: 3, b: 100, s: 56, ms: 330 },
  { x: 90, b: 98, s: 56, ms: 350, hat: true },
  { x: 15, b: 156, s: 44, ms: 300 },
  { x: 75, b: 162, s: 46, ms: 340 },
  { x: 35, b: 146, s: 42, ms: 360, hat: true },
  { x: 58, b: 156, s: 44, ms: 320 },
  { x: 92, b: 36, s: 60, ms: 290 },
  { x: 30, b: 34, s: 60, ms: 370, hat: true },
];
const CROWD = 5;

/** 0 = nobody, 1..4 = that many chickens, 5 = the whole crowd. Driven by your taps OR how cracked the egg is. */
export function cheerStage(taps: number, progress: number) {
  const t = taps >= 20 ? CROWD : taps >= 12 ? 4 : taps >= 8 ? 3 : taps >= 4 ? 2 : taps >= 1 ? 1 : 0;
  const p = progress >= 60 ? CROWD : progress >= 48 ? 4 : progress >= 35 ? 3 : progress >= 22 ? 2 : progress >= 10 ? 1 : 0;
  return Math.max(t, p);
}

function Fan({ slot, width, still }: { slot: Slot; width: number; still: boolean }) {
  const pop = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
    if (still) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hop, { toValue: 1, duration: slot.ms, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(hop, { toValue: 0, duration: slot.ms, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pop, hop, slot.ms, still]);
  return (
    <Animated.View
      style={{
        position: "absolute", left: (slot.x / 100) * width - slot.s / 2, bottom: slot.b, opacity: pop,
        transform: [
          { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
          { scale: pop },
          { translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -slot.s * 0.16] }) },
          { rotate: hop.interpolate({ inputRange: [0, 1], outputRange: ["-8deg", "8deg"] }) },
        ],
      }}
    >
      <Clucky size={slot.s} label="Cheering chicken" overlay={slot.hat ? FAN_HAT : FAN_EYES} />
    </Animated.View>
  );
}

/**
 * Silent cheering section behind the egg: 1 → 2 → 3 → 4 chickens, then a whole crowd.
 * Goes away on its own when a new round resets taps and progress.
 */
function CheerCrowd({ taps, progress, hidden = false }: { taps: number; progress: number; hidden?: boolean }) {
  const { width, height } = useWindowDimensions();
  const [still, setStill] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
  }, []);
  const stage = hidden ? 0 : cheerStage(taps, progress);
  if (stage === 0) return null;
  const count = stage >= CROWD ? SLOTS.length : stage;
  return (
    <View pointerEvents="none" style={styles.root}>
      {stage >= CROWD && <EmojiRain emojis={["🎉", "📣", "👏", "🔥", "🥚"]} count={8} height={height} />}
      {SLOTS.slice(0, count).map((slot, i) => (
        <Fan key={i} slot={slot} width={width} still={still} />
      ))}
    </View>
  );
}

export default memo(CheerCrowd);

const styles = StyleSheet.create({ root: { ...StyleSheet.absoluteFillObject, zIndex: 0, opacity: 0.95 } });
