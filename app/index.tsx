// Tap2Crack - Application Entry Point
// Preserve ?code= from Google OAuth when redirecting to welcome

import { Redirect } from "expo-router";
import { Platform } from "react-native";

export default function Tap2CrackIndex() {
  let href = "/welcome";
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const search = window.location.search;
    if (search.includes("code=") || search.includes("error=")) {
      href = `/welcome${search}`;
    }
  }
  return <Redirect href={href} />;
}
