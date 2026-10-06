import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Clucky } from './landing/Mascot';
import { LinearGradient } from 'expo-linear-gradient';

interface CooldownTimerProps {
  endTime: number | string | Date | null;
  onJoinNext: () => void;
}

export default function CooldownTimer({ endTime, onJoinNext }: CooldownTimerProps) {
  // 1. Ensure we have a valid numeric timestamp
  const targetTime = useMemo(() => {
    if (!endTime) return 0;
    return typeof endTime === 'number' ? endTime : new Date(endTime).getTime();
  }, [endTime]);
  
  // Start from the real time left (not a placeholder) so the countdown ring starts full.
  const [secondsLeft, setSecondsLeft] = useState(() =>
    targetTime ? Math.max(0, Math.ceil((targetTime - Date.now()) / 1000)) : 10
  );
  const [autoJoin, setAutoJoin] = useState(true);
  const [eggCracked, setEggCracked] = useState(false);
  const hasAutoJoinedRef = useRef(false);
  
  const eggShakeAnim = useRef(new Animated.Value(0)).current;
  const eggScaleAnim = useRef(new Animated.Value(1)).current;

  // Sync state when endTime changes
  useEffect(() => {
    hasAutoJoinedRef.current = false;
    setEggCracked(false);
    eggScaleAnim.setValue(1);
    eggShakeAnim.setValue(0);
  }, [targetTime]);

  useEffect(() => {
    if (targetTime === 0) return;

    const tick = () => {
      const now = Date.now();
      const diffMs = targetTime - now;
      const seconds = Math.max(0, Math.ceil(diffMs / 1000));
      
      setSecondsLeft(seconds);

      if (seconds <= 0 && !hasAutoJoinedRef.current) {
        hasAutoJoinedRef.current = true;
        onJoinNext();
      }
    };

    tick(); // Run once immediately
    const timer = setInterval(tick, 500); // Update every half second for accuracy

    return () => clearInterval(timer);
  }, [targetTime, onJoinNext]);

  const handleManualJoin = useCallback(() => {
    if (!eggCracked) {
      setEggCracked(true);
      Animated.sequence([
        Animated.timing(eggShakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(eggShakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(eggShakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        Animated.spring(eggScaleAnim, { toValue: 1.2, friction: 3, useNativeDriver: true }),
      ]).start();
    }
  }, [eggCracked]);

  // Ring + entrance animations
  const totalRef = useRef(0);
  const ring = useRef(new Animated.Value(1)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const [pun] = useState(() => NEXT_ROUND_PUNS[Math.floor(Math.random() * NEXT_ROUND_PUNS.length)]);

  useEffect(() => {
    totalRef.current = 0;
    enter.setValue(0);
    Animated.spring(enter, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }).start();
  }, [targetTime, enter]);

  useEffect(() => {
    if (secondsLeft > totalRef.current) totalRef.current = secondsLeft; // first reading = full ring
    const total = Math.max(1, totalRef.current);
    Animated.timing(ring, {
      toValue: secondsLeft / total,
      duration: 480,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [secondsLeft, ring]);

  if (secondsLeft <= 0 && hasAutoJoinedRef.current) return null;

  const urgent = secondsLeft <= 3;
  const dashOffset = ring.interpolate({ inputRange: [0, 1], outputRange: [RING_C, 0] });

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['rgba(16,18,40,0.94)', 'rgba(8,10,24,0.98)']} style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: enter,
              transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
            },
          ]}
        >
          <Clucky size={84} label="Clucky waiting for the next egg" />
          <Text style={styles.title}>Round Over!</Text>
          <Text style={styles.subtitle}>{pun}</Text>

          {/* countdown ring */}
          <View style={styles.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke="rgba(255,255,255,0.1)" strokeWidth={RING_STROKE} fill="none" />
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_R}
                stroke={urgent ? '#FF6B6B' : '#FFD700'}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${RING_C} ${RING_C}`}
                strokeDashoffset={dashOffset as unknown as number}
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={[styles.timer, urgent && styles.timerUrgent]}>{secondsLeft}</Text>
              <Text style={styles.timerUnit}>seconds</Text>
            </View>
          </View>
          <Text style={styles.timerLabel}>until the next egg drops</Text>

          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleManualJoin}
            activeOpacity={0.85}
            disabled={eggCracked}
            accessibilityRole="button"
            accessibilityState={{ disabled: eggCracked }}
          >
            <LinearGradient
              colors={eggCracked ? ['#FFD700', '#F5A623'] : ['#4ECDC4', '#3BA99F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Animated.Text style={[styles.eggIcon, { transform: [{ translateX: eggShakeAnim }, { scale: eggScaleAnim }] }]}>
                {eggCracked ? '🐣' : '🥚'}
              </Animated.Text>
              <Text style={[styles.buttonText, eggCracked && styles.buttonTextLocked]}>
                {eggCracked ? "Locked in! You're ready" : 'Lock in for next round'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.autoJoinText}>
            {eggCracked ? 'Get your tapping finger ready 👆' : "Don't worry, you'll join automatically."}
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const RING_SIZE = 132;
const RING_STROKE = 8;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const NEXT_ROUND_PUNS = [
  'A fresh egg is warming up…',
  'Shell we go again?',
  'No yolk, the next one could be yours!',
  'Getting the next egg out of the nest…',
  'Eggs-cited for round two?',
];

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timerUrgent: { color: '#FF8A80' },
  timerUnit: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  timerLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 10,
    marginBottom: 20,
  },
  joinButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  eggIcon: {
    fontSize: 22,
    lineHeight: 28,
    marginRight: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  buttonTextLocked: { color: '#1A1A2E' },
  autoJoinText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});
