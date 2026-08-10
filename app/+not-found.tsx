// Tap2Crack - 404 Not Found Screen

import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Home, AlertCircle, Egg } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import SeoHead from "@/components/SeoHead";
import SemanticHeading from "@/components/SemanticHeading";

export default function Tap2CrackNotFound() {
  return (
    <>
      <SeoHead page="notFound" />
      <Stack.Screen options={{ title: "Page Not Found", headerShown: false }} />
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Egg size={50} color="#FFD700" />
            <View style={styles.alertOverlay}>
              <AlertCircle size={28} color="#FF6B6B" />
            </View>
          </View>
          <SemanticHeading level={1} style={styles.title}>
            This egg cracked somewhere else
          </SemanticHeading>
          <Text style={styles.description}>
            The page you&apos;re looking for doesn&apos;t exist or may have moved.
          </Text>
          <Link href="/" asChild>
            <TouchableOpacity style={styles.homeButton}>
              <Home size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Back to Tap2Crack</Text>
            </TouchableOpacity>
          </Link>
          <View style={styles.linksRow}>
            <Link href="/how-to-play" style={styles.secondaryLink}>
              How to Play
            </Link>
            <Link href="/faq" style={styles.secondaryLink}>
              FAQ
            </Link>
            <Link href="/sponsor" style={styles.secondaryLink}>
              Contact
            </Link>
          </View>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  content: { alignItems: "center", maxWidth: 360 },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,215,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  alertOverlay: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#1a1a2e",
    borderRadius: 15,
    padding: 3,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF", marginBottom: 12, textAlign: "center" },
  description: { fontSize: 14, color: "rgba(255,255,255,0.65)", textAlign: "center", marginBottom: 28, lineHeight: 22 },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  linksRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  secondaryLink: { fontSize: 13, color: "#FFD700", fontWeight: "600" },
});
