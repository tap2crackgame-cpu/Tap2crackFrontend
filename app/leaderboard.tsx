import { useCallback } from "react";
import { StyleSheet, View, Text, ScrollView, SafeAreaView, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Trophy, Crown, Medal, Egg } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { LeaderboardEntry } from "@/types/game";
import { fetchLeaderboard } from "@/services/fetchleaderboard";
import { EGG_RANKS } from "@/types/game";
import BengzFooter from "@/components/BengzFooter";
import { resolveUserStats, formatStat } from "@/utils/userStats";

export default function Tap2CrackLeaderboard() {
  const { authUser: user, token, refreshProfile } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (token) void refreshProfile(true);
    }, [token, refreshProfile])
  );
  const { data: leaderboard = [], isLoading, isError } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: () => fetchLeaderboard(50),
    staleTime: 120000,
    gcTime: 300000,
    refetchInterval: 90000,
  });

  const list = Array.isArray(leaderboard) ? leaderboard : [];
  const myId = user?.id != null ? String(user.id) : "";
  const userEntry = list.find((e) => String(e.userId) === myId);
  const userRank = userEntry?.rank ?? null;
  const profileStats = resolveUserStats(user);
  const weeklyCount = userEntry?.weeklyEggsCracked ?? profileStats.weeklyEggsCracked;
  const totalCount = userEntry?.eggsCracked ?? profileStats.eggsCracked;

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={20} color="#FFD700" />;
    if (rank === 2) return <Medal size={20} color="#C0C0C0" />;
    if (rank === 3) return <Medal size={20} color="#CD7F32" />;
    return <Text style={styles.rankNum}>#{rank}</Text>;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
        <View style={styles.header}>
          <Trophy size={32} color="#FFD700" />
          <Text style={styles.title}>Weekly Leaderboard</Text>
          <Text style={styles.subtitle}>Most eggs cracked</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {user && (
            <View style={styles.userBox}>
              <Text style={styles.userRankLabel}>
                Your Rank: {userRank ? `#${userRank}` : 'Unranked'}
              </Text>
              <View style={styles.statsFlex}>
                <View style={styles.statItem}>
                  <Egg size={20} color="#FFD700" />
                  <Text style={styles.statNum}>{formatStat(weeklyCount)}</Text>
                  <Text style={styles.statLabel}>Weekly</Text>
                </View>
                <View style={styles.statItem}>
                  <Trophy size={20} color="#4ECDC4" />
                  <Text style={styles.statNum}>{formatStat(totalCount)}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>
            </View>
          )}

          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </View>
          ) : isError ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Could not load leaderboard</Text>
              <Text style={styles.emptySubtitle}>Pull down to refresh or try again shortly.</Text>
            </View>
          ) : list.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🥚</Text>
              <Text style={styles.emptyTitle}>No crackers yet!</Text>
              <Text style={styles.emptySubtitle}>Be the first to crack an egg and top the leaderboard!</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {list.map((entry) => {
                const isMe = entry.userId === user?.id;
                return (
                  <View key={entry.userId} style={[styles.item, entry.rank <= 3 && styles.topItem, isMe && styles.currentUserItem]}>
                    <View style={styles.rankCol}>{rankIcon(entry.rank)}</View>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarTxt}>{(entry.userName || '?')[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.name}>
                        {entry.userName || 'Anonymous'}
                        {isMe ? ' (You)' : ''}
                      </Text>
                      <Text style={styles.eggs}>{entry.eggsCracked} eggs | {entry.wins} wins</Text>
                    </View>
                    <View style={styles.score}>
                      <Trophy size={14} color={entry.rank <= 3 ? "#FFD700" : "#888"} />
                      <Text style={[styles.scoreTxt, entry.rank <= 3 && { color: "#FFD700" }]}>{entry.eggsCracked}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.ranksBox}>
            <Text style={styles.ranksTitle}>Egg Ranks</Text>
            {EGG_RANKS.map((r, i) => (
              <View key={i} style={styles.rankRow}>
                <View style={[styles.dot, { backgroundColor: r.color }]} />
                <Text style={[styles.rankName, user?.stats?.rank === r.rank && { color: r.color, fontWeight: 'bold' as const }]}>{r.rank}</Text>
                <Text style={styles.rankReq}>{r.minWins}+ wins</Text>
              </View>
            ))}
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
  header: { alignItems: "center", paddingVertical: 20 },
  title: { fontSize: 24, fontWeight: "bold" as const, color: "#FFF", marginTop: 12 },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  content: { padding: 20, paddingBottom: 40 },
  userBox: { backgroundColor: "rgba(255,215,0,0.1)", borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "rgba(255,215,0,0.3)" },
  userRankLabel: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 12 },
  statsFlex: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "bold" as const, color: "#FFF", marginTop: 4 },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
  loadingWrap: { alignItems: "center", paddingVertical: 40 },
  loadingText: { color: "rgba(255,255,255,0.6)", marginTop: 12 },
  emptyWrap: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "bold" as const, color: "#FFF", marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center" },
  list: { gap: 8, marginBottom: 20 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", padding: 14, borderRadius: 12 },
  topItem: { backgroundColor: "rgba(255,215,0,0.1)", borderWidth: 1, borderColor: "rgba(255,215,0,0.2)" },
  currentUserItem: { borderWidth: 1, borderColor: "rgba(78,205,196,0.5)" },
  rankCol: { width: 36, alignItems: "center" },
  rankNum: { fontSize: 14, fontWeight: "bold" as const, color: "rgba(255,255,255,0.5)" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarTxt: { fontSize: 16, fontWeight: "bold" as const, color: "#FFF" },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600" as const, color: "#FFF" },
  eggs: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
  score: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  scoreTxt: { fontSize: 12, fontWeight: "bold" as const, color: "rgba(255,255,255,0.7)" },
  ranksBox: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16 },
  ranksTitle: { fontSize: 16, fontWeight: "bold" as const, color: "#FFF", marginBottom: 12 },
  rankRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  rankName: { flex: 1, fontSize: 14, color: "#FFF" },
  rankReq: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
});
