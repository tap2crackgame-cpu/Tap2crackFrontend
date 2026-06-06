import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Volume2, VolumeX, X } from "lucide-react-native";
import { Image } from "expo-image";
import type { PromoAd } from "@/services/ads";
import AdSponsorBranding from "@/components/AdSponsorBranding";

interface AdModalProps {
  visible: boolean;
  step: number;
  totalSteps: number;
  timeLeft: number;
  duration?: number;
  currentAd: PromoAd | null;
  rewardGranted?: boolean;
  onDismissReward?: () => void;
  timerActive?: boolean;
  adPhase?: "idle" | "loading" | "playing" | "reward";
}

const DESKTOP_BREAKPOINT = 768;
const DESKTOP_CARD_MAX_WIDTH = 840;

export default function AdModal({
  visible,
  step,
  totalSteps,
  timeLeft,
  duration = 30,
  currentAd,
  rewardGranted = false,
  onDismissReward,
  timerActive = false,
  adPhase = "playing",
}: AdModalProps) {
  const { width, height } = useWindowDimensions();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(false);

  const isDesktopLayout = width >= DESKTOP_BREAKPOINT;
  const desktopCardMaxHeight = Math.min(height * 0.88, 760);
  const isVideoAd = currentAd?.mediaType === "video";
  const isLoading = adPhase === "loading" && !rewardGranted;
  const showTimer = timerActive && timeLeft > 0 && !rewardGranted;
  const useVideoFullscreen = isVideoAd && !isDesktopLayout;

  const progressPct = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    const elapsed = Math.max(0, duration - timeLeft);
    return Math.min(100, (elapsed / duration) * 100);
  }, [duration, timeLeft]);

  useEffect(() => {
    if (!visible || Platform.OS !== "web") return;
    if (currentAd?.mediaType !== "video") return;
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.muted = muted;
    el.play().catch(() => {});
  }, [visible, currentAd?.id, step, muted]);

  useEffect(() => {
    if (visible) setMuted(false);
  }, [visible, currentAd?.id, step]);

  const handleToggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  };

  const timerLabel = showTimer
    ? `${timeLeft}s`
    : isLoading
      ? "…"
      : rewardGranted
        ? "✓"
        : "…";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, isDesktopLayout && styles.overlayDesktop]}>
        <View
          style={[
            styles.container,
            isDesktopLayout && styles.containerDesktop,
            isDesktopLayout && { maxHeight: desktopCardMaxHeight },
          ]}
        >
          <View
            style={[
              styles.content,
              useVideoFullscreen && styles.contentFullscreen,
              isDesktopLayout && styles.contentDesktop,
            ]}
          >
            <View
              style={[
                styles.headerRow,
                useVideoFullscreen && styles.headerRowOverlay,
                isDesktopLayout && styles.headerRowDesktop,
              ]}
            >
              <View style={styles.headerLeft}>
                <Text style={[styles.badge, isDesktopLayout && styles.badgeDesktop]}>
                  {rewardGranted
                    ? "Reward unlocked"
                    : `Sponsored · Ad ${step} of ${totalSteps}`}
                </Text>
                {isDesktopLayout && !rewardGranted && (
                  <Text style={styles.headerHint}>
                    Watch to earn your 2× tap boost
                  </Text>
                )}
              </View>
              <View style={styles.headerActions}>
                {!rewardGranted && currentAd && isVideoAd && (
                  <TouchableOpacity
                    style={[styles.soundBtn, isDesktopLayout && styles.soundBtnDesktop]}
                    onPress={handleToggleMute}
                    activeOpacity={0.8}
                  >
                    {muted ? (
                      <VolumeX size={16} color="#FFD700" />
                    ) : (
                      <Volume2 size={16} color="#4ECDC4" />
                    )}
                  </TouchableOpacity>
                )}
                <View style={styles.timerBlock}>
                  {rewardGranted ? (
                    <TouchableOpacity
                      style={[styles.countdownPill, styles.rewardPill]}
                      onPress={onDismissReward}
                      activeOpacity={0.85}
                    >
                      <View style={styles.closeIconWrap}>
                        <X size={14} color="#0b3a35" />
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={[
                        styles.countdownPill,
                        isDesktopLayout && styles.countdownPillDesktop,
                      ]}
                    >
                      <Text style={styles.countdownText}>{timerLabel}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {isDesktopLayout && !rewardGranted && (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
              </View>
            )}

            {rewardGranted ? (
              <View style={[styles.rewardBox, isDesktopLayout && styles.rewardBoxDesktop]}>
                <View style={styles.rewardIconRing}>
                  <Text style={styles.rewardIcon}>⚡</Text>
                </View>
                <Text style={styles.rewardTitle}>2× Tap Boost Active!</Text>
                <Text style={styles.rewardSub}>Tap faster this round</Text>
                {isDesktopLayout && (
                  <Text style={styles.rewardFootnote}>Tap close to return to the game</Text>
                )}
              </View>
            ) : !currentAd || (isLoading && !isVideoAd) ? (
              <View style={[styles.loadingBox, isDesktopLayout && styles.loadingBoxDesktop]}>
                <ActivityIndicator color="#FFD700" size="large" />
                <Text style={styles.loadingText}>
                  {step === 2 && isLoading ? "Preparing ad 2…" : "Loading ad…"}
                </Text>
              </View>
            ) : (
              <View style={[styles.body, isDesktopLayout && styles.bodyDesktop]}>
                {!isVideoAd && (
                  <View style={isDesktopLayout ? styles.copyBlockDesktop : undefined}>
                    <Text style={[styles.title, isDesktopLayout && styles.titleDesktop]}>
                      {currentAd.title}
                    </Text>
                    {!!currentAd.description && (
                      <Text
                        style={[
                          styles.description,
                          isDesktopLayout && styles.descriptionDesktop,
                        ]}
                      >
                        {currentAd.description}
                      </Text>
                    )}
                  </View>
                )}

                <View
                  style={[
                    styles.mediaBox,
                    useVideoFullscreen && styles.mediaBoxFullscreen,
                    isDesktopLayout && styles.mediaBoxDesktop,
                    isDesktopLayout && isVideoAd && styles.mediaBoxDesktopVideo,
                  ]}
                >
                  {isLoading && isVideoAd && (
                    <View style={styles.mediaLoading}>
                      <ActivityIndicator color="#FFD700" />
                      <Text style={styles.loadingText}>Preparing ad {step}…</Text>
                    </View>
                  )}
                  {currentAd.mediaType === "video" ? (
                    Platform.OS === "web" ? (
                      <video
                        ref={videoRef as React.RefObject<HTMLVideoElement>}
                        src={currentAd.mediaUrl}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: isDesktopLayout ? "contain" : "cover",
                          backgroundColor: "#000",
                          opacity: isLoading ? 0.3 : 1,
                        }}
                        autoPlay
                        muted={muted}
                        playsInline
                        controls={false}
                      />
                    ) : (
                      <Image
                        source={{ uri: currentAd.mediaUrl }}
                        style={styles.media}
                        contentFit={isDesktopLayout ? "contain" : "cover"}
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
              </View>
            )}

            {currentAd && !rewardGranted && (
              <View
                style={[
                  styles.brandingDock,
                  useVideoFullscreen && styles.brandingDockOverlay,
                  isDesktopLayout && styles.brandingDockDesktop,
                ]}
              >
                <AdSponsorBranding
                  compact
                  companyName={currentAd.companyName}
                  companyLogoUrl={currentAd.companyLogoUrl}
                />
                {isDesktopLayout && (
                  <Text style={styles.disclaimer}>
                    Ads support Tap2Crack and keep prizes flowing for everyone.
                  </Text>
                )}
              </View>
            )}
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
  },
  overlayDesktop: {
    backgroundColor: "rgba(8, 10, 18, 0.82)",
    paddingHorizontal: 24,
    paddingVertical: 32,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        } as object)
      : {}),
  },
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  containerDesktop: {
    width: "100%",
    maxWidth: DESKTOP_CARD_MAX_WIDTH,
    height: "auto",
    maxHeight: "min(88vh, 760px)" as unknown as number,
    backgroundColor: "#12131f",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 28px 80px rgba(0, 0, 0, 0.55)",
        } as object)
      : {}),
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 14,
  },
  contentFullscreen: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  contentDesktop: {
    flex: 0,
    minHeight: 420,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerRowOverlay: {
    position: "absolute",
    top: 24,
    left: 12,
    right: 12,
    zIndex: 6,
  },
  headerRowDesktop: {
    position: "relative",
    top: 0,
    left: 0,
    right: 0,
    marginBottom: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
    gap: 4,
  },
  headerHint: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "flex-start",
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
    marginTop: 12,
  },
  soundBtnDesktop: {
    marginTop: 0,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  timerBlock: { alignItems: "center", gap: 4 },
  badge: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "rgba(255,107,107,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  badgeDesktop: {
    color: "rgba(255,255,255,0.72)",
    backgroundColor: "rgba(255,255,255,0.06)",
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4ECDC4",
    borderRadius: 2,
  },
  countdownPill: {
    minWidth: 74,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.7)",
    backgroundColor: "rgba(20,20,20,0.58)",
    alignItems: "center",
    justifyContent: "center",
  },
  countdownPillDesktop: {
    minWidth: 64,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  rewardPill: {
    width: 40,
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    borderColor: "rgba(78,205,196,0.8)",
    backgroundColor: "rgba(78,205,196,0.2)",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  countdownText: {
    color: "#FFD700",
    fontWeight: "900",
    fontSize: 17,
    letterSpacing: 0.3,
  },
  closeIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(152,255,240,0.9)",
  },
  body: {
    flex: 1,
  },
  bodyDesktop: {
    flex: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  copyBlockDesktop: {
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  titleDesktop: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  description: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginBottom: 12,
  },
  descriptionDesktop: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 0,
    color: "rgba(255,255,255,0.55)",
  },
  mediaBox: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 16,
    flex: 1,
    minHeight: 240,
  },
  mediaBoxFullscreen: {
    flex: 1,
    minHeight: 0,
    marginBottom: 0,
    borderRadius: 0,
  },
  mediaBoxDesktop: {
    flex: 0,
    width: "100%",
    aspectRatio: 16 / 9,
    minHeight: undefined,
    marginBottom: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#0a0a0f",
  },
  mediaBoxDesktopVideo: {
    marginBottom: 0,
  },
  media: { width: "100%", height: "100%", backgroundColor: "#000" },
  mediaLoading: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    gap: 10,
  },
  loadingBox: { alignItems: "center", paddingVertical: 48, gap: 12, flex: 1 },
  loadingBoxDesktop: {
    flex: 0,
    minHeight: 280,
    justifyContent: "center",
  },
  loadingText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  rewardBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rewardBoxDesktop: {
    flex: 0,
    minHeight: 320,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  rewardIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(78,205,196,0.12)",
    borderWidth: 1,
    borderColor: "rgba(78,205,196,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  rewardIcon: {
    fontSize: 32,
  },
  rewardTitle: {
    color: "#4ECDC4",
    fontSize: 22,
    fontWeight: "800",
  },
  rewardSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
  },
  rewardFootnote: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    marginTop: 8,
  },
  brandingDock: {
    width: "50%",
    alignSelf: "center",
    marginBottom: 8,
  },
  brandingDockOverlay: {
    position: "absolute",
    left: "25%",
    right: "25%",
    bottom: 10,
    zIndex: 6,
  },
  brandingDockDesktop: {
    position: "relative",
    left: 0,
    right: 0,
    width: "100%",
    alignSelf: "stretch",
    marginBottom: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
    gap: 10,
  },
  disclaimer: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
