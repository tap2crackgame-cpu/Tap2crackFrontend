// Tap2Crack - 404 Not Found Screen
// Displayed when navigation fails to find a route

import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Home, AlertCircle, Egg } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function Tap2CrackNotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "Page Not Found", headerShown: false }} />
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Egg size={50} color="#FFD700" />
            <View style={styles.alertOverlay}>
              <AlertCircle size={28} color="#FF6B6B" />
            </View>
          </View>
          <Text style={styles.title}>🥚 Egg Not Found!</Text>
          <Text style={styles.subtitle}>This egg rolled away...</Text>
          <Text style={styles.description}>
            The page you&apos;re looking for doesn&apos;t exist in the coop.
          </Text>
          <Link href="/welcome" asChild>
            <TouchableOpacity style={styles.homeButton}>
              <Home size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Return to Coop</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  content: { alignItems: "center", maxWidth: 300 },
  iconContainer: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: "rgba(255,215,0,0.15)", 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 24,
    position: "relative"
  },
  alertOverlay: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#1a1a2e",
    borderRadius: 15,
    padding: 3,
  },
  title: { fontSize: 26, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#FFD700", marginBottom: 12 },
  description: { fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 32 },
  homeButton: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#4ECDC4", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});
