import { useEffect, useState, useCallback, useRef } from "react";
import { showAlertAsToast } from "@/context/ToastContext";
import { useSocket } from "./SocketContext";
import type { PromoAd } from "@/services/ads";
import { preloadPromoAdMedia } from "@/utils/preloadAdMedia";

type AdStep = 1 | 2;
type AdPhase = "idle" | "loading" | "playing" | "reward";

const DEFAULT_DURATION = 15;
const MAX_AD_DURATION = 30;

const AD_REJECT_MESSAGES: Record<string, string> = {
  ROUND_ENDED: "This round has ended.",
  ROUND_COOLDOWN: "Wait for the next round to watch ads.",
  SESSION_EXPIRED: "Ad session expired. Please try again.",
  FIRST_AD_TOO_SHORT: "Please watch the full ad before continuing.",
  SECOND_AD_TOO_SHORT: "Please watch the full ad before claiming your reward.",
  ALREADY_REWARDED: "You already earned 2x for this round.",
  NO_ADS_AVAILABLE: "No active Ads",
};

function clampDuration(seconds?: number) {
  const n = Number(seconds);
  if (!Number.isFinite(n)) return DEFAULT_DURATION;
  return Math.max(5, Math.min(MAX_AD_DURATION, Math.round(n)));
}

function resolveAdDuration(ad: PromoAd | null | undefined, duration?: number) {
  return clampDuration(duration ?? ad?.durationSeconds);
}

