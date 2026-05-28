import React, { memo, useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';

interface TapParticle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  text?: string;
  size: number;
  isFire?: boolean;
  isBomb?: boolean;
}

interface TapFeedbackProps {
  tapCount: number;
  consecutiveTaps: number;
  lastTapPosition: { x: number; y: number } | null;
  tapMultiplier?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EGG_CENTER_X = SCREEN_WIDTH / 2;
const EGG_CENTER_Y = SCREEN_HEIGHT * 0.38;

const EGG_PUNS = [
  { threshold: 0, text: 'Tap!', emoji: '👆' },
  { threshold: 5, text: 'Egg-citing!', emoji: '✨' },
  { threshold: 10, text: 'Shell yeah!', emoji: '🐣' },
  { threshold: 15, text: 'Egg-cellent!', emoji: '🌟' },
  { threshold: 20, text: 'Crack on!', emoji: '💥' },
  { threshold: 25, text: 'Yolk-ing!', emoji: '😄' },
  { threshold: 30, text: 'Un-egg-ceptable!', emoji: '⚡' },
  { threshold: 35, text: 'Egg-straordinary!', emoji: '🌈' },
  { threshold: 50, text: 'ON FIRE!', emoji: '🔥' },
  { threshold: 70, text: 'Egg-plosive!', emoji: '🔥' },
  { threshold: 80, text: 'Inferno!', emoji: '🔥' },
  { threshold: 100, text: 'BOOM!', emoji: '💣' },
  { threshold: 120, text: 'Egg-ceptional!', emoji: '💣' },
  { threshold: 150, text: 'Devastation!', emoji: '💣' },
  { threshold: 200, text: 'Egg-stra Special!', emoji: '💣' },
];

const getFeedbackForConsecutive = (count: number) => {
  const reversed = [...EGG_PUNS].reverse();
  const match = reversed.find(p => count >= p.threshold);
  return match || EGG_PUNS[0];
};

const FIRE_EMOJIS = ['🔥', '🔥', '🔥', '⚡', '💥'];
const BOMB_EMOJIS = ['💣', '💣', '💥', '🔥', '⚡'];
const NORMAL_EMOJIS = ['✨', '🌟', '⚡', '💥', '🥚', '🐣', '🎯', '👏', '💪'];
const MAX_PARTICLES = 10;

export default memo(function TapFeedback({ tapCount, consecutiveTaps, lastTapPosition, tapMultiplier = 1 }: TapFeedbackProps) {
  const [particles, setParticles] = useState<TapParticle[]>([]);
  const particleIdRef = useRef(0);
  const lastTapCountRef = useRef(0);

  useEffect(() => {
    if (tapCount <= lastTapCountRef.current) {
      lastTapCountRef.current = tapCount;
      return;
    }

    const newParticles: TapParticle[] = [];
    const feedback = getFeedbackForConsecutive(consecutiveTaps);

    const isBombMode = consecutiveTaps >= 100;
    const isFireMode = consecutiveTaps >= 50;

    const spreadX = 50;
    const spreadY = 40;
    const cx = EGG_CENTER_X;
    const cy = EGG_CENTER_Y;

    const mainId = particleIdRef.current++;
    const multiplierText = tapMultiplier > 1 ? `+${tapMultiplier}` : undefined;
    newParticles.push({
      id: mainId,
      x: cx + (Math.random() - 0.5) * spreadX,
      y: cy + (Math.random() - 0.5) * spreadY,
      emoji: feedback.emoji,
      text: multiplierText || feedback.text,
      size: isBombMode ? 40 : isFireMode ? 36 : 28,
      isFire: isFireMode,
      isBomb: isBombMode,
    });

    if (tapMultiplier > 1) {
      newParticles.push({
        id: particleIdRef.current++,
        x: cx + (Math.random() - 0.5) * 60 + 30,
        y: cy + (Math.random() - 0.5) * 30 - 20,
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
  }, [tapCount, consecutiveTaps, tapMultiplier]);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map(particle => (
        <Particle key={particle.id} particle={particle} />
      ))}
    </View>
  );
});

function Particle({ particle }: { particle: TapParticle }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const isBig = particle.isBomb || particle.isFire;
    const duration = isBig ? 1300 : 1000;
    const yDistance = particle.isBomb ? -170 : particle.isFire ? -140 : -100;

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
          toValue: isBig ? 1.4 : 1.1,
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
          left: particle.x - particle.size / 2,
          top: particle.y - particle.size / 2,
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
        { fontSize: particle.size },
        particle.isBomb && styles.bombEmoji,
        particle.isFire && !particle.isBomb && styles.fireEmoji,
      ]}>
        {particle.emoji}
      </Text>
      {particle.text && (
        <Text style={[
          styles.text,
          particle.isBomb && styles.bombText,
          particle.isFire && !particle.isBomb && styles.fireText,
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
    zIndex: 100,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
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
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginTop: 2,
  },
  fireText: {
    fontSize: 15,
    color: '#FF6B35',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  bombText: {
    fontSize: 17,
    color: '#FF2222',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
