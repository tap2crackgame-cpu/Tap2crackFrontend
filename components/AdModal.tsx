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

import AdSponsorBranding from "@/components/AdSponsorBranding";



interface AdModalProps {

  visible: boolean;

  step: number;

  totalSteps: number;

  timeLeft: number;

  duration: number;

  currentAd: PromoAd | null;

  rewardGranted?: boolean;

  onDismissReward?: () => void;

}



export default function AdModal({

  visible,

  step,

  totalSteps,

  timeLeft,

  duration,

  currentAd,

  rewardGranted = false,

  onDismissReward,

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

  }, [visible, currentAd?.id, step, muted]);



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
  const isVideoAd = currentAd?.mediaType === "video";



  return (

    <Modal visible={visible} transparent animationType="fade">

      <View style={styles.overlay}>

        <View style={styles.container}>

          <View style={[styles.content, isVideoAd && styles.contentFullscreen]}>

            <View style={[styles.headerRow, isVideoAd && styles.headerRowOverlay]}>

              <Text style={styles.badge}>Ad {step} of {totalSteps}</Text>

              <View style={styles.headerActions}>

                {!rewardGranted && (

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

                )}

                <View style={styles.timerBlock}>

                  {rewardGranted ? (

                    <TouchableOpacity

                      style={[styles.timerCircle, styles.rewardCircle]}

                      onPress={onDismissReward}

                      activeOpacity={0.85}

                    >

                      <Text style={styles.rewardText}>Reward{"\n"}granted</Text>

                    </TouchableOpacity>

                  ) : (

                    <>

                      <Text style={styles.timerLabel}>Remaining countdown time</Text>

                      <View style={styles.timerCircle}>

                        <Text style={styles.timerText}>{timeLeft}s</Text>

                      </View>

                    </>

                  )}

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

                {!isVideoAd && (
                  <>
                    <Text style={styles.title}>{currentAd.title}</Text>

                    {!!currentAd.description && (
                      <Text style={styles.description}>{currentAd.description}</Text>
                    )}
                  </>
                )}



                <View style={[styles.mediaBox, isVideoAd && styles.mediaBoxFullscreen]}>

                  {currentAd.mediaType === "video" ? (

                    Platform.OS === "web" ? (

                      // eslint-disable-next-line jsx-a11y/media-has-caption

                      <video

                        ref={videoRef as React.RefObject<HTMLVideoElement>}

                        src={currentAd.mediaUrl}

                        style={{ width: "100%", height: "100%", objectFit: "cover", backgroundColor: "#000" }}

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

                        contentFit="cover"

                      />

                    )

                  ) : (

                    <Image

                      source={{ uri: currentAd.mediaUrl }}

                      style={styles.media}

                      contentFit={isVideoAd ? "cover" : "contain"}

                    />

                  )}

                </View>

              </>

            )}



            <Text style={[styles.hint, isVideoAd && styles.hintOverlay]}>

              {rewardGranted

                ? "Tap Reward granted to close and use your 2x boost."

                : step < totalSteps

                  ? `Watch the full ${safeDuration}s ad to continue.`

                  : `Watch the ad — reward grants with 3 seconds left.`}

            </Text>



            {!isVideoAd && (
              <AdSponsorBranding
                compact
                companyName={currentAd?.companyName}
                companyLogoUrl={currentAd?.companyLogoUrl}
              />
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
  contentFullscreen: {
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

  timerBlock: {

    alignItems: "center",

    gap: 4,

  },

  timerLabel: {

    color: "rgba(255,255,255,0.65)",

    fontSize: 10,

    fontWeight: "600",

    textAlign: "center",

    maxWidth: 88,

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

    width: 56,

    height: 56,

    borderRadius: 28,

    borderWidth: 2,

    borderColor: "#FFD700",

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "rgba(0,0,0,0.35)",

  },

  rewardCircle: {

    borderColor: "#4ECDC4",

    backgroundColor: "rgba(78,205,196,0.15)",

    width: 72,

    height: 72,

    borderRadius: 36,

  },

  timerText: { color: "#FFD700", fontWeight: "800", fontSize: 16 },

  rewardText: {

    color: "#4ECDC4",

    fontWeight: "800",

    fontSize: 11,

    textAlign: "center",

    lineHeight: 14,

  },

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
  mediaBoxFullscreen: {
    flex: 1,
    minHeight: 0,
    marginBottom: 0,
    borderRadius: 0,
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
  hintOverlay: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 44,
    zIndex: 5,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingVertical: 8,
    borderRadius: 10,
  },

});


