import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet, Text, Platform, AccessibilityInfo } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  progress: number;
  othersActive?: boolean;
  othersTapShare?: number;
}

const IS_WEB = Platform.OS === 'web';

function ProgressBar({ progress, othersActive = false }: ProgressBarProps) {
  const cleanProgress = Number.isFinite(progress) ? progress : 0;
  const raw = Math.min(Math.max(cleanProgress, 0), 100);
  const clampedProgress = raw >= 99.5 ? 100 : raw;
  const heat = clampedProgress / 100;

  const animatedProgress = useRef(new Animated.Value(clampedProgress)).current;
  const borderPulse = useRef(new Animated.Value(0)).current;
  const flick = useRef(new Animated.Value(0)).current; // drives every flame + the glow (transform/opacity only)
  const [still, setStill] = useState(false);

  useEffect(() => {
    animatedProgress.setValue(clampedProgress);
  }, [animatedProgress, clampedProgress]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
  }, []);

  useEffect(() => {
    if (still || clampedProgress <= 0) return;
    const ms = clampedProgress >= 70 ? 170 : 260; // hotter = faster flicker
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flick, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(flick, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [flick, still, clampedProgress >= 70, clampedProgress > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!othersActive || IS_WEB) {
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

  // FOMO copy: the closer it is, the more it says someone else is about to grab it.
  const getNotificationText = () => {
    if (clampedProgress >= 90) return "🚨 ABOUT TO CRACK! Someone wins THIS second!";
    if (clampedProgress >= 70) return "🔥 It's HOT! Don't let someone else steal it!";
    if (othersActive && clampedProgress >= 50) return "⚡ Everyone's tapping! Are you in?";
    if (clampedProgress >= 50) return "💪 Halfway! The next tap could be THE one!";
    if (othersActive) return "👥 Others are tapping too. Race them!";
    if (clampedProgress >= 25) return "🥚 It's heating up. Keep tapping!";
    return "👆 Start tapping, the egg is waiting!";
  };

  // Fire: dark ember on the left, bright yellow tip. Hotter bar as progress climbs.
  const getBarGradient = (): [string, string, string] => {
    if (clampedProgress >= 90) return ['#B71C1C', '#FF3B30', '#FFE000'];
    if (clampedProgress >= 70) return ['#D32F2F', '#FF5A1F', '#FFD60A'];
    if (clampedProgress >= 40) return ['#E65100', '#FF8A00', '#FFE066'];
    return ['#F57C00', '#FFA726', '#FFF176'];
  };

  const fillWidth = useMemo(
    () => animatedProgress.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
    [animatedProgress]
  );

  const flameCount = clampedProgress >= 60 ? 3 : clampedProgress >= 25 ? 2 : 1;
  const flameSize = 16 + heat * 16;
  const flames = Array.from({ length: flameCount }, (_, i) => {
    const flip = i % 2 === 1;
    return (
      <Animated.Text
        key={i}
        style={{
          fontSize: flameSize * (1 - i * 0.14),
          marginRight: i === 0 ? -6 : -10,
          opacity: flick.interpolate({ inputRange: [0, 1], outputRange: flip ? [1, 0.75] : [0.8, 1] }),
          transform: [
            { scaleY: flick.interpolate({ inputRange: [0, 1], outputRange: flip ? [1.25, 0.85] : [0.85, 1.25] }) },
            { translateY: flick.interpolate({ inputRange: [0, 1], outputRange: flip ? [-4, 0] : [0, -4] }) },
            { rotate: flick.interpolate({ inputRange: [0, 1], outputRange: flip ? ['6deg', '-6deg'] : ['-6deg', '6deg'] }) },
          ],
        }}
      >
        🔥
      </Animated.Text>
    );
  });

  const barInner = (
    <View style={styles.barContainer}>
      <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.track}>
        <View style={styles.trackInner} />
      </LinearGradient>

      <Animated.View style={[styles.fillContainer, { width: fillWidth }]}>
        <LinearGradient colors={getBarGradient()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fill}>
          <View style={styles.shine} />
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF3A0', opacity: flick.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] }) }]}
          />
        </LinearGradient>
      </Animated.View>

      <View style={styles.segments}>
        {[...Array(10)].map((_, i) => (
          <View key={i} style={styles.segment} />
        ))}
      </View>
    </View>
  );

  const webBarOuterStyle = [styles.barOuter, othersActive && styles.barOuterActive, othersActive && { borderColor: 'rgba(255,140,50,0.8)' }];
  const nativeBarOuterStyle = [
    styles.barOuter,
    othersActive && styles.barOuterActive,
    othersActive && {
      borderColor: borderPulse.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,140,50,0.35)', 'rgba(255,140,50,0.95)'] }) as unknown as string,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={[styles.notificationText, clampedProgress >= 70 && styles.notificationHot]}>{getNotificationText()}</Text>
        <Text style={styles.progressText}>{isNaN(clampedProgress) ? 0 : Math.floor(clampedProgress)}%</Text>
      </View>

      <View
        style={[
          styles.glowWrap,
          { shadowOpacity: 0.2 + heat * 0.65, shadowRadius: 6 + heat * 16, elevation: 4 + Math.round(heat * 8) },
        ]}
      >
        {clampedProgress > 0 && (
          <View pointerEvents="none" style={styles.flameLayer}>
            <Animated.View style={[styles.flameRow, { width: fillWidth }]}>{flames}</Animated.View>
          </View>
        )}
        <Animated.View style={IS_WEB ? webBarOuterStyle : nativeBarOuterStyle}>{barInner}</Animated.View>
      </View>

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
  container: { width: '100%', paddingHorizontal: 20 },
  labelContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  notificationText: { flex: 1, fontSize: 14, fontWeight: '700' as const, color: '#FFD700', marginRight: 8 },
  notificationHot: { color: '#FF8A65', fontWeight: '900' as const },
  barOuterActive: { borderWidth: 2, borderColor: '#FF8C32' },
  progressText: { fontSize: 16, fontWeight: 'bold' as const, color: '#FFFFFF' },
  glowWrap: {
    borderRadius: 14,
    backgroundColor: 'rgba(30,12,8,0.7)',
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 0 },
  },
  flameLayer: { position: 'absolute', left: 0, right: 0, top: -22, height: 30, zIndex: 3 },
  flameRow: { height: 30, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end' },
  barOuter: { borderRadius: 14, overflow: 'hidden' },
  barContainer: { height: 24, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  track: { flex: 1, borderRadius: 12 },
  trackInner: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12 },
  fillContainer: { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 12, overflow: 'hidden' },
  fill: { flex: 1, borderRadius: 12 },
  shine: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(255,255,255,0.3)', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  segments: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  segment: { width: 2, height: '100%', backgroundColor: 'rgba(0,0,0,0.2)' },
  markersRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  markers: { flexDirection: 'row', flex: 1, justifyContent: 'space-between' },
  markerText: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
});
