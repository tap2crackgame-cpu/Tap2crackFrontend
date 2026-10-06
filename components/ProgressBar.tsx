import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet, Text, Platform, AccessibilityInfo, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  progress: number;
  othersActive?: boolean;
  othersTapShare?: number;
  /** Replaces the hint text above the bar (e.g. between rounds). */
  message?: string;
}

const IS_WEB = Platform.OS === 'web';

/** Stable pseudo-random 0.45..1 so the flame shape doesn't jump around between renders. */
const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return 0.45 + 0.55 * (x - Math.floor(x));
};

/**
 * One continuous wall of flame across the filled width: many overlapping pointed peaks,
 * fading in at the left and tallest at the leading edge, so it reads as fire rather than icons.
 */
function fireBandPath(bandW: number, H: number, peakW: number, hScale: number, seed: number) {
  const k = Math.max(3, Math.round(bandW / peakW));
  const w = bandW / k;
  let d = `M0 ${H}`;
  for (let j = 0; j < k; j++) {
    const x0 = j * w;
    const xc = (x0 + w / 2) / bandW; // 0..1 along the band
    const rampIn = Math.min(1, (x0 + w / 2) / 18);
    const tipBoost = xc > 0.85 ? 1 + ((xc - 0.85) / 0.15) * 0.45 : 1;
    // Body flames use ~72% of the height so the taller leading-edge flames still fit without being cut off.
    const h = Math.min(H * 0.98, H * hScale * 0.72 * rnd(seed + j) * rampIn * tipBoost);
    const lean = 0.5 + (rnd(seed * 3 + j) - 0.725) * 0.6; // tips lean a little left/right
    const endY = j === k - 1 ? H : H - h * 0.42;
    const tipX = x0 + w * lean;
    // Rounded, bulging sides that pinch to a curled tip, like a real flame tongue.
    d += ` C ${(x0 + w * 0.02).toFixed(1)} ${(H - h * 0.5).toFixed(1)} ${(tipX - w * 0.25).toFixed(1)} ${(H - h * 0.8).toFixed(1)} ${tipX.toFixed(1)} ${(H - h).toFixed(1)}`;
    d += ` C ${(tipX + w * 0.2).toFixed(1)} ${(H - h * 0.72).toFixed(1)} ${(x0 + w * 1.02).toFixed(1)} ${(H - h * 0.5).toFixed(1)} ${(x0 + w).toFixed(1)} ${endY.toFixed(1)}`;
  }
  return `${d} L${bandW.toFixed(1)} ${H} Z`;
}

const FireLayer = memo(function FireLayer({
  bandW, H, peakW, hScale, seed, id, stops,
}: { bandW: number; H: number; peakW: number; hScale: number; seed: number; id: string; stops: [string, string, string] }) {
  const d = useMemo(() => fireBandPath(bandW, H, peakW, hScale, seed), [bandW, H, peakW, hScale, seed]);
  return (
    <Svg width={bandW} height={H}>
      <Defs>
        <SvgGradient id={id} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={stops[0]} />
          <Stop offset="0.55" stopColor={stops[1]} />
          <Stop offset="1" stopColor={stops[2]} stopOpacity={0.75} />
        </SvgGradient>
      </Defs>
      <Path d={d} fill={`url(#${id})`} />
    </Svg>
  );
});

function ProgressBar({ progress, othersActive = false, message }: ProgressBarProps) {
  const cleanProgress = Number.isFinite(progress) ? progress : 0;
  const raw = Math.min(Math.max(cleanProgress, 0), 100);
  const clampedProgress = raw >= 99.5 ? 100 : raw;
  const heat = clampedProgress / 100;

  const animatedProgress = useRef(new Animated.Value(clampedProgress)).current;
  const borderPulse = useRef(new Animated.Value(0)).current;
  const flick = useRef(new Animated.Value(0)).current; // drives the glow on the fill
  // Three out-of-phase flickers, one per flame layer (cheap: transform/opacity on the native driver).
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
    if (message) return message;
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

  // Three stacked layers of flame (deep red, orange, yellow core) burning along the filled part of the bar.
  // Each layer flickers on its own phase, which makes the wall of fire look alive.
  const filledPx = Math.round((barW * clampedProgress) / 100);
  const bandW = Math.max(10, filledPx);
  const fireH = Math.round((compact ? 20 : 26) + heat * (compact ? 12 : 16));
  const peakW = compact ? 13 : 16;
  const isHot = clampedProgress >= 70;
  const layer = (v: Animated.Value, flip: boolean) => ({
    position: 'absolute' as const,
    left: 0,
    bottom: 0,
    transformOrigin: 'bottom',
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: flip ? [1, 0.82] : [0.85, 1] }),
    transform: [
      { scaleY: v.interpolate({ inputRange: [0, 1], outputRange: flip ? [1.12, 0.86] : [0.88, 1.14] }) },
      { translateX: v.interpolate({ inputRange: [0, 1], outputRange: flip ? [1.5, -1.5] : [-1.5, 1.5] }) },
    ],
  });
  const flames = (
    <>
      <Animated.View style={layer(flickA, false) as any}>
        <FireLayer bandW={bandW} H={fireH} peakW={peakW} hScale={1} seed={1} id="t2cFireOuter"
          stops={isHot ? ['#B71C1C', '#FF3D00', '#FF9100'] : ['#D84315', '#FF6D00', '#FFAB00']} />
      </Animated.View>
      <Animated.View style={layer(flickB, true) as any}>
        <FireLayer bandW={bandW} H={fireH} peakW={peakW * 1.3} hScale={0.7} seed={7} id="t2cFireMid"
          stops={isHot ? ['#FF3D00', '#FF9100', '#FFD600'] : ['#FF6D00', '#FFA000', '#FFE082']} />
      </Animated.View>
      <Animated.View style={layer(flickC, false) as any}>
        <FireLayer bandW={bandW} H={fireH} peakW={peakW * 1.7} hScale={0.4} seed={13} id="t2cFireCore"
          stops={['#FFD54F', '#FFF176', '#FFFDE7']} />
      </Animated.View>
    </>
  );

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
          <View pointerEvents="none" style={[styles.flameLayer, { height: fireH, width: bandW }]}>
            {flames}
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
  flameLayer: { position: 'absolute', left: 0, bottom: '50%', zIndex: 3 },
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
