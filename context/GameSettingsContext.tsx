import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSocket } from "@/hooks/SocketContext";
import { AUTH_API } from "@/utils/api";
import { applyCrackSoundEnabled } from "@/utils/sounds";

type GameSettingsContextValue = {
  crackSoundEnabled: boolean;
  settingsLoaded: boolean;
};

const GameSettingsContext = createContext<GameSettingsContextValue>({
  crackSoundEnabled: true,
  settingsLoaded: false,
});

export function GameSettingsProvider({ children }: { children: ReactNode }) {
  const socket = useSocket();
  const [crackSoundEnabled, setCrackSoundEnabled] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    applyCrackSoundEnabled(crackSoundEnabled);
  }, [crackSoundEnabled]);

  useEffect(() => {
    let cancelled = false;

    fetch(`${AUTH_API}/settings/public`)
      .then((res) => res.json().catch(() => ({})))
      .then((json) => {
        if (cancelled) return;
        if (typeof json?.settings?.crackSoundEnabled === "boolean") {
          setCrackSoundEnabled(json.settings.crackSoundEnabled);
        }
        setSettingsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setSettingsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const applySettings = (payload: { crackSoundEnabled?: boolean }) => {
      if (typeof payload?.crackSoundEnabled === "boolean") {
        setCrackSoundEnabled(payload.crackSoundEnabled);
      }
    };

    socket.on("game_settings", applySettings);
    socket.on("game_settings_updated", applySettings);

    return () => {
      socket.off("game_settings", applySettings);
      socket.off("game_settings_updated", applySettings);
    };
  }, [socket]);

  return (
    <GameSettingsContext.Provider value={{ crackSoundEnabled, settingsLoaded }}>
      {children}
    </GameSettingsContext.Provider>
  );
}

export function useGameSettings() {
  return useContext(GameSettingsContext);
}
