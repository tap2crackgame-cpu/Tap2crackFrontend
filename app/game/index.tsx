import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView, SafeAreaView, StatusBar, Platform, Animated, useWindowDimensions } from "react-native";
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
import OnlineUsers from "@/components/OnlineUsers";
import CooldownTimer from "@/components/CooldownTimer";
import WinModal from "@/components/WinModal";
import LoseModal from "@/components/LoseModal";
import AdModal from "@/components/AdModal";
import PaymentModal from "@/components/paymentModal";
import TapFeedback from "@/components/TapFeedback";
import PowerUpBackground from "@/components/PowerUpBackground";
import BengzFooter from "@/components/BengzFooter";
import EggPunLoadingOverlay from "@/components/EggPunLoadingOverlay";
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
  const [lastTapPosition, setLastTapPosition] = useState<{ x: number; y: number } | null>(null);
  const tapCountRef = useRef(0);
  const consecutiveRef = useRef(0);
  const tapUiRafRef = useRef<number | null>(null);
  const lastFlashAtRef = useRef(0);
  const flashColorsRef = useRef(['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#FFE66D']);
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
  const [flashColor, setFlashColor] = useState('#FFFFFF');
  
  // Test mode state
  const [testMode, setTestMode] = useState(false);
  const [testCrackLevel, setTestCrackLevel] = useState<number | null>(null);
  const [testIsLoser, setTestIsLoser] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const carouselScrollRef = useRef<ScrollView>(null);

  // Disable zoom on web
  useEffect(() => {
    return () => {
      if (tapUiRafRef.current !== null) {
        cancelAnimationFrame(tapUiRafRef.current);
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

  const scheduleTapUi = useCallback(() => {
    if (tapUiRafRef.current !== null) return;
    tapUiRafRef.current = requestAnimationFrame(flushTapUi);
  }, [flushTapUi]);

  const isWideWeb = Platform.OS === "web" && width >= 900;
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
  const railCost2x = currentEgg ? calculatePowerUpCost(currentEgg.prize.value, 2) : 0;
  const railCost3x = currentEgg ? calculatePowerUpCost(currentEgg.prize.value, 3) : 0;

  let serverProgress = 0;
  if (currentEgg && currentEgg.totalTaps > 0) {
    const rawProgress = (currentEgg.currentTaps / currentEgg.totalTaps) * 100;
    serverProgress = isNaN(rawProgress) ? 0 : rawProgress;
  }

  const progress = testMode ? (testCrackLevel || 0) : serverProgress;
  const progressPct = Math.min(Math.max(progress, 0), 100);
  const popupsProgressOk = progressPct >= 50;
   const popupsOnlineOk = onlineUsers > 1;
  const popupsCooldownOk = !currentEgg?.isCooldown;
  const popupsEligible = popupsProgressOk && popupsOnlineOk && popupsCooldownOk;

  const stageWidth = Math.min(contentMax, 560);
  const isPhone = width < 420;

  const laneStyles = useMemo(() => {
    const sidePush = isPhone ? 6 : 18;
    const outLeft = -Math.max(22, Math.round(stageWidth * (isPhone ? 0.08 : 0.18))) - sidePush;
    const outRight = outLeft;
    const nearLeft = -Math.max(10, Math.round(stageWidth * (isPhone ? 0.04 : 0.12))) - sidePush;
    const nearRight = nearLeft;

    return [
      { top: 58, left: nearLeft },
      { top: 108, right: nearRight },
      { top: 170, left: outLeft },
      { top: 220, right: outRight },
      { top: 286, left: nearLeft },
      { top: 318, right: nearRight },
    ] as const;
  }, [isPhone, stageWidth]);

  const popupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [powerUpPopups, setPowerUpPopups] = useState<Array<{
    id: string;
    text: string;
    lane: number;
    anim: Animated.Value;
  }>>([]);
  const baseNames = useRef([...BOT_DISPLAY_NAMES]).current;

  const spawnPowerUpPopup = useCallback(() => {
    if (!popupsEligible) return;

    setPowerUpPopups(prev => {
      const max = Math.max(0, Math.floor(onlineUsers));
      if (prev.length >= max) return prev;

      const activeLanes = new Set(prev.map(p => p.lane));
      const lanes = [0, 1, 2, 3, 4, 5];
      const free = lanes.filter(l => !activeLanes.has(l));
      const lane = (free.length ? free : lanes)[Math.floor(Math.random() * (free.length ? free.length : lanes.length))];

      const name = baseNames[Math.floor(Math.random() * baseNames.length)];
      const mult = Math.random() < 0.65 ? 2 : 3;
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const anim = new Animated.Value(0);

      const next = [
        ...prev,
        { id, text: `${name} activated ${mult}x taps`, lane, anim },
      ].slice(-max);

      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 280, useNativeDriver: true }),
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

    setPowerUpPopups(prev => prev.slice(-Math.max(0, Math.floor(onlineUsers))));

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
    const colors = flashColorsRef.current;
    setFlashColor(colors[Math.floor(Math.random() * colors.length)]);
    
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

    tapCountRef.current += 1;
    consecutiveRef.current += 1;
    const n = tapCountRef.current;

    setLastTapPosition({ x, y });
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
              backgroundColor: flashColor,
              opacity: flashAnim,
            },
          ]} 
          pointerEvents="none"
        />
        {(activePowerUp || currentEgg.isHappyHour) && (
          <PowerUpBackground activePowerUp={activePowerUp} isHappyHour={currentEgg.isHappyHour} />
        )}
        <TapFeedback tapCount={tapCount} consecutiveTaps={consecutiveTaps} lastTapPosition={lastTapPosition} tapMultiplier={activePowerUp?.multiplier || (currentEgg.isHappyHour ? 2 : 1)} />

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
        
        <View style={[styles.header, { paddingHorizontal: padH }]}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, width < 380 && styles.avatarSm]}>
              <Text style={[styles.avatarText, width < 380 && styles.avatarTextSm]}>{(user.name?.[0] || "👤").toUpperCase()}</Text>
            </View>
            <View style={styles.userInfoText}>
              <Text style={[styles.userName, width < 380 && styles.userNameSm]} numberOfLines={1}>
                 👋 {user.name || "Guest"}
              </Text>
              <View style={styles.rankRow}>
                <Crown size={width < 380 ? 10 : 12} color="#FFD700" />
                <Text style={[styles.rankText, width < 380 && styles.rankTextSm]} numberOfLines={1}>
                  {user?.stats?.rank || "Egg Novice"}
                </Text>
              </View>
            </View>
          </View>
          <OnlineUsers count={onlineUsers} />
        </View>

        <View style={[styles.navRow, { paddingHorizontal: padH, gap: navGap, marginBottom: width < 400 ? 10 : 16 }]}>
          <TouchableOpacity style={[styles.navBtn, width < 380 && styles.navBtnSm]} onPress={() => router.push("/leaderboard")}>
            <Trophy size={width < 380 ? 18 : 20} color="#FFD700" />
            <Text style={[styles.navText, width < 380 && styles.navTextSm]}>Rank</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, width < 380 && styles.navBtnSm]} onPress={() => router.push("/winners")}>
            <UsersIcon size={width < 380 ? 18 : 20} color="#4ECDC4" />
            <Text style={[styles.navText, width < 380 && styles.navTextSm]}>Winners</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, width < 380 && styles.navBtnSm]} onPress={() => router.push("/profile")}>
            <User size={width < 380 ? 18 : 20} color="#FF6B6B" />
            <Text style={[styles.navText, width < 380 && styles.navTextSm]}>Profile</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={[styles.scroll, isWideWeb && { alignItems: "center" }]} 
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.gameMainColumn, { maxWidth: contentMax, width: isWideWeb ? contentMax : "100%" }]}>
          {currentEgg && currentEgg.egg.type === 'normal' && (
            <>
              <View style={styles.prizeTypeBadge}>
                <Text style={styles.prizeTypeIcon}>{getPrizeIcon()}</Text>
                <Text style={styles.prizeTypeText}>
                  Win {currentEgg.prize.type === 'airtime' ? 'Airtime' : 
                       currentEgg.prize.type === 'coupon' ? 'Coupon' : 
                       currentEgg.prize.type === 'cash' ? 'Cash' : 'Prize'}
                </Text>
              </View>
              <View style={styles.prizeIndicatorContainer}>
                <PrizeIndicator 
                  prize={currentEgg.prize} 
                  eggType={currentEgg.egg.type} 
                />
              </View>
            </>
          )}

          {currentEgg && currentEgg.egg.type !== 'normal' && (
            <View style={styles.mysteryBadge}>
              <Text style={styles.prizeTypeIcon}>❓</Text>
              <Text style={styles.prizeTypeText}>Mystery Prize</Text>
            </View>
          )}

          {currentEgg && (
            <>
              <View style={[styles.eggStage, { width: stageWidth }]}>
                {powerUpPopups.length > 0 && (
                  <View pointerEvents="none" style={styles.powerUpPopupsLayer}>
                    {powerUpPopups.map(p => (
                      <Animated.View
                        key={p.id}
                        style={[
                          styles.powerUpPopup,
                          isPhone && styles.powerUpPopupCompact,
                          laneStyles[p.lane] ?? laneStyles[0],
                          {
                            opacity: p.anim,
                            transform: [
                              {
                                translateY: p.anim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [10, 0],
                                }),
                              },
                              {
                                scale: p.anim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.98, 1],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                      <Text numberOfLines={1} style={[styles.powerUpPopupText, isPhone && styles.powerUpPopupTextCompact]}>
                        {p.text}
                      </Text>
                      </Animated.View>
                    ))}
                  </View>
                )}

                <View style={styles.eggTopLayer}>
                  <Egg 
                    type={mainEgg.type} 
                    progress={progressPct} 
                    onTap={handleEggTap} 
                    isCracked={mainEgg.isCracked} 
                    isCooldown={mainEgg.isCooldown}
                    isLoser={testMode && testIsLoser}
                    testCrackLevel={testMode ? testCrackLevel : null}
                  />
                </View>
              </View>
            </>
          )}

          <View style={[styles.progressWrap, { paddingHorizontal: padH }]}>
  <ProgressBar 
    progress={progressPct} 
    othersActive={onlineUsers > 1}
    othersTapShare={currentEgg ? (otherPlayersTaps / currentEgg.totalTaps) * 100 : 0}
  />
  {progressPct > 0 && (
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
                🔥 {onlineUsers} Players Tapping Live
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

          <BengzFooter />
          </View>
        </ScrollView>
        {currentEgg?.isCooldown && 
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
          visible={showWinModal} 
          winner={currentWinner} 
          onClose={handleCloseWinModal} 
        />
        <LoseModal 
          visible={loseModalVisible} 
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, paddingBottom: 8, minHeight: 52 },
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
  navRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", flexWrap: "nowrap" },
  navBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.08)", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, flexShrink: 1 },
  navBtnSm: { paddingVertical: 6, paddingHorizontal: 10, gap: 4 },
  navText: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  navTextSm: { fontSize: 10 },
  scroll: { paddingBottom: 40 },
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
  eggStage: {
    alignSelf: "center",
    height: 360,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    overflow: "visible",
  },
  powerUpPopupsLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  eggTopLayer: {
    zIndex: 2,
  },
  powerUpPopup: {
    position: "absolute",
    maxWidth: 190,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  powerUpPopupCompact: {
    maxWidth: 148,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  powerUpPopupText: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: "rgba(255,255,255,0.92)",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  powerUpPopupTextCompact: {
    fontSize: 10,
    fontWeight: "700" as const,
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
  progressWrap: { width: "100%", marginTop: 6 },
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
