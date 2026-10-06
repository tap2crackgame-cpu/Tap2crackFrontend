import React, { memo, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";
import { Circle, Ellipse, Path } from "react-native-svg";
import { Clucky, INK } from "./landing/Mascot";

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

/** Spots around the egg stage edges where a chicken can peek in (side + height from bottom as a fraction). */
const SPOTS: { side: "left" | "right"; bottom: number; hat: boolean }[] = [
  { side: "left", bottom: 0.04, hat: false },
  { side: "right", bottom: 0.1, hat: true },
  { side: "left", bottom: 0.42, hat: true },
  { side: "right", bottom: 0.5, hat: false },
];

type Peek = { id: number; spot: number };

/** Keep the old export so nothing else breaks: 0 = quiet, higher = more excitement. */
export function cheerStage(taps: number, progress: number) {
  if (taps >= 20 || progress >= 60) return 2;
  if (taps >= 1 || progress >= 10) return 1;
  return 0;
}

function PeekingChicken({ spot, size, onDone }: { spot: number; size: number; onDone: () => void }) {
  const v = useRef(new Animated.Value(0)).current;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const { side, bottom, hat } = SPOTS[spot];

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 380, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(v, { toValue: 0, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => finished && doneRef.current());
    return () => anim.stop();
  }, [v]);

  const dir = side === "left" ? -1 : 1;
  return (
    <Animated.View
      style={{
        position: "absolute",
        [side]: 0,
        bottom: `${Math.round(bottom * 100)}%` as const,
        opacity: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.9, 0.9] }),
        transform: [
          // slides in from the side edge, with a small head tilt
          { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [dir * size * 0.6, 0] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: [`${dir * 25}deg`, `${dir * 8}deg`] }) },
        ],
      }}
    >
      <Clucky size={size} label="Chicken peeking in" overlay={hat ? FAN_HAT : FAN_EYES} />
    </Animated.View>
  );
}

/**
 * A chicken (two when the egg is hot) peeks in at the side of the egg every few seconds while people are tapping.
 * Lives inside the egg stage, so it scrolls away with the page and never covers the egg itself.
 */
function CheerCrowd({ taps, progress, hidden = false, size = 52, avoidRight = false }: { taps: number; progress: number; hidden?: boolean; size?: number; /** keep the right side clear (2x/3x offer bubble is there) */ avoidRight?: boolean }) {
  const [still, setStill] = useState(false);
  const [peeks, setPeeks] = useState<Peek[]>([]);
  const idRef = useRef(0);
  const stage = hidden ? 0 : cheerStage(taps, progress);
  const active = stage > 0 && !still;
  const maxAtOnce = stage >= 2 ? 2 : 1;
  const maxRef = useRef(maxAtOnce);
  maxRef.current = maxAtOnce;
  const avoidRightRef = useRef(avoidRight);
  avoidRightRef.current = avoidRight;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
  }, []);

  useEffect(() => {
    if (!active) {
      setPeeks([]);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (first: boolean) => {
      // First peek soon after tapping starts, then every ~6–10s.
      const wait = first ? 1200 : 6000 + Math.random() * 4000;
      timer = setTimeout(() => {
        setPeeks((prev) => {
          if (prev.length >= maxRef.current) return prev;
          const used = new Set(prev.map((p) => p.spot));
          const free = SPOTS.map((_, i) => i).filter((i) => !used.has(i) && !(avoidRightRef.current && SPOTS[i].side === "right"));
          if (!free.length) return prev;
          const spot = free[Math.floor(Math.random() * free.length)];
          return [...prev, { id: idRef.current++, spot }];
        });
        schedule(false);
      }, wait);
    };
    schedule(true);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active || peeks.length === 0) return null;
  return (
    <View pointerEvents="none" style={styles.root}>
      {peeks.map((p) => (
        <PeekingChicken
          key={p.id}
          spot={p.spot}
          size={size}
          onDone={() => setPeeks((prev) => prev.filter((x) => x.id !== p.id))}
        />
      ))}
    </View>
  );
}

export default memo(CheerCrowd);

const styles = StyleSheet.create({ root: { ...StyleSheet.absoluteFillObject, zIndex: 1, overflow: "hidden" } });
