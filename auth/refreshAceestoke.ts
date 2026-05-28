import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUTH_API } from "@/utils/api";




export const refreshAccessToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    console.log("Stored Refresh Token exists:", !!refreshToken);

    if (!refreshToken) return null;

    const res = await fetch(`${AUTH_API}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      console.log("Refresh request failed with status:", res.status);
      return null;
    }

    const data = await res.json();
    console.log("New Access Token received:", !!data.accessToken);

    await AsyncStorage.setItem("token", data.accessToken);
    return data.accessToken;
  } catch (error) {
    console.log("Refresh function crashed:", error);
    return null;
  }
};