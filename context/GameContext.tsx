import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { saveCachedProfile } from '@/utils/cache';
import type { UserStats } from '@/types/game';
import { useSocket } from '@/hooks/SocketContext';
import { useEgg } from './eggContext';
import { usePowerUp } from '@/hooks/usePowerUps';
import { useAds } from '@/hooks/adsHook';
import {
  EggSession,
  PowerUp,
  PowerUpType,
  User,
  Winner,
  GameState,
  DbRound,
  mergePowerUpInventory,
  buildPowerUpInventoryFromList,
  normalizeWinner,
  getUserRank,
} from '@/types/game';
import { resolveUserStats } from '@/utils/userStats';
import { fetchWinners } from '@/services/fetchleaderboard';
import { playGameSound, playCrackMilestones } from '@/utils/sounds';
import {
  loadCachedRecentWinners,
  mergeWinnersByRecency,
  saveCachedRecentWinners,
} from '@/utils/recentWinnersCache';


// Keep client limits close to backend limits for smoother tapping on mobile.
const TAP_LIMIT_PER_SEC = 45;
const MIN_TAP_INTERVAL = 18;
// Smaller batches = faster server sync so all clients share the same progress %
const TAP_BATCH_SIZE = 3;
const TAP_BATCH_INTERVAL = 35;

