import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import html2canvas from "html2canvas";
import { LinearGradient } from "expo-linear-gradient";
import { Trophy, Sparkles, Camera, X } from "lucide-react";
import { formatWinnerPrizeLabel } from "@/types/game";

type WinModalProps = {
  visible: boolean;
  winner: any;
  onClose: () => void;
};

export default function WinModal({ visible, winner, onClose }: WinModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const captureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const handleScreenshot = async () => {
    if (!captureRef.current) return;

    try {
      const canvas = await html2canvas(captureRef.current);

      const image = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = image;
      link.download = "tap2crack-win.png";
      link.click();

      if (navigator.share) {
        await navigator.share({
          title: "Tap2Crack Win 🎉",
          text: `I just won ${winner.prize_description}!`,
        });
      }
    } catch (err) {
      console.log("SCREENSHOT ERROR:", err);
    }
  };

  if (!winner) return null;

  const isCoupon = winner.prize_type === "coupon";
  const prizeHeadline = isCoupon
    ? winner.company_name || winner.prize_description
    : winner.prize_description;
  const prizeSubline = isCoupon
    ? [
        winner.company_name ? winner.prize_description : null,
        winner.prize_code ? `Code: ${winner.prize_code}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* 👇 ONLY THIS PART WILL BE SCREENSHOT */}
          <div ref={captureRef}>
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              style={styles.gradient}
            >
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                }}
              >
                <View style={styles.iconContainer}>
                  <Trophy size={60} color="#FFD700" />
                </View>
              </Animated.View>

              <Text style={styles.congratsText}>
                🎉 Congratulations! 🎉
              </Text>

              <Text style={styles.winnerText}>
                You cracked the egg!
              </Text>

              <View style={styles.prizeContainer}>
                <Sparkles size={24} color="#FFD700" />
                <View style={styles.prizeTextWrap}>
                  <Text style={styles.prizeText}>{prizeHeadline}</Text>
                  {!!prizeSubline && (
                    <Text style={styles.prizeSubtext}>{prizeSubline}</Text>
                  )}
                </View>
                <Sparkles size={24} color="#FFD700" />
              </View>

              <Text style={styles.eggTypeText}>
                {winner.egg_type === "golden"
                  ? "🥇 Golden Egg"
                  : winner.egg_type === "silver"
                  ? "🥈 Silver Egg"
                  : winner.egg_type === "company"
                  ? "🏢 Company Egg"
                  : winner.egg_type === "business"
                  ? "💼 Business Egg"
                  : "🥚 Normal Egg"}
              </Text>

              <Text style={styles.hint}>
                Your prize will be sent to your registered details
              </Text>
            </LinearGradient>
          </div>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleScreenshot}
          >
            <Camera size={20} color="#FFFFFF" />
            <Text style={styles.shareText}>Save / Share</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    maxWidth: 400,
    borderRadius: 24,
    overflow: "hidden",
  },
  gradient: {
    padding: 30,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  winnerText: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 24,
  },
  prizeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  prizeTextWrap: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  prizeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  prizeSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  eggTypeText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 16,
  },
  shareButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  shareText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  hint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
});