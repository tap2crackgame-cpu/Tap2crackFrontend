import { useMemo } from "react";
import { useWindowDimensions, type ViewStyle } from "react-native";

/**
 * Shared responsive sizing for content pages.
 * - Phones: tighter side padding so cards aren't squashed.
 * - Tablets / desktop web: content is centred in a readable column instead of stretching edge to edge.
 */
export function useResponsive(maxContentWidth = 640) {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isSmallPhone = width < 360;
    const isPhone = width < 480;
    const isWide = width >= 900;
    const padH = isSmallPhone ? 14 : isPhone ? 16 : 24;

    /** Spread into a ScrollView's contentContainerStyle (after the page's own style). */
    const content: ViewStyle = {
      width: "100%",
      maxWidth: maxContentWidth + padH * 2,
      alignSelf: "center",
      paddingHorizontal: padH,
    };

    /** Scale a font size down slightly on very small phones, up a touch on wide screens. */
    const fs = (size: number) => Math.round(size * (isSmallPhone ? 0.9 : isWide ? 1.06 : 1));

    return { width, height, isSmallPhone, isPhone, isWide, padH, content, fs };
  }, [width, height, maxContentWidth]);
}
