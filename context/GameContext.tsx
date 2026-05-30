import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
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
} from '@/types/game';
import { fetchWinners } from '@/services/fetchleaderboard';


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
  const { authUser} = useAuth();
  const  socket  = useSocket();
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
  const {
    startAds,
    isWatching,
    step: adStep,
    timeLeft: adTimeLeft,
    currentAd,
    currentDuration: adDuration,
    totalSteps: adTotalSteps,
    rewardGranted,
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
  const powerUpUsedRef = useRef(powerUpUsedThisRound);
  powerUpUsedRef.current = powerUpUsedThisRound;

  const otherPlayersTapsRef = useRef(0);
 
  const lastActivityUpdateRef = useRef(0);
  const eggCrackedLockRef = useRef(false);
 

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
  const { activatePowerUp, purchasePowerUp } = usePowerUp({
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
  }, []);

  const handleRoundStart = useCallback((data: { round: DbRound }) => {
    if (data?.round) {
     applyRoundToState(data.round);
    }
  }, [applyRoundToState]);


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
    if (egg.totalTaps > 0 && egg.currentTaps >= egg.totalTaps) {
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
    return;
  }

  if (!data.winner) {
    eggCrackedLockRef.current = true;
    setShowLoseModal(true);
    setShowWinModal(false);
    return;
  }

  const winner = normalizeWinner(data.winner as Record<string, unknown>);

  const isMe = 
    String(winner.user_id) === String(authUser?.id) || 
    String(winner.id) === String(authUser?.id) ||
    (winner.user_name === authUser?.name);
  setCurrentWinner(winner);
  eggCrackedLockRef.current = true;
  
  setWinners((prev) => {
    const withoutDup = prev.filter((w) => w.id !== winner.id);
    return [winner, ...withoutDup].slice(0, 10);
  });

  if (isMe) {
    setShowWinModal(true);
    setShowLoseModal(false);
  } else {
    setShowLoseModal(true);
    setShowWinModal(false); 
  }
}, [authUser, setShowWinModal, setShowLoseModal]); 

  /*========Socket Handlers========*/

  useEffect(() => {
    let cancelled = false;
    fetchWinners(10)
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) return;
        setWinners(rows.map((row) => normalizeWinner(row as Record<string, unknown>)));
      })
      .catch((err) => console.warn("Failed to load recent winners:", err));
    return () => {
      cancelled = true;
    };
  }, []);

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

  useEffect(() => {
    if (!currentEgg || currentEgg.totalTaps <= 0) return;

    const atFullProgress = currentEgg.currentTaps >= currentEgg.totalTaps;
    if (!atFullProgress) return;

    const finishedRound = !currentEgg.isActive || currentEgg.isCooldown;
    if (!finishedRound) {
      syncEggRoomState();
      return;
    }

    const timer = setTimeout(() => {
      if (eggCrackedLockRef.current || showWinModal || showLoseModal) return;
      setShowLoseModal(true);
      syncEggRoomState();
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    currentEgg?.currentTaps,
    currentEgg?.totalTaps,
    currentEgg?.isActive,
    currentEgg?.isCooldown,
    showWinModal,
    showLoseModal,
    syncEggRoomState,
  ]);
  

  return useMemo(() => ({
    currentEgg,
    winners,
    recentTaps,
    showWinModal,
    showLoseModal,
    currentWinner,
    showAd: isWatching,
    isWatchingAd: isWatching,
    adStep,
    adTimeLeft,
    adDuration,
    adCurrent: currentAd,
    adTotalSteps,
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
