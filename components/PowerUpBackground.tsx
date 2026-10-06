import React, { memo, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native';

interface PowerUpBackgroundProps {
  activePowerUp: { type: string; multiplier: number } | null;
  isHappyHour?: boolean;
  /** Hide the right-side decorations (the 2x/3x offer bubble is showing there). */
  clearRight?: boolean;
}

type Mode = '2x' | '3x';

const EASE = Easing.inOut(Easing.sin);

/** 0 -> 1 -> 0 forever, smooth sine easing. */
function useWave(ms: number, running: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!running) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: ms, easing: EASE, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: ms, easing: EASE, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [ms, running, v]);
  return v;
}

/** An emoji with room around the glyph so rotation / scaling never cuts it off. */
function Emoji({ char, size }: { char: string; size: number }) {
  return (
    <Text
      style={{
        fontSize: size,
        lineHeight: Math.round(size * 1.3),
        width: Math.round(size * 1.4),
        textAlign: 'center',
        includeFontPadding: false,
      }}
    >
      {char}
    </Text>
  );
}

function PowerUpBackground({ activePowerUp, isHappyHour = false, clearRight = false }: PowerUpBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const isPhone = width < 420;

  const wanted: Mode | null =
    activePowerUp?.type === '3x' ? '3x' : activePowerUp?.type === '2x' || isHappyHour ? '2x' : null;

  // Keep showing the last mode while fading out, so it never just pops away.
  const [mode, setMode] = useState<Mode | null>(wanted);
  const fade = useRef(new Animated.Value(wanted ? 1 : 0)).current;

  useEffect(() => {
    if (wanted) {
      setMode(wanted);
      Animated.timing(fade, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    } else {
      Animated.timing(fade, { toValue: 0, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(
        ({ finished }) => finished && setMode(null)
      );
    }
  }, [wanted, fade]);

  const running = mode !== null;
  const float1 = useWave(2000, running);
  const float2 = useWave(1800, running);
  const pulse = useWave(1200, running);
  const glow = useWave(1500, running);
  const sway = useWave(3000, running);

  if (!mode) return null;
  const is3x = mode === '3x';

  // Sizes and positions follow the live window size (not a value captured once at load),
  // and keep everything inside the screen and away from the egg in the middle.
  const charSize = isPhone ? 40 : 52;
  const decorSize = isPhone ? 22 : 28;
  const sparkSize = isPhone ? 18 : 22;
  const edge = isPhone ? 6 : 16;
  const topBand = Math.max(210, height * 0.32); // beside the egg, well below the header, nav and active strip

  const y1 = float1.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] });
  const y2 = float2.interpolate({ inputRange: [0, 1], outputRange: [8, -8] });
  const x1 = float1.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] });
  const x2 = float2.interpolate({ inputRange: [0, 1], outputRange: [6, -6] });
  const rot = sway.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });

  const t = is3x
    ? {
        char1: '🍳', char2: '🐔', decor: '⚡', sparkL: '💥', sparkR: '🔥',
        bubble: '3x!!', bubbleBg: '#9B59B6', big: '3×', color: '#D4A5FF',
        badgeBg: 'rgba(155, 89, 182, 0.3)', badgeBorder: 'rgba(155, 89, 182, 0.6)',
        orbA: 'rgba(155, 89, 182, 0.18)', orbB: 'rgba(255, 107, 107, 0.14)',
      }
    : {
        char1: '🐣', char2: '🐥', decor: '✨', sparkL: '⭐', sparkR: '✨',
        bubble: '2x!', bubbleBg: '#4ECDC4', big: '2×', color: '#4ECDC4',
        badgeBg: 'rgba(78, 205, 196, 0.25)', badgeBorder: 'rgba(78, 205, 196, 0.5)',
        orbA: 'rgba(78, 205, 196, 0.15)', orbB: 'rgba(255, 215, 0, 0.12)',
      };

  return (
    <Animated.View style={[styles.container, { opacity: fade }]} pointerEvents="none">
      {/* soft glows */}
      <Animated.View style={[styles.orb, { top: height * 0.1, left: -50, width: 170, height: 170, borderRadius: 85, backgroundColor: t.orbA, opacity: glowOpacity }]} />
      <Animated.View style={[styles.orb, { bottom: height * 0.14, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: t.orbB, opacity: glowOpacity }]} />

      {/* character + speech bubble (left) */}
      <Animated.View style={[styles.abs, { top: topBand, left: edge, transform: [{ translateY: y1 }, { rotate: rot }] }]}>
        <Emoji char={t.char1} size={charSize} />
        <View style={[styles.bubble, { backgroundColor: t.bubbleBg }]}>
          <Text style={[styles.bubbleText, isPhone && styles.bubbleTextSm]}>{t.bubble}</Text>
        </View>
      </Animated.View>

      {/* big multiplier badge (right) */}
      {!clearRight && (
      <Animated.View
        style={[
          styles.abs,
          styles.badge,
          isPhone && styles.badgeSm,
          { top: topBand, right: edge, backgroundColor: t.badgeBg, borderColor: t.badgeBorder, transform: [{ translateY: y2 }, { scale }] },
        ]}
      >
        <Text style={[styles.bigText, isPhone && styles.bigTextSm, { color: t.color }]}>{t.big}</Text>
        <Text style={[styles.bigSub, isPhone && styles.bigSubSm, { color: t.color }]}>TAP</Text>
      </Animated.View>
      )}

      {/* side sparks beside the egg */}
      <Animated.View style={[styles.abs, { top: height * 0.5, left: edge, transform: [{ translateX: x2 }] }]}>
        <Emoji char={t.sparkL} size={sparkSize} />
      </Animated.View>
      {!clearRight && (
        <Animated.View style={[styles.abs, { top: height * 0.47, right: edge, transform: [{ translateX: x1 }] }]}>
          <Emoji char={t.sparkR} size={sparkSize} />
        </Animated.View>
      )}

      {/* lower character + decor */}
      {!clearRight && (
        <Animated.View style={[styles.abs, { bottom: height * 0.2, right: edge + 6, transform: [{ translateY: y2 }, { rotate: rot }] }]}>
          <Emoji char={t.char2} size={charSize} />
        </Animated.View>
      )}
      <Animated.View style={[styles.abs, { bottom: height * 0.28, left: edge + 10, transform: [{ translateY: y1 }] }]}>
        <Emoji char={t.decor} size={decorSize} />
      </Animated.View>

    </Animated.View>
  );
}

