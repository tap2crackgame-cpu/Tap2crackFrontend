import React, { memo, useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface TapParticle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  text?: string;
  size: number;
  isFire?: boolean;
  isBomb?: boolean;
  isCrack?: boolean;
}

interface TapFeedbackProps {
  tapCount: number;
  consecutiveTaps: number;
  tapMultiplier?: number;
  crackProgress?: number; // 0-100: how cracked the egg is. Puns get louder once it's cracking.
  /** Centre of the egg inside the egg stage, in px (feedback lives in the stage so it scrolls with the egg). */
  centerX: number;
  centerY: number;
  /** Phones: slightly smaller text/emoji and shorter float so nothing gets cut off. */
  compact?: boolean;
  /** Keep the "+2/+3" pop on the left (the 2x/3x offer bubble is on the right). */
  avoidRight?: boolean;
}

type Pun = { text: string; emoji: string };
const P = (text: string, emoji: string): Pun => ({ text, emoji });

const EGG_PUN_TIERS: { threshold: number; options: Pun[] }[] = [
  { threshold: 0, options: [P("Tap!", "👆"), P("Go go go!", "🏃"), P("Crack it!", "🥚"), P("Egg-gressive!", "😤")] },
  { threshold: 5, options: [P("Egg-citing!", "✨"), P("Shell yeah!", "🐣"), P("Eggs-actly!", "🎯"), P("Yolk's on!", "🍳")] },
  { threshold: 10, options: [P("Shell yeah!", "🐣"), P("Yolk-ing around!", "😜"), P("Beat it!", "🥄"), P("Egg on!", "📣")] },
  { threshold: 15, options: [P("Egg-cellent!", "🌟"), P("Sunny side up!", "🍳"), P("Egg-stra good!", "👌"), P("Nest-tastic!", "🪺")] },
  { threshold: 20, options: [P("Crack on!", "💥"), P("Whisk-y business!", "😎"), P("Hard-boiled hero!", "💪"), P("Eggs-pert!", "🧠")] },
  { threshold: 25, options: [P("Yolk-ing!", "😄"), P("Egg-stremely good!", "😁"), P("Poach-erful!", "🔥"), P("Fry-tastic!", "🍳")] },
  { threshold: 30, options: [P("Un-egg-ceptable!", "⚡"), P("Eggs-traordinary!", "🌈"), P("Hatch it!", "🐥"), P("Shell-ebrate!", "🎊")] },
  { threshold: 35, options: [P("Egg-straordinary!", "🌈"), P("Cluck yeah!", "🐔"), P("Egg-mazing!", "🤩")] },
  { threshold: 50, options: [P("ON FIRE!", "🔥"), P("Scrambling speed!", "🔥"), P("Egg-stremely hot!", "🥵")] },
  { threshold: 70, options: [P("Egg-plosive!", "🔥"), P("Fry-ing hot!", "🍳"), P("Smokin' yolks!", "💨")] },
  { threshold: 80, options: [P("Inferno!", "🔥"), P("Egg-nited!", "🧨"), P("Too hot to handle!", "🌋")] },
  { threshold: 100, options: [P("BOOM!", "💣"), P("Egg-splosion!", "💣"), P("Cracked up!", "🤯")] },
  { threshold: 120, options: [P("Egg-ceptional!", "💣"), P("Unscrambleable!", "💣")] },
  { threshold: 150, options: [P("Devastation!", "💣"), P("Yolk-ano!", "🌋")] },
  { threshold: 200, options: [P("Egg-stra Special!", "💣"), P("LEGEND-airy!", "👑")] },
];

