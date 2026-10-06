import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet, Text, Platform, AccessibilityInfo, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  progress: number;
  othersActive?: boolean;
  othersTapShare?: number;
}

const IS_WEB = Platform.OS === 'web';

/** One flame tongue (viewBox 20x32): outer orange-red body with a bright yellow core. */
const FLAME_OUTER = 'M10 32 C3 32 0 26 1.5 20 C3 14 7 12 7 3 C12 8 13 11 13.5 14 C15 12 15.5 10 15 7 C19 12 20 18 18.5 24 C17.5 29 14 32 10 32 Z';
const FLAME_INNER = 'M10 31 C6 31 4.5 27.5 5.5 24 C6.5 21 9 19.5 9.5 15 C12.5 18 15 21 14.5 25.5 C14 29 12.5 31 10 31 Z';

const FlameTongue = memo(function FlameTongue({ w, h, hot }: { w: number; h: number; hot: boolean }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 20 32">
      <Defs>
        <SvgGradient id="t2cFlameOuter" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={hot ? '#D50000' : '#E65100'} />
          <Stop offset="0.55" stopColor={hot ? '#FF3D00' : '#FF6D00'} />
          <Stop offset="1" stopColor="#FFAB00" stopOpacity={0.85} />
        </SvgGradient>
        <SvgGradient id="t2cFlameInner" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#FFF59D" />
          <Stop offset="1" stopColor="#FFD600" stopOpacity={0.6} />
        </SvgGradient>
      </Defs>
      <Path d={FLAME_OUTER} fill="url(#t2cFlameOuter)" />
      <Path d={FLAME_INNER} fill="url(#t2cFlameInner)" />
    </Svg>
  );
});

function ProgressBar({ progress, othersActive = false }: ProgressBarProps) {
  const cleanProgress = Number.isFinite(progress) ? progress : 0;
  const raw = Math.min(Math.max(cleanProgress, 0), 100);
  const clampedProgress = raw >= 99.5 ? 100 : raw;
  const heat = clampedProgress / 100;

  const animatedProgress = useRef(new Animated.Value(clampedProgress)).current;
  const borderPulse = useRef(new Animated.Value(0)).current;
  const flick = useRef(new Animated.Value(0)).current; // drives the glow on the fill
  // Three out-of-phase flickers shared by all flame tongues (cheap: transform/opacity on the native driver).
  const flickA = useRef(new Animated.Value(0)).current;
  const flickB = useRef(new Animated.Value(0)).current;
  const flickC = useRef(new Animated.Value(0)).current;
  const [still, setStill] = useState(false);
  const [barW, setBarW] = useState(0);
  const { width: screenW } = useWindowDimensions();
  const compact = screenW < 420;
  const onBarLayout = (e: LayoutChangeEvent) => setBarW(e.nativeEvent.layout.width);

  useEffect(() => {
    animatedProgress.setValue(clampedProgress);
  }, [animatedProgress, clampedProgress]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
  }, []);

  useEffect(() => {
    if (still || clampedProgress <= 0) return;
    const hot = clampedProgress >= 70; // hotter = faster flicker
    const mk = (v: Animated.Value, ms: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
    const loops = [
      mk(flick, hot ? 170 : 260),
      mk(flickA, hot ? 140 : 210),
      mk(flickB, hot ? 190 : 270),
      mk(flickC, hot ? 230 : 330),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [flick, flickA, flickB, flickC, still, clampedProgress >= 70, clampedProgress > 0]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (clampedProgress >= 70) return "It's HOT! Don't let someone else steal it!";
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

  // A row of drawn flame tongues burning along the filled part of the bar; tallest at the leading edge.
  const filledPx = (barW * clampedProgress) / 100;
  const tongueW = compact ? 12 : 14;
  const tongueCount = Math.max(1, Math.min(compact ? 28 : 40, Math.round(filledPx / (tongueW * 0.5))));
  const baseH = (compact ? 12 : 14) + heat * (compact ? 8 : 12);
  const phases = [flickA, flickB, flickC];
  const isHot = clampedProgress >= 70;
  const flames = Array.from({ length: tongueCount }, (_, i) => {
    const v = phases[i % 3];
    const fromTip = tongueCount - 1 - i; // 0 = leading edge
    const tipBoost = fromTip === 0 ? 1.45 : fromTip === 1 ? 1.2 : 1;
    const jitter = 0.8 + ((i * 37) % 10) / 25; // stable per-tongue variety
    const h = baseH * tipBoost * jitter;
    const w = tongueW * (fromTip === 0 ? 1.3 : 1);
    const leftPct = tongueCount === 1 ? 100 : ((i + 1) / tongueCount) * 100;
    return (
      <Animated.View
        key={i}
        style={{
          position: 'absolute',
          bottom: 0,
          left: `${leftPct}%`,
          marginLeft: -w * 0.85,
          transformOrigin: 'bottom',
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: i % 2 ? [0.95, 0.7] : [0.75, 1] }),
          transform: [
            { scaleY: v.interpolate({ inputRange: [0, 1], outputRange: i % 2 ? [1.15, 0.8] : [0.8, 1.2] }) },
            { scaleX: v.interpolate({ inputRange: [0, 1], outputRange: i % 2 ? [0.9, 1.08] : [1.08, 0.92] }) },
            { rotate: v.interpolate({ inputRange: [0, 1], outputRange: i % 2 ? ['4deg', '-4deg'] : ['-4deg', '4deg'] }) },
          ],
        } as any}
      >
        <FlameTongue w={w} h={h} hot={isHot} />
      </Animated.View>
    );
  });

  const barInner = (
    <View style={[styles.barContainer, compact && styles.barContainerCompact]} onLayout={onBarLayout}>
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
        <Text style={[styles.notificationText, compact && styles.notificationTextCompact, clampedProgress >= 70 && styles.notificationHot]} numberOfLines={2}>{getNotificationText()}</Text>
        <Text style={[styles.progressText, compact && styles.progressTextCompact]}>{isNaN(clampedProgress) ? 0 : Math.floor(clampedProgress)}%</Text>
      </View>

      <View
        style={[
          styles.glowWrap,
          { shadowOpacity: 0.2 + heat * 0.65, shadowRadius: 6 + heat * 16, elevation: 4 + Math.round(heat * 8) },
        ]}
      >
        <Animated.View style={IS_WEB ? webBarOuterStyle : nativeBarOuterStyle}>{barInner}</Animated.View>
        {clampedProgress > 0 && barW > 0 && !still && (
          <View pointerEvents="none" style={[styles.flameLayer, { height: baseH * 1.8 }]}>
            <Animated.View style={[styles.flameRow, { width: fillWidth }]}>{flames}</Animated.View>
          </View>
        )}
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
  container: { width: '100%' },
  labelContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  notificationText: { flex: 1, fontSize: 14, fontWeight: '700' as const, color: '#FFD700', marginRight: 8 },
  notificationTextCompact: { fontSize: 12 },
  progressTextCompact: { fontSize: 14 },
  barContainerCompact: { height: 18 },
  notificationHot: { color: '#FF8A65', fontWeight: '900' as const },
  barOuterActive: { borderWidth: 2, borderColor: '#FF8C32' },
  progressText: { fontSize: 16, fontWeight: 'bold' as const, color: '#FFFFFF' },
  glowWrap: {
    borderRadius: 14,
    backgroundColor: 'rgba(30,12,8,0.7)',
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 0 },
  },
  flameLayer: { position: 'absolute', left: 0, right: 0, bottom: '55%', zIndex: 3 },
  flameRow: { height: '100%', position: 'relative' },
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