/**
 * "DOUBLE / TRIPLE TAP ACTIVE" strip. Sits in the page layout (under the nav), not floating,
 * so the header can never overlap it.
 */
export const PowerUpActiveStrip = memo(
  function PowerUpActiveStrip({ activePowerUp, isHappyHour = false }: PowerUpBackgroundProps) {
    const { width } = useWindowDimensions();
    const isPhone = width < 420;
    const mode: Mode | null =
      activePowerUp?.type === '3x' ? '3x' : activePowerUp?.type === '2x' || isHappyHour ? '2x' : null;
    const glow = useWave(1500, mode !== null);
    const appear = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      if (!mode) { appear.setValue(0); return; }
      Animated.timing(appear, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    }, [mode, appear]);
    if (!mode) return null;
    const is3x = mode === '3x';
    const color = is3x ? '#D4A5FF' : '#4ECDC4';
    return (
      <Animated.View
        style={[
          styles.strip,
          {
            backgroundColor: is3x ? 'rgba(155, 89, 182, 0.22)' : 'rgba(78, 205, 196, 0.18)',
            borderColor: is3x ? 'rgba(155, 89, 182, 0.5)' : 'rgba(78, 205, 196, 0.45)',
            opacity: Animated.multiply(appear, glow.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] })),
            transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={[styles.bannerText, isPhone && styles.bannerTextSm, { color }]} numberOfLines={1}>
          {is3x ? '⚡ TRIPLE TAP ACTIVE ⚡' : isHappyHour && activePowerUp?.type !== '2x' ? '🐣 HAPPY HOUR · 2X TAPS 🐣' : '🐣 DOUBLE TAP ACTIVE 🐣'}
        </Text>
      </Animated.View>
    );
  },
  (a, b) => a.activePowerUp?.type === b.activePowerUp?.type && !!a.isHappyHour === !!b.isHappyHour
);

/** Only re-render when the power-up actually changes, not on every tap. */
export default memo(
  PowerUpBackground,
  (a, b) =>
    a.activePowerUp?.type === b.activePowerUp?.type &&
    !!a.isHappyHour === !!b.isHappyHour &&
    !!a.clearRight === !!b.clearRight
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    overflow: 'hidden',
  },
  orb: { position: 'absolute' },
  abs: { position: 'absolute', alignItems: 'center', padding: 4 },

  bubble: {
    position: 'absolute',
    top: -14,
    left: '70%',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 19, fontWeight: '900' as const, color: '#FFFFFF', letterSpacing: 1 },
  bubbleTextSm: { fontSize: 12, lineHeight: 16 },

  badge: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
  },
  badgeSm: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  bigText: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '900' as const,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  bigTextSm: { fontSize: 26, lineHeight: 32 },
  bigSub: { fontSize: 13, lineHeight: 16, fontWeight: '800' as const, letterSpacing: 4 },
  bigSubSm: { fontSize: 10, lineHeight: 13, letterSpacing: 3 },

  strip: {
    alignSelf: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  bannerText: { fontSize: 13, lineHeight: 17, fontWeight: '800' as const, letterSpacing: 2 },
  bannerTextSm: { fontSize: 11, lineHeight: 15, letterSpacing: 1.5 },
});
