import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { applyCrackSoundEnabled } from "@/utils/sounds";
import {
  loadCrackSoundPreference,
  saveCrackSoundPreference,
} from "@/utils/crackSoundPreference";

type GameSettingsContextValue = {
  crackSoundEnabled: boolean;
  settingsLoaded: boolean;
  setCrackSoundEnabled: (enabled: boolean) => Promise<void>;
};

const GameSettingsContext = createContext<GameSettingsContextValue>({
  crackSoundEnabled: true,
  settingsLoaded: false,
  setCrackSoundEnabled: async () => {},
});

export function GameSettingsProvider({ children }: { children: ReactNode }) {
  const [crackSoundEnabled, setCrackSoundEnabledState] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    applyCrackSoundEnabled(crackSoundEnabled);
  }, [crackSoundEnabled]);

  useEffect(() => {
    let cancelled = false;

    loadCrackSoundPreference()
      .then((enabled) => {
        if (!cancelled) setCrackSoundEnabledState(enabled);
      })
      .finally(() => {
        if (!cancelled) setSettingsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setCrackSoundEnabled = useCallback(async (enabled: boolean) => {
    setCrackSoundEnabledState(enabled);
    applyCrackSoundEnabled(enabled);
    await saveCrackSoundPreference(enabled);
  }, []);

  return (
    <GameSettingsContext.Provider
      value={{ crackSoundEnabled, settingsLoaded, setCrackSoundEnabled }}
    >
      {children}
    </GameSettingsContext.Provider>
  );
}

export function useGameSettings() {
  return useContext(GameSettingsContext);
}
