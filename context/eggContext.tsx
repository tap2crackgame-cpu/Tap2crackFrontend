import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import type { AllEggSessions, EggSession, EggType } from "@/types/game";
import { useSocket } from "@/hooks/SocketContext";


type EggContextType = {
  eggs: AllEggSessions;
  onlineUsers: number;
  selectedEggType: EggType;
  joinRoom: (type: EggType) => void;
  syncEggRoomState: () => void;
  showWinModal: boolean;
  showLoseModal: boolean;
  setShowWinModal: (value: boolean) => void;
  setShowLoseModal: (value: boolean) => void;
};

type Props = {
  children: React.ReactNode;
};

const EggContext = createContext<EggContextType | null>(null);

export function EggProvider({ children }: Props) {
  const socket = useSocket();

  const [eggs, setEggs] = useState<AllEggSessions>({});
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [selectedEggType, setSelectedEggType] =
    useState<EggType>("normal");
  const selectedEggTypeRef = useRef<EggType>("normal");

  const syncEggRoomState = useCallback(() => {
    if (!socket) return;
    socket.emit("join_egg_room", selectedEggTypeRef.current);
  }, [socket]);



  const joinRoom = useCallback((type: EggType) => {
  selectedEggTypeRef.current = type;
  setSelectedEggType(type);
}, []);



// -------------------------
  // COOLDOWN HANDLER (FIXED)
  // -------------------------
  const startFrontendCooldown = useCallback((type: EggType) => {
  const COOLDOWN_MS = 10000; 
  const endTime = Date.now() + COOLDOWN_MS;

  setEggs((prev) => {
    const targetType = type || selectedEggType;
    const egg = prev[targetType];
    
    if (!egg) {
      console.warn(`⚠️ No egg state found for ${targetType}`);
      return prev;
    }

    return {
      ...prev,
      [targetType]: {
        ...egg,
        isActive: false, 
        isCooldown: true,
        cooldownEndTime: endTime,
      },
    };
  });
}, [selectedEggType]); 


//---------------------------
// EGG CRACKED 
//---------------------------
  const onEggCracked = useCallback((data: any) => {
  const type = data.round?.egg_type || data.egg_type || selectedEggType;
  const roundData = data.round || data;
  const key = (roundData?.egg?.type || roundData?.egg_type || type) as EggType;

  if (key && roundData) {
    setEggs((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      const total = Number(roundData.totalTaps ?? existing.totalTaps ?? 0);
      return {
        ...prev,
        [key]: {
          ...existing,
          currentTaps: total,
          totalTaps: total || existing.totalTaps,
          isActive: false,
        },
      };
    });
  }

  setTimeout(() => {
    setShowWinModal(false);
    setShowLoseModal(false);
  }, 5000); 

}, [selectedEggType, setShowWinModal, setShowLoseModal]);


  //--------------------------
  // ROUND START
  //--------------------------
  const onRoundStart = (data: any) => {
  console.log("🚀 ROUND_START DATA:", data);
  const roundData = data.round || data; 
  const type = (
    roundData.egg_type || 
    roundData.type || 
    roundData.egg?.type || 
    roundData.egg?.eggType
  ) as EggType;

  if (!type) {
    console.error("❌ Round start failed: No egg type found in this object:", roundData);
    return;
  }
  const newEgg = normalizeEgg(roundData);
  setEggs(prev => ({
    ...prev,
    [type]: {
      ...newEgg,
      isActive: true,
      isCooldown: false,      
      cooldownEndTime: null,  
      currentTaps: 0,         
    }
  }));
  
  console.log(`✨ Successfully reset UI for ${type} egg.`);
};


useEffect(() => {
  selectedEggTypeRef.current = selectedEggType;
  if (!socket) return;

  console.log("🚪 Auto joining default:", selectedEggType);
  socket.emit("join_egg_room", selectedEggType);
}, [socket, selectedEggType]);

useEffect(() => {
  if (!socket) return;

  const refreshFromServer = () => {
    syncEggRoomState();
  };

  socket.io.on("reconnect", refreshFromServer);

  if (Platform.OS === "web" && typeof document !== "undefined") {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshFromServer();
      }
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        refreshFromServer();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refreshFromServer);
    window.addEventListener("pageshow", onPageShow as EventListener);

    return () => {
      socket.io.off("reconnect", refreshFromServer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refreshFromServer);
      window.removeEventListener("pageshow", onPageShow as EventListener);
    };
  }

  return () => {
    socket.io.off("reconnect", refreshFromServer);
  };
}, [socket, syncEggRoomState]);

  const onCooldownStarted = useCallback((data: { endsAt?: string | number | null }) => {
    const type = selectedEggTypeRef.current;
    const endsAt = data?.endsAt ? new Date(data.endsAt).getTime() : Date.now() + 10000;

    setEggs((prev) => {
      const egg = prev[type];
      if (!egg) return prev;
      return {
        ...prev,
        [type]: {
          ...egg,
          isActive: false,
          isCooldown: true,
          cooldownEndTime: endsAt,
          currentTaps: egg.totalTaps,
        },
      };
    });
  }, []);

  // -------------------------
  // NORMALIZE
  // -------------------------
  const normalizeEgg = useCallback((egg: any): EggSession => {
  if (!egg) return {} as EggSession;

  const now = Date.now();
  const cooldownEnd = egg.cooldownEndTime ?? egg.round?.cooldownEndsAt ?? null;
  
  const endTimestamp = cooldownEnd ? new Date(cooldownEnd).getTime() : 0;

  return {
    ...egg,
    cooldownEndTime: endTimestamp || null,
    isCooldown: endTimestamp > (now + 500), 
  };
}, []);


  /*========Handle Taps========*/
  // Progress is server-authoritative only (egg_update). No local currentTaps mutation.
  /*======SOCKET CONNECTION======*/
  useEffect(() => {
  if (!socket) return;

  console.log("🟡 CLIENT SOCKET READY");

  // -------------------------
  // BOOTSTRAP (ALL EGGS)
  // -------------------------
  const onBootstrap = (data: AllEggSessions) => {
  console.log("📦 BOOTSTRAP RAW:", data);

  const normalized: AllEggSessions = Object.fromEntries(
    Object.entries(data).map(([key, egg]) => [
      key,
      normalizeEgg(egg),
    ])
  ) as AllEggSessions;

  setEggs(normalized);
};

  // -------------------------
  // ROOM STATE (ON JOIN)
  // -------------------------
  const onRoomState = (data: { egg: EggSession }) => {
  console.log("🥚 ROOM STATE:", data);

  const egg = normalizeEgg(data.egg);

  const typeKey = egg.egg?.type || (egg as any).type;
  if (!typeKey) {
    console.warn("⚠️ Missing egg type in room state:", data);
    return;
  }

  setEggs(prev => ({
    ...prev,
    [typeKey]: egg,
  }));
};

  // -------------------------
  // LIVE UPDATES
  // -------------------------
   const onEggUpdate = (data: { egg: { type: EggType; currentTaps: number; totalTaps: number; roundId?: string; isActive?: boolean } & Record<string, unknown> }) => {
    const key = (data.egg.type || data.egg.egg?.type) as EggType;
    if (!key) return;

    setEggs(prev => {
      const existing = prev[key];
      if (!existing) return prev;

      const serverTaps = Number(data.egg.currentTaps);
      if (!Number.isFinite(serverTaps)) return prev;

      const serverTotal = data.egg.totalTaps ?? existing.totalTaps ?? 100;
      const serverRoundId = data.egg.roundId as string | undefined;
      const serverActive = data.egg.isActive ?? existing.isActive;
      const serverCooldown = data.egg.isCooldown ?? existing.isCooldown;
      const serverCooldownEnd = data.egg.cooldownEndTime ?? existing.cooldownEndTime;

      if (
        existing.currentTaps === serverTaps &&
        existing.totalTaps === serverTotal &&
        existing.roundId === serverRoundId &&
        existing.isActive === serverActive &&
        existing.isCooldown === serverCooldown &&
        existing.cooldownEndTime === serverCooldownEnd
      ) {
        return prev;
      }

      return {
        ...prev,
        [key]: {
          ...existing,
          currentTaps: serverTaps,
          totalTaps: serverTotal,
          isActive: serverActive,
          isCooldown: serverCooldown,
          cooldownEndTime: serverCooldownEnd,
          roundId: serverRoundId ?? existing.roundId,
        },
      };
    });
  };

  // -------------------------
  // PRESENCE
  // -------------------------
  const onPresence = (data: { count: number }) => {
    setOnlineUsers(Math.max(1, data.count));
  };

  // -------------------------
  // LISTENERS
  // -------------------------
   socket.on("eggs_bootstrap", onBootstrap);
   socket.on("egg_room_state", onRoomState);
   socket.on("egg_update",onEggUpdate);
   socket.on("presence_update", onPresence);
   socket.on("egg_cracked", onEggCracked);
   socket.on("round_start", onRoundStart);
   socket.on("cooldown_started", onCooldownStarted);


  return () => {
    socket.off("eggs_bootstrap", onBootstrap);
    socket.off("egg_room_state", onRoomState);
    socket.off("egg_update", onEggUpdate);
    socket.off("presence_update", onPresence);
    socket.off("egg_cracked", onEggCracked);
    socket.off("round_start", onRoundStart);
    socket.off("cooldown_started", onCooldownStarted);
  };
}, [socket, normalizeEgg, onEggCracked, onRoundStart, onCooldownStarted]);


  // -------------------------
  // COOLDOWN TIMER LOOP
  // -------------------------
  
