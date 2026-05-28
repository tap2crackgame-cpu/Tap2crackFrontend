import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/** Matches welcome / phone screens so loading fully covers the game instead of a translucent layer. */
const LOADING_GRADIENT = ["#1a1a2e", "#16213e", "#0f3460"] as const;

type PunItem = {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: Animated.Value;
  opacity: Animated.Value;
  translateY: Animated.Value;
};

const PUNS = [
  "Cracking the connection…",
  "Hold on, we’re shelling in…",
  "Searching for egg rooms…",
  "No yolk — almost ready!",
  "Eggspecting good things…",
  "Let’s get crackin’…",
  "Shell we begin?",
  "Hatching a fresh round…",
  "Just a whisker away…",
  "Loading… sunny side up.",
];

export default function EggPunLoadingOverlay({ visible }: { visible: boolean }) {
  const [items, setItems] = useState<PunItem[]>([]);
  const { width, height } = Dimensions.get("window");

  const safeBounds = useMemo(() => {
    // Keep puns away from edges/header-ish area.
    return {
      minX: 18,
      maxX: Math.max(18, width - 18),
      minY: Math.max(140, height * 0.28),
      maxY: Math.max(200, height - 120),
    };
  }, [width, height]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eggBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(eggBounce, { toValue: -10, duration: 500, useNativeDriver: true }),
        Animated.timing(eggBounce, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, [eggBounce, visible]);

  useEffect(() => {
    if (!visible) {
      setItems([]);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const spawn = () => {
      const text = PUNS[Math.floor(Math.random() * PUNS.length)];
      const x = Math.floor(
        safeBounds.minX + Math.random() * Math.max(1, safeBounds.maxX - safeBounds.minX - 180)
      );
      const y = Math.floor(
        safeBounds.minY + Math.random() * Math.max(1, safeBounds.maxY - safeBounds.minY)
      );

      const item: PunItem = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text,
        x,
        y,
        scale: new Animated.Value(0.9),
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(8),
      };

      setItems(prev => [...prev.slice(-7), item]);

      Animated.parallel([
        Animated.timing(item.opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(item.translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.spring(item.scale, { toValue: 1, useNativeDriver: true }),
      ]).start(() => {
        Animated.timing(item.opacity, { toValue: 0, duration: 450, delay: 900, useNativeDriver: true }).start(() => {
          setItems(prev => prev.filter(p => p.id !== item.id));
        });
      });
    };

    spawn();
    intervalRef.current = setInterval(spawn, 750);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [safeBounds, visible]);

  if (!visible) return null;

  return (
    <View style={styles.root} pointerEvents="auto">
      <LinearGradient
        colors={[...LOADING_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.center}>
        <Animated.Text style={[styles.egg, { transform: [{ translateY: eggBounce }] }]}>🥚</Animated.Text>
        <Text style={styles.title}>Finding an egg room…</Text>
        <Text style={styles.subtitle}>Warming up the shell-stadium</Text>
        <ActivityIndicator color="#FFD700" style={styles.spinner} />
      </View>

      {items.map(item => (
        <Animated.View
          key={item.id}
          style={[
            styles.punPill,
            {
              left: item.x,
              top: item.y,
              opacity: item.opacity,
              transform: [{ translateY: item.translateY }, { scale: item.scale }],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.punText}>{item.text}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  center: { alignItems: "center", zIndex: 1 },
  egg: { fontSize: 54, marginBottom: 10 },
  title: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: "#FFF",
    textShadowColor: "rgba(255,215,0,0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },
  spinner: { marginTop: 14 },
  punPill: {
    position: "absolute",
    maxWidth: 220,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  punText: { color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: "600" as const },
});

