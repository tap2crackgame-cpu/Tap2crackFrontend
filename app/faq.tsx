import { StyleSheet, View, Text, ScrollView, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HelpCircle } from "lucide-react-native";
import { Link } from "expo-router";
import SeoHead from "@/components/SeoHead";
import SemanticHeading from "@/components/SemanticHeading";
import { FAQ_ITEMS } from "@/constants/seo";

export default function FaqScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <SeoHead page="faq" faqSchema />
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <HelpCircle size={28} color="#FFD700" />
            </View>
            <SemanticHeading level={1} style={styles.title}>
              Frequently Asked Questions
            </SemanticHeading>
            <Text style={styles.subtitle}>
              Common questions about Tap2Crack gameplay, rewards, and support.
            </Text>
          </View>

          {FAQ_ITEMS.map((item) => (
            <View key={item.question} style={styles.faqCard}>
              <SemanticHeading level={3} style={styles.question}>
                {item.question}
              </SemanticHeading>
              <Text style={styles.answer}>{item.answer}</Text>
            </View>
          ))}

          <Link href="/how-to-play" style={styles.link}>
            Read the How to Play guide
          </Link>
          <Link href="/" style={styles.homeLink}>
            Back to Home
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
