import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface FireBackgroundProps {
  intensity: number;
  active: boolean;
}

interface Ember {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  startX: number;
  startY: number;
  color: string;
  size: number;
}

const EMBER_COLORS = [
  '#FF4500',
  '#FF6B00',
  '#FF8C00',
  '#FFD700',
  '#FF3300',
  '#FF5722',
  '#FFA000',
];

export default function FireBackground({ intensity, active }: FireBackgroundProps) {
  const borderGlow = useRef(new Animated.Value(0)).current;
  const heatWave1 = useRef(new Animated.Value(0)).current;
  const heatWave2 = useRef(new Animated.Value(0)).current;
  const intensityRef = useRef(intensity);
  const activeRef = useRef(active);
  const emberCancelledRef = useRef(false);

  intensityRef.current = intensity;
  activeRef.current = active;

  const embers = useMemo<Ember[]>(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      startX: Math.random() * width,
      startY: height * 0.6 + Math.random() * height * 0.4,
      color: EMBER_COLORS[i % EMBER_COLORS.length],
      size: 4 + Math.random() * 8,
    }));
  }, []);

  useEffect(() => {
    if (!active) {
      emberCancelledRef.current = true;
      borderGlow.setValue(0);
      heatWave1.setValue(0);
      heatWave2.setValue(0);
      embers.forEach(e => {
        e.opacity.setValue(0);
        e.scale.setValue(0);
        e.x.setValue(0);
        e.y.setValue(0);
      });
      return;
    }

    emberCancelledRef.current = false;

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(borderGlow, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(borderGlow, { toValue: 0.1, duration: 800, useNativeDriver: true }),
      ])
    );

    const heat1Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(heatWave1, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(heatWave1, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );

    const heat2Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(heatWave2, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(heatWave2, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );

    glowLoop.start();
    heat1Loop.start();
    heat2Loop.start();

    embers.forEach((ember, i) => {
      const delay = i * 200 + Math.random() * 400;
      const duration = 1500 + Math.random() * 1500;

      const animateEmber = () => {
        if (emberCancelledRef.current) return;

        ember.x.setValue(0);
        ember.y.setValue(0);
        ember.opacity.setValue(0);
        ember.scale.setValue(0);

        const currentIntensity = intensityRef.current || 0.5;

        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(ember.y, {
              toValue: -(height * 0.3 + Math.random() * height * 0.3),
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(ember.x, {
              toValue: (Math.random() - 0.5) * 80,
              duration,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(ember.opacity, { toValue: 0.8 * currentIntensity, duration: 200, useNativeDriver: true }),
              Animated.timing(ember.opacity, { toValue: 0, duration: duration - 200, useNativeDriver: true }),
            ]),
            Animated.sequence([
              Animated.timing(ember.scale, { toValue: 1, duration: 300, useNativeDriver: true }),
              Animated.timing(ember.scale, { toValue: 0.2, duration: duration - 300, useNativeDriver: true }),
            ]),
          ]),
        ]).start(() => {
          if (activeRef.current && !emberCancelledRef.current) animateEmber();
        });
      };

      animateEmber();
    });

    return () => {
      emberCancelledRef.current = true;
      glowLoop.stop();
      heat1Loop.stop();
      heat2Loop.stop();
      embers.forEach(e => {
        e.x.stopAnimation();
        e.y.stopAnimation();
        e.opacity.stopAnimation();
        e.scale.stopAnimation();
      });
    };
  }, [active, borderGlow, heatWave1, heatWave2, embers]);

  if (!active) return null;

  const heat1Opacity = heatWave1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.12 * intensity],
  });

  const heat2Opacity = heatWave2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.08 * intensity],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.bottomGlow, { opacity: borderGlow }]} />
      <Animated.View style={[styles.sideGlowLeft, { opacity: borderGlow }]} />
      <Animated.View style={[styles.sideGlowRight, { opacity: borderGlow }]} />

      <Animated.View style={[styles.heatWave, styles.heatWave1, { opacity: heat1Opacity }]} />
      <Animated.View style={[styles.heatWave, styles.heatWave2, { opacity: heat2Opacity }]} />

      {embers.map((ember, i) => (
        <Animated.View
          key={i}
          style={[
            styles.ember,
            {
              left: ember.startX,
              top: ember.startY,
              width: ember.size,
              height: ember.size,
              borderRadius: ember.size / 2,
              backgroundColor: ember.color,
              opacity: ember.opacity,
              transform: [
                { translateX: ember.x },
                { translateY: ember.y },
                { scale: ember.scale },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
    overflow: 'hidden',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    backgroundColor: 'transparent',
    borderTopLeftRadius: width,
    borderTopRightRadius: width,
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 20,
    borderTopWidth: 2,
    borderColor: 'rgba(255,69,0,0.3)',
  },
  sideGlowLeft: {
    position: 'absolute',
    left: 0,
    top: height * 0.3,
    bottom: 0,
    width: 40,
    backgroundColor: 'rgba(255,69,0,0.15)',
  },
  sideGlowRight: {
    position: 'absolute',
    right: 0,
    top: height * 0.3,
    bottom: 0,
    width: 40,
    backgroundColor: 'rgba(255,69,0,0.15)',
  },
  heatWave: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 100,
  },
  heatWave1: {
    bottom: height * 0.1,
    height: height * 0.25,
    backgroundColor: 'rgba(255,100,0,0.3)',
  },
  heatWave2: {
    bottom: height * 0.2,
    height: height * 0.2,
    backgroundColor: 'rgba(255,165,0,0.2)',
  },
  ember: {
    position: 'absolute',
  },
});
