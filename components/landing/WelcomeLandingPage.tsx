import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

function SectionTitle({ children, compact }: { children: string; compact?: boolean }) {
  return (
    <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>
      {children}
    </Text>
  );
}

function SectionBody({ children }: { children: string }) {
  return <Text style={styles.sectionBody}>{children}</Text>;
}

function LandingHeader({ compact }: { compact?: boolean }) {
  return (
    <View style={[styles.dashboardHeader, compact && styles.dashboardHeaderCompact]}>
      <View style={styles.dashboardBrand}>
        <View style={[styles.dashboardAvatar, compact && styles.dashboardAvatarCompact]}>
          <Egg size={compact ? 18 : 22} color="#FFD700" strokeWidth={1.5} />
        </View>
        <View style={styles.dashboardBrandText}>
          <Text style={[styles.dashboardTitle, compact && styles.dashboardTitleCompact]}>
            {LANDING_HERO.title}
          </Text>
          <View style={styles.dashboardRankRow}>
            <Crown size={10} color="#FFD700" />
            <Text style={styles.dashboardRank}>Egg Novice</Text>
          </View>
        </View>
      </View>
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveBadgeText}>Live</Text>
      </View>
    </View>
  );
}

function WinnersCarousel({ compact }: { compact?: boolean }) {
  const { data: winners = [], isLoading } = useWinnersQuery(12);
  const { width } = useWindowDimensions();
  const cardWidth = compact ? Math.min(240, width * 0.78) : Math.min(260, width * 0.72);

  if (isLoading) {
    return (
      <View style={styles.carouselLoading}>
        <ActivityIndicator color="#FFD700" />
        <Text style={styles.carouselLoadingText}>Loading winners…</Text>
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
          { id: "3", name: "Chioma O.", prize: "Movie Ticket", egg: "company" },
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
      snapToInterval={cardWidth + 12}
    >
      {cards.map((card) => (
        <View key={card.id} style={[styles.winnerCard, { width: cardWidth }]}>
          <View style={styles.winnerCardHeader}>
            <View style={[styles.winnerEggDot, { backgroundColor: eggColor(card.egg) }]} />
            <Text style={styles.winnerCardName} numberOfLines={1}>
              {card.name}
            </Text>
          </View>
          <Text style={styles.winnerCardPrize} numberOfLines={2}>
            {card.prize}
          </Text>
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
  const isMobile = width < 640;
  const isWide = width >= 768;
  const pagePad = isMobile ? 20 : 16;
  const contentMax = Math.min(920, width);
  const gridInnerWidth = contentMax - pagePad * 2;
  const eggCols = width >= 640 ? 3 : 2;
  const gridGap = isMobile ? 10 : 12;
  const eggCardWidth = (gridInnerWidth - (eggCols - 1) * gridGap) / eggCols;

  const prizeCols = isMobile ? 2 : 1;
  const prizeCardWidth =
    prizeCols === 2
      ? (gridInnerWidth - gridGap) / 2
      : gridInnerWidth;

  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isMobile) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: -8, duration: 800, useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [bounce, isMobile]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={Platform.OS !== "web"}
    >
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
        <View style={[styles.page, { maxWidth: contentMax, paddingHorizontal: pagePad }]}>
          <LandingHeader compact={isMobile} />

          {/* Hero */}
          <View style={[styles.hero, isMobile && styles.heroMobile]}>
            {!isMobile ? (
              <Animated.View style={{ transform: [{ translateY: bounce }] }}>
                <View style={styles.heroEggGlow}>
                  <Egg size={isWide ? 96 : 72} color="#FFD700" strokeWidth={1.5} />
                </View>
              </Animated.View>
            ) : (
              <View style={styles.heroEggGlowMobile}>
                <Egg size={56} color="#FFD700" strokeWidth={1.5} />
              </View>
            )}
            <Text style={[styles.heroTitle, isWide && styles.heroTitleWide, isMobile && styles.heroTitleMobile]}>
              {LANDING_HERO.tagline}
            </Text>
            <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
              {LANDING_HERO.subtitle}
            </Text>

            <View style={[styles.heroFeatures, isMobile && styles.heroFeaturesMobile]}>
              <View style={styles.heroFeature}>
                <Zap size={16} color="#FF6B6B" />
                <Text style={styles.heroFeatureText}>Multiplayer</Text>
              </View>
              <View style={styles.heroFeature}>
                <Trophy size={16} color="#FFD700" />
                <Text style={styles.heroFeatureText}>Real prizes</Text>
              </View>
              <View style={styles.heroFeature}>
                <Users size={16} color="#4ECDC4" />
                <Text style={styles.heroFeatureText}>Play together</Text>
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
                No payment required to win. Power-ups are optional.
              </Text>
            </View>
          </View>

          {/* Egg types grid only */}
          <View style={[styles.section, isMobile && styles.sectionMobile]}>
            <View style={[styles.eggGrid, { gap: gridGap }]}>
              {EGG_TYPES.map((egg) => (
                <View
                  key={egg.key}
                  style={[
                    styles.eggCard,
                    isMobile && styles.eggCardMobile,
                    {
                      width: eggCardWidth,
                      borderColor: `${egg.color}40`,
                    },
                  ]}
                >
                  <View style={styles.eggCardTop}>
                    <View style={[styles.eggShape, { backgroundColor: egg.color }]}>
                      <Text style={styles.eggCardChicken}>{egg.chicken}</Text>
                    </View>
                    <Text style={styles.eggCardName} numberOfLines={2}>
                      {egg.name}
                    </Text>
                  </View>
                  <Text style={[styles.eggCardCopy, isMobile && styles.eggCardCopyMobile]}>
                    {egg.copy}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recent winners */}
          <View style={[styles.section, isMobile && styles.sectionMobile]}>
            <SectionTitle compact={isMobile}>{WINNERS_SECTION.title}</SectionTitle>
            {!isMobile && <SectionBody>{WINNERS_SECTION.subtitle}</SectionBody>}
            <WinnersCarousel compact={isMobile} />
          </View>

          {/* Prizes */}
          <View style={[styles.section, isMobile && styles.sectionMobile]}>
            <SectionTitle compact={isMobile}>{PRIZES_SECTION.title}</SectionTitle>
            <View style={[styles.prizeGrid, { gap: gridGap }]}>
              {PRIZES_SECTION.groups.map((group) => (
                <View
                  key={group.title}
                  style={[
                    styles.prizeCard,
                    isMobile && styles.prizeCardMobile,
                    { width: prizeCardWidth },
                  ]}
                >
                  <Text style={styles.prizeCardTitle} numberOfLines={2}>
                    {group.emoji} {group.title}
                  </Text>
                  <Text style={styles.prizeCardItems} numberOfLines={isMobile ? 4 : undefined}>
                    {group.items.join(" · ")}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Testimonials */}
          <View style={[styles.section, isMobile && styles.sectionMobile]}>
            <SectionTitle compact={isMobile}>Word from winners</SectionTitle>
            <View style={styles.quoteGrid}>
              {WINNER_QUOTES.map((quote, i) => (
                <View key={i} style={[styles.quoteCard, isMobile && styles.quoteCardMobile]}>
                  <Text style={[styles.quoteText, isMobile && styles.quoteTextMobile]}>{quote}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Coming soon */}
          <View style={[styles.section, styles.comingSection, isMobile && styles.comingSectionMobile]}>
            <SectionTitle compact={isMobile}>{COMING_SOON_SECTION.title}</SectionTitle>
            <SectionBody>{COMING_SOON_SECTION.body}</SectionBody>
            <TouchableOpacity style={styles.playCta} onPress={onGuestPress} disabled={guestLoading}>
              <LinearGradient colors={["#FFD700", "#E6A800"]} style={styles.playCtaInner}>
                <Text style={styles.playCtaText}>Start Cracking Now</Text>
                <ChevronRight size={18} color="#1a1a2e" />
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
                <Info size={18} color="#FFD700" />
              </TouchableOpacity>
              <View style={styles.footerSocial}>
                <SocialMediaLinks />
              </View>
              <View style={styles.footerSpacer} />
            </View>
            <Text style={styles.footerCopy}>
              © {new Date().getFullYear()} Tap2Crack
            </Text>
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
    paddingTop: 8,
    paddingBottom: 32,
  },
  dashboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  dashboardHeaderCompact: {
    paddingVertical: 8,
    marginBottom: 12,
  },
  dashboardBrand: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  dashboardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,215,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  dashboardAvatarCompact: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  dashboardBrandText: { flex: 1 },
  dashboardTitle: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  dashboardTitleCompact: { fontSize: 15 },
  dashboardRankRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  dashboardRank: { fontSize: 11, color: "rgba(255,255,255,0.55)" },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },
  liveBadgeText: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  hero: { alignItems: "center", marginBottom: 32 },
  heroMobile: { marginBottom: 28 },
  heroEggGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,215,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroEggGlowMobile: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,215,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  heroTitleWide: { fontSize: 34 },
  heroTitleMobile: { fontSize: 22, lineHeight: 28, paddingHorizontal: 4 },
  heroSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  heroSubtitleMobile: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  heroFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  heroFeaturesMobile: {
    gap: 6,
    marginBottom: 20,
  },
  heroFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  heroFeatureText: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  ctaBlock: { width: "100%", gap: 10 },
  googleBtn: { borderRadius: 12, overflow: "hidden" },
  googleBtnInner: { paddingVertical: 14, alignItems: "center" },
  googleBtnText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  guestBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  guestBtnText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  btnDisabled: { opacity: 0.6 },
  ctaNote: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
  section: { marginBottom: 32 },
  sectionMobile: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  sectionTitleCompact: {
    fontSize: 17,
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 14,
  },
  eggGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  eggCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  eggCardMobile: {
    padding: 10,
    borderRadius: 10,
  },
  eggCardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  eggShape: {
    width: 36,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 3,
    flexShrink: 0,
  },
  eggCardChicken: { fontSize: 14 },
  eggCardName: { fontSize: 13, fontWeight: "600", color: "#FFF", flex: 1 },
  eggCardCopy: { fontSize: 12, lineHeight: 18, color: "rgba(255,255,255,0.6)" },
  eggCardCopyMobile: { fontSize: 11, lineHeight: 16 },
  carouselContent: { gap: 12, paddingVertical: 2 },
  carouselLoading: { alignItems: "center", paddingVertical: 20, gap: 8 },
  carouselLoadingText: { color: "rgba(255,255,255,0.45)", fontSize: 13 },
  winnerCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  winnerCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  winnerEggDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  winnerCardName: { fontSize: 14, fontWeight: "600", color: "#FFF", flex: 1 },
  winnerCardPrize: { fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 17 },
  prizeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  prizeCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  prizeCardMobile: {
    padding: 10,
  },
  prizeCardTitle: { fontSize: 13, fontWeight: "600", color: "#FFF", marginBottom: 5 },
  prizeCardItems: { fontSize: 11, lineHeight: 16, color: "rgba(255,255,255,0.55)" },
  quoteGrid: { gap: 10 },
  quoteCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  quoteCardMobile: {
    padding: 12,
  },
  quoteText: { fontSize: 13, lineHeight: 20, color: "rgba(255,255,255,0.72)" },
  quoteTextMobile: { fontSize: 12, lineHeight: 18 },
  comingSection: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  comingSectionMobile: {
    padding: 14,
    borderRadius: 12,
  },
  playCta: { borderRadius: 12, overflow: "hidden", marginTop: 4 },
  playCtaInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 13,
  },
  playCtaText: { fontSize: 15, fontWeight: "700", color: "#1a1a2e" },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 20,
    marginTop: 4,
  },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
    marginBottom: 10,
  },
  footerLink: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "500",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  footerEmail: {
    textAlign: "center",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 14,
  },
  footerBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  footerSocial: {
    flex: 1,
    alignItems: "center",
  },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  footerSpacer: { width: 36 },
  footerCopy: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
  },
});
