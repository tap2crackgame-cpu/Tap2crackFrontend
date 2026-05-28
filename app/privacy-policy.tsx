import { StyleSheet, View, Text, ScrollView, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Shield } from "lucide-react-native";
import BengzFooter from "@/components/BengzFooter";

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Shield size={28} color="#4ECDC4" />
            </View>
            <Text style={styles.title}>Privacy Policy</Text>
            <Text style={styles.updated}>Last updated: April 10, 2026</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.body}>
              When you use Tap2Crack, we may collect the following information:{"\n\n"}
              • Account information (name, email) when you sign up{"\n"}
              • Game statistics and activity data{"\n"}
              • Device information and usage analytics{"\n"}
              • Information you provide when contacting support
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
            <Text style={styles.body}>
              We use collected information to:{"\n\n"}
              • Provide and improve the Tap2Crack experience{"\n"}
              • Maintain leaderboards and game statistics{"\n"}
              • Send important updates about the app{"\n"}
              • Prevent fraud and ensure fair gameplay{"\n"}
              • Analyze usage patterns to improve performance
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Data Sharing</Text>
            <Text style={styles.body}>
              We do not sell your personal information. We may share data with:{"\n\n"}
              • Service providers that help us operate the app{"\n"}
              • Law enforcement when required by law{"\n"}
              • Other players (limited to your public profile and game stats)
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Security</Text>
            <Text style={styles.body}>
              We implement industry-standard security measures to protect your data. However, no method of electronic storage is 100% secure. We strive to use commercially acceptable means to protect your personal information.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Your Rights</Text>
            <Text style={styles.body}>
              You have the right to:{"\n\n"}
              • Access your personal data{"\n"}
              • Request deletion of your account and data{"\n"}
              • Opt out of non-essential communications{"\n"}
              • Export your game data
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Children's Privacy</Text>
            <Text style={styles.body}>
              Tap2Crack is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal data, please contact us.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Contact Us</Text>
            <Text style={styles.body}>
              If you have questions about this Privacy Policy, please reach out to us through the app or email us at tap2crackgame@gmail.com.
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
    backgroundColor: "rgba(78,205,196,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(78,205,196,0.3)",
  },
  title: { fontSize: 24, fontWeight: "bold" as const, color: "#FFF", marginBottom: 6 },
  updated: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 16, fontWeight: "700" as const, color: "#4ECDC4", marginBottom: 8 },
  body: { fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 22 },
});