useEffect(() => {
  const interval = setInterval(() => {
    setEggs((currentEggs) => {
      const now = Date.now();
      let needsUpdate = false;
      const next = { ...currentEggs };

      (Object.keys(next) as EggType[]).forEach((type) => {
        const egg = next[type];
        if (egg?.isCooldown && egg?.cooldownEndTime && now >= egg.cooldownEndTime + 500) {
          next[type] = {
            ...egg,
            isCooldown: false,
            cooldownEndTime: null,
          };
          needsUpdate = true;
          syncEggRoomState();
        }
      });

      return needsUpdate ? next : currentEggs;
    });
  }, 2000);

  return () => clearInterval(interval);
}, [syncEggRoomState]);


  const contextValue = useMemo(
    () => ({
      eggs,
      onlineUsers,
      selectedEggType,
      joinRoom,
      syncEggRoomState,
      showWinModal,
      showLoseModal,
      setShowWinModal,
      setShowLoseModal,
    }),
    [
      eggs,
      onlineUsers,
      selectedEggType,
      joinRoom,
      syncEggRoomState,
      showWinModal,
      showLoseModal,
    ]
  );

  return (
    <EggContext.Provider value={contextValue}>
      {children}
    </EggContext.Provider>
  );
}

export function useEgg() {
  const ctx = useContext(EggContext);
  if (!ctx) throw new Error("useEgg must be used inside EggProvider");
  return ctx;
};
export function useCurrentEgg() {
  const { eggs, selectedEggType } = useEgg();
  return eggs[selectedEggType];
};