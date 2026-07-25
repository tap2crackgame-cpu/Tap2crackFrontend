import { StyleSheet, View, Image, TouchableOpacity, Linking, Platform } from "react-native";
import React, { useCallback } from "react";

const SOCIAL_LINKS = [
  {
    key: "instagram",
    url: "https://www.instagram.com/tap2crackgame/",
    icon: require("@/assets/images/instagram.png"),
    label: "Instagram",
  },
  {
    key: "tiktok",
    url: "https://www.tiktok.com/@tap2crack",
    icon: require("@/assets/images/tiktok.png"),
    label: "TikTok",
  },
  {
    key: "x",
    url: "https://x.com/Tap2Crack_",
    icon: require("@/assets/images/twiter.png"),
    label: "X",
  },
] as const;

function SocialMediaLinks() {
  const openLink = useCallback(async (url: string) => {
    try {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.warn("Failed to open social link:", err);
    }
  }, []);

  return (
    <View style={styles.container}>
      {SOCIAL_LINKS.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.button}
          activeOpacity={0.8}
          accessibilityRole="link"
          accessibilityLabel={`Open Tap2Crack on ${item.label}`}
          onPress={() => openLink(item.url)}
        >
          <Image source={item.icon} style={styles.icon} resizeMode="contain" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default React.memo(SocialMediaLinks);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 18,
    paddingTop: 8,
    paddingBottom: 4,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 28,
    height: 28,
  },
});
