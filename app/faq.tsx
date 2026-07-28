import { StyleSheet, View, Text, ScrollView, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HelpCircle } from "lucide-react-native";
import { Link } from "expo-router";

const FAQ_ITEMS = [
  {
    q: "What is Tap2Crack? 🥚",
    a: "Tap2Crack is a free real-time multiplayer egg cracking game. Players tap together on shared eggs, and whoever lands the final tap wins real prizes like airtime, cash, coupons, and merch.",
  },
  {
    q: "Do I need to pay to win? 💰",
    a: "Nope! No payment is required to win. Power-ups are optional boosts — think of them as extra tap sauce, not a golden ticket.",
  },
  {
    q: "How does winning work? 🏆",
    a: "Every egg round needs a fixed number of taps. All players contribute. When the egg reaches 100%, the player who makes the last cracking tap wins that round's prize.",
  },
  {
    q: "What prizes can I win? 🎁",
    a: "Airtime, cash, discount coupons (KFC, Chicken Republic, and more), movie tickets, pizza, cake slices, and Tap2Crack merch like hoodies and jackets.",
  },
  {
    q: "What's the difference between egg types? 🐔",
    a: "Normal, Silver, Gold, Business, Company, and Pure eggs each offer different prize tiers and vibes. Business and Company eggs often carry partner coupons; Gold and Silver eggs tend toward higher-value rewards.",
  },
  {
    q: "Can I play as a guest? 👤",
    a: "Yes! Guest mode lets you jump in instantly. Sign in with Google to unlock full prize history and codes on your profile.",
  },
  {
    q: "Are bots or auto-tappers allowed? 🤖",
    a: "Absolutely not. Fair play is enforced. Bots, scripts, and exploits will get you shell-shocked with a ban.",
  },
  {
    q: "Why can't I win MTN credit outside Nigeria? 🌍",
    a: "Some airtime prizes are tied to Nigerian networks (MTN, Glo, Airtel, 9mobile). We're working to eggs-pand rewards globally — don't eggs-clude yourself from the fun!",
  },
  {
    q: "How do I contact support? 📧",
    a: "Email us at tap2crackgame@gmail.com or visit the Contact page to reach the team.",
  },
];

export default function FaqScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <HelpCircle size={28} color="#FFD700" />
            </View>
            <Text style={styles.title}>Frequently Asked Questions</Text>
            <Text style={styles.subtitle}>
              Got egg questions? We've got egg answers. No yolk! 🐣
            </Text>
          </View>

          {FAQ_ITEMS.map((item) => (
            <View key={item.q} style={styles.faqCard}>
              <Text style={styles.question}>{item.q}</Text>
              <Text style={styles.answer}>{item.a}</Text>
            </View>
          ))}

          <Link href="/how-to-play" style={styles.link}>
            Read the full How to Play guide →
          </Link>
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
  faqCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  question: { fontSize: 15, fontWeight: "700", color: "#FFD700", marginBottom: 8 },
  answer: { fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 22 },
  link: {
    alignSelf: "center",
    marginTop: 16,
    fontSize: 14,
    color: "#4ECDC4",
    fontWeight: "600",
  },
  homeLink: {
    alignSelf: "center",
    marginTop: 12,
    fontSize: 14,
    color: "#FFD700",
    fontWeight: "600",
  },
});
