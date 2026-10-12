import React, { memo, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CluckyFace } from "@/components/CluckyBuddy";
import {
  LEVELS, OUTFITS, getBadges, getLevel, getXp, loadLocalProgress, loadOutfit, saveOutfit,
  effectiveOutfit, type BasicStats, type LocalProgress, type OutfitId,
} from "@/utils/progression";

const INK = "#1A1A2E";

/** Profile card: Tapper Level + XP bar, badges, and the Clucky outfit picker. */
function TapperProgress({ stats, isGuest }: { stats: BasicStats | null | undefined; isGuest?: boolean }) {
  const xp = getXp(stats);
  const { current, next, progress, xpToNext } = getLevel(xp);
  const [local, setLocal] = useState<LocalProgress | null>(null);
  const [outfit, setOutfit] = useState<OutfitId>("plain");

  useEffect(() => {
    void loadLocalProgress().then((l) => setLocal({ ...l }));
    void loadOutfit().then(setOutfit);
  }, []);

  const worn = effectiveOutfit(outfit, current.level);
  const badges = local ? getBadges(stats, local) : [];
  const earned = badges.filter((b) => b.earned).length;

  return (
    <View style={styles.wrap}>
      {/* level */}
      <LinearGradient colors={[current.color, "#FFF7E6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.levelCard}>
        <View style={styles.levelRow}>
          <CluckyFace size={92} mood="happy" outfit={worn} />
          <View style={{ flex: 1 }}>
            <Text style={styles.levelSmall}>TAPPER LEVEL {current.level}</Text>
            <Text style={styles.levelName}>
              {current.emoji} {current.name}
            </Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Text style={styles.xpText}>
              {next ? `${xp.toLocaleString()} XP · ${xpToNext.toLocaleString()} to ${next.emoji} ${next.name}` : `${xp.toLocaleString()} XP · MAX LEVEL 👑`}
            </Text>
          </View>
        </View>
        <Text style={styles.xpHint}>1 XP per tap · {"+"}300 XP per egg you crack</Text>
        {isGuest ? <Text style={styles.guestHint}>Sign in to keep your level and badges.</Text> : null}
      </LinearGradient>

      {/* levels ladder */}
      <View style={styles.ladder}>
        {LEVELS.map((l) => {
          const reached = current.level >= l.level;
          return (
            <View key={l.level} style={[styles.step, reached && { backgroundColor: l.color, borderColor: INK }]}>
              <Text style={styles.stepEmoji}>{l.emoji}</Text>
              <Text style={[styles.stepNum, reached && { color: INK }]}>{l.level}</Text>
            </View>
          );
        })}
      </View>

      {/* outfits */}
      <Text style={styles.sectionLabel}>Clucky's outfits</Text>
      <View style={styles.outfitRow}>
        {OUTFITS.map((o) => {
          const unlocked = current.level >= o.unlockLevel;
          const selected = worn === o.id;
          return (
            <TouchableOpacity
              key={o.id}
              disabled={!unlocked}
              onPress={() => {
                setOutfit(o.id);
                void saveOutfit(o.id);
              }}
              style={[styles.outfit, selected && styles.outfitSelected, !unlocked && styles.outfitLocked]}
              accessibilityLabel={unlocked ? `Wear ${o.name}` : `${o.name}, unlocks at level ${o.unlockLevel}`}
            >
              <View style={!unlocked && { opacity: 0.35 }}>
                <CluckyFace size={52} mood={selected ? "happy" : "idle"} outfit={o.id} />
              </View>
              <Text style={[styles.outfitName, selected && { color: "#FFD700" }]} numberOfLines={1}>
                {unlocked ? o.name : `🔒 Lv ${o.unlockLevel}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* badges */}
      <Text style={styles.sectionLabel}>
        Badges {local ? `· ${earned}/${badges.length}` : ""}
      </Text>
      <View style={styles.badgeGrid}>
        {badges.map((b) => (
          <View key={b.id} style={[styles.badge, b.earned ? styles.badgeOn : styles.badgeOff]}>
            <Text style={[styles.badgeEmoji, !b.earned && { opacity: 0.3 }]}>{b.emoji}</Text>
            <Text style={[styles.badgeName, !b.earned && { color: "rgba(255,255,255,0.45)" }]} numberOfLines={1}>
              {b.name}
            </Text>
            <Text style={styles.badgeHint} numberOfLines={2}>
              {b.earned ? "Earned ✓" : b.hint}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default memo(TapperProgress);

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  levelCard: { borderRadius: 20, padding: 14, borderWidth: 3, borderColor: INK },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  levelSmall: { color: "rgba(26,26,46,0.6)", fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  levelName: { color: INK, fontSize: 20, fontWeight: "900", marginTop: 2 },
  barBg: { height: 12, borderRadius: 8, backgroundColor: "rgba(26,26,46,0.15)", borderWidth: 2, borderColor: INK, marginTop: 8, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: "#FF8C00" },
  xpText: { color: INK, fontSize: 11, fontWeight: "700", marginTop: 5 },
  xpHint: { color: "rgba(26,26,46,0.6)", fontSize: 10, fontWeight: "600", marginTop: 8, textAlign: "center" },
  guestHint: { color: "#B91C1C", fontSize: 11, fontWeight: "800", marginTop: 4, textAlign: "center" },
  ladder: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  step: { flex: 1, marginHorizontal: 2, alignItems: "center", paddingVertical: 6, borderRadius: 10, borderWidth: 2, borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.05)" },
  stepEmoji: { fontSize: 16 },
  stepNum: { fontSize: 10, fontWeight: "900", color: "rgba(255,255,255,0.5)" },
  sectionLabel: { color: "#FFF", fontSize: 15, fontWeight: "800", marginTop: 16, marginBottom: 8 },
  outfitRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  outfit: { width: "31%", alignItems: "center", paddingVertical: 8, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 2, borderColor: "rgba(255,255,255,0.1)" },
  outfitSelected: { borderColor: "#FFD700", backgroundColor: "rgba(255,215,0,0.12)" },
  outfitLocked: { borderStyle: "dashed" },
  outfitName: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "800", marginTop: 2 },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: { width: "31%", alignItems: "center", padding: 8, borderRadius: 14, borderWidth: 2 },
  badgeOn: { backgroundColor: "rgba(255,215,0,0.12)", borderColor: "rgba(255,215,0,0.6)" },
  badgeOff: { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" },
  badgeEmoji: { fontSize: 26 },
  badgeName: { color: "#FFF", fontSize: 11, fontWeight: "900", marginTop: 2 },
  badgeHint: { color: "rgba(255,255,255,0.55)", fontSize: 9, textAlign: "center", marginTop: 2 },
});
