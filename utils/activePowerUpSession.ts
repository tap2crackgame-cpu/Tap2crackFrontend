import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PowerUpType } from "@/types/game";

const SESSION_KEY = "tap2crack_active_powerup_v1";

export type ActivePowerUpSession = {
  userId: string;
  roundId: string;
  type: PowerUpType;
  multiplier: number;
};

export async function loadActivePowerUpSession(
  userId: string,
  roundId: string
): Promise<ActivePowerUpSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActivePowerUpSession;
    if (parsed.userId !== userId || parsed.roundId !== roundId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveActivePowerUpSession(session: ActivePowerUpSession): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // non-fatal
  }
}

export async function clearActivePowerUpSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {
    // non-fatal
  }
}
