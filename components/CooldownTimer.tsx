import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
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
  
  const [secondsLeft, setSecondsLeft] = useState(10);
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

   if (secondsLeft <= 0 && hasAutoJoinedRef.current) return null;

  return (
    <View style={StyleSheet.absoluteFill}> 
      <LinearGradient
        colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.98)']}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <Text style={styles.title}>🥚 Round Over!</Text>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Next round begins in</Text>
            <Text style={styles.timer}>{secondsLeft}s</Text>
          </View>

          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleManualJoin}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={eggCracked ? ['#FFD700', '#FFA500'] : ['#4ECDC4', '#44B3AB']}
              style={styles.buttonGradient}
            >
              <Animated.Text style={[styles.eggIcon, { transform: [{ translateX: eggShakeAnim }, { scale: eggScaleAnim }] }]}>
                {eggCracked ? '🐣' : '🥚'}
              </Animated.Text>
              <Text style={styles.buttonText}>{eggCracked ? 'Locked in!' : 'Lock in for next round'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.autoJoinText}>
            You will join the next round automatically.
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

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
  },
  content: {
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 40,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  timer: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  joinButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  eggIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  autoJoinText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
});
