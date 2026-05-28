import { useState } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { AUTH_API } from "@/utils/api";

export default function PhonePrompt() {
  const { token, refreshProfile, loginWithGuestToken, setAuthStatus } = useAuth();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cleaned = phone.replace(/\D/g, "");
  const canContinue = cleaned.length >= 10;

  const onContinue = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      if (token) {
        await fetch(`${AUTH_API}/update-phone`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ phone: cleaned }),
        });
        await refreshProfile();
      } else {
        const res = await fetch(`${AUTH_API}/create-guest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleaned }),
        });

        const data = await res.json();

        if (res.ok && data.token) {
          const ok = await loginWithGuestToken(data.token);
          if (!ok) {
            console.error("Guest profile fetch failed after registration");
          }
        } else {
          console.error("Guest creation failed:", data.error);
        }
      }
    } catch (err) {
      console.log("AUTH UPDATE ERROR:", err);
    } finally {
      setSubmitting(false);
    }
    // submit
  };

  const onSkip = () => {
    if (!token) {
      setAuthStatus("guest");
    } else {
      setAuthStatus("ready");
    }
  };


  return (
    <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.content}>
        <Text style={styles.title}>Tap2Crack</Text>
        <Text style={styles.subtitle}>Insert your phone number for EGG-cellent prizes.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Phone number</Text>

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+234 555 123 4567"
            placeholderTextColor="rgba(255,255,255,0.35)"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={onContinue}
            disabled={!canContinue || submitting}
            style={[
              styles.primaryBtn,
              (!canContinue || submitting) && styles.disabledBtn,
            ]}
          >
            <LinearGradient
              colors={["#FFD700", "#F39C12"]}
              style={styles.primaryGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#1a1a2e" />
              ) : (
                <Text style={styles.primaryText}>Continue</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onSkip} disabled={submitting}>
            <Text style={styles.secondaryText}>
            Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { width: "100%", paddingHorizontal: 30, alignItems: "center" },
  title: {
    fontSize: 42,
    fontWeight: "bold" as const,
    color: "#FFF",
    marginBottom: 8,
    textShadowColor: "rgba(255,215,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: { fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 24, textAlign: "center" },
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  label: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 8, fontWeight: "600" as const },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 14,
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 14,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  primaryBtn: { borderRadius: 16, overflow: "hidden" },
  primaryGradient: { paddingVertical: 16, paddingHorizontal: 32, alignItems: "center" },
  primaryText: { color: "#1a1a2e", fontSize: 16, fontWeight: "800" as const },
  secondaryBtn: { paddingVertical: 14, alignItems: "center" },
  secondaryText: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" as const },
  disabledBtn: { opacity: 0.6 },
});

