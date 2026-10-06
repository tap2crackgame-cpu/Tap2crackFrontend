import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from "react-native";
import html2canvas from "html2canvas";
import { LinearGradient } from "expo-linear-gradient";
import { CluckyCheer, EmojiRain } from "./CluckyReactions";

const CONFETTI = ["🎉", "🎊", "✨", "⭐", "🥳", "💛", "🐣"];

type WinModalProps = {
  visible: boolean;
  winner: any;
  onClose: () => void;
};

function PrizeContent({ winner }: { winner: any }) {
  const isCoupon = winner.prize_type === "coupon";

  if (isCoupon) {
    return (
      <View style={styles.prizeTextWrap}>
        {!!winner.company_name && (
          <Text style={styles.prizeText}>{winner.company_name}</Text>
        )}
        {!!winner.prize_description && (
          <Text style={styles.prizeSubtext}>{winner.prize_description}</Text>
        )}
        {!!winner.prize_code && (
          <Text style={styles.prizeCode}>Code: {winner.prize_code}</Text>
        )}
        {!winner.company_name &&
          !winner.prize_description &&
          !winner.prize_code && (
            <Text style={styles.prizeText}>Coupon prize</Text>
          )}
      </View>
    );
  }

  return (
    <View style={styles.prizeTextWrap}>
      <Text style={styles.prizeText}>{winner.prize_description}</Text>
    </View>
  );
}

export default function WinModal({ visible, winner, onClose }: WinModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const captureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);

      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  const handleScreenshot = async () => {
    if (Platform.OS !== "web" || !captureRef.current) return;

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

  const modalBody = (
    <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.gradient}>
      <EmojiRain emojis={CONFETTI} count={18} height={560} />

      <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Close">
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.mascotWrap}>
        <CluckyCheer size={150} />
      </View>

      <Text style={styles.congratsText}>🎉 Congratulations! 🎉</Text>
      <Text style={styles.winnerText}>You cracked the egg! 🐣</Text>

      <View style={styles.prizeContainer}>
        <Text style={styles.prizeSparkle}>✨</Text>
        <PrizeContent winner={winner} />
        <Text style={styles.prizeSparkle}>✨</Text>
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
        Your prize will be sent to your registered details 🎁
      </Text>
    </LinearGradient>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.container, { transform: [{ scale: scaleAnim }] }]}
        >
          {Platform.OS === "web" ? (
            <div ref={captureRef}>{modalBody}</div>
          ) : (
            <View>{modalBody}</View>
          )}

          {Platform.OS === "web" ? (
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleScreenshot}
            >
              <Text style={styles.shareText}>📸 Save / Share</Text>
            </TouchableOpacity>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    overflow: "hidden",
  },
  gradient: {
    padding: 24,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  mascotWrap: { marginTop: 22, marginBottom: 10, alignItems: "center" },
  closeText: { fontSize: 22, color: "#FFFFFF", fontWeight: "700" },
  congratsText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  winnerText: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 24,
    textAlign: "center",
  },
  prizeContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  prizeSparkle: {
    flexShrink: 0,
    fontSize: 22,
  },
  prizeTextWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  prizeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    flexShrink: 1,
  },
  prizeSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    flexShrink: 1,
  },
  prizeCode: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF8DC",
    textAlign: "center",
    flexShrink: 1,
  },
  eggTypeText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 16,
    textAlign: "center",
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
    alignSelf: "center",
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
