import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Animated, Easing, StyleSheet, TouchableWithoutFeedback, Text, Platform,
  type GestureResponderEvent,
} from 'react-native';
import Svg, { Path, Ellipse, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { EggType, EGG_CONFIGS } from '@/types/game';

interface EggProps {
  type: EggType;
  progress: number;
  onTap: (x: number, y: number) => void;
  isCracked: boolean;
  isCooldown: boolean;
  isLoser?: boolean;
  testCrackLevel?: number | null;
  /** Egg width in px (height keeps the 180:220 shape). Lets the game screen shrink the egg on short phones. */
  size?: number;
  /** Tighter spacing under the egg (short screens). */
  compact?: boolean;
}

const IS_WEB = Platform.OS === 'web';

const getEggGradient = (type: EggType): [string, string] => {
  switch (type) {
    case 'golden':
      return ['#FFD700', '#FFA500'];
    case 'silver':
      return ['#E8E8E8', '#A0A0A0'];
    case 'no-powerup':
      return ['#FFFFFF', '#E0E0E0'];
    case 'company':
      return ['#FF6B6B', '#EE5A5A'];
    case 'business':
      return ['#4ECDC4', '#44B3AB'];
    default:
      return ['#F4A460', '#D2691E'];
  }
};

// Crack SVG paths for different stages
const CRACK_PATHS = {
  stage1: [
    "M 45 80 L 55 95 L 50 110",
    "M 125 70 L 115 85 L 120 100",
  ],
  stage2: [
    "M 45 80 L 55 95 L 50 110 L 60 125",
    "M 125 70 L 115 85 L 120 100 L 110 115",
    "M 80 50 L 85 75 L 75 90",
  ],
  stage3: [
    "M 45 80 L 55 95 L 50 110 L 60 125 L 55 145",
    "M 125 70 L 115 85 L 120 100 L 110 115 L 115 135",
    "M 80 50 L 85 75 L 75 90 L 80 110",
    "M 140 140 L 125 155 L 135 170",
  ],
  stage4: [
    "M 45 80 L 55 95 L 50 110 L 60 125 L 55 145 L 65 165",
    "M 125 70 L 115 85 L 120 100 L 110 115 L 115 135 L 105 155",
    "M 80 50 L 85 75 L 75 90 L 80 110 L 70 130",
    "M 140 140 L 125 155 L 135 170 L 120 185",
    "M 35 130 L 50 145 L 40 165",
    "M 90 25 L 95 50 L 85 70",
  ],
};

/** Shell shards for the burst: direction they fly (unit-ish x/y) + shape. */
const SHARDS: { dx: number; dy: number; d: string; spin: number }[] = [
  { dx: -1, dy: -0.9, d: 'M5 30 L30 5 L50 25 L35 55 Z', spin: -1 },
  { dx: 1, dy: -1, d: 'M10 10 L50 15 L40 50 Z', spin: 1 },
  { dx: -1.1, dy: 0.2, d: 'M5 20 L45 5 L55 40 L20 55 Z', spin: 1 },
  { dx: 1.15, dy: 0.15, d: 'M5 30 L30 5 L50 25 L35 55 Z', spin: -1 },
  { dx: -0.6, dy: 0.9, d: 'M10 10 L50 15 L40 50 Z', spin: -1 },
  { dx: 0.7, dy: 0.95, d: 'M5 20 L45 5 L55 40 L20 55 Z', spin: 1 },
  { dx: 0, dy: -1.2, d: 'M5 30 L30 5 L50 25 L35 55 Z', spin: 1 },
  { dx: -0.3, dy: -1.1, d: 'M10 10 L50 15 L40 50 Z', spin: -1 },
];

const RIPPLE_SLOTS = 3;

export default function EggComponent({
  type,
  progress,
  onTap,
  isCracked,
  isCooldown,
  isLoser = false,
  testCrackLevel = null,
  size = 180,
  compact = false,
}: EggProps) {
  const eggW = Math.round(size);
  const eggH = Math.round(size * (220 / 180));
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;

  const effectiveProgress = testCrackLevel !== null ? testCrackLevel : progress;
  const isBroken = isCracked || effectiveProgress >= 100;
  const heat = Math.min(1, Math.max(0, effectiveProgress / 100));

  /* ---------------- tap: squash & stretch + wiggle + ripple ---------------- */
  const squash = useRef(new Animated.Value(0)).current; // 0 = rest, 1 = squashed
  const wiggle = useRef(new Animated.Value(0)).current; // px left/right
  const lastAnimAtRef = useRef(0);
  const ripples = useRef(Array.from({ length: RIPPLE_SLOTS }, () => new Animated.Value(1))).current;
  const [ripplePos, setRipplePos] = useState<{ x: number; y: number }[]>(() =>
    Array.from({ length: RIPPLE_SLOTS }, () => ({ x: 0, y: 0 }))
  );
  const rippleSlot = useRef(0);

  const handleTap = useCallback((e: GestureResponderEvent) => {
    onTapRef.current(0, 0);

    const now = Date.now();
    if (now - lastAnimAtRef.current < (IS_WEB ? 45 : 90)) return;
    lastAnimAtRef.current = now;

    // squash then spring back (scaleX in / scaleY out)
    squash.stopAnimation();
    squash.setValue(0);
    Animated.sequence([
      Animated.timing(squash, { toValue: 1, duration: 55, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(squash, { toValue: 0, friction: 4, tension: 260, useNativeDriver: true }),
    ]).start();

    // quick decaying side-to-side wiggle
    wiggle.stopAnimation();
    Animated.sequence([
      Animated.timing(wiggle, { toValue: 9, duration: 35, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: -7, duration: 50, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 4, duration: 45, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();

    // ring ripple where the finger landed
    const slot = rippleSlot.current;
    rippleSlot.current = (slot + 1) % RIPPLE_SLOTS;
    const { locationX, locationY } = e.nativeEvent;
    const x = Number.isFinite(locationX) ? locationX : eggW / 2;
    const y = Number.isFinite(locationY) ? locationY : eggH / 2;
    setRipplePos((prev) => {
      const next = prev.slice();
      next[slot] = { x, y };
      return next;
    });
    const r = ripples[slot];
    r.stopAnimation();
    r.setValue(0);
    Animated.timing(r, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [squash, wiggle, ripples, eggW, eggH]);

  /* ---------------- heat wobble when it's about to crack ---------------- */
  const shiver = useRef(new Animated.Value(0)).current;
  const hotLevel = isBroken ? 0 : effectiveProgress >= 90 ? 2 : effectiveProgress >= 70 ? 1 : 0;
  useEffect(() => {
    if (!hotLevel) {
      shiver.setValue(0);
      return;
    }
    const ms = hotLevel === 2 ? 38 : 55;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shiver, { toValue: 1, duration: ms, useNativeDriver: true }),
        Animated.timing(shiver, { toValue: -1, duration: ms * 2, useNativeDriver: true }),
        Animated.timing(shiver, { toValue: 0, duration: ms, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [hotLevel, shiver]);
  const shiverAmp = hotLevel === 2 ? 4 : hotLevel === 1 ? 2 : 0;

  /* ---------------- burst ---------------- */
  const burst = useRef(new Animated.Value(isBroken ? 1 : 0)).current; // shards fly 0 -> 1
  const ring = useRef(new Animated.Value(isBroken ? 1 : 0)).current; // shockwave
  const pop = useRef(new Animated.Value(isBroken ? 1 : 0)).current; // broken egg pop-in
  const [showBroken, setShowBroken] = useState(isBroken);
  const prevBrokenRef = useRef(isBroken);

  useEffect(() => {
    if (isBroken && !prevBrokenRef.current) {
      setShowBroken(true);
      burst.setValue(0);
      ring.setValue(0);
      pop.setValue(0);
      Animated.parallel([
        Animated.timing(burst, { toValue: 1, duration: 950, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(ring, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      ]).start();
    } else if (!isBroken && prevBrokenRef.current) {
      setShowBroken(false);
      burst.setValue(0);
      ring.setValue(0);
      pop.setValue(0);
    }
    prevBrokenRef.current = isBroken;
  }, [isBroken, burst, ring, pop]);

  const [gradientStart, gradientEnd] = getEggGradient(type);
  const config = EGG_CONFIGS[type];

  const crackStage = isBroken
    ? null
    : effectiveProgress >= 70 ? 'stage4'
    : effectiveProgress >= 50 ? 'stage3'
    : effectiveProgress >= 30 ? 'stage2'
    : effectiveProgress >= 10 ? 'stage1'
    : null;

  // Shard flight paths: fast outward burst (ease-out) + gravity pulling them down.
  const shardAnims = useMemo(() => {
    const R = eggW * 1.25;
    const G = eggW * 0.9;
    const ks = [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1];
    const out = (k: number) => 1 - Math.pow(1 - k, 3);
    return SHARDS.map((s) => ({
      x: burst.interpolate({ inputRange: ks, outputRange: ks.map((k) => s.dx * R * out(k)) }),
      y: burst.interpolate({ inputRange: ks, outputRange: ks.map((k) => s.dy * R * out(k) + G * out(k) * out(k)) }),
      rot: burst.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${s.spin * 400}deg`] }),
      opacity: burst.interpolate({ inputRange: [0, 0.05, 0.6, 1], outputRange: [0, 1, 1, 0] }),
    }));
  }, [burst, eggW]);

  const glowStyle = IS_WEB
    ? ({ filter: `drop-shadow(0 0 ${Math.round(10 + heat * 26)}px rgba(255, ${Math.round(200 - heat * 100)}, 0, ${(0.25 + heat * 0.45).toFixed(2)}))` } as object)
    : { shadowColor: '#FF8A00', shadowOpacity: 0.2 + heat * 0.5, shadowRadius: 8 + heat * 18, shadowOffset: { width: 0, height: 0 } };

  const shardSize = Math.round(eggW * 0.36);

  return (
    <TouchableWithoutFeedback onPressIn={handleTap} disabled={isCooldown || isCracked}>
      <View
        style={[
          styles.container,
          IS_WEB ? ({ outlineStyle: 'none', outlineWidth: 0, WebkitTapHighlightColor: 'transparent', cursor: 'pointer' } as object) : null,
        ]}
      >
        <View style={[styles.eggContainer, { width: eggW, height: eggH }]}>
          {!showBroken ? (
            <Animated.View
              style={[
                { width: eggW, height: eggH },
                glowStyle,
                isLoser && styles.loserEgg,
                {
                  transform: [
                    { translateX: Animated.add(wiggle, shiver.interpolate({ inputRange: [-1, 1], outputRange: [-shiverAmp, shiverAmp] })) },
                    { scaleX: squash.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) },
                    { scaleY: squash.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }) },
                  ],
                },
              ]}
            >
              <Svg width={eggW} height={eggH} viewBox="0 0 180 220">
                <Defs>
                  <SvgGradient id="eggFill" x1="54" y1="0" x2="126" y2="220" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor={gradientStart} />
                    <Stop offset="1" stopColor={gradientEnd} />
                  </SvgGradient>
                </Defs>
                <Ellipse cx="90" cy="110" rx="85" ry="105" fill="url(#eggFill)" stroke="none" />
                <Ellipse cx="70" cy="70" rx="25" ry="35" fill="rgba(255,255,255,0.3)" stroke="none" />
                {crackStage && CRACK_PATHS[crackStage].map((path, i) => (
                  <Path key={i} d={path} stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                ))}
              </Svg>
            </Animated.View>
          ) : (
            <>
              {/* gold shockwave ring */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.shockwave,
                  {
                    width: eggW,
                    height: eggW,
                    borderRadius: eggW / 2,
                    left: 0,
                    top: (eggH - eggW) / 2,
                    opacity: ring.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0] }),
                    transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.3, 2.4] }) }],
                  },
                ]}
              />

              {/* the cracked-open egg: white + yolk */}
              <Animated.View
                style={{
                  width: eggW,
                  height: eggH,
                  transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
                  opacity: pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
                }}
              >
                <Svg width={eggW} height={eggH} viewBox="0 0 180 220">
                  <Ellipse cx="90" cy="132" rx="80" ry="62" fill="rgba(255,255,255,0.9)" />
                  <Ellipse cx="70" cy="122" rx="22" ry="14" fill="rgba(255,255,255,0.7)" />
                  <Circle cx="90" cy="130" r="40" fill="#FFC21A" />
                  <Circle cx="90" cy="130" r="40" fill="none" stroke="#F59E0B" strokeWidth="3" />
                  <Circle cx="76" cy="116" r="11" fill="rgba(255,255,255,0.55)" />
                </Svg>
              </Animated.View>

              {/* shell shards flying out */}
              {SHARDS.map((s, i) => (
                <Animated.View
                  key={i}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    width: shardSize,
                    height: shardSize,
                    left: eggW / 2 - shardSize / 2,
                    top: eggH / 2 - shardSize / 2,
                    opacity: shardAnims[i].opacity,
                    transform: [
                      { translateX: shardAnims[i].x },
                      { translateY: shardAnims[i].y },
                      { rotate: shardAnims[i].rot },
                    ],
                  }}
                >
                  <Svg width={shardSize} height={shardSize} viewBox="0 0 60 60">
                    <Path d={s.d} fill={i % 2 ? gradientEnd : gradientStart} stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
                  </Svg>
                </Animated.View>
              ))}
            </>
          )}

          {/* tap ripples */}
          {!showBroken &&
            ripples.map((r, i) => (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={[
                  styles.ripple,
                  {
                    left: ripplePos[i].x - 50,
                    top: ripplePos[i].y - 50,
                    opacity: r.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0] }),
                    transform: [{ scale: r.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.5] }) }],
                  },
                ]}
              />
            ))}

          {/* Loser overlay (test mode) */}
          {isLoser && (
            <View style={styles.loserOverlay}>
              <Text style={styles.loserEmoji}>😢</Text>
              <Text style={styles.loserText}>So Close!</Text>
            </View>
          )}
        </View>

        <View style={[styles.eggLabel, compact && styles.eggLabelCompact]}>
          <Text style={[styles.eggName, compact && styles.eggNameCompact, isLoser && styles.loserTextStyle]}>{config.name}</Text>
          {type !== 'normal' && type !== 'no-powerup' && (
            <View style={[styles.badge, { backgroundColor: config.color }]}>
              <Text style={styles.badgeText}>{config.frequency}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eggContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  ripple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  shockwave: {
    position: 'absolute',
    borderWidth: 8,
    borderColor: 'rgba(255,215,0,0.9)',
  },
  loserEgg: {
    opacity: 0.7,
  },
  loserOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loserEmoji: {
    fontSize: 48,
  },
  loserText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  loserTextStyle: {
    opacity: 0.6,
  },
  eggLabel: {
    marginTop: 20,
    alignItems: 'center',
    gap: 8,
  },
  eggLabelCompact: {
    marginTop: 8,
    gap: 4,
  },
  eggName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  eggNameCompact: {
    fontSize: 15,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
