import { useEffect, useState, useCallback, useRef } from "react";
import { Platform } from "react-native";
import { showAlertAsToast } from "@/context/ToastContext";
import { useSocket } from "./SocketContext";
import type { PromoAd } from "@/services/ads";

type AdStep = 0 | 1 | 2;

const AD_REJECT_MESSAGES: Record<string, string> = {
  ROUND_ENDED: "This round has ended.",
  ROUND_COOLDOWN: "Wait for the next round to watch ads.",
  SESSION_EXPIRED: "Ad session expired. Please try again.",
  FIRST_AD_TOO_SHORT: "Please watch the full ad before continuing.",
  SECOND_AD_TOO_SHORT: "Please watch the full ad before claiming your reward.",
  ALREADY_REWARDED: "You already earned 2x for this round.",
  NO_ADS_AVAILABLE: "No ads are available yet. Check back soon.",
};

export function useAds() {
  const socket = useSocket();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<AdStep>(0);
  const [isWatching, setIsWatching] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentAd, setCurrentAd] = useState<PromoAd | null>(null);
  const [totalSteps, setTotalSteps] = useState(2);
  const [rewardGranted, setRewardGranted] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(30);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<string | null>(null);
  const stepCompletedRef = useRef(false);
  const currentDurationRef = useRef(30);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetSession = useCallback(() => {
    clearTimer();
    setSessionId(null);
    sessionRef.current = null;
    setStep(0);
    setIsWatching(false);
    setTimeLeft(0);
    setCurrentAd(null);
    setCurrentDuration(30);
    currentDurationRef.current = 30;
    stepCompletedRef.current = false;
  }, [clearTimer]);

  const startCountdown = useCallback(
    (duration: number, onDone: () => void) => {
      setTimeLeft(duration);
      stepCompletedRef.current = false;
      clearTimer();

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            if (!stepCompletedRef.current) {
              stepCompletedRef.current = true;
              onDone();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer]
  );

  const resolveAdDuration = useCallback(
    async (ad: PromoAd | null | undefined, fallback: number) => {
      const normalizedFallback = Number.isFinite(fallback) ? Math.max(5, Math.min(30, Math.round(fallback))) : 30;
      if (!ad || ad.mediaType !== "video" || Platform.OS !== "web") {
        return normalizedFallback;
      }

      try {
        const duration = await new Promise<number>((resolve) => {
          const v = document.createElement("video");
          let done = false;
          const finish = (value: number) => {
            if (done) return;
            done = true;
            resolve(value);
          };

          const timeout = window.setTimeout(() => finish(normalizedFallback), 6000);
          v.preload = "metadata";
          v.muted = true;
          v.src = ad.mediaUrl;
          v.onloadedmetadata = () => {
            window.clearTimeout(timeout);
            const d = Number.isFinite(v.duration) ? Math.ceil(v.duration) : normalizedFallback;
            finish(Math.max(5, Math.min(30, d)));
          };
          v.onerror = () => {
            window.clearTimeout(timeout);
            finish(normalizedFallback);
          };
        });

        return duration;
      } catch {
        return normalizedFallback;
      }
    },
    []
  );

  const beginStep = useCallback(
    (data: {
      sessionId: string;
      step: number;
      duration?: number;
      totalSteps?: number;
      ad?: PromoAd | null;
    }) => {
      sessionRef.current = data.sessionId;
      setSessionId(data.sessionId);
      setStep(data.step as AdStep);
      setIsWatching(true);
      setTotalSteps(data.totalSteps ?? 2);
      setCurrentAd(data.ad ?? null);

      const fallbackDuration = data.duration ?? 30;
      resolveAdDuration(data.ad ?? null, fallbackDuration).then((duration) => {
        currentDurationRef.current = duration;
        setCurrentDuration(duration);
        startCountdown(duration, () => {
          socket?.emit("ads_progress", {
            sessionId: sessionRef.current,
            durationSeconds: currentDurationRef.current,
          });
        });
      });
    },
    [socket, startCountdown, resolveAdDuration]
  );

  const startAds = useCallback(
    (roundId: string) => {
      if (!socket) return;
      setRewardGranted(false);
      socket.emit("watch_ads", { roundId, adType: "admin" });
    },
    [socket]
  );

  useEffect(() => {
    if (!socket) return;

    const onStarted = (data: {
      sessionId: string;
      step: number;
      duration?: number;
      totalSteps?: number;
      ad?: PromoAd;
    }) => beginStep(data);

    const onNext = (data: {
      step: number;
      duration?: number;
      totalSteps?: number;
      ad?: PromoAd;
    }) => {
      if (!sessionRef.current) return;
      beginStep({
        sessionId: sessionRef.current,
        ...data,
      });
    };

    const onReward = () => {
      resetSession();
      setRewardGranted(true);
    };

    const onRejected = (data: { reason?: string; message?: string }) => {
      resetSession();
      const msg =
        data.message ||
        AD_REJECT_MESSAGES[data.reason ?? ""] ||
        "Could not play ad.";
      showAlertAsToast("Ad unavailable", msg);
    };

    socket.on("ad_started", onStarted);
    socket.on("ad_next", onNext);
    socket.on("ad_reward_granted", onReward);
    socket.on("ad_rejected", onRejected);
    socket.on("ad_already_started", onStarted);

    return () => {
      socket.off("ad_started", onStarted);
      socket.off("ad_next", onNext);
      socket.off("ad_reward_granted", onReward);
      socket.off("ad_rejected", onRejected);
      socket.off("ad_already_started", onStarted);
      clearTimer();
    };
  }, [socket, beginStep, resetSession, clearTimer]);

  return {
    startAds,
    isWatching,
    step,
    timeLeft,
    sessionId,
    currentAd,
    currentDuration,
    totalSteps,
    rewardGranted,
    resetSession,
  };
}