// Shown once the egg is really cracking (70%+). Bigger, bolder, louder.
const CRACK_PUNS: Pun[] = [
  P("IT'S CRACKING!", "💥"), P("SHELL-SHOCKED!", "😱"), P("ALMOST HATCHED!", "🐣"), P("YOLK IS COMING!", "🍳"),
  P("EGG-XPLOSION!", "🧨"), P("DON'T SCRAMBLE NOW!", "😬"), P("CRACK IT OPEN!", "🔨"), P("SO EGG-CITING!", "🤩"),
  P("HATCH-TASTIC!", "🎉"), P("WHO'S GONNA WIN?!", "👀"), P("EGG-STREME CRACK!", "⚡"), P("SHELL NO, KEEP GOING!", "🔥"),
];

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const getFeedbackForConsecutive = (count: number, crackProgress = 0): Pun & { crack: boolean } => {
  if (crackProgress >= 70) return { ...pick(CRACK_PUNS), crack: true };
  const tier = [...EGG_PUN_TIERS].reverse().find((t) => count >= t.threshold) ?? EGG_PUN_TIERS[0];
  return { ...pick(tier.options), crack: false };
};

const FIRE_EMOJIS = ['🔥', '🔥', '🔥', '⚡', '💥'];
const BOMB_EMOJIS = ['💣', '💣', '💥', '🔥', '⚡'];
const NORMAL_EMOJIS = ['✨', '🌟', '⚡', '💥', '🥚', '🐣', '🎯', '👏', '💪'];
const MAX_PARTICLES = 10;

export default memo(function TapFeedback({ tapCount, consecutiveTaps, tapMultiplier = 1, crackProgress = 0, centerX, centerY, compact = false, avoidRight = false }: TapFeedbackProps) {
  const [particles, setParticles] = useState<TapParticle[]>([]);
  const particleIdRef = useRef(0);
  const lastTapCountRef = useRef(0);

  useEffect(() => {
    if (tapCount <= lastTapCountRef.current) {
      lastTapCountRef.current = tapCount;
      return;
    }

    const newParticles: TapParticle[] = [];
    const feedback = getFeedbackForConsecutive(consecutiveTaps, crackProgress);
    const isCrack = feedback.crack;

    const isBombMode = consecutiveTaps >= 100;
    const isFireMode = consecutiveTaps >= 50;

    const spreadX = 50;
    const spreadY = 40;
    const cx = centerX;
    const cy = centerY;

    const mainId = particleIdRef.current++;
    newParticles.push({
      id: mainId,
      x: cx + (Math.random() - 0.5) * spreadX,
      y: cy + (Math.random() - 0.5) * spreadY,
      emoji: feedback.emoji,
      // Always show the pun; during 2x/3x the "+2" / "+3" pops out as its own particle beside it.
      text: feedback.text,
      size: isCrack ? 46 : isBombMode ? 40 : isFireMode ? 36 : 30,
      isFire: isFireMode || isCrack,
      isBomb: isBombMode,
      isCrack,
    });

    if (tapMultiplier > 1) {
      newParticles.push({
        id: particleIdRef.current++,
        // off to one side so it doesn't sit on top of the pun
        x: cx + (avoidRight || Math.random() < 0.5 ? -1 : 1) * (compact ? 70 : 90),
        y: cy + 10 + (Math.random() - 0.5) * 20,
        emoji: tapMultiplier >= 3 ? '⚡' : '✨',
        text: `+${tapMultiplier}`,
        size: 24,
        isFire: tapMultiplier >= 3,
      });
    }

    if (isFireMode && !isBombMode) {
      const extraCount = Math.min(Math.floor(consecutiveTaps / 20), 2);
      for (let i = 0; i < extraCount; i++) {
        newParticles.push({
          id: particleIdRef.current++,
          x: cx + (Math.random() - 0.5) * 80,
          y: cy + (Math.random() - 0.5) * 60,
          emoji: FIRE_EMOJIS[Math.floor(Math.random() * FIRE_EMOJIS.length)],
          size: 24 + Math.random() * 10,
          isFire: true,
        });
      }
    }

    if (isBombMode) {
      const extraCount = Math.min(Math.floor(consecutiveTaps / 25), 3);
      for (let i = 0; i < extraCount; i++) {
        newParticles.push({
          id: particleIdRef.current++,
          x: cx + (Math.random() - 0.5) * 100,
          y: cy + (Math.random() - 0.5) * 70,
          emoji: BOMB_EMOJIS[Math.floor(Math.random() * BOMB_EMOJIS.length)],
          size: 26 + Math.random() * 14,
          isBomb: true,
          isFire: true,
        });
      }
    }

    if (!isFireMode && consecutiveTaps >= 10) {
      const extraCount = Math.min(Math.floor(consecutiveTaps / 10), 2);
      for (let i = 0; i < extraCount; i++) {
        newParticles.push({
          id: particleIdRef.current++,
          x: cx + (Math.random() - 0.5) * 70,
          y: cy + (Math.random() - 0.5) * 50,
          emoji: NORMAL_EMOJIS[Math.floor(Math.random() * NORMAL_EMOJIS.length)],
          size: 22,
        });
      }
    }

    setParticles(prev => [...prev, ...newParticles].slice(-MAX_PARTICLES));

    const particleIds = newParticles.map(p => p.id);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !particleIds.includes(p.id)));
    }, 1100);

    lastTapCountRef.current = tapCount;
  }, [tapCount, consecutiveTaps, tapMultiplier, crackProgress, centerX, centerY, compact, avoidRight]);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map(particle => (
        <Particle key={particle.id} particle={particle} compact={compact} />
      ))}
    </View>
  );
});

