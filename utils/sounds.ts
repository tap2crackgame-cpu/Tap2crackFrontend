import { Audio } from "expo-av";

const SOUND_SOURCES = {
  couponWin: require("@/assets/sounds/sitcom-crowd-ooh_sRDaL7d.mp3"),
  paymentSuccess: require("@/assets/sounds/money-soundfx.mp3"),
  airtimeWin: require("@/assets/sounds/money-button.mp3"),
  eggCrack: require("@/assets/sounds/short-egg-cracking-soundbible.mp3"),
} as const;

export type GameSoundKey = keyof typeof SOUND_SOURCES;

let crackSoundEnabled = true;

export function applyCrackSoundEnabled(enabled: boolean) {
  crackSoundEnabled = enabled;
}

export function isCrackSoundEnabled() {
  return crackSoundEnabled;
}

/* ---------------- tap sound ----------------
 * A short, quiet eggshell "tick" (cut from the egg-crack recording) on every tap.
 * Sounds are loaded once into a small pool and replayed, so tapping fast never lags.
 * Follows the same on/off switch as the crack sound.
 */
const TAP_SOURCES = [
  require("@/assets/sounds/egg-tap-1.mp3"),
  require("@/assets/sounds/egg-tap-2.mp3"),
  require("@/assets/sounds/egg-tap-3.mp3"),
];
const TAP_COPIES_EACH = 2; // 6 players total -> overlapping taps don't cut each other off
const TAP_VOLUME = 0.35; // quiet on purpose
const TAP_MIN_GAP_MS = 55;

let tapPool: Audio.Sound[] = [];
let tapPoolLoading: Promise<void> | null = null;
let tapIndex = 0;
let lastTapSoundAt = 0;

export function preloadTapSounds(): Promise<void> {
  if (tapPool.length) return Promise.resolve();
  if (tapPoolLoading) return tapPoolLoading;
  tapPoolLoading = (async () => {
    try {
      await ensureAudioMode();
      const loaded: Audio.Sound[] = [];
      for (let c = 0; c < TAP_COPIES_EACH; c++) {
        for (const src of TAP_SOURCES) {
          const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: false, volume: TAP_VOLUME });
          loaded.push(sound);
        }
      }
      tapPool = loaded;
    } catch (e) {
      console.warn("Tap sounds failed to load:", e);
    } finally {
      tapPoolLoading = null;
    }
  })();
  return tapPoolLoading;
}

export function unloadTapSounds() {
  const pool = tapPool;
  tapPool = [];
  pool.forEach((s) => void s.unloadAsync().catch(() => {}));
}

/** Call on every egg tap. Cheap: throttled, and just replays an already-loaded sound. */
export function playTapSound() {
  if (!crackSoundEnabled) return;
  const now = Date.now();
  if (now - lastTapSoundAt < TAP_MIN_GAP_MS) return;
  lastTapSoundAt = now;
  if (!tapPool.length) {
    void preloadTapSounds();
    return;
  }
  // rotate through the variants so it doesn't sound like a machine gun
  const sound = tapPool[tapIndex % tapPool.length];
  tapIndex = (tapIndex + 1 + Math.floor(Math.random() * 2)) % tapPool.length;
  void sound.replayAsync().catch(() => {});
}

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
  if (key === "eggCrack" && !crackSoundEnabled) return;
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
  if (!crackSoundEnabled) return;
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
