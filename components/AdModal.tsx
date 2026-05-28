import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Bell, BellOff } from "lucide-react-native";
import { Image } from "expo-image";
import type { PromoAd } from "@/services/ads";
import FlutterwaveBranding from "@/components/FlutterwaveBranding";

interface AdModalProps {
  visible: boolean;
  step: number;
  totalSteps: number;
  timeLeft: number;
  duration: number;
  currentAd: PromoAd | null;
}

export default function AdModal({
  visible,
  step,
  totalSteps,
  timeLeft,
  duration,
  currentAd,
}: AdModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!visible || Platform.OS !== "web") return;
    if (currentAd?.mediaType !== "video") return;
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.muted = muted;
    el.play().catch(() => {});
  }, [visible, currentAd?.id, step]);

  const handleToggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      if (videoRef.current) {
        videoRef.current.muted = next;
      }
      return next;
    });
  };

  const safeDuration = Math.max(1, duration || 30);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.badge}>Ad {step} of {totalSteps}</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.soundBtn}
                  onPress={handleToggleMute}
                  activeOpacity={0.8}
                >
                  {muted ? (
                    <BellOff size={16} color="#FFD700" />
                  ) : (
                    <Bell size={16} color="#4ECDC4" />
                  )}
                </TouchableOpacity>
                <View style={styles.timerCircle}>
                  <Text style={styles.timerText}>{timeLeft}s</Text>
                </View>
              </View>
            </View>

            {!currentAd ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#FFD700" size="large" />
                <Text style={styles.loadingText}>Loading ad…</Text>
              </View>
            ) : (
              <>
                <Text style={styles.title}>{currentAd.title}</Text>
                {!!currentAd.description && (
                  <Text style={styles.description}>{currentAd.description}</Text>
                )}

                <View style={styles.mediaBox}>
                  {currentAd.mediaType === "video" ? (
                    Platform.OS === "web" ? (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video
                        ref={videoRef as React.RefObject<HTMLVideoElement>}
                        src={currentAd.mediaUrl}
                        style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#000" }}
                        autoPlay
                        muted={muted}
                        playsInline
                        controls={false}
                        controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                        disablePictureInPicture
                        disableRemotePlayback
                      />
                    ) : (
                      <Image
                        source={{ uri: currentAd.mediaUrl }}
                        style={styles.media}
                        contentFit="contain"
                      />
                    )
                  ) : (
                    <Image
                      source={{ uri: currentAd.mediaUrl }}
                      style={styles.media}
                      contentFit="contain"
                    />
                  )}
                </View>
              </>
            )}

            <Text style={styles.hint}>
              Watch the full {safeDuration}s ad to {step < totalSteps ? "continue" : "earn your 2x boost"}.
            </Text>

            <FlutterwaveBranding compact />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
  },
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  soundBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  badge: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "rgba(255,107,107,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FFD700",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  timerText: { color: "#FFD700", fontWeight: "800", fontSize: 16 },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  description: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginBottom: 12,
  },
  mediaBox: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 16,
    flex: 1,
    minHeight: 240,
  },
  media: { width: "100%", height: "100%", backgroundColor: "#000" },
  loadingBox: { alignItems: "center", paddingVertical: 48, gap: 12 },
  loadingText: { color: "rgba(255,255,255,0.6)" },
  hint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
  },
});