function Particle({ particle, compact }: { particle: TapParticle; compact: boolean }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const isBig = particle.isBomb || particle.isFire || particle.isCrack;
    const duration = particle.isCrack ? 1500 : isBig ? 1300 : 1000;
    const rise = particle.isCrack ? -190 : particle.isBomb ? -170 : particle.isFire ? -140 : -100;
    const yDistance = compact ? rise * 0.7 : rise;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: yDistance,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: (Math.random() - 0.5) * (isBig ? 60 : 40),
        duration,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: duration - 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.spring(scale, {
          toValue: compact ? (particle.isCrack ? 1.35 : isBig ? 1.2 : 1.05) : particle.isCrack ? 1.7 : isBig ? 1.4 : 1.1,
          friction: 4,
          tension: 160,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.6,
          duration: duration - 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.x - 120,
          top: particle.y - (compact ? particle.size * 0.8 : particle.size) / 2,
          transform: [
            { translateY },
            { translateX },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      <Text style={[
        styles.emoji,
        { fontSize: compact ? Math.round(particle.size * 0.8) : particle.size, lineHeight: Math.round((compact ? particle.size * 0.8 : particle.size) * 1.25) },
        particle.isBomb && styles.bombEmoji,
        particle.isFire && !particle.isBomb && styles.fireEmoji,
        particle.isCrack && styles.crackEmoji,
      ]}>
        {particle.emoji}
      </Text>
      {particle.text && (
        <Text style={[
          styles.text,
          particle.isBomb && styles.bombText,
          particle.isFire && !particle.isBomb && styles.fireText,
          particle.isCrack && styles.crackText,
          compact && (particle.isCrack ? styles.crackTextCompact : particle.isBomb ? styles.bombTextCompact : particle.isFire ? styles.fireTextCompact : styles.textCompact),
        ]}>
          {particle.text}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    pointerEvents: 'none',
  },
  textCompact: {
    fontSize: 15,
  },
  fireTextCompact: {
    fontSize: 17,
  },
  bombTextCompact: {
    fontSize: 19,
  },
  crackTextCompact: {
    fontSize: 20,
  },
  particle: {
    position: 'absolute',
    width: 240,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  fireEmoji: {
    textShadowColor: '#FF6B35',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  bombEmoji: {
    textShadowColor: '#FF0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  text: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#FFD700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    marginTop: 2,
  },
  fireText: {
    fontSize: 21,
    color: '#FF6B35',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  bombText: {
    fontSize: 24,
    color: '#FF2222',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  crackEmoji: {
    textShadowColor: '#FF3B30',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  crackText: {
    fontSize: 27,
    fontWeight: '900' as const,
    letterSpacing: 1,
    textAlign: 'center' as const,
    color: '#FFFFFF',
    textShadowColor: '#FF3B30',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
});
