import { StyleSheet, View, Text, ScrollView, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FileText } from "lucide-react-native";
import BengzFooter from "@/components/BengzFooter";

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <FileText size={28} color="#FFD700" />
            </View>
            <Text style={styles.title}>Terms & Conditions</Text>
            <Text style={styles.updated}>Last updated: April 10, 2026</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.body}>
              By accessing or using Tap2Crack, you agree to be bound by these Terms and Conditions. If you do not agree, you may not use the app.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Game Rules</Text>
            <Text style={styles.body}>
              • Each egg round has a set number of taps required to crack{"\n"}
              • The player who makes the final cracking tap wins the round{"\n"}
              • Power-ups like x2 taps are available and count accordingly{"\n"}
              • Automated tapping, bots, or exploits are strictly prohibited{"\n"}
              • We reserve the right to disqualify players for unfair play
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. User Accounts</Text>
            <Text style={styles.body}>
              • You are responsible for maintaining the security of your account{"\n"}
              • Guest accounts may have limited features{"\n"}
              • We reserve the right to suspend or terminate accounts that violate these terms{"\n"}
              • One account per person; multiple accounts are not allowed
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Prizes & Rewards</Text>
            <Text style={styles.body}>
              • Prize availability and values are subject to change{"\n"}
              • Winners must meet eligibility requirements to claim prizes{"\n"}
              • Prizes are non-transferable unless stated otherwise{"\n"}
              • We reserve the right to modify or cancel prize offerings at any time
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
            <Text style={styles.body}>
              All content, graphics, and game mechanics in Tap2Crack are owned by us. You may not copy, modify, distribute, or create derivative works based on the app without our written consent.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
            <Text style={styles.body}>
              Tap2Crack is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the app, including but not limited to loss of data, prizes, or game progress.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Changes to Terms</Text>
            <Text style={styles.body}>
              We may update these Terms and Conditions at any time. Continued use of the app after changes constitutes acceptance of the updated terms. We will notify users of significant changes.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Contact</Text>
            <Text style={styles.body}>
              For questions about these terms, please contact us at tap2crackgame@gmail.com.
            </Text>
          </View>

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
  header: { alignItems: "center", paddingVertical: 24, marginBottom: 8 },
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
  title: { fontSize: 24, fontWeight: "bold" as const, color: "#FFF", marginBottom: 6 },
  updated: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 16, fontWeight: "700" as const, color: "#FFD700", marginBottom: 8 },
  body: { fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 22 },
});
