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
  NO_ADS_AVAILABLE: "No active Ads",
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
  const [rewardGrantedUI, setRewardGrantedUI] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(30);
  const [isStartingAds, setIsStartingAds] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef<string | null>(null);
  const stepRef = useRef<AdStep>(0);
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
    stepRef.current = 0;
    setIsWatching(false);
    setTimeLeft(0);
    setCurrentAd(null);
    setCurrentDuration(30);
    currentDurationRef.current = 30;
    stepCompletedRef.current = false;
    setRewardGrantedUI(false);
  }, [clearTimer]);

  const dismissAdModal = useCallback(() => {
    resetSession();
  }, [resetSession]);

  const clearStartLoading = useCallback(() => {
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    setIsStartingAds(false);
  }, []);

  const emitAdProgress = useCallback(() => {
    socket?.emit("ads_progress", {
      sessionId: sessionRef.current,
      durationSeconds: currentDurationRef.current,
    });
  }, [socket]);

  const startCountdown = useCallback(
    (duration: number, adStep: AdStep) => {
      setTimeLeft(duration);
      stepCompletedRef.current = false;
      stepRef.current = adStep;
      clearTimer();

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (
            stepRef.current === 2 &&
            prev === 3 &&
            !stepCompletedRef.current
          ) {
            stepCompletedRef.current = true;
            emitAdProgress();
            return 3;
          }

          if (prev <= 1) {
            clearTimer();
            if (!stepCompletedRef.current) {
              stepCompletedRef.current = true;
              emitAdProgress();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer, emitAdProgress]
  );

  const resolveAdDuration = useCallback(
    async (ad: PromoAd | null | undefined, fallback: number) => {
      const normalizedFallback = Number.isFinite(fallback)
        ? Math.max(5, Math.min(30, Math.round(fallback)))
        : 30;
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

          const timeout = window.setTimeout(
            () => finish(normalizedFallback),
            6000
          );
          v.preload = "metadata";
          v.muted = true;
          v.src = ad.mediaUrl;
          v.onloadedmetadata = () => {
            window.clearTimeout(timeout);
            const d = Number.isFinite(v.duration)
              ? Math.ceil(v.duration)
              : normalizedFallback;
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
      const nextStep = data.step as AdStep;
      setStep(nextStep);
      stepRef.current = nextStep;
      setIsWatching(true);
      setRewardGrantedUI(false);
      clearStartLoading();
      setTotalSteps(data.totalSteps ?? 2);
      setCurrentAd(data.ad ?? null);

      const fallbackDuration = data.duration ?? 30;
      resolveAdDuration(data.ad ?? null, fallbackDuration).then((duration) => {
        currentDurationRef.current = duration;
        setCurrentDuration(duration);
        startCountdown(duration, nextStep);
      });
    },
    [startCountdown, resolveAdDuration, clearStartLoading]
  );

  const startAds = useCallback(
    (roundId: string) => {
      if (!socket) return false;
      if (isStartingAds || isWatching) return false;

      setIsStartingAds(true);
      setRewardGranted(false);
      setRewardGrantedUI(false);

      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
      }
      startTimeoutRef.current = setTimeout(() => {
        startTimeoutRef.current = null;
        setIsStartingAds(false);
        showAlertAsToast("Ad unavailable", "Could not start ad. Please try again.");
      }, 12000);

      socket.emit("watch_ads", { roundId, adType: "admin" });
      return true;
    },
    [socket, isStartingAds, isWatching]
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
      stepCompletedRef.current = false;
      beginStep({
        sessionId: sessionRef.current,
        ...data,
      });
    };

    const onReward = () => {
      clearTimer();
      setRewardGranted(true);
      setRewardGrantedUI(true);
      setTimeLeft(0);
    };

    const onRejected = (data: { reason?: string; message?: string }) => {
      if (rewardGrantedUI) return;
      clearStartLoading();
      resetSession();
      if (data.reason === "NO_ADS_AVAILABLE") {
        showAlertAsToast("No active Ads", "No active Ads");
        return;
      }
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
      clearStartLoading();
    };
  }, [socket, beginStep, resetSession, clearTimer, clearStartLoading, rewardGrantedUI]);

  return {
    startAds,
    isWatching,
    isStartingAds,
    step,
    timeLeft,
    sessionId,
    currentAd,
    currentDuration,
    totalSteps,
    rewardGranted,
    rewardGrantedUI,
    dismissAdModal,
    resetSession,
  };
}
