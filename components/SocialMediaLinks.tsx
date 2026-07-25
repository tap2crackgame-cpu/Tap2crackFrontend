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

const BUTTON_SIZE = 28;

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
          activeOpacity={0.75}
          accessibilityRole="link"
          accessibilityLabel={`Open Tap2Crack on ${item.label}`}
          onPress={() => openLink(item.url)}
        >
          <Image source={item.icon} style={styles.icon} resizeMode="cover" />
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
    gap: 12,
    paddingTop: 12,
    paddingBottom: 16,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    overflow: "hidden",
  },
  icon: {
    width: "100%",
    height: "100%",
  },
});
