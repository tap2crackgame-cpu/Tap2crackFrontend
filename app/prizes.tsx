import { useMemo, useState } from "react";
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from "react-native";
import { showAlertAsToast } from "@/context/ToastContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchUserPrizes } from "@/services/userPrizes";
import type { DbWinner } from "@/types/game";
import { getUserSettlementLabel, isPrizeSettled } from "@/types/game";

export default function PrizesPage() {
  const router = useRouter();
  const { authUser, token } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const userId = authUser?.id;

  const { data: wins = [], isLoading } = useQuery({
    queryKey: ["my-prizes", userId],
    queryFn: () => fetchUserPrizes(token as string),
    enabled: !!token && !!userId && !authUser?.isGuest,
    staleTime: 15000,
  });

  const grouped = useMemo(() => wins, [wins]);

  if (!authUser) return null;

  if (authUser.isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
          <View style={styles.center}>
            <Text style={styles.title}>Prizes</Text>
            <Text style={styles.guestText}>
              Guest users can’t view prize codes. Sign in with Google to unlock this feature.
            </Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const onCopy = async (w: DbWinner) => {
    const text =
      w.prize_code
        ? `${w.prize_code}`
        : `${w.prize_description} ${w.prize_value ? `(${w.prize_value})` : ""}`.trim();

    // Clipboard API differs by platform; keep it simple and user-friendly without adding deps.
    try {
      // @ts-expect-error - web clipboard
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        // @ts-expect-error - web clipboard
        await navigator.clipboard.writeText(text);
        setCopiedId(w.id);
        setTimeout(() => setCopiedId(null), 1200);
        return;
      }
    } catch {}

    showAlertAsToast(
      "Copy",
      "Copy is available on web. On mobile, long-press to select the code:\n\n" + text
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Your Prizes</Text>
          <Text style={styles.subtitle}>Tap a prize to copy its code (if available).</Text>

          {isLoading ? (
            <View style={styles.centerPad}>
              <ActivityIndicator color="#FFD700" size="large" />
              <Text style={styles.loadingText}>Loading prizes…</Text>
            </View>
          ) : grouped.length === 0 ? (
            <View style={styles.centerPad}>
              <Text style={styles.emptyEmoji}>🥚</Text>
              <Text style={styles.emptyTitle}>No prizes yet</Text>
              <Text style={styles.emptyText}>Crack some eggs and your winnings will show up here.</Text>
            </View>
          ) : (
            grouped.map(w => {
              const settled = isPrizeSettled(w.settlement_status);
              return (
              <TouchableOpacity key={w.id} style={styles.card} onPress={() => onCopy(w)}>
                <View style={styles.cardTop}>
                  <Text style={styles.prizeDesc}>{w.prize_description}</Text>
                  <View style={styles.cardTopRight}>
                    <View style={[
                      styles.settlementBadge,
                      settled ? styles.settlementBadgeSent : styles.settlementBadgePending,
                    ]}>
                      <Text style={[
                        styles.settlementBadgeText,
                        settled ? styles.settlementBadgeTextSent : styles.settlementBadgeTextPending,
                      ]}>
                        {getUserSettlementLabel(w.settlement_status)}
                      </Text>
                    </View>
                    <Text style={styles.when}>
                      {new Date(w.won_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                {!!w.company_name && (
                  <Text style={styles.company}>Company: {w.company_name}</Text>
                )}
                <View style={styles.row}>
                  <Text style={styles.meta}>
                    Type: <Text style={styles.metaStrong}>{w.prize_type}</Text>
                  </Text>
                  <Text style={styles.value}>₦{(w.prize_value || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.codeBox}>
                  <Text style={styles.codeLabel}>{w.prize_code ? "Code" : "Details"}</Text>
                  <Text style={styles.codeText}>{w.prize_code || w.prize_description}</Text>
                  <Text style={styles.copyHint}>
                    {copiedId === w.id ? "Copied" : "Tap to copy"}
                  </Text>
                </View>
              </TouchableOpacity>
            );})
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "bold" as const, color: "#FFF", marginBottom: 6 },
  subtitle: { fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 16 },
  loadingText: { marginTop: 10, color: "rgba(255,255,255,0.6)", fontSize: 12 },
  centerPad: { alignItems: "center", paddingVertical: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  guestText: { color: "rgba(255,255,255,0.65)", fontSize: 13, textAlign: "center", marginTop: 10, marginBottom: 18 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.1)", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 },
  backBtnText: { color: "#FFF", fontWeight: "600" as const },
  emptyEmoji: { fontSize: 44, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "800" as const, color: "#FFF" },
  emptyText: { fontSize: 12, color: "rgba(255,255,255,0.55)", textAlign: "center", marginTop: 6, maxWidth: 260 },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    marginBottom: 10,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 6 },
  cardTopRight: { alignItems: "flex-end", gap: 6 },
  prizeDesc: { flex: 1, color: "#FFD700", fontWeight: "700" as const, fontSize: 13 },
  when: { color: "rgba(255,255,255,0.45)", fontSize: 10 },
  settlementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  settlementBadgePending: {
    backgroundColor: "rgba(251,191,36,0.12)",
    borderColor: "rgba(251,191,36,0.35)",
  },
  settlementBadgeSent: {
    backgroundColor: "rgba(39,174,96,0.12)",
    borderColor: "rgba(39,174,96,0.35)",
  },
  settlementBadgeText: { fontSize: 10, fontWeight: "800" as const, textTransform: "uppercase", letterSpacing: 0.4 },
  settlementBadgeTextPending: { color: "#FBBF24" },
  settlementBadgeTextSent: { color: "#27AE60" },
  company: { color: "rgba(255,255,255,0.65)", fontSize: 11, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  meta: { color: "rgba(255,255,255,0.6)", fontSize: 11 },
  metaStrong: { color: "#FFF", fontWeight: "700" as const },
  value: { color: "#27AE60", fontWeight: "800" as const, fontSize: 12 },
  codeBox: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  codeLabel: { color: "rgba(255,255,255,0.55)", fontSize: 10, marginBottom: 6 },
  codeText: { color: "#FFF", fontSize: 14, fontWeight: "800" as const },
  copyHint: { color: "rgba(255,255,255,0.45)", fontSize: 10, marginTop: 8 },
});

