import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  message?: string;
};

export default function AuthLoadingScreen({ message = "Loading…" }: Props) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f3460"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.inner}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
  },
  inner: { alignItems: "center", zIndex: 1 },
  text: { color: "rgba(255,255,255,0.7)", marginTop: 12, fontSize: 14 },
});
