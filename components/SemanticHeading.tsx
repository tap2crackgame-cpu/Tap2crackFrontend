import React from "react";
import { Platform, Text, TextProps, StyleSheet } from "react-native";

type Level = 1 | 2 | 3;

type Props = TextProps & {
  level: Level;
  children: React.ReactNode;
};

export default function SemanticHeading({ level, children, style, ...rest }: Props) {
  const flatStyle = StyleSheet.flatten([styles.base, style]);

  const a11yProps =
    Platform.OS === "web"
      ? ({ accessibilityRole: "header" as const, "aria-level": level } as const)
      : ({ accessibilityRole: "header" as const, accessibilityLevel: level } as const);

  return (
    <Text style={flatStyle} {...a11yProps} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    margin: 0,
    padding: 0,
  },
});
