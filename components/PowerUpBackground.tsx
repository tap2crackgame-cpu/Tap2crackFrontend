import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface PowerUpBackgroundProps {
  activePowerUp: { type: string; multiplier: number } | null;
  isHappyHour?: boolean;
}

export default function PowerUpBackground({ activePowerUp, isHappyHour = false }: PowerUpBackgroundProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const isActive = activePowerUp?.type === '2x' || activePowerUp?.type === '3x' || isHappyHour;
  const is3x = activePowerUp?.type === '3x';

  useEffect(() => {
    if (!isActive) {
      pulseAnim.setValue(1);
      floatAnim1.setValue(0);
      floatAnim2.setValue(0);
      glowAnim.setValue(0.3);
      bounceAnim.setValue(0);
      rotateAnim.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    floatAnim1.setValue(-12);
    const floatLoop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: 12,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: -12,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    floatAnim2.setValue(10);
    const floatLoop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: -10,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 10,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    glowAnim.setValue(0.25);
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.25,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    bounceAnim.setValue(-6);
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: -6,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    rotateAnim.setValue(0);
    const rotateLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    floatLoop1.start();
    floatLoop2.start();
    glowLoop.start();
    bounceLoop.start();
    rotateLoop.start();

    return () => {
      pulseLoop.stop();
      floatLoop1.stop();
      floatLoop2.stop();
      glowLoop.stop();
      bounceLoop.stop();
      rotateLoop.stop();
    };
  }, [isActive, is3x, pulseAnim, floatAnim1, floatAnim2, glowAnim, bounceAnim, rotateAnim]);

  if (!isActive) return null;

  const smallRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-8deg', '8deg'],
  });

  if (is3x) {
    return (
      <View style={styles.container} pointerEvents="none">
        <Animated.View style={[styles.glowOrb3x, { opacity: glowAnim }]} />
        <Animated.View style={[styles.glowOrb3xSecond, { opacity: glowAnim }]} />

        <Animated.View style={[
          styles.topLeftCharacter,
          { transform: [{ translateY: floatAnim1 }, { rotate: smallRotate }] },
        ]}>
          <Text style={styles.characterEmoji}>🍳</Text>
          <View style={styles.speechBubble3x}>
            <Text style={styles.speechText3x}>3x!!</Text>
          </View>
        </Animated.View>

        <Animated.View style={[
          styles.topRightBadge3x,
          { transform: [{ scale: pulseAnim }, { translateY: bounceAnim }] },
        ]}>
          <Text style={styles.bigMultiplierText3x}>3×</Text>
          <Text style={styles.bigMultiplierSubtext3x}>TAP</Text>
        </Animated.View>

        <Animated.View style={[
          styles.bottomLeftCharacter,
          { transform: [{ translateY: floatAnim2 }, { rotate: smallRotate }] },
        ]}>
          <Text style={styles.characterEmoji}>🐔</Text>
        </Animated.View>

        <Animated.View style={[
          styles.bottomRightDecor,
          { transform: [{ translateY: floatAnim1 }] },
        ]}>
          <Text style={styles.decorEmoji}>⚡</Text>
        </Animated.View>

        <Animated.View style={[
          styles.midLeftDecor,
          { transform: [{ translateX: floatAnim2 }] },
        ]}>
          <Text style={styles.sparkEmoji}>💥</Text>
        </Animated.View>

        <Animated.View style={[
          styles.midRightDecor,
          { transform: [{ translateX: floatAnim1 }] },
        ]}>
          <Text style={styles.sparkEmoji}>🔥</Text>
        </Animated.View>

        <Animated.View style={[styles.bannerStrip3x, { opacity: glowAnim }]}>
          <Text style={styles.bannerText3x}>⚡ TRIPLE TAP ACTIVE ⚡</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.glowOrb2x, { opacity: glowAnim }]} />
      <Animated.View style={[styles.glowOrb2xSecond, { opacity: glowAnim }]} />

      <Animated.View style={[
        styles.topLeftCharacter,
        { transform: [{ translateY: floatAnim1 }, { rotate: smallRotate }] },
      ]}>
        <Text style={styles.characterEmoji}>🐣</Text>
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>2x!</Text>
        </View>
      </Animated.View>

      <Animated.View style={[
        styles.topRightBadge,
        { transform: [{ scale: pulseAnim }, { translateY: bounceAnim }] },
      ]}>
        <Text style={styles.bigMultiplierText}>2×</Text>
        <Text style={styles.bigMultiplierSubtext}>TAP</Text>
      </Animated.View>

      <Animated.View style={[
        styles.bottomRightCharacter,
        { transform: [{ translateY: floatAnim2 }, { rotate: smallRotate }] },
      ]}>
        <Text style={styles.characterEmoji}>🐥</Text>
      </Animated.View>

      <Animated.View style={[
        styles.bottomLeftDecor,
        { transform: [{ translateY: floatAnim1 }] },
      ]}>
        <Text style={styles.decorEmoji}>✨</Text>
      </Animated.View>

      <Animated.View style={[
        styles.midLeftDecor,
        { transform: [{ translateX: floatAnim2 }] },
      ]}>
        <Text style={styles.sparkEmoji}>⭐</Text>
      </Animated.View>

      <Animated.View style={[
        styles.midRightDecor,
        { transform: [{ translateX: floatAnim1 }] },
      ]}>
        <Text style={styles.sparkEmoji}>✨</Text>
      </Animated.View>

      <Animated.View style={[styles.bannerStrip, { opacity: glowAnim }]}>
        <Text style={styles.bannerText}>🐣 DOUBLE TAP ACTIVE 🐣</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    overflow: 'hidden',
  },

  glowOrb2x: {
    position: 'absolute',
    top: height * 0.1,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
  },
  glowOrb2xSecond: {
    position: 'absolute',
    bottom: height * 0.15,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
  },
  glowOrb3x: {
    position: 'absolute',
    top: height * 0.08,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(155, 89, 182, 0.18)',
  },
  glowOrb3xSecond: {
    position: 'absolute',
    bottom: height * 0.12,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 107, 107, 0.14)',
  },

  topLeftCharacter: {
    position: 'absolute',
    top: height * 0.12,
    left: 16,
    alignItems: 'center',
  },
  characterEmoji: {
    fontSize: 52,
  },
  speechBubble: {
    position: 'absolute',
    top: -20,
    right: -38,
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  speechText: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  speechBubble3x: {
    position: 'absolute',
    top: -20,
    right: -42,
    backgroundColor: '#9B59B6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  speechText3x: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  topRightBadge: {
    position: 'absolute',
    top: height * 0.1,
    right: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: 'rgba(78, 205, 196, 0.5)',
  },
  bigMultiplierText: {
    fontSize: 38,
    fontWeight: '900' as const,
    color: '#4ECDC4',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  bigMultiplierSubtext: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#4ECDC4',
    letterSpacing: 4,
    marginTop: -4,
  },
  topRightBadge3x: {
    position: 'absolute',
    top: height * 0.1,
    right: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(155, 89, 182, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: 'rgba(155, 89, 182, 0.6)',
  },
  bigMultiplierText3x: {
    fontSize: 38,
    fontWeight: '900' as const,
    color: '#D4A5FF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  bigMultiplierSubtext3x: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#D4A5FF',
    letterSpacing: 4,
    marginTop: -4,
  },

  bottomRightCharacter: {
    position: 'absolute',
    bottom: height * 0.22,
    right: 20,
  },
  bottomLeftCharacter: {
    position: 'absolute',
    bottom: height * 0.25,
    left: 20,
  },
  bottomLeftDecor: {
    position: 'absolute',
    bottom: height * 0.32,
    left: 30,
  },
  bottomRightDecor: {
    position: 'absolute',
    bottom: height * 0.30,
    right: 24,
  },
  decorEmoji: {
    fontSize: 28,
  },

  midLeftDecor: {
    position: 'absolute',
    top: height * 0.40,
    left: 10,
  },
  midRightDecor: {
    position: 'absolute',
    top: height * 0.38,
    right: 10,
  },
  sparkEmoji: {
    fontSize: 22,
  },

  bannerStrip: {
    position: 'absolute',
    top: height * 0.04,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#4ECDC4',
    letterSpacing: 2,
  },
  bannerStrip3x: {
    position: 'absolute',
    top: height * 0.04,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(155, 89, 182, 0.18)',
  },
  bannerText3x: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#D4A5FF',
    letterSpacing: 2,
  },
});
