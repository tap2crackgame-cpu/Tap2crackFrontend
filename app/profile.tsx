import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Modal, Pressable, Platform, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { LogOut, Trophy, Egg, Crown, Award, Shield, Gift, ShieldCheck, FileText, Heart, Coffee, X, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { showAlertAsToast } from "@/context/ToastContext";
import { getRankColor, EGG_RANKS } from "@/types/game";
import BengzFooter from "@/components/BengzFooter";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import  userUserProfile  from "@/app/useProfile";
import { useUserPrizes } from "./usePrizes";
import { type DbWinner, getUserSettlementLabel, isPrizeSettled } from "@/types/game";
import { AUTH_API } from "@/utils/api";
import { resolveUserStats, formatStat } from "@/utils/userStats";
import { useGoogleAuth } from "@/hooks/googleLogin";

const PUNS = [
  "You're egg-straordinary!",
  "Shell yeah!",
  "Yolking amazing!",
  "Egg-cellent work!",
];

export default function Tap2CrackProfile() {
  const router = useRouter();
  const { authUser, setAuthUser, logout, token, refreshProfile, loginWithGuestToken } = useAuth();
  const { user } = userUserProfile();
  const { login: startGoogleSignIn, loading: googleLoading } = useGoogleAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [crackHistoryOpen, setCrackHistoryOpen] = useState(false);
  const { crackPrizes, crackPrizesLoading, refetch: refetchCrackPrizes } = useUserPrizes();
  const [phoneDraft, setPhoneDraft] = useState("");
const [phoneEditorOpen, setPhoneEditorOpen] = useState(false);
const [phoneSubmitting, setPhoneSubmitting] = useState(false);

  useEffect(() => {
    if (crackHistoryOpen) {
      void refetchCrackPrizes();
    }
  }, [crackHistoryOpen, refetchCrackPrizes]);

  const linkGuestWithGoogle = async () => {
    if (!authUser?.isGuest || googleLoading) return;
    try {
      if (authUser.phone) {
        await AsyncStorage.setItem("temp_phone", String(authUser.phone).replace(/\D/g, ""));
      }
      if (authUser.id) {
        await AsyncStorage.setItem("temp_guest_user_id", authUser.id);
      }
      startGoogleSignIn();
    } catch (err) {
      console.log("GOOGLE LINK ERROR:", err);
      showAlertAsToast("Google sign-in", "Could not start Google sign-in. Try again.");
    }
  };

  const doLogout = async () => {
    setLoggingOut(true);
    try{
      await logout();

      router.replace("/welcome");
    } catch (err) {
      console.log("LOGOUT ERROR", err);
    } finally {
      setLoggingOut(false);
    }
  };

  if (!user || !authUser) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color="#FFD700" size="large" />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const pun = PUNS[Math.floor(Math.random() * PUNS.length)];
  const stats = authUser?.stats ?? resolveUserStats(authUser);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.profile}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatar}>{user.name?.[0] || "\u{1F464}"}</Text>
              <View style={styles.crownBadge}>
                <Crown size={12} color="#FFD700" />
              </View>
            </View>
            <Text style={styles.name}>{user?.name || "Guest"}</Text>
            <Text style={styles.email}>{user.email || "Playing as guest"}</Text>
            <TouchableOpacity
              style={styles.phoneRow}
              onPress={() => {
                setPhoneDraft(user?.phone || "");
                setPhoneEditorOpen(true);
              }}
            >
              <Text style={styles.phoneLabel}>Phone:</Text>
              <Text style={styles.phoneValue}>
               {user?.phone && user.phone.trim() !== "" 
               ? user.phone 
               : "Tap to add phone number"}
              </Text>
            </TouchableOpacity>

            {user.isGuest && (
              <TouchableOpacity
                style={[styles.guestBanner, googleLoading && styles.disabledBtn]}
                onPress={linkGuestWithGoogle}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#FFD700" size="small" />
                ) : (
                  <Text style={styles.guestText}>
                    Guest account — tap here to sign in with Google and save progress
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <View style={[styles.rankBadge, { borderColor: getRankColor(stats.rank) }]}>
              <Award size={14} color={getRankColor(stats.rank)} />
              <Text style={[styles.rankText, { color: getRankColor(stats.rank) }]}>{stats.rank || "Egg Novice"}</Text>
            </View>
            <Text style={styles.pun}>{pun}</Text>

            {user.isAdmin && (
              <TouchableOpacity style={styles.adminBtn} onPress={() => router.push("/egglookup")}>
                <Egg size={16} color="#FFD700" />
                <Text style={styles.adminBtnText}>Egg Lookup</Text>
              </TouchableOpacity>
            )}

            {!user.isGuest && (
              <TouchableOpacity style={styles.prizesBtn} onPress={() => router.push("/prizes" as any)}>
                <Gift size={16} color="#FFD700" />
                <Text style={styles.prizesBtnText}>My Prizes</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Stats</Text>
            <View style={styles.statsGrid}>
              {!user.isGuest ? (
                <TouchableOpacity
                  style={[styles.statCard, styles.statCardTappable]}
                  onPress={() => setCrackHistoryOpen(true)}
                  activeOpacity={0.85}
                >
                  <Egg size={20} color="#FFD700" />
                  <Text style={styles.statVal}>{formatStat(stats.eggsCracked)}</Text>
                  <Text style={styles.statLbl}>Cracked</Text>
                  <Text style={styles.statHint}>Tap for prizes</Text>
                  <ChevronRight size={14} color="rgba(255,215,0,0.5)" style={styles.statChevron} />
                </TouchableOpacity>
              ) : (
                <View style={styles.statCard}>
                  <Egg size={20} color="#FFD700" />
                  <Text style={styles.statVal}>{formatStat(stats.eggsCracked)}</Text>
                  <Text style={styles.statLbl}>Cracked</Text>
                </View>
              )}
              <View style={styles.statCard}>
                <Trophy size={20} color="#FF6B6B" />
                <Text style={styles.statVal}>{formatStat(stats.wins)}</Text>
                <Text style={styles.statLbl}>Wins</Text>
              </View>
              <View style={styles.statCard}>
                <Trophy size={20} color="#4ECDC4" />
                <Text style={styles.statVal}>{formatStat(stats.weeklyEggsCracked)}</Text>
                <Text style={styles.statLbl}>Weekly</Text>
              </View>
            </View>
          </View>

          <Modal visible={crackHistoryOpen} animationType="slide" transparent onRequestClose={() => setCrackHistoryOpen(false)}>
            <View style={styles.modalBackdrop}>
              <Pressable style={styles.modalBackdrop} onPress={() => setCrackHistoryOpen(false)} />
              <View style={styles.modalSheet}>
                <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.modalGradient}>
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={styles.modalTitle}>Crack winnings</Text>
                      <Text style={styles.modalSubtitle}>Prizes from eggs you cracked</Text>
                    </View>
                    <TouchableOpacity onPress={() => setCrackHistoryOpen(false)} hitSlop={12}>
                      <X size={24} color="rgba(255,255,255,0.85)" />
                    </TouchableOpacity>
                  </View>

                  {crackPrizesLoading ? (
                    <View style={styles.modalLoading}>
                      <ActivityIndicator color="#FFD700" size="large" />
                      <Text style={styles.modalLoadingText}>Loading your prizes…</Text>
                    </View>
                  ) : crackPrizes.length === 0 ? (
                    <View style={styles.modalEmpty}>
                      <Text style={styles.modalEmptyEmoji}>🥚</Text>
                      <Text style={styles.modalEmptyTitle}>No recorded prizes yet</Text>
                      <Text style={styles.modalEmptyText}>
                        Wins you earn while signed in will appear here. Keep cracking!
                      </Text>
                    </View>
                  ) : (
                    <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalListContent}>
                      {crackPrizes.map((w: DbWinner) => {
                        const settled = isPrizeSettled(w.settlement_status);
                        return (
                        <View key={w.id} style={styles.prizeRow}>
                          <View style={styles.prizeRowTop}>
                            <View style={styles.prizeRowMain}>
                              <Text style={styles.prizeDesc}>
                                {w.prize_type === "coupon" && w.company_name
                                  ? w.company_name
                                  : w.prize_description}
                              </Text>
                              {w.prize_type === "coupon" && (
                                <Text style={styles.prizeSubDesc}>{w.prize_description}</Text>
                              )}
                              <Text style={styles.prizeWhen}>{new Date(w.won_at).toLocaleString()}</Text>
                            </View>
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
                          </View>
                          <View style={styles.prizeRowMeta}>
                            <Text style={styles.prizeEggType}>{w.egg_type} egg</Text>
                            <Text style={styles.prizeValue}>₦{(w.prize_value || 0).toLocaleString()}</Text>
                          </View>
                          {w.company_name ? <Text style={styles.prizeCompany}>{w.company_name}</Text> : null}
                          {w.prize_code ? (
                            <Text style={styles.prizeCode} numberOfLines={2}>
                              Code: {w.prize_code}
                            </Text>
                          ) : null}
                        </View>
                      );})}
                    </ScrollView>
                  )}

                  <TouchableOpacity
                    style={styles.modalFooterBtn}
                    onPress={() => {
                      setCrackHistoryOpen(false);
                      router.push("/prizes" as any);
                    }}
                  >
                    <Gift size={18} color="#1a1a2e" />
                    <Text style={styles.modalFooterBtnText}>Open My Prizes (copy codes)</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </Modal>

          <Modal
            visible={phoneEditorOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setPhoneEditorOpen(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.phoneModal}>
                <Text style={styles.phoneModalTitle}>Update Phone Number</Text>
                <TextInput
                  value={phoneDraft}
                  onChangeText={setPhoneDraft}
                  placeholder="e.g. 08012345678"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  keyboardType="phone-pad"
                  style={styles.phoneInput}
                />
                <View style={styles.phoneModalActions}>
                  <TouchableOpacity style={styles.phoneCancelBtn} onPress={() => setPhoneEditorOpen(false)}>
                    <Text style={styles.phoneCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                   style={[styles.phoneSaveBtn, phoneSubmitting && { opacity: 0.6 }]}
                    disabled={phoneSubmitting}
                     onPress={async () => {
                       if (!authUser || phoneSubmitting) return;

                      const cleaned = phoneDraft.replace(/\D/g, "");
                     if (cleaned.length < 10) {
                        showAlertAsToast("Error", "Please enter a valid phone number.");
                       return;
                     }

                    setPhoneSubmitting(true);
                    try {
                   if (token) {
                   const res = await fetch(`${AUTH_API}/update-phone`, {
                   method: "POST",
                  headers: {
                  "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                 },
               body: JSON.stringify({ phone: cleaned }),
                });

              if (res.ok) {
             setAuthUser({ ...authUser, phone: cleaned });
           await refreshProfile(true); 
          setPhoneEditorOpen(false);
        } else {
          const data = await res.json();
          showAlertAsToast("Error", data.error || "Failed to update phone number");
        }

      // 2. If user is currently an un-registered Guest setup
      } else {
        const res = await fetch(`${AUTH_API}/create-guest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleaned }),
        });

        const data = await res.json();

        if (res.ok && data.token) {
          const ok = await loginWithGuestToken(data.token);
          if (ok) {
            setPhoneEditorOpen(false);
          } else {
            showAlertAsToast(
              "Error",
              "Account created but profile could not be loaded. Please try again."
            );
          }
        } else {
          showAlertAsToast("Error", data.error || "Failed to link guest phone number");
        }
      }
    } catch (err) {
      console.log("PROFILE PHONE UPDATE ERROR:", err);
      showAlertAsToast("Error", "An error occurred. Please try again.");
    } finally {
      setPhoneSubmitting(false);
    }
  }}
>
  {phoneSubmitting ? (
    <ActivityIndicator size="small" color="#fff" />
  ) : (
    <Text style={styles.phoneSaveText}>Save</Text>
  )}
</TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Total Taps</Text>
            <View style={styles.tapsCard}>
              <Text style={styles.tapsValue}>{stats.totalTaps.toLocaleString()}</Text>
              <Text style={styles.tapsLabel}>lifetime taps</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Egg Ranks</Text>
            <View style={styles.ranksCard}>
              {EGG_RANKS.map((r, i) => (
                <View key={i} style={[styles.rankRow, user?.stats?.rank === r.rank && styles.activeRankRow]}>
                  <View style={[styles.rankDot, { backgroundColor: r.color }]} />
                  <Text style={[styles.rankName, user?.stats?.rank === r.rank && { color: r.color, fontWeight: 'bold' as const }]}>{r.rank}</Text>
                  <Text style={styles.rankReq}>{r.minWins}+ wins</Text>
                  {user?.stats?.rank === r.rank && <Text style={styles.currentBadge}>YOU</Text>}
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.logout, loggingOut && styles.disabledBtn]}
            onPress={doLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator color="#FF6B6B" size="small" />
            ) : (
              <>
                <LogOut size={18} color="#FF6B6B" />
                <Text style={styles.logoutText}>Sign Out</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footerLinks}>
            <TouchableOpacity style={styles.footerBtn} onPress={() => router.push("/privacy-policy" as any)}>
              <ShieldCheck size={15} color="rgba(255,255,255,0.45)" />
              <Text style={styles.footerBtnText}>Privacy Policy</Text>
            </TouchableOpacity>
            <View style={styles.footerDivider} />
            <TouchableOpacity style={styles.footerBtn} onPress={() => router.push("/terms" as any)}>
              <FileText size={15} color="rgba(255,255,255,0.45)" />
              <Text style={styles.footerBtnText}>Terms & Conditions</Text>
            </TouchableOpacity>
            <View style={styles.footerDivider} />
            <TouchableOpacity style={styles.footerBtn} onPress={() => router.push("/sponsor" as any)}>
              <Heart size={15} color="#FF6B6B" />
              <Text style={[styles.footerBtnText, { color: "#FF6B6B" }]}>Be a Sponsor</Text>
            </TouchableOpacity>
            <View style={styles.footerDivider} />
            <TouchableOpacity style={styles.footerBtn} onPress={() => router.push("/buy-coffee" as any)}>
              <Coffee size={15} color="#FBBF24" />
              <Text style={[styles.footerBtnText, { color: "#FBBF24" }]}>Buy Us a Coffee</Text>
            </TouchableOpacity>
          </View>

          <BengzFooter />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  profile: { alignItems: "center", paddingVertical: 30 },
  avatarWrap: { position: "relative", marginBottom: 16 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,215,0,0.2)", textAlign: "center", lineHeight: 90, fontSize: 36, fontWeight: "bold" as const, color: "#FFD700", borderWidth: 3, borderColor: "#FFD700", overflow: "hidden" },
  crownBadge: { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: "#FFD700", justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#1a1a2e" },
  name: { fontSize: 22, fontWeight: "bold" as const, color: "#FFF", marginBottom: 4 },
  email: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 12 },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  phoneLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  phoneValue: { fontSize: 12, color: "#FFD700", fontWeight: "700" as const },
  guestBanner: {
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.35)",
    width: "100%",
    alignItems: "center",
  },
  guestText: { color: "#FFD700", fontSize: 12, textAlign: "center" },
  rankBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginBottom: 10 },
  rankText: { fontSize: 13, fontWeight: "bold" as const },
  pun: { fontSize: 13, color: "#FFD700", fontStyle: "italic" },
  adminBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,215,0,0.12)", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: "rgba(255,215,0,0.35)" },
  adminBtnText: { color: "#FFD700", fontWeight: "600" as const, fontSize: 14 },
  prizesBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,215,0,0.15)", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: "rgba(255,215,0,0.35)" },
  prizesBtnText: { color: "#FFD700", fontWeight: "700" as const, fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "bold" as const, color: "#FFF", marginBottom: 12 },
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 16, alignItems: "center" },
  statCardTappable: {
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.25)",
    backgroundColor: "rgba(255,215,0,0.08)",
  },
  statVal: { fontSize: 20, fontWeight: "bold" as const, color: "#FFF", marginTop: 8, marginBottom: 2 },
  statLbl: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  statHint: { fontSize: 9, color: "rgba(255,215,0,0.75)", marginTop: 4, fontWeight: "600" as const },
  statChevron: { position: "absolute", top: 10, right: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
  },
  modalSheet: {
    maxHeight: "88%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  modalGradient: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "800" as const, color: "#FFF" },
  modalSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4 },
  modalLoading: { alignItems: "center", paddingVertical: 48 },
  modalLoadingText: { color: "rgba(255,255,255,0.65)", marginTop: 12, fontSize: 14 },
  phoneModal: {
    backgroundColor: "#1f2542",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    padding: 16,
    margin: 24,
  },
  phoneModalTitle: { color: "#FFF", fontSize: 16, fontWeight: "700" as const, marginBottom: 10 },
  phoneInput: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "web" ? 10 : 8,
    color: "#FFF",
    marginBottom: 12,
  },
  phoneModalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  phoneCancelBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  phoneCancelText: { color: "rgba(255,255,255,0.7)" },
  phoneSaveBtn: {
    backgroundColor: "#FFD700",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  phoneSaveText: { color: "#1a1a2e", fontWeight: "700" as const },
  modalEmpty: { alignItems: "center", paddingVertical: 36, paddingHorizontal: 12 },
  modalEmptyEmoji: { fontSize: 44, marginBottom: 12 },
  modalEmptyTitle: { fontSize: 17, fontWeight: "700" as const, color: "#FFF", marginBottom: 8 },
  modalEmptyText: { fontSize: 13, color: "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: 20 },
  modalList: { maxHeight: 340 },
  modalListContent: { paddingBottom: 12 },
  prizeRow: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  prizeRowTop: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  prizeRowMain: { flex: 1 },
  prizeDesc: { fontSize: 15, fontWeight: "700" as const, color: "#FFF", marginBottom: 4 },
  prizeSubDesc: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 4 },
  prizeWhen: { fontSize: 11, color: "rgba(255,255,255,0.45)" },
  settlementBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
  prizeRowMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  prizeEggType: { fontSize: 12, color: "rgba(255,215,0,0.85)", textTransform: "capitalize" },
  prizeValue: { fontSize: 13, fontWeight: "700" as const, color: "#4ECDC4" },
  prizeCompany: { fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 6 },
  prizeCode: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 8, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) },
  modalFooterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  modalFooterBtnText: { fontSize: 15, fontWeight: "800" as const, color: "#1a1a2e" },
  tapsCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 20, alignItems: "center" },
  tapsValue: { fontSize: 28, fontWeight: "bold" as const, color: "#FFD700" },
  tapsLabel: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 },
  ranksCard: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16 },
  rankRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  activeRankRow: { backgroundColor: "rgba(255,215,0,0.1)", borderRadius: 8, paddingHorizontal: 8, marginHorizontal: -8 },
  rankDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  rankName: { flex: 1, fontSize: 14, color: "#FFF" },
  rankReq: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  currentBadge: { fontSize: 10, fontWeight: "bold" as const, color: "#FFD700", backgroundColor: "rgba(255,215,0,0.2)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(255,107,107,0.1)", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,107,107,0.3)" },
  logoutText: { color: "#FF6B6B", fontSize: 15, fontWeight: "600" as const },
  disabledBtn: { opacity: 0.6 },
  footerLinks: { alignItems: "center", marginTop: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  footerBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10 },
  footerBtnText: { fontSize: 13, color: "rgba(255,255,255,0.45)" },
  footerDivider: { width: 40, height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 2 },
});
