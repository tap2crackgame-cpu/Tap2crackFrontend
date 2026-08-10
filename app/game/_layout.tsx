import { Stack } from "expo-router";
import SeoHead from "@/components/SeoHead";

export default function Tap2CrackGameLayout() {
  return (
    <>
      <SeoHead
        custom={{
          title: "Tap2Crack Game",
          description: "Play Tap2Crack and crack eggs in real time.",
          path: "/game",
          robots: "noindex, nofollow",
        }}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}
