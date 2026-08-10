import { useWindowDimensions } from "react-native";

export type LandingTier = "xs" | "sm" | "md" | "lg" | "xl";

export function useLandingLayout() {
  const { width, height } = useWindowDimensions();

  const tier: LandingTier =
    width < 360 ? "xs" : width < 480 ? "sm" : width < 640 ? "md" : width < 900 ? "lg" : "xl";

  const isMobile = width < 640;
  const isVeryCompact = width < 360;
  const isCompactPhone = width < 480;
  const isWide = width >= 768;
  const lockEntryViewport = isMobile || height < 760;

  const pagePad = isVeryCompact ? 12 : isCompactPhone ? 14 : isMobile ? 16 : 20;
  const contentMax = Math.min(920, width);
  const gridInnerWidth = width - pagePad * 2;
  const gridGap = isMobile ? 8 : 12;

  const eggCols = width >= 768 ? 3 : 2;
  const prizeCols = width >= 640 ? 2 : 2;

  const eggCardWidthPct = eggCols === 3 ? "31.5%" : "48%";
  const prizeCardWidthPct = prizeCols === 2 ? "48%" : "100%";

  return {
    width,
    height,
    tier,
    isMobile,
    isVeryCompact,
    isCompactPhone,
    isWide,
    lockEntryViewport,
    pagePad,
    contentMax,
    gridInnerWidth,
    gridGap,
    eggCols,
    prizeCols,
    eggCardWidthPct,
    prizeCardWidthPct,
  };
}
