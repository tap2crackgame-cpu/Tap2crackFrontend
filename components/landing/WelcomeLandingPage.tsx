import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import {
  Egg,
  Trophy,
  Users,
  Zap,
  Crown,
  Sparkles,
  ChevronRight,
  Info,
} from "lucide-react-native";
import SocialMediaLinks from "@/components/SocialMediaLinks";
import { useWinnersQuery } from "@/hooks/useWinnersQuery";
import {
  displayWinnerName,
  formatWinnerPrizeLabel,
} from "@/types/game";
import {
  LANDING_HERO,
  CRACKING_SECTION,
  HERO_PHOTOS,
  EGG_TYPES,
  WINNERS_SECTION,
  PRIZES_SECTION,
  WINNER_QUOTES,
  COMING_SOON_SECTION,
  FOOTER_LINKS,
} from "@/constants/landingCopy";

type Props = {
  onGooglePress: () => void;
  onGuestPress: () => void;
  googleLoading: boolean;
  guestLoading: boolean;
  onInfoPress: () => void;
};

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function SectionBody({ children }: { children: string }) {
  return <Text style={styles.sectionBody}>{children}</Text>;
}

function LandingHeader() {
  return (
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardBrand}>
        <View style={styles.dashboardAvatar}>
          <Egg size={22} color="#FFD700" strokeWidth={1.5} />
        </View>
        <View style={styles.dashboardBrandText}>
          <Text style={styles.dashboardTitle}>{LANDING_HERO.title}</Text>
          <View style={styles.dashboardRankRow}>
            <Crown size={11} color="#FFD700" />
            <Text style={styles.dashboardRank}>Egg Novice</Text>
          </View>
        </View>
      </View>
      <View style={styles.liveBadge}>
        <Zap size={14} color="#FF6B6B" />
        <Text style={styles.liveBadgeText}>Live</Text>
      </View>
    </View>
  );
}

function LandingNav() {
  return (
    <View style={styles.navRow}>
      <View style={styles.navBtn}>
        <Trophy size={18} color="#FFD700" />
        <Text style={styles.navText}>Rank</Text>
      </View>
      <View style={styles.navBtn}>
        <Users size={18} color="#4ECDC4" />
        <Text style={styles.navText}>Winners</Text>
      </View>
      <View style={styles.navBtn}>
        <Sparkles size={18} color="#FF6B6B" />
        <Text style={styles.navText}>Prizes</Text>
      </View>
    </View>
  );
}

function WinnersCarousel() {
  const { data: winners = [], isLoading } = useWinnersQuery(12);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(260, width * 0.72);

  if (isLoading) {
    return (
      <View style={styles.carouselLoading}>
        <ActivityIndicator color="#FFD700" />
        <Text style={styles.carouselLoadingText}>Loading egg hunters…</Text>
      </View>
    );
  }

  const cards =
    winners.length > 0
      ? winners.slice(0, 10).map((w) => ({
          id: w.id,
          name: displayWinnerName(w.user_name),
          prize: formatWinnerPrizeLabel(w),
          egg: w.egg_type ?? "normal",
        }))
      : [
          { id: "1", name: "Ada C.", prize: "₦500 Airtime", egg: "golden" },
          { id: "2", name: "Tunde M.", prize: "KFC Coupon", egg: "business" },
          { id: "3", name: "Chioma O.", prize: "Movie Ticket 🍿", egg: "company" },
          { id: "4", name: "Samuel K.", prize: "Tap2Crack Hoodie", egg: "silver" },
        ];

  const eggColor = (type: string) => {
    switch (type) {
      case "golden":
        return "#FFD700";
      case "silver":
        return "#C0C0C0";
      case "company":
        return "#FF6B6B";
      case "business":
        return "#4ECDC4";
      case "no-powerup":
        return "#E8E8E8";
      default:
        return "#F4A460";
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carouselContent}
      decelerationRate="fast"
      snapToInterval={cardWidth + 14}
    >
      {cards.map((card) => (
        <View key={card.id} style={[styles.winnerCard, { width: cardWidth }]}>
          <View style={[styles.winnerEggDot, { backgroundColor: eggColor(card.egg) }]} />
          <Text style={styles.winnerCardName}>{card.name}</Text>
          <Text style={styles.winnerCardPrize}>Won {card.prize}</Text>
          <Text style={styles.winnerCardEmoji}>🎉🥚</Text>
        </View>
      ))}
    </ScrollView>
  );
}

