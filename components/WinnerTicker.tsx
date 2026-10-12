import React, { memo, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { displayWinnerName, type Winner } from "@/types/game";

function prizeShort(w: Winner): string {
  if (w.prize_type === "coupon") return w.company_name ? `a ${w.company_name} coupon 🎟️` : "a coupon 🎟️";
  if (w.prize_type === "airtime") return "airtime 📱";
  if (w.prize_type === "cash") return "cash 💸";
  return w.prize_description || "a prize 🎁";
}

function ago(iso: string): string {
  const t = new Date(iso).getTime();
  if (!t) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** One-line live ticker of recent winners: "🎉 Chioma just won airtime 📱 · 3m ago". Rotates every 4s. */
function WinnerTicker({ winners, compact = false }: { winners: Winner[]; compact?: boolean }) {
  const list = winners.slice(0, 8);
  const [i, setI] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (list.length < 2) return;
    const iv = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setI((n) => (n + 1) % list.length);
        Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => clearInterval(iv);
  }, [list.length, fade]);

  if (!list.length) return null;
  const w = list[i % list.length];
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View
        style={[styles.pill, { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }]}
      >
        <Text style={[styles.text, compact && styles.textSm]}>
          🎉 <Text style={styles.name}>{displayWinnerName(w.user_name).split(" ")[0]}</Text> won {prizeShort(w)}
          <Text style={styles.when}> · {ago(w.won_at)}</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

export default memo(WinnerTicker);

const styles = StyleSheet.create({
  wrap: { alignItems: "center", marginBottom: 6, minHeight: 28 },
  pill: {
    maxWidth: "100%",
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(46,204,113,0.14)",
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.4)",
  },
  text: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600", textAlign: "center" },
  textSm: { fontSize: 12 },
  name: { color: "#7CF0A9", fontWeight: "800" },
  when: { color: "rgba(255,255,255,0.5)", fontWeight: "500" },
});
