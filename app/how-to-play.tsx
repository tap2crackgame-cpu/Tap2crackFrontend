import { StyleSheet, View, Text, ScrollView, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BookOpen } from "lucide-react-native";
import { Link } from "expo-router";

const STEPS = [
  {
    title: "1. Join the flock 🐔",
    body: "Sign in with Google or tap Play as Guest. No payment is required — we're not yolking around about free fun.",
  },
  {
    title: "2. Pick your egg 🥚",
    body: "Choose from Normal, Silver, Gold, Business, Company, or Pure eggs. Each room has its own vibe, prizes, and chicken energy.",
  },
  {
    title: "3. Tap like your life depends on it 👆",
    body: "Every tap adds cracks to the shared egg progress bar. You're racing real players in real time — shell yeah!",
  },
  {
    title: "4. Boost optional (not required) ⚡",
    body: "Use 2x or 3x power-ups to add more tap power, or watch ads when offered. Boosts help — they don't guarantee a win.",
  },
  {
    title: "5. Land the final tap 🏆",
    body: "When the egg hits 100%, the player who makes the last cracking tap wins the round prize. Timing is everything!",
  },
  {
    title: "6. Claim your prize 🎁",
    body: "Winners see their reward instantly. Signed-in users can track codes and settlement on the Prizes page.",
  },
];

const WIN_RULES = [
  "Each round needs a set number of taps before the egg cracks.",
  "All players in the room contribute taps together.",
  "The final tap wins — it's a multiplayer sprint, not a solo scramble.",
  "Fair play only: bots, auto-tappers, and exploits are banned.",
];

const PRIZE_TYPES = [
  "📱 Mobile airtime (MTN, Glo, Airtel, 9mobile)",
  "💵 Cash rewards",
  "🎟️ Coupons & discounts (KFC, Chicken Republic, and more)",
  "🍿 Movie tickets",
  "🍕 Pizza boxes",
  "👕 Merch — hoodies, jackets, mugs, and more",
];

export default function HowToPlayScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <BookOpen size={28} color="#FFD700" />
            </View>
            <Text style={styles.title}>How to Play Tap2Crack</Text>
            <Text style={styles.subtitle}>
              Tap. Crack. Win. Repeat. It's egg-stremely simple — and egg-stremely addictive. 🥚
            </Text>
          </View>

          {STEPS.map((step) => (
            <View key={step.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{step.title}</Text>
              <Text style={styles.body}>{step.body}</Text>
            </View>
          ))}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How wins work 🏆</Text>
            {WIN_RULES.map((rule) => (
              <Text key={rule} style={styles.bullet}>
                • {rule}
              </Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What you can win 🎁</Text>
            {PRIZE_TYPES.map((item) => (
              <Text key={item} style={styles.bullet}>
                • {item}
              </Text>
            ))}
          </View>

          <Link href="/" style={styles.homeLink}>
            ← Back to Home
          </Link>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { alignItems: "center", paddingVertical: 20, marginBottom: 8 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,215,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFF", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 22 },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#FFD700", marginBottom: 8 },
  body: { fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 22 },
  bullet: { fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 24, marginBottom: 4 },
  homeLink: {
    alignSelf: "center",
    marginTop: 12,
    fontSize: 14,
    color: "#FFD700",
    fontWeight: "600",
  },
});