export default function WelcomeLandingPage({
  onGooglePress,
  onGuestPress,
  googleLoading,
  guestLoading,
  onInfoPress,
}: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const contentMax = Math.min(920, width - 32);
  const eggCols = width >= 640 ? 3 : 2;
  const eggCardWidth = (contentMax - (eggCols - 1) * 12) / eggCols;

  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -10, duration: 700, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [bounce]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={Platform.OS !== "web"}
    >
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
        <View style={[styles.page, { maxWidth: contentMax }]}>
          <LandingHeader />
          <LandingNav />

          {/* Hero */}
          <View style={styles.hero}>
            <Animated.View style={{ transform: [{ translateY: bounce }] }}>
              <View style={styles.heroEggGlow}>
                <Egg size={isWide ? 96 : 72} color="#FFD700" strokeWidth={1.5} />
              </View>
            </Animated.View>
            <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>
              {LANDING_HERO.tagline}
            </Text>
            <Text style={styles.heroSubtitle}>{LANDING_HERO.subtitle}</Text>

            <View style={styles.heroFeatures}>
              <View style={styles.heroFeature}>
                <Zap size={18} color="#FF6B6B" />
                <Text style={styles.heroFeatureText}>Real-time multiplayer</Text>
              </View>
              <View style={styles.heroFeature}>
                <Trophy size={18} color="#FFD700" />
                <Text style={styles.heroFeatureText}>Win real prizes</Text>
              </View>
              <View style={styles.heroFeature}>
                <Users size={18} color="#4ECDC4" />
                <Text style={styles.heroFeatureText}>Play with friends</Text>
              </View>
            </View>

            <View style={styles.ctaBlock}>
              <TouchableOpacity
                style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
                onPress={onGooglePress}
                disabled={googleLoading}
              >
                <LinearGradient colors={["#4285F4", "#34A853"]} style={styles.googleBtnInner}>
                  {googleLoading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.googleBtnText}>Sign in with Google</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.guestBtn, guestLoading && styles.btnDisabled]}
                onPress={onGuestPress}
                disabled={guestLoading}
              >
                {guestLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.guestBtnText}>Play as Guest</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.ctaNote}>
                No payment required to win. Power-ups are optional boosts. 🥚
              </Text>
            </View>
          </View>

          {/* Section 1 */}
          <View style={styles.section}>
            <SectionTitle>{CRACKING_SECTION.title}</SectionTitle>
            <SectionBody>{CRACKING_SECTION.body}</SectionBody>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
            >
              {HERO_PHOTOS.map((photo) => (
                <Image
                  key={photo.uri}
                  source={{ uri: photo.uri }}
                  style={styles.heroPhoto}
                  accessibilityLabel={photo.alt}
                />
              ))}
            </ScrollView>
          </View>

          {/* Section 2 */}
          <View style={styles.section}>
            <SectionTitle>Bring out the Eggs! 🐔</SectionTitle>
            <SectionBody>
              Six egg types. Six chicken guardians. One mission: crack, win, repeat. 🥚✨
            </SectionBody>
            <View style={styles.eggGrid}>
              {EGG_TYPES.map((egg) => (
                <View
                  key={egg.key}
                  style={[styles.eggCard, { width: eggCardWidth, borderColor: `${egg.color}55` }]}
                >
                  <View style={styles.eggCardTop}>
                    <View style={[styles.eggShape, { backgroundColor: egg.color }]}>
                      <Text style={styles.eggCardChicken}>{egg.chicken}</Text>
                    </View>
                    <Text style={styles.eggCardName}>{egg.name}</Text>
                  </View>
                  <Text style={styles.eggCardCopy}>{egg.copy}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Section 3 */}
          <View style={styles.section}>
            <SectionTitle>{WINNERS_SECTION.title}</SectionTitle>
            <SectionBody>{WINNERS_SECTION.subtitle}</SectionBody>
            <WinnersCarousel />
          </View>

          {/* Section 4 */}
          <View style={styles.section}>
            <SectionTitle>{PRIZES_SECTION.title}</SectionTitle>
            <SectionBody>{PRIZES_SECTION.intro}</SectionBody>
            <View style={styles.prizeGrid}>
              {PRIZES_SECTION.groups.map((group) => (
                <View key={group.title} style={styles.prizeCard}>
                  <Text style={styles.prizeCardTitle}>
                    {group.emoji} {group.title}
                  </Text>
                  <Text style={styles.prizeCardItems}>{group.items.join(" · ")}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Section 5 */}
          <View style={styles.section}>
            <SectionTitle>Word from winners! 💬</SectionTitle>
            <View style={styles.quoteGrid}>
              {WINNER_QUOTES.map((quote, i) => (
                <View key={i} style={[styles.quoteCard, i % 2 === 1 && styles.quoteCardAlt]}>
                  <Text style={styles.quoteMark}>"</Text>
                  <Text style={styles.quoteText}>{quote}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Section 6 */}
          <View style={[styles.section, styles.comingSection]}>
            <SectionTitle>{COMING_SOON_SECTION.title}</SectionTitle>
            <SectionBody>{COMING_SOON_SECTION.body}</SectionBody>
            <TouchableOpacity style={styles.playCta} onPress={onGuestPress} disabled={guestLoading}>
              <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.playCtaInner}>
                <Text style={styles.playCtaText}>Start Cracking Now</Text>
                <ChevronRight size={20} color="#1a1a2e" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerLinks}>
              {FOOTER_LINKS.map((link) => (
                <Link key={link.href} href={link.href as never} style={styles.footerLink}>
                  {link.label}
                </Link>
              ))}
            </View>
            <Text style={styles.footerEmail}>tap2crackgame@gmail.com</Text>
            <View style={styles.footerBottom}>
              <TouchableOpacity style={styles.infoBtn} onPress={onInfoPress} accessibilityLabel="About Tap2Crack">
                <Info size={20} color="#FFD700" />
              </TouchableOpacity>
              <View style={styles.footerSocial}>
                <SocialMediaLinks />
              </View>
              <View style={styles.footerSpacer} />
            </View>
            <Text style={styles.footerCopy}>© {new Date().getFullYear()} Tap2Crack. All yolks reserved. 🐣</Text>
          </View>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  gradient: { flex: 1, minHeight: "100%" as unknown as number },
  page: {
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  dashboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 4,
  },
  dashboardBrand: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  dashboardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,215,0,0.2)",
    borderWidth: 2,
    borderColor: "#FFD700",
    alignItems: "center",
    justifyContent: "center",
  },
  dashboardBrandText: { flex: 1 },
  dashboardTitle: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  dashboardRankRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  dashboardRank: { fontSize: 11, color: "rgba(255,255,255,0.65)" },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,107,107,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.35)",
  },
  liveBadgeText: { fontSize: 11, color: "#FF6B6B", fontWeight: "600" },
  navRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  navBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  navText: { fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  hero: { alignItems: "center", marginBottom: 36 },
  heroEggGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,215,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(255,215,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroTitleWide: { fontSize: 34 },
  heroSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  heroFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 22,
  },
  heroFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  heroFeatureText: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  ctaBlock: { width: "100%", gap: 12 },
  googleBtn: { borderRadius: 16, overflow: "hidden" },
  googleBtnInner: { paddingVertical: 15, alignItems: "center" },
  googleBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  guestBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
  },
  guestBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  btnDisabled: { opacity: 0.6 },
  ctaNote: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
  section: { marginBottom: 36 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFD700",
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 24,
    color: "rgba(255,255,255,0.78)",
    marginBottom: 16,
  },
  photoRow: { gap: 12, paddingVertical: 4 },
  heroPhoto: {
    width: 200,
    height: 140,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  eggGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  eggCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  eggCardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  eggShape: {
    width: 42,
    height: 52,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  eggCardChicken: { fontSize: 16 },
  eggCardName: { fontSize: 14, fontWeight: "700", color: "#FFF", flex: 1 },
  eggCardCopy: { fontSize: 13, lineHeight: 20, color: "rgba(255,255,255,0.72)" },
  carouselContent: { gap: 14, paddingVertical: 4, paddingRight: 8 },
  carouselLoading: { alignItems: "center", paddingVertical: 24, gap: 10 },
  carouselLoadingText: { color: "rgba(255,255,255,0.55)", fontSize: 13 },
  winnerCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
  },
  winnerEggDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 10 },
  winnerCardName: { fontSize: 16, fontWeight: "700", color: "#FFF", marginBottom: 4 },
  winnerCardPrize: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  winnerCardEmoji: { fontSize: 18, marginTop: 10 },
  prizeGrid: { gap: 12 },
  prizeCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  prizeCardTitle: { fontSize: 15, fontWeight: "700", color: "#FFF", marginBottom: 6 },
  prizeCardItems: { fontSize: 13, lineHeight: 20, color: "rgba(255,255,255,0.68)" },
  quoteGrid: { gap: 12 },
  quoteCard: {
    backgroundColor: "rgba(255,215,0,0.08)",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#FFD700",
  },
  quoteCardAlt: {
    backgroundColor: "rgba(78,205,196,0.08)",
    borderLeftColor: "#4ECDC4",
  },
  quoteMark: { fontSize: 28, color: "rgba(255,215,0,0.35)", lineHeight: 28, marginBottom: -4 },
  quoteText: { fontSize: 14, lineHeight: 22, color: "rgba(255,255,255,0.82)", fontStyle: "italic" },
  comingSection: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.15)",
  },
  playCta: { borderRadius: 16, overflow: "hidden", marginTop: 8 },
  playCtaInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
  },
  playCtaText: { fontSize: 16, fontWeight: "800", color: "#1a1a2e" },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 24,
    marginTop: 8,
  },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  footerLink: {
    fontSize: 13,
    color: "#FFD700",
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  footerEmail: {
    textAlign: "center",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 16,
  },
  footerBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  footerSocial: {
    flex: 1,
    alignItems: "center",
  },
  infoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,215,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  footerSpacer: { width: 40 },
  footerCopy: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
  },
});
