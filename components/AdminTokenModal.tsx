import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Shield } from "lucide-react-native";

type Props = {
  visible: boolean;
  email: string;
  setup: boolean;
  onSubmit: (adminToken: string) => Promise<void>;
  onCancel: () => void;
};

export default function AdminTokenModal({
  visible,
  email,
  setup,
  onSubmit,
  onCancel,
}: Props) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setToken("");
      setError(null);
      setSubmitting(false);
    }
  }, [visible]);

  const handleContinue = async () => {
    if (submitting) return;

    const trimmed = token.trim();
    if (trimmed.length < 8) {
      setError("Admin token must be at least 8 characters");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(trimmed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid token";
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.iconRow}>
            <Shield size={28} color="#FFD700" />
          </View>

          <Text style={s.title}>
            {setup ? "Create your admin token" : "Admin verification"}
          </Text>

          <Text style={s.subtitle}>
            {setup
              ? "You were added as an admin. Choose a personal token (min. 8 characters) for this email. You will need it every time you sign in."
              : "Enter your personal admin token for this account."}
          </Text>

          {email ? <Text style={s.email}>{email}</Text> : null}

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TextInput
            value={token}
            onChangeText={(value) => {
              setToken(value);
              if (error) setError(null);
            }}
            placeholder={setup ? "Choose your admin token" : "Enter admin token"}
            placeholderTextColor="rgba(255,255,255,0.35)"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={s.input}
            editable={!submitting}
          />

          <TouchableOpacity
            style={[s.continueBtn, submitting && s.disabledBtn]}
            onPress={handleContinue}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#1a1a2e" />
            ) : (
              <Text style={s.continueText}>Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={s.cancelBtn} onPress={onCancel} disabled={submitting}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.35)",
    padding: 22,
  },
  iconRow: { alignItems: "center", marginBottom: 12 },
  title: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  email: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },
  error: {
    color: "#FF6B6B",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    color: "#FFF",
    fontSize: 16,
    marginBottom: 14,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  continueBtn: {
    backgroundColor: "#FFD700",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  continueText: { color: "#1a1a2e", fontSize: 16, fontWeight: "800" },
  cancelBtn: { paddingVertical: 10, alignItems: "center" },
  cancelText: { color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: "600" },
  disabledBtn: { opacity: 0.7 },
});
