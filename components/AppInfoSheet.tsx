import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, Info } from "lucide-react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const SECTIONS = [
  {
    title: "What is Tap2Crack?",
    body:
      "Tap2Crack is a live multiplayer egg cracking game. Players tap together on shared eggs in real time. When an egg reaches 100%, the player who lands the final tap wins the round prize. You can play as a guest or sign in with Google, climb the leaderboard, and collect wins in your profile.",
  },
  {
    title: "How to Play",
    body:
      "1. Sign in with Google or tap Play as Guest.\n2. Open the game and choose an egg room (Normal, Silver, Golden, Company, or Business).\n3. Tap the egg to add cracks. Every tap counts toward the shared progress bar.\n4. Optional: use 2x or 3x power-ups to increase your tap strength, or watch ads when offered.\n5. When the egg cracks, a winner is announced. If it is you, your prize appears in the win popup and in Prizes on your profile.\n6. After a round ends, wait for the short cooldown, then join the next egg.",
  },
  {
    title: "How Wins Work",
    body:
      "Each egg round needs a fixed number of taps before it cracks. All players in the room contribute taps together. The player who makes the last cracking tap wins that round.\n\nWinning is based on timing and participation, not payment. Power-ups only boost how many taps you add — they do not guarantee a win. Fair play rules apply: bots, auto-tappers, and exploits are not allowed.",
  },
  {
    title: "What You Can Win",
    body:
      "Prizes depend on the egg you play:\n\n• Airtime — mobile credit sent to winners.\n• Coupons — discount codes from partner brands.\n• Sponsor gifts — special sponsored prizes.\n\nNormal, Silver, Golden, Company, and Business eggs can offer different reward types and values. Check the prize indicator on each egg before you play. Signed-in users can view prize codes and settlement status on the Prizes page.",
  },
  {
    title: "Tips",
    body:
      "• No payment is required to win — power-ups are optional.\n• Link your phone number after sign-in for a better account experience.\n• Visit Winners and Leaderboard to see recent results and top players.\n• Guest accounts have limited prize features; Google sign-in unlocks full prize history.",
  },
];

export default function AppInfoSheet({ visible, onClose }: Props) {
  const { height } = useWindowDimensions();
  const sheetHeight = Math.min(height * 0.82, 640);
  const slideAnim = useRef(new Animated.Value(sheetHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 9,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    slideAnim.setValue(sheetHeight);
    fadeAnim.setValue(0);
  }, [visible, sheetHeight, slideAnim, fadeAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: sheetHeight,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { height: sheetHeight, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <LinearGradient colors={["#1f2540", "#16213e", "#0f3460"]} style={styles.sheetInner}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Info size={22} color="#FFD700" />
              </View>
              <Text style={styles.headerTitle}>About Tap2Crack</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} accessibilityLabel="Close info">
                <X size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {SECTIONS.map((section) => (
                <View key={section.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionBody}>{section.body}</Text>
                </View>
              ))}
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  sheetInner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 10,
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,215,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFD700",
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.78)",
  },
});
