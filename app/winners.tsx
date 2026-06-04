import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, Share, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Trophy, Share2, Sparkles } from "lucide-react-native";
import BengzFooter from "@/components/BengzFooter";
import { useWinnersQuery } from "@/hooks/useWinnersQuery";
import { Winner, formatWinnerPrizeLabel, formatWinnerPrizeAmount, displayWinnerName } from "@/types/game";

const ICONS: Record<string, string> = {
  airtime: "\u{1F4F1}",
  coupon: "\u{1F3AB}",
  cash: "\u{1F4B0}",
  sponsor: "\u{1F381}",
};

export default function Tap2CrackWinners() {
  const { data: winners = [], isLoading } = useWinnersQuery(50);

  const onShare = async (w: Winner) => {
    try {
      await Share.share({ message: `${w.user_name} won ${formatWinnerPrizeLabel(w)} on Tap2Crack!` });
    } catch (e) {
      console.error(e);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  const eggColor = (type: string) => {
    switch (type) {
      case "golden": return "#FFD700";
      case "silver": return "#C0C0C0";
      case "company": return "#FF6B6B";
      case "business": return "#4ECDC4";
      default: return "#F4A460";
    }
  };

  const eggName = (type: string) => {
    switch (type) {
      case "golden": return "Golden Egg";
      case "silver": return "Silver Egg";
      case "company": return "Company Egg";
      case "business": return "Business Egg";
      case "no-powerup": return "Pure Egg";
      default: return "Normal Egg";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.iconBg}>
            <Trophy size={40} color="#FFD700" />
          </View>
          <Text style={styles.title}>Recent Winners</Text>
          <Text style={styles.subtitle}>Celebrate the egg crackers!</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading winners...</Text>
            </View>
          ) : winners.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>{"\u{1F95A}"}</Text>
              <Text style={styles.emptyTitle}>No winners yet!</Text>
              <Text style={styles.emptyText}>Be the first to crack an egg!</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {winners.map((w, i) => (
                <View key={w.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{i + 1}</Text>
                    </View>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeText}>{timeAgo(w.won_at)}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{(w.user_name || '?')[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.name}>{displayWinnerName(w.user_name)}</Text>
                      <View style={styles.prizeRow}>
                        <Text style={styles.prizeIcon}>{ICONS[w.prize_type] || "\u{1F381}"}</Text>
                        <View style={styles.prizeTextWrap}>
                          <Text style={styles.prizeText}>
                            {w.prize_type === "coupon" && w.company_name
                              ? w.company_name
                              : w.prize_description}
                            {formatWinnerPrizeAmount(w)
                              ? ` · ${formatWinnerPrizeAmount(w)}`
                              : ""}
                          </Text>
                          {w.prize_type === "coupon" && w.company_name && (
                            <Text style={styles.prizeSubtext}>
                              {w.prize_description}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={[styles.eggBadge, { backgroundColor: `${eggColor(w.egg_type)}20` }]}>
                        <Sparkles size={10} color={eggColor(w.egg_type)} />
                        <Text style={[styles.eggText, { color: eggColor(w.egg_type) }]}>{eggName(w.egg_type)}</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.shareBtn} onPress={() => onShare(w)}>
                    <Share2 size={14} color="#4ECDC4" />
                    <Text style={styles.shareText}>Share</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

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
  iconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,215,0,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "bold" as const, color: "#FFF" },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  content: { padding: 20, paddingBottom: 40 },
  loadingWrap: { alignItems: "center", paddingVertical: 40 },
  loadingText: { color: "rgba(255,255,255,0.6)", marginTop: 12 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "bold" as const, color: "#FFF", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center" },
  list: { gap: 12 },
  card: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,215,0,0.1)" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  rankBadge: { backgroundColor: "rgba(255,215,0,0.2)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  rankText: { fontSize: 11, fontWeight: "bold" as const, color: "#FFD700" },
  timeBadge: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  timeText: { fontSize: 10, color: "rgba(255,255,255,0.5)" },
  cardBody: { flexDirection: "row", gap: 10, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(78,205,196,0.2)", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 16, fontWeight: "bold" as const, color: "#4ECDC4" },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: "bold" as const, color: "#FFF" },
  prizeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  prizeTextWrap: { flex: 1, gap: 2 },
  prizeIcon: { fontSize: 14 },
  prizeText: { fontSize: 13, color: "#FFD700", fontWeight: "600" as const },
  prizeSubtext: { fontSize: 11, color: "rgba(255,255,255,0.65)" },
  eggBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start" },
  eggText: { fontSize: 10, fontWeight: "500" as const },
  shareBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: "rgba(78,205,196,0.15)", paddingVertical: 8, borderRadius: 10 },
  shareText: { color: "#4ECDC4", fontWeight: "600" as const, fontSize: 12 },
});