const [GameContextInternal, useGameInternal] = createContextHook(() => {
  const { 
    eggs, 
    selectedEggType, 
    showWinModal, 
    showLoseModal, 
    setShowWinModal, 
    setShowLoseModal,
    syncEggRoomState,
  } = useEgg();
  const { authUser, refreshProfile, setAuthUser } = useAuth();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const userId = authUser?.id;
  const currentEgg = eggs[selectedEggType];

  const [gameState, setGameState] = useState<GameState>({
   currentEgg: null,
   round: 0,
   isCooldown: false,
   cooldownEndTime: null,
  });
  const currentEggRef = useRef<EggSession | null>(null);
  const [inventory, setInventory] = useState<Record<PowerUpType, number>>({
    "2x": 0,
    "3x": 0,
    X2: 0,
    X3: 0,
  });
  const [activePowerUp, setActivePowerUp] = useState<PowerUp | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [pendingType, setPendingType] = useState<PowerUpType | null>(null);
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapHistoryRef = useRef<number[]>([]);
  const userRef = useRef<User | null>(null);
  const gameStateRef = useRef(gameState);
  const lastTapRef = useRef(0);
  const pendingTapsRef = useRef(0);
  const modalAutoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    startAds,
    isWatching,
    step: adStep,
    timeLeft: adTimeLeft,
    currentAd,
    currentDuration: adDuration,
    totalSteps: adTotalSteps,
    rewardGranted,
    rewardGrantedUI,
    dismissAdModal,
    isStartingAds,
    adTimerActive,
    adPhase,
  } = useAds();
  const socketRef = useRef(socket);


  const [winners, setWinners] = useState<Winner[]>([]);
  const [recentTaps, setRecentTaps] = useState<number>(0);
  const [currentWinner, setCurrentWinner] = useState<Winner | null>(null);
  
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [powerUpUsedThisRound, setPowerUpUsedThisRound] = useState(false);
  const [otherPlayersTaps, setOtherPlayersTaps] = useState(0);
  const [othersActivity, setOthersActivity] = useState(0);
  const [isSimulatingPlayers, setIsSimulatingPlayers] = useState(false);
  const winnersRef = useRef(winners);
  winnersRef.current = winners;

  const applyWinnersList = useCallback((list: Winner[]) => {
    const next = mergeWinnersByRecency(list).slice(0, 10);
    setWinners(next);
    void saveCachedRecentWinners(next);
  }, []);

  const loadWinnersFromApi = useCallback(async () => {
    try {
      const fromApi = await fetchWinners(50);
      setWinners((prev) => {
        const next = mergeWinnersByRecency(fromApi, prev).slice(0, 10);
        void saveCachedRecentWinners(next);
        return next;
      });
    } catch (err) {
      console.warn("Failed to load recent winners:", err);
    }
  }, []);
  const powerUpUsedRef = useRef(powerUpUsedThisRound);
  powerUpUsedRef.current = powerUpUsedThisRound;

  const otherPlayersTapsRef = useRef(0);
 
  const lastActivityUpdateRef = useRef(0);
  const eggCrackedLockRef = useRef(false);
  const crackSoundRoundRef = useRef<string | null>(null);
  const crackMilestonesPlayedRef = useRef<Set<number>>(new Set());
 

   useEffect(() => {
     socketRef.current = socket;
     userRef.current = authUser ?? null;
     currentEggRef.current = currentEgg ?? null;
     gameStateRef.current = gameState;
   }, [authUser, currentEgg, gameState, socket]);

   useEffect(() => {
     if (!authUser) return;
     const fromProfile = authUser.powerUpInventory;
     const fromList = buildPowerUpInventoryFromList(authUser.powerUps);
     setInventory(mergePowerUpInventory(fromProfile, fromList));
   }, [authUser?.id, authUser?.powerUpInventory, authUser?.powerUps]);


  /*========PowerUPS=======*/
  const { activatePowerUp, purchasePowerUp, activatingPowerUp } = usePowerUp({
    setInventory,
    setActivePowerUp,
    onNoInventory: (type) => {
    setPendingType(type);
    setShowPurchaseModal(true);
    },
  });


  /*========Watch Ads========*/
  const watchAdsFor2x = useCallback(() => {
    if (!currentEgg?.roundId) {
      return;
    }
    if (powerUpUsedRef.current || activePowerUp) {
      return;
    }
    startAds(currentEgg.roundId);
  }, [currentEgg, startAds, activePowerUp]);

  useEffect(() => {
    if (rewardGranted) {
      setPowerUpUsedThisRound(true);
    }
  }, [rewardGranted]);

  useEffect(() => {
    if (activePowerUp) {
      setPowerUpUsedThisRound(true);
    }
  }, [activePowerUp]);

 
  /*========Reset Finished Round And Nomarlize New Round=======*/
  const applyRoundToState = useCallback((db: DbRound) => {
    console.log("[GameUI] Cleaning up for Round:", db.round_number);
    setGameState(prev => ({
      ...prev,
      round: db.round_number,
      isCooldown: false,       
      cooldownEndTime: null,   
    }));

    setShowWinModal(false);
    setShowLoseModal(false);

    setActivePowerUp(null);
    setPowerUpUsedThisRound(false);
    setRecentTaps(0);
    setOtherPlayersTaps(0);
    setOthersActivity(0);
  
    otherPlayersTapsRef.current = 0;
    eggCrackedLockRef.current = false;
    crackSoundRoundRef.current = null;
    crackMilestonesPlayedRef.current = new Set();
  }, []);

  const handleRoundStart = useCallback((data: { round: DbRound }) => {
    crackSoundRoundRef.current = null;
    crackMilestonesPlayedRef.current = new Set();
    if (data?.round) {
     applyRoundToState(data.round);
    }
  }, [applyRoundToState]);

  useEffect(() => {
    if (!currentEgg?.roundId || currentEgg.isCooldown) return;
    if (currentEgg.isActive === false && currentEgg.currentTaps >= currentEgg.totalTaps) {
      return;
    }

    const total = Number(currentEgg.totalTaps ?? 0);
    const current = Number(currentEgg.currentTaps ?? 0);
    if (total <= 0 || current <= 0) return;

    if (crackSoundRoundRef.current !== currentEgg.roundId) {
      crackSoundRoundRef.current = currentEgg.roundId;
      crackMilestonesPlayedRef.current = new Set();
    }

    const progressPct = (current / total) * 100;
    if (progressPct >= 100) return;

    playCrackMilestones(progressPct, crackMilestonesPlayedRef.current);
  }, [
    currentEgg?.roundId,
    currentEgg?.currentTaps,
    currentEgg?.totalTaps,
    currentEgg?.isActive,
    currentEgg?.isCooldown,
  ]);


  /*=======REMOTE TAP (egg_update — eggContext already syncs progress)=======*/
  const handleRemoteEggUpdate = useCallback((data: {
    egg?: { lastTapsAdded?: number; lastTapperId?: string };
  }) => {
    const added = data?.egg?.lastTapsAdded;
    if (!added || added <= 0) return;

    const myId = userRef.current?.id;
    if (myId && data.egg?.lastTapperId && String(data.egg.lastTapperId) === String(myId)) {
      return;
    }

    otherPlayersTapsRef.current += added;

    const now = Date.now();
    if (now - lastActivityUpdateRef.current > 800) {
      lastActivityUpdateRef.current = now;
      setOthersActivity(Math.min(1, added / 10));
      setOtherPlayersTaps(otherPlayersTapsRef.current);
    }
  }, []);


  /*=======Validate Taps=======*/
  const isValidTap = () => {
    const now = Date.now();
    tapHistoryRef.current = tapHistoryRef.current.filter(t => now - t < 1000);
      if (tapHistoryRef.current.length >= TAP_LIMIT_PER_SEC) 
        return false;
      if (now - lastTapRef.current < MIN_TAP_INTERVAL) 
        return false;
     tapHistoryRef.current.push(now);
    lastTapRef.current = now;
   return true;
  };


  /*=======Batch Tap Engine=======*/
  const flushTapBatch = useCallback(() => {
    // FIX 1: Grab the taps and clear the reference counter IMMEDIATELY.
    // This blocks rapid, simultaneous clicks from double-flushing stale numbers.
    const tapsToSend = pendingTapsRef.current;
    if (tapsToSend <= 0) return;
    pendingTapsRef.current = 0; 

    const egg = currentEggRef.current;
    const activeSocket = socketRef.current;
    if (!activeSocket) {
        // Put the taps back since it failed to send
        pendingTapsRef.current += tapsToSend; 
        return;
    }
    
    if (!egg) {
        pendingTapsRef.current += tapsToSend;
        return;
    }

    activeSocket.emit("tap", {
       taps: tapsToSend,
       eggType: egg.egg.type,
       roundId: egg.roundId,
    });
}, []);


  /*=======Handle Tap========*/
const handleTap = useCallback(() => {
  const egg = currentEggRef.current;
  if (!egg || egg.isCooldown) return;

  if (!egg.isActive) {
    if (egg.totalTaps > 0 && egg.currentTaps >= egg.totalTaps && !egg.isCooldown) {
      syncEggRoomState();
    }
    return;
  }

  if (!isValidTap()) return;

  const multiplier = activePowerUp?.multiplier ?? 1;
  const remaining = Math.max(0, egg.totalTaps - egg.currentTaps);
  if (remaining <= 0) {
    syncEggRoomState();
    return;
  }

  const progressPct =
    egg.totalTaps > 0 ? (egg.currentTaps / egg.totalTaps) * 100 : 0;
  const nearEnd =
    progressPct >= 90 || remaining <= multiplier * TAP_BATCH_SIZE;

  pendingTapsRef.current += multiplier;

  if (nearEnd) {
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }
    flushTapBatch();
  } else {
    if (pendingTapsRef.current >= TAP_BATCH_SIZE) {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
        batchTimerRef.current = null;
      }
      flushTapBatch();
      return;
    }

    if (!batchTimerRef.current) {
      batchTimerRef.current = setTimeout(() => {
        batchTimerRef.current = null;
        flushTapBatch();
      }, TAP_BATCH_INTERVAL);
    }
  }
}, [activePowerUp, flushTapBatch, syncEggRoomState]);


