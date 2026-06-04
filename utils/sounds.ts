import { Audio } from "expo-av";

const SOUND_SOURCES = {
  couponWin: require("@/assets/sounds/sitcom-crowd-ooh_sRDaL7d.mp3"),
  paymentSuccess: require("@/assets/sounds/money-soundfx.mp3"),
  airtimeWin: require("@/assets/sounds/money-button.mp3"),
  eggCrack: require("@/assets/sounds/short-egg-cracking-soundbible.mp3"),
} as const;

export type GameSoundKey = keyof typeof SOUND_SOURCES;

/** Progress thresholds where crack sfx plays (never at 100% burst). */
export const CRACK_SOUND_MILESTONES = [
  25, 30, 45, 60, 65, 70, 75, 80, 85, 90, 95,
] as const;

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

/** Play crack sfx for each newly crossed progress milestone. */
export function playCrackMilestones(
  progressPct: number,
  played: Set<number>
) {
  if (progressPct >= 100) return;

  const triggered = CRACK_SOUND_MILESTONES.filter(
    (milestone) => progressPct >= milestone && !played.has(milestone)
  );

  triggered.forEach((milestone, index) => {
    played.add(milestone);
    setTimeout(() => {
      void playGameSound("eggCrack");
    }, index * 120);
  });
}
