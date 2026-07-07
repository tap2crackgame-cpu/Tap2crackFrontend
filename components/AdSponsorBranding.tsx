import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type Props = {
  companyName?: string | null;
  companyLogoUrl?: string | null;
  compact?: boolean;
};

export default function AdSponsorBranding({
  companyName,
  companyLogoUrl,
  compact = false,
}: Props) {
  const name = companyName?.trim();
  if (!name && !companyLogoUrl?.trim()) return null;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {!!companyLogoUrl?.trim() && (
        <Image
          source={{ uri: companyLogoUrl.trim() }}
          style={compact ? styles.logoCompact : styles.logo}
          resizeMode="contain"
          accessibilityLabel={name || "Company logo"}
        />
      )}
      <Text style={[styles.label, compact && styles.labelCompact]}>
        Powered by {name || "Sponsor"}
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
    paddingTop: 8,
    marginTop: 2,
    gap: 6,
    width: "100%",
    borderTopWidth: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  logoCompact: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  label: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  labelCompact: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "rgba(255,255,255,0.9)",
  },
});
