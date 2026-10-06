import React, { memo, useEffect, useRef, useState } from 'react';
import { Text, Animated, StyleSheet, View } from 'react-native';

/**
 * Light tap feedback: a short egg pun floats up from the egg.
 * Text only (no emojis / confetti), throttled so fast tapping never floods the screen.
 * Rendered inside the egg stage, so it stays on the egg and scrolls with the page.
 */

interface TapFeedbackProps {
  tapCount: number;
  consecutiveTaps: number;
  tapMultiplier?: number;
  crackProgress?: number; // 0-100: how cracked the egg is.
  /** Centre of the egg inside the stage, in px. */
  centerX: number;
  centerY: number;
  /** Smaller text on phones. */
  compact?: boolean;
}

const EGG_PUN_TIERS: { threshold: number; options: string[] }[] = [
  { threshold: 0, options: ["Tap!", "Go go go!", "Crack it!", "Egg-gressive!"] },
  { threshold: 5, options: ["Egg-citing!", "Shell yeah!", "Eggs-actly!", "Yolk's on!"] },
  { threshold: 10, options: ["Yolk-ing around!", "Beat it!", "Egg on!"] },
  { threshold: 15, options: ["Egg-cellent!", "Sunny side up!", "Egg-stra good!", "Nest-tastic!"] },
  { threshold: 20, options: ["Crack on!", "Whisk-y business!", "Hard-boiled hero!", "Eggs-pert!"] },
  { threshold: 25, options: ["Egg-stremely good!", "Poach-erful!", "Fry-tastic!"] },
  { threshold: 30, options: ["Eggs-traordinary!", "Hatch it!", "Shell-ebrate!"] },
  { threshold: 35, options: ["Cluck yeah!", "Egg-mazing!"] },
  { threshold: 50, options: ["On fire!", "Scrambling speed!", "Egg-stremely hot!"] },
  { threshold: 70, options: ["Egg-plosive!", "Fry-ing hot!", "Smokin' yolks!"] },
  { threshold: 80, options: ["Inferno!", "Egg-nited!", "Too hot to handle!"] },
  { threshold: 100, options: ["Egg-splosion!", "Cracked up!"] },
  { threshold: 150, options: ["Yolk-ano!", "Unscrambleable!"] },
  { threshold: 200, options: ["LEGEND-airy!", "Egg-stra special!"] },
];

// Once the egg is really cracking (70%+).
const CRACK_PUNS = [
  "It's cracking!", "Shell-shocked!", "Almost hatched!", "Yolk is coming!",
  "Don't scramble now!", "Crack it open!", "Who's gonna win?!", "Shell no, keep going!",
];

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const getPun = (count: number, crackProgress = 0) => {
  if (crackProgress >= 70) return { text: pick(CRACK_PUNS), hot: true };
  const tier = [...EGG_PUN_TIERS].reverse().find((t) => count >= t.threshold) ?? EGG_PUN_TIERS[0];
  return { text: pick(tier.options), hot: count >= 50 };
};

type Pun = { id: number; text: string; hot: boolean; dx: number };

/** At most one new pun per this many ms, and only a couple on screen. */
const MIN_GAP_MS = 450;
const MAX_ON_SCREEN = 2;

export default memo(function TapFeedback({
  tapCount,
  consecutiveTaps,
  tapMultiplier = 1,
  crackProgress = 0,
  centerX,
  centerY,
  compact = false,
}: TapFeedbackProps) {
  const [puns, setPuns] = useState<Pun[]>([]);
  const idRef = useRef(0);
  const lastTapCountRef = useRef(0);
  const lastShownAtRef = useRef(0);

  useEffect(() => {
    if (tapCount <= lastTapCountRef.current) {
      lastTapCountRef.current = tapCount;
      return;
    }
    lastTapCountRef.current = tapCount;

    const now = Date.now();
    if (now - lastShownAtRef.current < MIN_GAP_MS) return;
    lastShownAtRef.current = now;

    const { text, hot } = getPun(consecutiveTaps, crackProgress);
    const label = tapMultiplier > 1 ? `+${tapMultiplier} ${text}` : text;
    const id = idRef.current++;
    setPuns((prev) => [...prev, { id, text: label, hot, dx: (Math.random() - 0.5) * 40 }].slice(-MAX_ON_SCREEN));
  }, [tapCount, consecutiveTaps, tapMultiplier, crackProgress]);

  const remove = useRef((id: number) => setPuns((prev) => prev.filter((p) => p.id !== id))).current;

  return (
    <View style={styles.container} pointerEvents="none">
      {puns.map((p) => (
        <FloatingPun key={p.id} pun={p} x={centerX} y={centerY} compact={compact} onDone={remove} />
      ))}
    </View>
  );
});

const PUN_BOX_W = 220;

function FloatingPun({ pun, x, y, compact, onDone }: { pun: Pun; x: number; y: number; compact: boolean; onDone: (id: number) => void }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(t, { toValue: 1, duration: 1000, useNativeDriver: true });
    anim.start(() => onDone(pun.id));
    return () => anim.stop();
  }, [t, pun.id, onDone]);

  const rise = compact ? -70 : -100;

  return (
    <Animated.View
      style={[
        styles.pun,
        {
          left: x - PUN_BOX_W / 2 + pun.dx,
          top: y,
          opacity: t.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, rise] }) },
            { scale: t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.7, 1.05, 0.95] }) },
          ],
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[styles.text, compact && styles.textCompact, pun.hot && styles.hotText, pun.hot && compact && styles.hotTextCompact]}
      >
        {pun.text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
  },
  pun: {
    position: 'absolute',
    width: PUN_BOX_W,
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#FFD700',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  textCompact: {
    fontSize: 14,
  },
  hotText: {
    fontSize: 20,
    color: '#FFFFFF',
    textShadowColor: '#FF3B30',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  hotTextCompact: {
    fontSize: 16,
  },
});
