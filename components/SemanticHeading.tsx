import React from "react";
import { Platform, Text, TextProps, StyleSheet } from "react-native";

type Level = 1 | 2 | 3;

type Props = TextProps & {
  level: Level;
  children: React.ReactNode;
};

export default function SemanticHeading({ level, children, style, ...rest }: Props) {
  const flatStyle = StyleSheet.flatten([styles.base, style]);
  const webStyle =
    Platform.OS === "web"
      ? {
          ...(flatStyle as object),
          marginTop: 0,
          marginBottom: (flatStyle as { marginBottom?: number })?.marginBottom ?? 0,
          paddingTop: 0,
          paddingBottom: 0,
          display: "block",
          position: "relative",
          flexShrink: 0,
        }
      : flatStyle;

  if (Platform.OS === "web") {
    return React.createElement(`h${level}`, { style: webStyle, ...rest }, children);
  }

  return (
    <Text accessibilityRole="header" style={flatStyle} {...rest}>
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