export function useAds() {
  const socket = useSocket();
  const [phase, setPhase] = useState<AdPhase>("idle");
  const [step, setStep] = useState<AdStep>(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentAd, setCurrentAd] = useState<PromoAd | null>(null);
  const [totalSteps, setTotalSteps] = useState(2);
  const [stepDuration, setStepDuration] = useState(DEFAULT_DURATION);
  const [isStartingAds, setIsStartingAds] = useState(false);

  const sessionRef = useRef<string | null>(null);
  const stepRef = useRef<AdStep>(1);
  const durationRef = useRef(DEFAULT_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextAdRef = useRef<PromoAd | null>(null);
  const waitingForAdNextRef = useRef(false);
  const phaseRef = useRef<AdPhase>("idle");
  phaseRef.current = phase;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetSession = useCallback(() => {
    clearTimer();
    sessionRef.current = null;
    nextAdRef.current = null;
    waitingForAdNextRef.current = false;
    stepRef.current = 1;
    durationRef.current = DEFAULT_DURATION;
    setPhase("idle");
    setStep(1);
    setTimeLeft(0);
    setCurrentAd(null);
    setStepDuration(DEFAULT_DURATION);
    setIsStartingAds(false);
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

  const emitStepComplete = useCallback(
    (completedStep: AdStep) => {
      if (!socket || !sessionRef.current) return;
      socket.emit("ads_progress", {
        sessionId: sessionRef.current,
        completedStep,
        durationSeconds: durationRef.current,
      });
    },
    [socket]
  );

  const startStepTimer = useCallback(
    (adStep: AdStep, duration: number) => {
      clearTimer();
      const secs = clampDuration(duration);
      durationRef.current = secs;
      stepRef.current = adStep;
      setStep(adStep);
      setStepDuration(secs);
      setTimeLeft(secs);
      setPhase("playing");

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            setTimeLeft(0);

            if (stepRef.current === 1) {
              waitingForAdNextRef.current = true;
              setPhase("loading");
              emitStepComplete(1);
            } else if (stepRef.current === 2) {
              setPhase("loading");
              emitStepComplete(2);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer, emitStepComplete]
  );

  const playStep = useCallback(
    (adStep: AdStep, ad: PromoAd | null, duration?: number) => {
      if (!ad) {
        setPhase("loading");
        return;
      }
      const secs = resolveAdDuration(ad, duration);
      setCurrentAd(ad);
      void preloadPromoAdMedia(ad);
      startStepTimer(adStep, secs);
    },
    [startStepTimer]
  );

  const handleSessionStart = useCallback(
    (data: {
      sessionId: string;
      step: number;
      duration?: number;
      totalSteps?: number;
      ad?: PromoAd | null;
      nextAd?: PromoAd | null;
    }) => {
      sessionRef.current = data.sessionId;
      nextAdRef.current = data.nextAd ?? null;
      waitingForAdNextRef.current = false;
      setTotalSteps(data.totalSteps ?? 2);
      clearStartLoading();

      const adStep = (data.step === 2 ? 2 : 1) as AdStep;
      if (data.nextAd) {
        void preloadPromoAdMedia(data.nextAd);
      }

      if (adStep === 2) {
        playStep(2, data.ad ?? null, data.duration);
        return;
      }

      playStep(1, data.ad ?? null, data.duration);
    },
    [clearStartLoading, playStep]
  );

  const startAds = useCallback(
    (roundId: string) => {
      if (!socket) return false;
      if (isStartingAds || phase !== "idle") return false;

      setIsStartingAds(true);
      setPhase("loading");
      nextAdRef.current = null;
      waitingForAdNextRef.current = false;

      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = setTimeout(() => {
        startTimeoutRef.current = null;
        setIsStartingAds(false);
        setPhase("idle");
        showAlertAsToast("Ad unavailable", "Could not start ad. Please try again.");
      }, 15000);

      socket.emit("watch_ads", { roundId, adType: "admin" });
      return true;
    },
    [socket, isStartingAds, phase]
  );

  useEffect(() => {
    if (!socket) return;

    const onStarted = (data: Parameters<typeof handleSessionStart>[0]) =>
      handleSessionStart(data);

    const onNext = (data: {
      step: number;
      duration?: number;
      totalSteps?: number;
      ad?: PromoAd;
    }) => {
      if (!sessionRef.current) return;
      waitingForAdNextRef.current = false;
      handleSessionStart({
        sessionId: sessionRef.current,
        step: data.step,
        duration: data.duration,
        totalSteps: data.totalSteps,
        ad: data.ad ?? nextAdRef.current,
        nextAd: null,
      });
    };

    const onReward = () => {
      clearTimer();
      waitingForAdNextRef.current = false;
      setPhase("reward");
      setTimeLeft(0);
      showAlertAsToast("Success", "2x Tap Boost activated!");
      setTimeout(() => dismissAdModal(), 3000);
    };

    const onRejected = (data: { reason?: string; message?: string }) => {
      if (phaseRef.current === "reward") return;

      const reason = data.reason ?? "";
      if (reason === "FIRST_AD_TOO_SHORT" || reason === "SECOND_AD_TOO_SHORT") {
        const msg =
          AD_REJECT_MESSAGES[reason] || "Please watch the full ad.";
        showAlertAsToast("Ad", msg);
        if (waitingForAdNextRef.current && reason === "FIRST_AD_TOO_SHORT") {
          waitingForAdNextRef.current = false;
          setPhase("playing");
        }
        return;
      }

      clearStartLoading();
      resetSession();

      if (reason === "NO_ADS_AVAILABLE") {
        showAlertAsToast("No active Ads", "No active Ads");
        return;
      }

      const msg =
        data.message || AD_REJECT_MESSAGES[reason] || "Could not play ad.";
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
  }, [socket, handleSessionStart, resetSession, clearTimer, clearStartLoading, dismissAdModal]);

  const isWatching = phase === "loading" || phase === "playing" || phase === "reward";
  const adTimerActive = phase === "playing" && timeLeft > 0;
  const rewardGrantedUI = phase === "reward";

  return {
    startAds,
    isWatching,
    isStartingAds,
    step,
    timeLeft,
    sessionId: sessionRef.current,
    currentAd,
    currentDuration: stepDuration,
    totalSteps,
    rewardGranted: rewardGrantedUI,
    rewardGrantedUI,
    dismissAdModal,
    resetSession,
    markAdMediaReady: () => {},
    adTimerActive,
    adPhase: phase,
  };
}
