import React, { memo, useEffect, useMemo, useRef } from 'react';
import { View, Animated, StyleSheet, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  progress: number;
  othersActive?: boolean;
  othersTapShare?: number;
}

const IS_WEB = Platform.OS === 'web';

function ProgressBar({ progress, othersActive = false, othersTapShare = 0 }: ProgressBarProps) {
  // Safeguard incoming value right away to prevent NaN pollution
  const cleanProgress = Number.isFinite(progress) ? progress : 0;
  const raw = Math.min(Math.max(cleanProgress, 0), 100);
  const clampedProgress = raw >= 99.5 ? 100 : raw;

  const animatedProgress = useRef(new Animated.Value(clampedProgress)).current;
  const borderPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedProgress.setValue(clampedProgress);
  }, [animatedProgress, clampedProgress]);

  useEffect(() => {
    if (!othersActive || IS_WEB) {
      // Don't run the animation loop on Web at all to protect performance
      borderPulse.stopAnimation();
      borderPulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(borderPulse, { toValue: 1, duration: 520, useNativeDriver: false }),
        Animated.timing(borderPulse, { toValue: 0, duration: 520, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [borderPulse, othersActive]);

  const getNotificationText = () => {
    if (othersActive && clampedProgress >= 50) return "🔥 Everyone's going crazy!";
    if (othersActive) return "👥 Others are tapping too!";
    if (clampedProgress >= 90) return "👀 Egg is almost cracking!";
    if (clampedProgress >= 70) return "🔥 Getting close!";
    if (clampedProgress >= 50) return "💪 Halfway there!";
    if (clampedProgress >= 25) return "🥚 Keep tapping!";
    return "👆 Start tapping!";
  };

  const getBarGradient = (): [string, string] => {
    if (clampedProgress >= 90) return ['#FF6B6B', '#FF4757'];
    if (clampedProgress >= 70) return ['#FFA502', '#FF6B6B'];
    if (clampedProgress >= 50) return ['#FFD700', '#FFA502'];
    return ['#4ECDC4', '#44B3AB'];
  };

  const fillWidth = useMemo(() => {
    return animatedProgress.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });
  }, [animatedProgress]);

  const barInner = (
    <View style={styles.barContainer}>
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.track}
      >
        <View style={styles.trackInner} />
      </LinearGradient>

      <Animated.View style={[styles.fillContainer, { width: fillWidth }]}>
        <LinearGradient
          colors={getBarGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fill}
        >
          <View style={styles.shine} />
        </LinearGradient>
      </Animated.View>

      <View style={styles.segments}>
        {[...Array(10)].map((_, i) => (
          <View key={i} style={styles.segment} />
        ))}
      </View>
    </View>
  );

  // FIX: Web uses a clean, solid color when others are active—no interpolation crash!
  const webBarOuterStyle = [
    styles.barOuter,
    othersActive && styles.barOuterActive,
    othersActive && { borderColor: 'rgba(255,140,50,0.8)' },
  ];

  // Native mobile apps can process the pulsing interpolation safely via JavaScript
  const nativeBarOuterStyle = [
    styles.barOuter,
    othersActive && styles.barOuterActive,
    othersActive && { 
      borderColor: borderPulse.interpolate({ 
        inputRange: [0, 1], 
        outputRange: ['rgba(255,140,50,0.35)', 'rgba(255,140,50,0.95)'] 
      }) as unknown as string 
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.notificationText}>
          {getNotificationText()}
        </Text>
        <Text style={styles.progressText}>
          {isNaN(clampedProgress) ? 0 : Math.floor(clampedProgress)}%
        </Text>
      </View>

      <Animated.View style={IS_WEB ? webBarOuterStyle : nativeBarOuterStyle}>
        {barInner}
      </Animated.View>

      <View style={styles.markersRow}>
        <View style={styles.markers}>
          <Text style={styles.markerText}>0%</Text>
          <Text style={styles.markerText}>50%</Text>
          <Text style={styles.markerText}>100%</Text>
        </View>
      </View>
    </View>
  );
}

export default memo(ProgressBar);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFD700',
  },
  barOuterActive: {
    borderWidth: 2,
    borderColor: '#FF8C32',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  barOuter: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  barContainer: {
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  track: {
    flex: 1,
    borderRadius: 12,
  },
  trackInner: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  fillContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
    borderRadius: 12,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  segments: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  segment: {
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  markersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  markers: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  markerText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
});
