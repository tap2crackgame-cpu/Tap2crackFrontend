
import { useEgg } from "@/context/eggContext";

export function useCurrentEggViewModel() {
  const { eggs, selectedEggType } = useEgg();

  const session = eggs?.[selectedEggType];

  if (!session) return null;

  const progress =
    session.totalTaps > 0
      ? (session.currentTaps / session.totalTaps) * 100
      : 0;

  return {
    type: session.egg.type,
    progress,
    isCooldown: !!session.isCooldown || (session.cooldownEndTime ?? 0) > Date.now(),
    isCracked: progress >= 100,
    designType: session.egg.type,
    cooldownEndTime: session.cooldownEndTime,
  };
}