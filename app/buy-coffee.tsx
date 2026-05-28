import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Coffee, Heart, ExternalLink } from "lucide-react-native";
import BengzFooter from "@/components/BengzFooter";
import { useCallback } from "react";

const COFFEE_URL = "https://buymeacoffee.com/tap2crack";
const SUPPORT_EMAIL = "tap2crackgame@gmail.com";

export default function BuyCoffeePage() {
  const handleBuyCoffee = useCallback(() => {
    Linking.openURL(COFFEE_URL).catch(() => {
      Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Tap2Crack%20Support&body=Hi%2C%20I%27d%20like%20to%20support%20Tap2Crack!`);
    });
  }, []);

  const handleEmail = useCallback(() => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Tap2Crack%20Support&body=Hi%2C%20I%27d%20like%20to%20support%20Tap2Crack!`);
  }, []);

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <View style={styles.coffeeCircle}>
            <Coffee size={48} color="#FBBF24" />
          </View>
          <View style={styles.steamDot1} />
          <View style={styles.steamDot2} />
          <View style={styles.steamDot3} />
        </View>

        <Text style={styles.title}>Buy Us a Coffee</Text>
        <Text style={styles.subtitle}>Help keep the eggs cracking!</Text>

        <View style={styles.card}>
          <Heart size={20} color="#FF6B6B" />
          <Text style={styles.cardText}>
            Tap2Crack is built with love. Your support helps us keep the servers running, add new features, and create bigger prizes for the community.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What your coffee funds:</Text>
          <Text style={styles.bulletItem}>☕  Server costs & uptime</Text>
          <Text style={styles.bulletItem}>🥚  New egg types & prizes</Text>
          <Text style={styles.bulletItem}>⚡  Performance improvements</Text>
          <Text style={styles.bulletItem}>🎨  Better designs & animations</Text>
          <Text style={styles.bulletItem}>🌍  Growing the community</Text>
        </View>

        <TouchableOpacity style={styles.coffeeBtn} onPress={handleBuyCoffee} activeOpacity={0.8}>
          <Coffee size={20} color="#1a1a2e" />
          <Text style={styles.coffeeBtnText}>Buy Us a Coffee</Text>
          <ExternalLink size={16} color="#1a1a2e" />
        </TouchableOpacity>

        <Text style={styles.orText}>or send us some love directly</Text>

        <TouchableOpacity style={styles.emailBtn} onPress={handleEmail} activeOpacity={0.8}>
          <Text style={styles.emailBtnText}>📧  {SUPPORT_EMAIL}</Text>
        </TouchableOpacity>

        <Text style={styles.thanks}>Every little bit counts. Thank you for being part of the Tap2Crack family! 🙏</Text>

        <BengzFooter />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  content: { padding: 24, paddingBottom: 50, alignItems: "center" },
  iconWrap: { position: "relative", marginTop: 20, marginBottom: 24 },
  coffeeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(251,191,36,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(251,191,36,0.3)",
  },
  steamDot1: {
    position: "absolute",
    top: -6,
    left: 30,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(251,191,36,0.4)",
  },
  steamDot2: {
    position: "absolute",
    top: -12,
    left: 48,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(251,191,36,0.3)",
  },
  steamDot3: {
    position: "absolute",
    top: -4,
    left: 64,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(251,191,36,0.25)",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold" as const,
    color: "#FBBF24",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 28,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 16,
    gap: 10,
  },
  cardText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 22,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#FFF",
    marginBottom: 4,
  },
  bulletItem: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    paddingVertical: 3,
  },
  coffeeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FBBF24",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    marginTop: 12,
  },
  coffeeBtnText: {
    fontSize: 17,
    fontWeight: "bold" as const,
    color: "#1a1a2e",
  },
  orText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    marginTop: 18,
    marginBottom: 10,
  },
  emailBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  emailBtnText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  thanks: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: 30,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
});
