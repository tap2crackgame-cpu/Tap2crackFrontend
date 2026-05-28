import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Egg, Mail, Megaphone } from "lucide-react-native";
import BengzFooter from "@/components/BengzFooter";

const SPONSOR_EMAIL = "tap2crackgame@gmail.com";

export default function SponsorScreen() {
  const handleContact = () => {
    Linking.openURL(
      `mailto:${SPONSOR_EMAIL}?subject=Tap2Crack%20Sponsorship%20Inquiry&body=Hi%2C%20I%27m%20interested%20in%20sponsoring%20an%20egg%20round%20on%20Tap2Crack.`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Megaphone size={30} color="#FFD700" />
            </View>
            <Text style={styles.title}>Be a Sponsor</Text>
            <Text style={styles.subtitle}>
              Get your brand in front of thousands of players every round.
            </Text>
          </View>

          <View style={styles.whatYouGetCard}>
            <Text style={styles.sectionTitle}>What You Get</Text>

            <View style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Egg size={22} color="#FFD700" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Your Company-Themed Egg</Text>
                <Text style={styles.benefitDesc}>
                  A custom egg designed with your brand's colors, logo, and identity. Every player sees and taps YOUR egg.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Megaphone size={22} color="#FF6B6B" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Your Ads Before Your Egg</Text>
                <Text style={styles.benefitDesc}>
                  Run your ad or promo video right before your sponsored egg round starts. Maximum visibility, captive audience.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.howItWorksCard}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            {[
              "Send us an email to express interest.",
              "We design a custom egg with your branding.",
              "Your ad plays before the sponsored egg round.",
              "Thousands of players engage with your brand!",
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.contactBtn} onPress={handleContact} activeOpacity={0.8}>
            <Mail size={18} color="#1a1a2e" />
            <Text style={styles.contactBtnText}>Send Us an Email</Text>
          </TouchableOpacity>

          <Text style={styles.emailLabel}>{SPONSOR_EMAIL}</Text>

          <Text style={styles.footer}>
            Let's put your brand in front of an engaged, tapping audience.
          </Text>

          <BengzFooter />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  content: { padding: 20, paddingBottom: 50 },
  header: { alignItems: "center", paddingVertical: 24, marginBottom: 16 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,215,0,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.25)",
  },
  title: { fontSize: 26, fontWeight: "bold" as const, color: "#FFF", marginBottom: 10 },
  subtitle: { fontSize: 15, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 22, paddingHorizontal: 10 },
  whatYouGetCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.15)",
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" as const, color: "#FFF", marginBottom: 16 },
  benefitRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  benefitContent: { flex: 1 },
  benefitTitle: { fontSize: 15, fontWeight: "700" as const, color: "#FFF", marginBottom: 4 },
  benefitDesc: { fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 20 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 16 },
  howItWorksCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,215,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: { fontSize: 13, fontWeight: "700" as const, color: "#FFD700" },
  stepText: { fontSize: 14, color: "rgba(255,255,255,0.7)", flex: 1 },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FFD700",
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 8,
  },
  contactBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#1a1a2e" },
  emailLabel: { fontSize: 13, color: "rgba(255,255,255,0.45)", textAlign: "center", marginBottom: 20 },
  footer: { fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center", lineHeight: 18, paddingHorizontal: 20 },
});
