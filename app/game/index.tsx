import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView, SafeAreaView, StatusBar, Platform, Animated, Easing, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Users as UsersIcon, User, Crown, TestTube, Smartphone, Ticket, Banknote, Gift, Flame, Zap } from "lucide-react-native";
import PrizeIndicator from "@/components/PrizeIndicator";
import { useGame } from "@/context/GameContext";
import { useCurrentEgg, useEgg } from "@/context/eggContext";
import { useCurrentEggViewModel } from "@/hooks/eggSelector";
import Egg from "@/components/Egg";
import ProgressBar from "@/components/ProgressBar";
import PowerUpPanel, { type PowerUpPanelRef } from "@/components/PowerUpPanel";
import { calculatePowerUpCost, mergePowerUpInventory, formatWinnerPrizeAmount, displayWinnerName, type PowerUpType } from "@/types/game";
import { useAuth } from "@/context/AuthContext";
import CooldownTimer from "@/components/CooldownTimer";
import WinModal from "@/components/WinModal";
import LoseModal from "@/components/LoseModal";
import AdModal from "@/components/AdModal";
import PaymentModal from "@/components/paymentModal";
import TapFeedback from "@/components/TapFeedback";
import PowerUpBackground, { PowerUpActiveStrip } from "@/components/PowerUpBackground";
import CheerCrowd from "@/components/CheerCrowd";
import EggPunLoadingOverlay from "@/components/EggPunLoadingOverlay";
import CluckyNest from "@/components/CluckyNest";
import { preloadTapSounds, playTapSound, unloadTapSounds } from "@/utils/sounds";
import { useLockGameZoom } from "@/hooks/useDisableZoomAndSelect";
import { BOT_DISPLAY_NAMES } from "@/constants/botDisplayNames";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";

const PRIZE_CATEGORIES = [
  {
    key: 'airtime',
    label: 'Airtime',
    desc: 'Win mobile airtime credits',
    icon: <Smartphone size={22} color="#4ECDC4" />,
    bgColor: 'rgba(78,205,196,0.15)',
    borderColor: 'rgba(78,205,196,0.3)',
  },
  {
    key: 'coupon',
    label: 'Coupons',
    desc: 'Shopping vouchers & deals',
    icon: <Ticket size={22} color="#FF6B6B" />,
    bgColor: 'rgba(255,107,107,0.15)',
    borderColor: 'rgba(255,107,107,0.3)',
  },
  {
    key: 'cash',
    label: 'Cash',
    desc: 'Direct cash rewards',
    icon: <Banknote size={22} color="#27AE60" />,
    bgColor: 'rgba(39,174,96,0.15)',
    borderColor: 'rgba(39,174,96,0.3)',
  },
  {
    key: 'sponsor',
    label: 'Sponsor Gifts',
    desc: 'Exclusive sponsored prizes',
    icon: <Gift size={22} color="#F39C12" />,
    bgColor: 'rgba(243,156,18,0.15)',
    borderColor: 'rgba(243,156,18,0.3)',
  },
];

