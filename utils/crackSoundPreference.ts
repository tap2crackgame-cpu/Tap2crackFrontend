import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "tap2crack_crack_sound_enabled_v1";

export async function loadCrackSoundPreference(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw == null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

export async function saveCrackSoundPreference(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
}
