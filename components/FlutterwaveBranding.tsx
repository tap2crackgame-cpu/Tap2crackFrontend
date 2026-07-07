import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const flutterLogo = require("@/assets/images/flutter.png");

type Props = {
  compact?: boolean;
};

export default function FlutterwaveBranding({ compact = false }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Image
        source={flutterLogo}
        style={compact ? styles.logoCompact : styles.logo}
        resizeMode="contain"
        accessibilityLabel="Flutterwave"
      />
      <Text style={[styles.label, compact && styles.labelCompact]}>
        Powered by Flutterwave
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  wrapCompact: {
    paddingTop: 10,
    marginTop: 4,
    gap: 4,
  },
  logo: {
    width: 70,
    height: 36,
  },
  logoCompact: {
    width: 76,
    height: 28,
  },
  label: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 8,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
  labelCompact: {
    fontSize: 11,
  },
});
