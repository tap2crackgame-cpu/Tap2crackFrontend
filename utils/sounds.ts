import { Audio } from "expo-av";

const SOUND_SOURCES = {
  couponWin: require("@/assets/sounds/sitcom-crowd-ooh_sRDaL7d.mp3"),
  paymentSuccess: require("@/assets/sounds/money-soundfx.mp3"),
  airtimeWin: require("@/assets/sounds/money-button.mp3"),
  eggCrack: require("@/assets/sounds/short-egg-cracking-soundbible.mp3"),
} as const;

export type GameSoundKey = keyof typeof SOUND_SOURCES;

let audioModeReady = false;

async function ensureAudioMode() {
  if (audioModeReady) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    audioModeReady = true;
  } catch (e) {
    console.warn("Audio mode setup failed:", e);
  }
}

export async function playGameSound(key: GameSoundKey) {
  try {
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(SOUND_SOURCES[key], {
      shouldPlay: true,
      volume: 1,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void sound.unloadAsync();
      }
    });
  } catch (e) {
    console.warn(`Failed to play sound "${key}":`, e);
  }
}
