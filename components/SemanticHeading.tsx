import React from "react";
import { Platform, Text, TextProps, StyleSheet } from "react-native";

type Level = 1 | 2 | 3;

type Props = TextProps & {
  level: Level;
  children: React.ReactNode;
};

export default function SemanticHeading({ level, children, style, ...rest }: Props) {
  const flatStyle = StyleSheet.flatten([styles.base, style]);

  if (Platform.OS === "web") {
    return React.createElement(`h${level}`, { style: flatStyle, ...rest }, children);
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