const MODAL_AUTO_CLOSE_MS = 5000;

const scheduleModalAutoClose = useCallback(() => {
  if (modalAutoCloseRef.current) {
    clearTimeout(modalAutoCloseRef.current);
  }
  modalAutoCloseRef.current = setTimeout(() => {
    modalAutoCloseRef.current = null;
    setShowWinModal(false);
    setShowLoseModal(false);
  }, MODAL_AUTO_CLOSE_MS);
}, [setShowWinModal, setShowLoseModal]);

/*=======Handle Egg Cracked=======*/
const handleEggCracked = useCallback((data: {
  winner: Winner | null;
  antiStreakBlocked?: boolean;
  blockedTapperId?: string;
}) => {
  if (data.antiStreakBlocked) {
    eggCrackedLockRef.current = true;
    setShowWinModal(false);
    setShowLoseModal(true);
    scheduleModalAutoClose();
    return;
  }

  if (!data.winner) {
    eggCrackedLockRef.current = true;
    setShowLoseModal(true);
    setShowWinModal(false);
    scheduleModalAutoClose();
    return;
  }

  const winner = normalizeWinner(data.winner as Record<string, unknown>);

  const isMe = Boolean(
    authUser?.id && String(winner.user_id) === String(authUser.id)
  );
  setCurrentWinner(winner);
  eggCrackedLockRef.current = true;

  setWinners((prev) => {
    const next = mergeWinnersByRecency([winner], prev).slice(0, 10);
    void saveCachedRecentWinners(next);
    return next;
  });

  setTimeout(() => void loadWinnersFromApi(), 3000);

  if (isMe) {
    if (winner.prize_type === 'coupon') {
      void playGameSound('couponWin');
    } else if (winner.prize_type === 'airtime' || winner.prize_type === 'cash') {
      void playGameSound('airtimeWin');
    }

    setAuthUser((prev) => {
      if (!prev) return prev;
      const s = resolveUserStats(prev);
      const nextWins = s.wins + 1;
      const nextStats = {
        ...s,
        wins: nextWins,
        eggsCracked: s.eggsCracked + 1,
        weeklyEggsCracked: s.weeklyEggsCracked + 1,
        rank: getUserRank(nextWins),
      };
      const next = { ...prev, stats: nextStats };
      void saveCachedProfile(next);
      return next;
    });

    void refreshProfile(true);
    setTimeout(() => void refreshProfile(true), 2000);
    setTimeout(() => void refreshProfile(true), 5000);
    setShowWinModal(true);
    setShowLoseModal(false);
  } else {
    setShowLoseModal(true);
    setShowWinModal(false);
  }
  scheduleModalAutoClose();
}, [
  authUser,
  setAuthUser,
  setShowWinModal,
  setShowLoseModal,
  loadWinnersFromApi,
  refreshProfile,
  scheduleModalAutoClose,
]);

  useEffect(() => {
    return () => {
      if (modalAutoCloseRef.current) {
        clearTimeout(modalAutoCloseRef.current);
      }
    };
  }, []);

  /*========Recover stuck 100% round (no modal / no cooldown)========*/
  const stuckRecoveryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const egg = currentEgg;
    if (stuckRecoveryRef.current) {
      clearTimeout(stuckRecoveryRef.current);
      stuckRecoveryRef.current = null;
    }
    if (!egg || egg.isCooldown || !socket) return;

    const total = Number(egg.totalTaps ?? 0);
    const current = Number(egg.currentTaps ?? 0);
    const atFull = total > 0 && current >= total;
    if (!atFull) return;

    stuckRecoveryRef.current = setTimeout(() => {
      if (!eggCrackedLockRef.current) {
        console.warn("[Game] Round at 100% without crack — re-syncing room");
        syncEggRoomState();
      }
    }, 3500);

    return () => {
      if (stuckRecoveryRef.current) {
        clearTimeout(stuckRecoveryRef.current);
        stuckRecoveryRef.current = null;
      }
    };
  }, [
    currentEgg?.roundId,
    currentEgg?.currentTaps,
    currentEgg?.totalTaps,
    currentEgg?.isCooldown,
    socket,
    syncEggRoomState,
  ]);

  /*========Socket Handlers========*/

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await loadCachedRecentWinners();
      if (!cancelled && cached.length > 0) {
        applyWinnersList(cached);
      }
      try {
        const fromApi = await fetchWinners(50);
        if (!cancelled) {
          setWinners((prev) => {
            const next = mergeWinnersByRecency(fromApi, prev).slice(0, 10);
            void saveCachedRecentWinners(next);
            return next;
          });
        }
      } catch (err) {
        console.warn("Failed to load recent winners:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyWinnersList]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadWinnersFromApi();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadWinnersFromApi]);

  useEffect(() => {
    if (!socket) return;

    const onStatsUpdated = (payload: { stats?: UserStats }) => {
      if (!payload?.stats) return;
      setAuthUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, stats: payload.stats as UserStats };
        void saveCachedProfile(next);
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    };

    socket.on('stats_updated', onStatsUpdated);
    return () => {
      socket.off('stats_updated', onStatsUpdated);
    };
  }, [socket, setAuthUser, queryClient]);

  useEffect(() => {
  if (!socket) return;

  const handleTapRejected = (data: { reason?: string }) => {
    if (data?.reason === "STALE_ROUND") {
      pendingTapsRef.current = 0;
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
        batchTimerRef.current = null;
      }
      syncEggRoomState();
    }
  };

  socket.on("egg_update", handleRemoteEggUpdate);
  socket.on("egg_sync", applyRoundToState);
  socket.on("egg_cracked", handleEggCracked);
  socket.on("round_start", handleRoundStart);
  socket.on("tap_rejected", handleTapRejected);

  return () => {
    socket.off("egg_update", handleRemoteEggUpdate);
    socket.off("egg_sync", applyRoundToState);
    socket.off("egg_cracked", handleEggCracked);
    socket.off("round_start", handleRoundStart);
    socket.off("tap_rejected", handleTapRejected);
  };
}, [socket, handleRemoteEggUpdate, handleEggCracked, handleRoundStart, syncEggRoomState]);

  return useMemo(() => ({
    currentEgg,
    winners,
    recentTaps,
    showWinModal,
    showLoseModal,
    currentWinner,
    showAd: isWatching || rewardGrantedUI,
    isWatchingAd: isWatching || rewardGrantedUI,
    adStep,
    adTimeLeft,
    adDuration,
    adCurrent: currentAd,
    adTotalSteps,
    adRewardGrantedUI: rewardGrantedUI,
    dismissAdModal,
    isStartingAds,
    adTimerActive,
    adPhase,
    activatingPowerUp,
    isPaymentLoading,
    powerUpUsedThisRound,
    handleTap,
    inventory,
    activePowerUp,
    activatePowerUp,
    purchasePowerUp,
    showPurchaseModal,
    setShowPurchaseModal,
    pendingType,
    setShowWinModal,
    setShowLoseModal,
    otherPlayersTaps,
    othersActivity,
    isSimulatingPlayers,
    watchAdsFor2x,
  }), [
    currentEgg, 
    winners,
    recentTaps,
    showWinModal,
    showLoseModal,
    currentWinner,
    isWatching,
    rewardGrantedUI,
    dismissAdModal,
    isStartingAds,
    adTimerActive,
    adPhase,
    adStep,
    adTimeLeft,
    adDuration,
    currentAd,
    adTotalSteps,
    isPaymentLoading,
    powerUpUsedThisRound,
    handleTap,
    inventory,
    activePowerUp,
    activatePowerUp,
    purchasePowerUp,
    activatingPowerUp,
    showPurchaseModal,
    pendingType,
    otherPlayersTaps,
    othersActivity,
    isSimulatingPlayers,
    watchAdsFor2x
  ]);
});

export function GameProvider({ children }: { children: React.ReactNode }) {
  return (
    <GameContextInternal>
      {children}
    </GameContextInternal>
  );
}

export const useGame = useGameInternal;

export default GameProvider;