export default function Tap2CrackGame() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const powerUpPanelRef = useRef<PowerUpPanelRef>(null);
  const { 
    winners, 
    showWinModal, 
    showLoseModal, 
    showAd,
    adStep,
    adTimeLeft,
    adDuration,
    adCurrent,
    adTotalSteps,
    adRewardGrantedUI,
    dismissAdModal,
    isStartingAds,
    adTimerActive,
    adPhase,
    markAdMediaReady,
    markAdMediaFailed,
    setAdMediaBuffering,
    adMediaBuffering,
    activatingPowerUp,
    currentWinner, 
    activePowerUp, 
    isPaymentLoading,
    powerUpUsedThisRound,
    handleTap, 
    activatePowerUp,
    inventory,
    setShowWinModal, 
    setShowLoseModal,
    otherPlayersTaps,
    isSimulatingPlayers,
    watchAdsFor2x,
   // toggleSimulatePlayers,
    
  } = useGame();
  const mainEgg = useCurrentEggViewModel();
  const [tapCount, setTapCount] = useState(0);
  const [consecutiveTaps, setConsecutiveTaps] = useState(0);
  const consecutiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef = useRef(0);
  const consecutiveRef = useRef(0);
  const tapUiRafRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFlashAtRef = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const noop = useCallback(() => {}, []);
  const { authUser: user, token, refreshProfile } = useAuth();
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentPayload, setPaymentPayload] = useState<{
    multiplier: 2 | 3;
    amount: number;
    quantity: number;
    type: PowerUpType;
  } | null>(null);

  const displayInventory = useMemo(() => {
    const live = mergePowerUpInventory(inventory);
    if (live["2x"] > 0 || live["3x"] > 0) return live;
    return mergePowerUpInventory(user?.powerUpInventory, live);
  }, [user?.powerUpInventory, inventory]);

  const isPowerUpActivating = useCallback(
    (type: "2x" | "3x") => {
      if (!activatingPowerUp) return false;
      const norm = (v: string) => v.toLowerCase().replace(/^x/, "");
      return norm(String(activatingPowerUp)) === norm(type);
    },
    [activatingPowerUp]
  );

  const handleStartPayment = useCallback(
    (payload: {
      type: PowerUpType;
      quantity: number;
      multiplier: 2 | 3;
      amount: number;
    }) => {
      setPaymentPayload(payload);
      setPaymentModalVisible(true);
    },
    []
  );

  const handlePaymentSuccess = useCallback(async () => {
    await refreshProfile(true);
    setPaymentModalVisible(false);
    setPaymentPayload(null);
  }, [refreshProfile]);
  const { onlineUsers, selectedEggType } = useEgg();
  const currentEgg = useCurrentEgg();
    
  
  // Background flash animation
  const flashAnim = useRef(new Animated.Value(0)).current;
  
  // Test mode state
  const [testMode, setTestMode] = useState(false);
  const [testCrackLevel, setTestCrackLevel] = useState<number | null>(null);
  const [testIsLoser, setTestIsLoser] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const carouselScrollRef = useRef<ScrollView>(null);

  // No zooming while playing (some phones zoom in on rapid taps).
  useLockGameZoom();

  // Load the tap sounds once when the game opens.
  useEffect(() => {
    void preloadTapSounds();
    return () => unloadTapSounds();
  }, []);

  // Disable zoom on web
  useEffect(() => {
    return () => {
      if (tapUiRafRef.current !== null) {
        clearTimeout(tapUiRafRef.current);
      }
    };
  }, []);

  const handleCloseWinModal = useCallback(() => {
    setShowWinModal(false);
  }, [setShowWinModal]);

  const loseModalVisible = showLoseModal || (testMode && testIsLoser);

  const handleLoseJoinNext = useCallback(() => {
    setShowLoseModal(false);
    setTestIsLoser(false);
    setTestCrackLevel(0);
  }, [setShowLoseModal]);

  useEffect(() => {
    tapCountRef.current = 0;
    consecutiveRef.current = 0;
    setTapCount(0);
    setConsecutiveTaps(0);
  }, [currentEgg?.egg.id, currentEgg?.roundId]);

  const flushTapUi = useCallback(() => {
    tapUiRafRef.current = null;
    setTapCount(tapCountRef.current);
    setConsecutiveTaps(consecutiveRef.current);
  }, []);

  // Tap counters drive the puns/chickens only, so refresh them ~14 times a second instead of every frame.
  // Fewer full-screen re-renders keeps the 2x/3x and pun animations smooth while tapping fast.
  const scheduleTapUi = useCallback(() => {
    if (tapUiRafRef.current !== null) return;
    tapUiRafRef.current = setTimeout(flushTapUi, 70);
  }, [flushTapUi]);

  const isWideWeb = Platform.OS === "web" && width >= 900;
  const showNavLabels = width >= 640;
  const contentMax = Math.min(560, Math.max(280, width - 32));
  const carouselCardW = Math.min(260, contentMax * 0.44);
  const padH = width < 360 ? 10 : width < 480 ? 14 : 20;
  const navGap = width < 360 ? 6 : 12;
  const eggNoPowerUp = currentEgg?.egg.type === "no-powerup";
  const canTapSideRails =
    !!currentEgg &&
    !testMode &&
    !powerUpUsedThisRound &&
    !activePowerUp &&
    !currentEgg.isCooldown &&
    !eggNoPowerUp;
  const showDesktopRails = isWideWeb && !!currentEgg && !testMode && !eggNoPowerUp;
  const showMobilePowerBubbleMount =
    !isWideWeb && !!currentEgg && !testMode && !eggNoPowerUp && !showAd;
  const railCost2x = currentEgg ? calculatePowerUpCost(currentEgg.prize.value, 2) : 0;
  const railCost3x = currentEgg ? calculatePowerUpCost(currentEgg.prize.value, 3) : 0;

  let serverProgress = 0;
  if (currentEgg && currentEgg.totalTaps > 0) {
    const rawProgress = (currentEgg.currentTaps / currentEgg.totalTaps) * 100;
    serverProgress = isNaN(rawProgress) ? 0 : rawProgress;
  }

  const progress = testMode ? (testCrackLevel || 0) : serverProgress;
  const progressPct = Math.min(Math.max(progress, 0), 100);
  const mobileBubbleTier: "2x" | "3x" = progressPct >= 70 ? "3x" : "2x";
  const mobileBubbleVisible =
    showMobilePowerBubbleMount &&
    progressPct >= 50 &&
    progressPct < 100 &&
    !currentEgg?.isCooldown &&
    !powerUpUsedThisRound &&
    !activePowerUp;
  const mobileBubbleOpacity = useRef(new Animated.Value(0)).current;
  const mobileBubbleScale = useRef(new Animated.Value(1)).current;
  const mobileBubbleTierRef = useRef<"2x" | "3x">("2x");

  useEffect(() => {
    Animated.timing(mobileBubbleOpacity, {
      toValue: mobileBubbleVisible ? 1 : 0,
      duration: mobileBubbleVisible ? 400 : 300,
      useNativeDriver: true,
    }).start();
  }, [mobileBubbleVisible, mobileBubbleOpacity]);

  useEffect(() => {
    mobileBubbleTierRef.current = "2x";
    mobileBubbleOpacity.setValue(0);
    mobileBubbleScale.setValue(1);
  }, [currentEgg?.roundId, mobileBubbleOpacity, mobileBubbleScale]);

  useEffect(() => {
    if (!mobileBubbleVisible || progressPct < 50) return;
    const tier: "2x" | "3x" = progressPct >= 70 ? "3x" : "2x";
    if (tier === mobileBubbleTierRef.current) return;
    mobileBubbleTierRef.current = tier;
    mobileBubbleScale.setValue(0.88);
    Animated.spring(mobileBubbleScale, {
      toValue: 1,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [progressPct, mobileBubbleVisible, mobileBubbleScale]);
  // ---- Egg burst moment ----
  // When the egg cracks, play the burst first (flash + shake + shards), THEN show the win/lose modal
  // and the Round Over screen.
  const BURST_MS = 1100;
  const roundEnded =
    !!currentEgg &&
    (progressPct >= 100 || !!currentEgg.isCooldown || showWinModal || showLoseModal);
  const prevRoundEndedRef = useRef(roundEnded); // starts with current value: no hold if we join mid-cooldown
  const [burstHold, setBurstHold] = useState(false);
  const burstFlash = useRef(new Animated.Value(0)).current;
  const stageShake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (roundEnded && !prevRoundEndedRef.current) {
      setBurstHold(true);
      burstFlash.setValue(0.9);
      Animated.timing(burstFlash, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      stageShake.setValue(0);
      Animated.sequence([
        Animated.timing(stageShake, { toValue: 16, duration: 40, useNativeDriver: true }),
        Animated.timing(stageShake, { toValue: -14, duration: 50, useNativeDriver: true }),
        Animated.timing(stageShake, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(stageShake, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(stageShake, { toValue: 3, duration: 50, useNativeDriver: true }),
        Animated.timing(stageShake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      const t = setTimeout(() => setBurstHold(false), BURST_MS);
      prevRoundEndedRef.current = roundEnded;
      return () => clearTimeout(t);
    }
    if (!roundEnded) setBurstHold(false);
    prevRoundEndedRef.current = roundEnded;
  }, [roundEnded, burstFlash, stageShake]);

  // ---- Between rounds: Clucky lays the next egg ----
  // After the countdown, the old (broken) egg can hang around for a few seconds until the server
  // starts the new round. Instead of a yolk + burning bar, Clucky sits on a nest "laying" the next egg,
  // then the new egg pops out of the nest the moment the round really resets.
  const LAY_MS = 900;
  const eggBroken = !!currentEgg && (progressPct >= 100 || !!currentEgg.isCooldown || !!mainEgg?.isCooldown);
  const cooldownEndMs = currentEgg?.cooldownEndTime ? Number(currentEgg.cooldownEndTime) : 0;
  const [cooldownPassed, setCooldownPassed] = useState(true);
  useEffect(() => {
    const left = cooldownEndMs - Date.now();
    if (!cooldownEndMs || left <= 0) {
      setCooldownPassed(true);
      return;
    }
    setCooldownPassed(false);
    const t = setTimeout(() => setCooldownPassed(true), left);
    return () => clearTimeout(t);
  }, [cooldownEndMs]);
  const waitingForEgg =
    eggBroken && !burstHold && !showWinModal && !loseModalVisible && cooldownPassed && !testMode;

  const [layingEgg, setLayingEgg] = useState(false);
  const layAnim = useRef(new Animated.Value(1)).current;
  const prevWaitingRef = useRef(waitingForEgg);
  useEffect(() => {
    // Clucky was waiting and a fresh egg has arrived -> lay it.
    if (prevWaitingRef.current && !waitingForEgg && !eggBroken) {
      setLayingEgg(true);
      layAnim.setValue(0);
      Animated.spring(layAnim, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }).start();
      const t = setTimeout(() => setLayingEgg(false), LAY_MS);
      prevWaitingRef.current = waitingForEgg;
      return () => clearTimeout(t);
    }
    prevWaitingRef.current = waitingForEgg;
  }, [waitingForEgg, eggBroken, layAnim]);

  // ---- "ABOUT TO CRACK!" banner (85%+) ----
  const aboutToCrack = !!currentEgg && progressPct >= 85 && progressPct < 100 && !currentEgg.isCooldown;
  const crackPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!aboutToCrack) {
      crackPulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(crackPulse, { toValue: 1, duration: 180, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(crackPulse, { toValue: 0, duration: 180, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [aboutToCrack, crackPulse]);

  const popupsProgressOk = progressPct >= 50;
   const popupsOnlineOk = onlineUsers > 1;
  const popupsCooldownOk = !currentEgg?.isCooldown;
  const popupsEligible = popupsProgressOk && popupsOnlineOk && popupsCooldownOk;

  const stageWidth = Math.min(contentMax, 560);
  const isPhone = width < 420;
  const isShort = height < 760;

  // Size the egg so the header, egg and progress bar all fit on one phone screen.
  // Space reserved for: header (~56) + power-up strip (~34) + prize badge (~50) + egg label (~44)
  // + progress bar (~86) + breathing room. The strip is always reserved so the egg doesn't jump when a boost starts.
  const reservedH = 56 + 34 + 50 + 44 + 30 + 86 + 24; // +30: boost-activity slot under the egg
  const eggH = Math.max(140, Math.min(isShort ? 210 : 235, height - reservedH));
  const eggW = Math.round(eggH * (180 / 220));
  // Non-normal eggs show an extra frequency badge under the egg name.
  const eggHasBadge = !!currentEgg && currentEgg.egg.type !== "normal" && currentEgg.egg.type !== "no-powerup";
  const stageHeight = eggH + (isShort ? 48 : 64) + (eggHasBadge ? 26 : 0);
  const chickenSize = isPhone ? 44 : 56;
  const bubbleSize = width < 360 ? 52 : 60;
  // Centre of the egg inside the egg stage (stage centres egg + label vertically).
  const eggCenterY = Math.round((stageHeight - eggH) / 2 - 10 + eggH * 0.5);

  const popupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // "Name activated 2x taps": ONE message at a time, in a fixed centred slot under the egg,
  // so it's always fully on screen and never scattered around the egg.
  const [powerUpPopups, setPowerUpPopups] = useState<Array<{
    id: string;
    name: string;
    mult: 2 | 3;
    anim: Animated.Value;
  }>>([]);
  const baseNames = useRef([...BOT_DISPLAY_NAMES]).current;

  const spawnPowerUpPopup = useCallback(() => {
    if (!popupsEligible) return;

    setPowerUpPopups(prev => {
      if (prev.length >= 1 || onlineUsers < 2) return prev; // one at a time

      const name = baseNames[Math.floor(Math.random() * baseNames.length)];
      const mult: 2 | 3 = Math.random() < 0.65 ? 2 : 3;
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const anim = new Animated.Value(0);

      const next = [{ id, name, mult, anim }];

      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 260, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
        Animated.delay(2300),
        Animated.timing(anim, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start(() => {
        setPowerUpPopups(p => p.filter(x => x.id !== id));
      });

      return next;
    });
  }, [baseNames, onlineUsers, popupsEligible]);

  useEffect(() => {
    if (!popupsEligible) {
      if (popupTimerRef.current) {
        clearInterval(popupTimerRef.current);
        popupTimerRef.current = null;
      }
      setPowerUpPopups([]);
      return;
    }

    if (!popupTimerRef.current) {
      const t = setTimeout(spawnPowerUpPopup, 500);
      popupTimerRef.current = setInterval(spawnPowerUpPopup, 4500);
      return () => {
        clearTimeout(t);
        if (popupTimerRef.current) {
          clearInterval(popupTimerRef.current);
          popupTimerRef.current = null;
        }
      };
    }
  }, [onlineUsers, popupsEligible, spawnPowerUpPopup]);

  const triggerFlash = useCallback((intensity: number = 1) => {
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 0.08 * intensity,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [flashAnim]);

  const handleEggTap = useCallback((x: number, y: number) => {
    if (currentEgg?.isCooldown) return;

    playTapSound();
    tapCountRef.current += 1;
    consecutiveRef.current += 1;
    const n = tapCountRef.current;

    scheduleTapUi();

    if (consecutiveTimerRef.current) {
      clearTimeout(consecutiveTimerRef.current);
    }
    consecutiveTimerRef.current = setTimeout(() => {
      consecutiveRef.current = 0;
      setConsecutiveTaps(0);
    }, 4000);

    const now = Date.now();
    if (now - lastFlashAtRef.current > 140 || n % 4 === 0) {
      lastFlashAtRef.current = now;
      const intensity = n > 40 ? 1.2 : n > 20 ? 1 : 0.8;
      triggerFlash(intensity);
    }

    if (!testMode) {
      handleTap();
    }
  }, [handleTap, triggerFlash, testMode, currentEgg?.isCooldown, scheduleTapUi]);

  // Get background gradient based on egg type
  const getBackgroundGradient = (): [string, string, string] => {
    if (testMode && testIsLoser) return ["#2d1a1a", "#4a1a1a", "#6b1a1a"];
    
    if (!currentEgg) return ["#1a1a2e", "#16213e", "#0f3460"];
    
    switch (currentEgg.egg.type) {
      case 'golden':
        return ["#2d1f00", "#4a3500", "#6b4e00"];
      case 'silver':
        return ["#1a1a2e", "#2d2d3d", "#404050"];
      case 'company':
        return ["#2d1a1a", "#4a2a2a", "#6b3a3a"];
      case 'business':
        return ["#1a2d2a", "#2a4a42", "#3a6b5a"];
      case 'no-powerup':
        return ["#2d2d2d", "#404040", "#525252"];
      default:
        return ["#1a1a2e", "#16213e", "#0f3460"];
    }
  };

  const getPrizeIcon = () => {
    if (!currentEgg) return '🥚';
    switch (currentEgg.prize.type) {
      case 'airtime': return '📱';
      case 'coupon': return '🎫';
      case 'cash': return '💵';
      default: return '🎁';
    }
  };

  const testLevels = [
    { level: 0, label: 'Fresh' },
    { level: 10, label: '10%' },
    { level: 30, label: '30%' },
    { level: 50, label: '50%' },
    { level: 70, label: '70%' },
    { level: 100, label: '100%' },
  ];

 if (!currentEgg || !mainEgg) {
  const colors = getBackgroundGradient(); 

  return (
    <LinearGradient 
      colors={colors} 
      style={styles.loadar}
    >
      <ActivityIndicator size="large" color="#FFD700" />
    </LinearGradient>
  );
}

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={getBackgroundGradient()} style={styles.gradient}>
        <EggPunLoadingOverlay visible={!currentEgg} />
        <Animated.View 
          style={[
            styles.flashOverlay,
            {
              backgroundColor: '#FFD27A',
              opacity: flashAnim,
            },
          ]} 
          pointerEvents="none"
        />
        <PowerUpBackground activePowerUp={activePowerUp} isHappyHour={!!currentEgg.isHappyHour} clearRight={mobileBubbleVisible} />

        {showDesktopRails ? (
          <View style={[styles.desktopRailLeft, { top: Math.min(height * 0.26, height * 0.5 - 140) }]} pointerEvents="box-none">
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={!canTapSideRails || isPaymentLoading}
              onPress={() => powerUpPanelRef.current?.pressPowerUp("2x")}
              style={[styles.desktopRailBtn, (!canTapSideRails || isPaymentLoading) && styles.desktopRailBtnDisabled]}
            >
              <LinearGradient colors={activePowerUp?.type === "2x" ? ["#FFD700", "#FFA500"] : ["#4ECDC4", "#44B3AB"]} style={styles.desktopRailGradient}>
                {isPowerUpActivating("2x") ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                <Zap size={22} color="#FFF" />
                <Text style={styles.desktopRailMult}>2x</Text>
                <Text style={styles.desktopRailCost}>₦{railCost2x}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={!canTapSideRails || isPaymentLoading}
              onPress={() => powerUpPanelRef.current?.pressPowerUp("3x")}
              style={[styles.desktopRailBtn, (!canTapSideRails || isPaymentLoading) && styles.desktopRailBtnDisabled]}
            >
              <LinearGradient colors={activePowerUp?.type === "3x" ? ["#FFD700", "#FFA500"] : ["#9B59B6", "#8E44AD"]} style={styles.desktopRailGradient}>
                {isPowerUpActivating("3x") ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                <Crown size={22} color="#FFF" />
                <Text style={styles.desktopRailMult}>3x</Text>
                <Text style={styles.desktopRailCost}>₦{railCost3x}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : null}

        {showDesktopRails ? (
          <View style={[styles.desktopRailRight, { top: Math.min(height * 0.26, height * 0.5 - 100) }]} pointerEvents="box-none">
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={!canTapSideRails || isStartingAds}
              onPress={() => powerUpPanelRef.current?.pressWatchAd()}
              style={[styles.desktopWatchAdBtn, (!canTapSideRails || isStartingAds) && styles.desktopRailBtnDisabled]}
            >
              {isStartingAds ? (
                <ActivityIndicator color="#FFD700" size="small" />
              ) : (
                <>
              <Text style={styles.desktopWatchAdEmoji}>📺</Text>
              <Text style={styles.desktopWatchAdText}>Ad</Text>
              <Text style={styles.desktopWatchAdSub}>2x</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        
        {/* One compact header row: who you are + online count on the left, round icon buttons on the right.
            (Replaces the separate pill row so the top of the screen stays clean.) */}
        <View style={[styles.header, { paddingHorizontal: padH }]}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, width < 380 && styles.avatarSm]}>
              <Text style={[styles.avatarText, width < 380 && styles.avatarTextSm]}>{(user.name?.[0] || "👤").toUpperCase()}</Text>
            </View>
            <View style={styles.userInfoText}>
              <Text style={[styles.userName, width < 380 && styles.userNameSm]} numberOfLines={1}>
                {user.name || "Guest"}
              </Text>
              <View style={styles.rankRow}>
                <Crown size={width < 380 ? 10 : 12} color="#FFD700" />
                <Text style={[styles.rankText, width < 380 && styles.rankTextSm]} numberOfLines={1}>
                  {user?.stats?.rank || "Egg Novice"}
                </Text>
                <View style={styles.onlineDot} />
                <Text style={[styles.rankText, width < 380 && styles.rankTextSm]} numberOfLines={1}>
                  {onlineUsers.toLocaleString()} online
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.headerNav, { gap: navGap }]}>
            {([
              { label: "Rank", href: "/leaderboard", icon: <Trophy size={18} color="#FFD700" /> },
              { label: "Winners", href: "/winners", icon: <UsersIcon size={18} color="#4ECDC4" /> },
              { label: "Profile", href: "/profile", icon: <User size={18} color="#FF6B6B" /> },
            ] as const).map((item) => (
              <TouchableOpacity
                key={item.href}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={[styles.iconBtn, showNavLabels && styles.iconBtnLabeled]}
                onPress={() => router.push(item.href)}
              >
                {item.icon}
                {showNavLabels && <Text style={styles.navText}>{item.label}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <PowerUpActiveStrip activePowerUp={activePowerUp} isHappyHour={!!currentEgg.isHappyHour} />

        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={[styles.scroll, isWideWeb && { alignItems: "center" }]} 
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.gameMainColumn, { maxWidth: contentMax, width: isWideWeb ? contentMax : "100%" }]}>
          {aboutToCrack && (
            <View style={styles.crackBannerWrap} pointerEvents="none">
              <Animated.Text
                style={[
                  styles.crackBanner,
                  isPhone && styles.crackBannerSm,
                  { transform: [{ scale: crackPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                ABOUT TO CRACK!
              </Animated.Text>
            </View>
          )}

          {!aboutToCrack && currentEgg && currentEgg.egg.type === 'normal' && (
            <View style={[styles.prizeRow, isShort && styles.prizeRowCompact]}>
              <View style={[styles.prizeIndicatorContainer, isShort && styles.prizeIndicatorCompact]}>
                <PrizeIndicator 
                  prize={currentEgg.prize} 
                  eggType={currentEgg.egg.type} 
                  compact={isShort}
                />
              </View>
            </View>
          )}

          {!aboutToCrack && currentEgg && currentEgg.egg.type !== 'normal' && (
            <View style={styles.mysteryBadge}>
              <Text style={styles.prizeTypeIcon}>❓</Text>
              <Text style={styles.prizeTypeText}>Mystery Prize</Text>
            </View>
          )}

          {currentEgg && (
            <>
              <Animated.View style={[styles.eggStage, { width: stageWidth, height: stageHeight, transform: [{ translateX: stageShake }] }]}>
                <CheerCrowd taps={tapCount} progress={progressPct} hidden={!!currentEgg.isCooldown || waitingForEgg} size={chickenSize} avoidRight={mobileBubbleVisible} />
                {/* 2x/3x offer bubble: sits in the empty space right of the egg and scrolls with it. */}
                {showMobilePowerBubbleMount ? (
                  <Animated.View
                    style={[
                      styles.mobilePowerBubbleWrap,
                      {
                        top: Math.round(eggCenterY - bubbleSize / 2),
                        opacity: mobileBubbleOpacity,
                        transform: [{ scale: mobileBubbleScale }],
                      },
                    ]}
                    pointerEvents={mobileBubbleVisible ? "box-none" : "none"}
                  >
                    <TouchableOpacity
                      activeOpacity={0.88}
                      disabled={isPaymentLoading || !mobileBubbleVisible}
                      onPress={() => powerUpPanelRef.current?.openPurchase(mobileBubbleTier)}
                      style={[
                        styles.mobilePowerBubble,
                        { width: bubbleSize, height: bubbleSize, borderRadius: bubbleSize / 2 },
                        (isPaymentLoading || !mobileBubbleVisible) && styles.mobilePowerBubbleDisabled,
                      ]}
                    >
                      <LinearGradient
                        colors={
                          activePowerUp?.type === mobileBubbleTier
                            ? ["#FFD700", "#FFA500"]
                            : mobileBubbleTier === "3x"
                              ? ["#9B59B6", "#8E44AD"]
                              : ["#4ECDC4", "#44B3AB"]
                        }
                        style={styles.mobilePowerBubbleGradient}
                      >
                        {isPowerUpActivating(mobileBubbleTier) ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : mobileBubbleTier === "3x" ? (
                          <>
                            <Crown size={18} color="#FFF" />
                            <Text style={styles.mobilePowerBubbleLabel}>3x</Text>
                            <Text style={styles.mobilePowerBubblePrice}>₦{railCost3x}</Text>
                          </>
                        ) : (
                          <>
                            <Zap size={18} color="#FFF" />
                            <Text style={styles.mobilePowerBubbleLabel}>2x</Text>
                            <Text style={styles.mobilePowerBubblePrice}>₦{railCost2x}</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                ) : null}

                {(waitingForEgg || layingEgg) && (
                  <View style={styles.nestLayer} pointerEvents="none">
                    <CluckyNest mode={waitingForEgg ? "waiting" : "laying"} eggW={eggW} compact={isPhone} />
                  </View>
                )}

                <Animated.View
                  style={[
                    styles.eggTopLayer,
                    waitingForEgg && styles.eggHidden,
                    layingEgg && {
                      transform: [
                        { translateY: layAnim.interpolate({ inputRange: [0, 1], outputRange: [eggH * 0.3, 0] }) },
                        { scale: layAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
                      ],
                    },
                  ]}
                  pointerEvents={waitingForEgg ? "none" : "auto"}
                >
                  <Egg 
                    type={mainEgg.type} 
                    progress={progressPct} 
                    onTap={handleEggTap} 
                    isCracked={mainEgg.isCracked || !!mainEgg.isCooldown} 
                    isCooldown={mainEgg.isCooldown}
                    isLoser={testMode && testIsLoser}
                    testCrackLevel={testMode ? testCrackLevel : null}
                    size={eggW}
                    compact={isShort}
                  />
                </Animated.View>
                <TapFeedback
                  tapCount={tapCount}
                  consecutiveTaps={consecutiveTaps}
                  tapMultiplier={activePowerUp?.multiplier || (currentEgg.isHappyHour ? 2 : 1)}
                  crackProgress={progressPct}
                  centerX={stageWidth / 2}
                  centerY={Math.round(eggCenterY - eggH * 0.05)}
                  avoidRight={mobileBubbleVisible}
                  compact={isPhone}
                />
              </Animated.View>
            </>
          )}

          {/* other players' boosts: fixed, centred slot (always fully visible) */}
          <View style={styles.activitySlot} pointerEvents="none">
            {powerUpPopups.map(p => (
              <Animated.View
                key={p.id}
                style={[
                  styles.activityToast,
                  p.mult === 3 ? styles.activityToast3x : styles.activityToast2x,
                  { maxWidth: stageWidth - 16 },
                  {
                    opacity: p.anim,
                    transform: [
                      { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                      { scale: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
                    ],
                  },
                ]}
              >
                {p.mult === 3 ? <Crown size={isPhone ? 13 : 15} color="#D4A5FF" /> : <Zap size={isPhone ? 13 : 15} color="#4ECDC4" />}
                <Text numberOfLines={1} ellipsizeMode="middle" style={[styles.activityText, isPhone && styles.activityTextSm]}>
                  <Text style={styles.activityName}>{p.name}</Text> activated{" "}
                  <Text style={{ color: p.mult === 3 ? "#D4A5FF" : "#4ECDC4", fontWeight: "900" }}>{p.mult}x</Text> taps
                </Text>
              </Animated.View>
            ))}
          </View>

          <View style={[styles.progressWrap, { paddingHorizontal: padH }]}>
  <ProgressBar 
    progress={waitingForEgg ? 0 : progressPct} 
    message={waitingForEgg ? "🐔 Next egg coming up…" : undefined}
    othersActive={onlineUsers > 1}
    othersTapShare={currentEgg ? (otherPlayersTaps / currentEgg.totalTaps) * 100 : 0}
  />
  {progressPct > 0 && !waitingForEgg && (
    <Text style={styles.progressText}>
      {Math.round(progressPct)}% cracked
      {onlineUsers > 1 && otherPlayersTaps > 0 && ` · ${otherPlayersTaps} taps from others`}
    </Text>
  )}
</View>

          {onlineUsers > 1 && (
            <View style={[styles.liveIndicator, { marginHorizontal: padH }]}>
              <Flame size={16} color="#FF6B00" />
              <Text style={styles.liveIndicatorText}>
                {onlineUsers} Players Tapping Live
              </Text>
            </View>
          )}

          {/* Simulate Players (for realtime demo) */}
        {/*  <TouchableOpacity
            style={[styles.testModeToggle, { marginHorizontal: padH }, isSimulatingPlayers && styles.simPlayersActive]}
            onPress={toggleSimulatePlayers}
          >
            <UsersIcon size={16} color={isSimulatingPlayers ? "#FFFFFF" : "rgba(255,255,255,0.7)"} />
            <Text style={[styles.testModeText, isSimulatingPlayers && styles.testModeTextActive]}>
              Simulate Players {isSimulatingPlayers ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity> */}

          {/* Test Controls */}
          {testMode && (
            <View style={[styles.testControls, { marginHorizontal: padH }]}>
              <Text style={styles.testTitle}>🧪 Test Egg States</Text>
              
              <View style={styles.testButtonsRow}>
                {testLevels.map(({ level, label }) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.testButton,
                      testCrackLevel === level && styles.testButtonActive,
                    ]}
                    onPress={() => {
                      setTestCrackLevel(level);
                      setTestIsLoser(false);
                    }}
                  >
                    <Text style={[
                      styles.testButtonText,
                      testCrackLevel === level && styles.testButtonTextActive,
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.loseTestButton,
                  testIsLoser && styles.loseTestButtonActive,
                ]}
                onPress={() => {
                  setTestIsLoser(!testIsLoser);
                  if (!testIsLoser) setTestCrackLevel(100);
                }}
              >
                <Text style={[
                  styles.loseTestButtonText,
                  testIsLoser && styles.loseTestButtonTextActive,
                ]}>
                  {testIsLoser ? '✓ Lose State' : 'Test Lose State'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.testHint}>
                Tap the egg to see the flash effect!
              </Text>
            </View>
          )}

          {!testMode && (
            <PowerUpPanel
              ref={powerUpPanelRef}
              egg={currentEgg}
              user={user}
              activePowerUp={activePowerUp}
              onActivate={activatePowerUp}
              onStartPayment={handleStartPayment}
              free2xAvailable={user.free2xAvailable}
              //onClaimFree2x={claimFree2x}
              adWatched2xAvailable={!powerUpUsedThisRound && !activePowerUp}
              onWatchAd={watchAdsFor2x}
             // isHappyHour={currentEgg.isHappyHour}
              isPaymentLoading={isPaymentLoading}
              userEmail={user.email  || ""}
              inventoryCounts={displayInventory}
              hideInlinePowerActions={isWideWeb}
              activatingPowerUp={activatingPowerUp}
              isStartingAds={isStartingAds}
            />
          )}

          {/* Prize Categories Carousel */}
          <View style={[styles.carouselContainer, { paddingHorizontal: padH }]}>
            <Text style={styles.carouselTitle}>Prize Categories</Text>
            <ScrollView
              ref={carouselScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              snapToInterval={carouselCardW + 10}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (carouselCardW + 10));
                setActiveCategory(index);
              }}
            >
              {PRIZE_CATEGORIES.map((cat, idx) => (
                <View key={cat.key} style={[styles.categoryCard, { borderColor: cat.borderColor, width: carouselCardW }]}>
                  <View style={[styles.categoryIconWrap, { backgroundColor: cat.bgColor }]}>
                    {cat.icon}
                  </View>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                  <Text style={styles.categoryDesc}>{cat.desc}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.carouselDots}>
              {PRIZE_CATEGORIES.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    activeCategory === idx && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {Array.isArray(winners) && winners.length > 0 && (
            <View style={[styles.winnersSection, { paddingHorizontal: padH }]}>
              <Text style={styles.sectionTitle}>Recent Winners</Text>
              {winners.slice(0, 3).map((winner, index) => (
                <View key={winner.id} style={styles.winnerCard}>
                  <Text style={styles.winnerRank}>#{index + 1}</Text>
                  <View style={styles.winnerAvatar}>
                    <Text style={styles.winnerInitial}>
                      {winner.user_name?.[0]?.toUpperCase() || "?"}
                    </Text>
                  </View>
                  <View style={styles.winnerDetails}>
                    <Text style={styles.winnerName}>
                      {displayWinnerName(winner.user_name)}
                    </Text>
                    <Text style={styles.winnerPrize}>
                      {winner.prize_type === "coupon" && winner.company_name
                        ? winner.company_name
                        : winner.prize_description}
                      {formatWinnerPrizeAmount(winner)
                        ? ` · ${formatWinnerPrizeAmount(winner)}`
                        : ""}
                    </Text>
                    {winner.prize_type === "coupon" && winner.company_name && (
                      <Text style={styles.winnerPrizeSub}>
                        {winner.prize_description}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.winnerTime}>
                    {winner.won_at
                      ? new Date(winner.won_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--"}
                  </Text>
                </View>
              ))}
            </View>
          )}

          </View>
        </ScrollView>
        {/* white flash when the egg bursts */}
        <Animated.View pointerEvents="none" style={[styles.burstFlash, { opacity: burstFlash }]} />

        {/* Order after a round: burst -> win/lose modal -> "Lock in for next round" -> Clucky lays the next egg.
            The lock-in screen only appears once the win/lose modal has closed. */}
        {currentEgg?.isCooldown && !burstHold && !showWinModal && !loseModalVisible &&
        currentEgg.cooldownEndTime && (
          <CooldownTimer 
            endTime={currentEgg.cooldownEndTime} 
            onJoinNext={() => {
              setShowWinModal(false);
              setShowLoseModal(false);
            }}
          />
        )}
        <WinModal 
          visible={showWinModal && !burstHold} 
          winner={currentWinner} 
          onClose={handleCloseWinModal} 
        />
        <LoseModal 
          visible={loseModalVisible && !burstHold} 
          onJoinNext={handleLoseJoinNext} 
        />
        <AdModal
          visible={showAd}
          step={adStep || 1}
          totalSteps={adTotalSteps || 2}
          timeLeft={adTimeLeft}
          duration={adDuration || 30}
          currentAd={adCurrent}
          rewardGranted={adRewardGrantedUI}
          onDismissReward={dismissAdModal}
          timerActive={adTimerActive}
          adPhase={adPhase}
          buffering={adMediaBuffering}
          onMediaReady={markAdMediaReady}
          onMediaError={markAdMediaFailed}
          onBuffering={setAdMediaBuffering}
        />
        {token && paymentPayload && (
          <PaymentModal
            visible={paymentModalVisible}
            multiplier={paymentPayload.multiplier}
            amount={paymentPayload.amount}
            quantity={paymentPayload.quantity}
            powerUpLabel={
              paymentPayload.type === "3x" || paymentPayload.type === "X3"
                ? "3x Tap Boost"
                : "2x Tap Boost"
            }
            token={token}
            onClose={() => {
              setPaymentModalVisible(false);
              setPaymentPayload(null);
            }}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadar: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  container: { flex: 1 },
  gradient: { flex: 1 },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'none',
  },
  loader: { marginVertical: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10, paddingBottom: 10, minHeight: 56 },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0, marginRight: 8 },
  userInfoText: { flex: 1, minWidth: 0 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,215,0,0.2)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#FFD700" },
  avatarSm: { width: 38, height: 38, borderRadius: 19 },
  avatarText: { fontSize: 18, fontWeight: "bold", color: "#FFD700" },
  avatarTextSm: { fontSize: 15 },
  userName: { fontSize: 14, fontWeight: "600", color: "#FFF" },
  userNameSm: { fontSize: 12 },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  rankText: { fontSize: 11, color: "rgba(255,255,255,0.7)", flexShrink: 1 },
  rankTextSm: { fontSize: 10 },
  headerNav: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  iconBtnLabeled: { width: "auto" as any, flexDirection: "row", gap: 6, paddingHorizontal: 14 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2ECC71", marginLeft: 6 },
  navRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", flexWrap: "nowrap" },
  navBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.08)", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, flexShrink: 1 },
  navBtnSm: { paddingVertical: 6, paddingHorizontal: 10, gap: 4 },
  navText: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  navTextSm: { fontSize: 10 },
  scroll: { paddingBottom: 24 },
  gameMainColumn: { width: "100%", alignSelf: "center" },
  desktopRailLeft: {
    position: "absolute",
    left: 12,
    zIndex: 20,
    gap: 12,
    pointerEvents: "box-none",
  },
  desktopRailRight: {
    position: "absolute",
    right: 12,
    zIndex: 20,
    pointerEvents: "box-none",
  },
  desktopRailBtn: {
    width: 76,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 4,
  },
  desktopRailBtnDisabled: { opacity: 0.45 },
  desktopRailGradient: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 2,
  },
  desktopRailMult: { fontSize: 18, fontWeight: "800" as const, color: "#FFF" },
  desktopRailCost: { fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: "600" as const },
  desktopWatchAdBtn: {
    width: 76,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  desktopWatchAdEmoji: { fontSize: 22, marginBottom: 2 },
  desktopWatchAdText: { fontSize: 13, fontWeight: "800" as const, color: "#FFF" },
  desktopWatchAdSub: { fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  mobilePowerBubbleWrap: {
    position: "absolute",
    right: 0,
    zIndex: 8,
    pointerEvents: "box-none",
  },
  mobilePowerBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 8px 24px rgba(0,0,0,0.35)" } as object)
      : {
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
        }),
  },
  mobilePowerBubbleDisabled: { opacity: 0.5 },
  mobilePowerBubbleGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 1,
  },
  mobilePowerBubbleLabel: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: "#FFF",
    lineHeight: 16,
  },
  mobilePowerBubblePrice: {
    fontSize: 9,
    fontWeight: "600" as const,
    color: "rgba(255,255,255,0.9)",
  },
  prizeTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 6,
  },
  prizeTypeIcon: {
    fontSize: 20,
  },
  prizeTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  mysteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  prizeIndicatorContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  crackBannerWrap: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    paddingHorizontal: 12,
  },
  crackBanner: {
    fontSize: 44,
    fontWeight: '900' as const,
    color: '#FF5A4F',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 59, 48, 0.75)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  crackBannerSm: {
    fontSize: 32,
  },
  burstFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 60,
  },
  prizeRow: {
    alignItems: 'center',
  },
  prizeRowCompact: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  prizeTypeBadgeCompact: {
    marginBottom: 0,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  prizeIndicatorCompact: {
    marginBottom: 0,
  },
  eggStage: {
    alignSelf: "center",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    overflow: "visible",
  },
  activitySlot: {
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  activityToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  activityToast2x: {
    backgroundColor: "rgba(78,205,196,0.14)",
    borderColor: "rgba(78,205,196,0.35)",
  },
  activityToast3x: {
    backgroundColor: "rgba(155,89,182,0.18)",
    borderColor: "rgba(155,89,182,0.45)",
  },
  activityText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "rgba(255,255,255,0.88)",
    flexShrink: 1,
  },
  activityTextSm: {
    fontSize: 12,
  },
  activityName: {
    fontWeight: "800" as const,
    color: "#FFFFFF",
  },
  carouselContainer: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 0,
    width: "100%",
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  carouselContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center' as const,
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: '#FFD700',
    width: 18,
  },
  progressWrap: { width: "100%", marginTop: 14 },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,69,0,0.25)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,140,0,0.5)',
  },
  liveIndicatorText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontSize: 13,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },
  testModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  testModeActive: {
    backgroundColor: 'rgba(155, 89, 182, 0.4)',
    borderColor: 'rgba(155, 89, 182, 0.6)',
  },
  simPlayersActive: {
    backgroundColor: 'rgba(78,205,196,0.25)',
    borderColor: 'rgba(78,205,196,0.45)',
  },
  testModeText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    fontSize: 13,
  },
  testModeTextActive: {
    color: '#FFFFFF',
  },
  testControls: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  testTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  testButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 12,
  },
  testButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  testButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.4)',
    borderColor: 'rgba(76, 175, 80, 0.6)',
  },
  testButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  testButtonTextActive: {
    color: '#FFFFFF',
  },
  loseTestButton: {
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  loseTestButtonActive: {
    backgroundColor: 'rgba(244, 67, 54, 0.4)',
    borderColor: 'rgba(244, 67, 54, 0.6)',
  },
  loseTestButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  loseTestButtonTextActive: {
    color: '#FFFFFF',
  },
  testHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  testWinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(155, 89, 182, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.5)',
  },
  testWinText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    
  },
  loadingText: {

  },
  winnersSection: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#FFF", marginBottom: 12 },
  winnerCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 12, marginBottom: 8, gap: 10 },
  winnerRank: { fontSize: 12, fontWeight: "bold", color: "rgba(255,255,255,0.5)", width: 24 },
  winnerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(78,205,196,0.2)", justifyContent: "center", alignItems: "center" },
  winnerInitial: { fontSize: 14, fontWeight: "bold", color: "#4ECDC4" },
  winnerDetails: { flex: 1 },
  winnerName: { fontSize: 14, fontWeight: "600", color: "#FFF" },
  winnerPrize: { fontSize: 11, color: "rgba(255,255,255,0.6)" },
  winnerPrizeSub: { fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2 },
  winnerTime: { fontSize: 11, color: "rgba(255,255,255,0.4)" },
});
