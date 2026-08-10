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
import SemanticHeading from "@/components/SemanticHeading";
import { useLandingLayout } from "@/hooks/useLandingLayout";
import { useWinnersQuery } from "@/hooks/useWinnersQuery";
import {
  displayWinnerName,
  formatWinnerPrizeLabel,
} from "@/types/game";
import {
  HOW_IT_WORKS_STEPS,
  LANDING_FAQ_PREVIEW,
  SUPPORT_EMAIL,
} from "@/constants/seo";
import {
  LANDING_HERO,
  EGG_TYPES,
  WINNERS_SECTION,
  PRIZES_SECTION,
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
    <SemanticHeading
      level={2}
      style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}
    >
      {children}
    </SemanticHeading>
  );
}

function SectionBody({ children }: { children: string }) {
  return <Text style={styles.sectionBody}>{children}</Text>;
}

function webClass(name: string) {
  return Platform.OS === "web" ? ({ className: name } as const) : {};
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

function formatWinnerDate(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

  if (winners.length === 0) {
    return (
      <View style={styles.carouselEmpty}>
        <Text style={styles.carouselEmptyText}>
          Recent winners appear here as players crack eggs. Updated regularly.
        </Text>
      </View>
    );
  }

  const cards = winners.slice(0, 10).map((w) => ({
    id: w.id,
    name: displayWinnerName(w.user_name),
    prize: formatWinnerPrizeLabel(w),
    egg: w.egg_type ?? "normal",
    date: formatWinnerDate(w.won_at),
  }));

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
            Reward: {card.prize}
          </Text>
          {card.date ? (
            <Text style={styles.winnerCardDate}>{card.date}</Text>
          ) : null}
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
  const layout = useLandingLayout();
  const {
    isMobile,
    isVeryCompact,
    isWide,
    lockEntryViewport,
    pagePad,
    contentMax,
    gridGap,
    eggCols,
  } = layout;

  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -8, duration: 800, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [bounce]);

  const eggIconSize = isVeryCompact ? 44 : isMobile ? 52 : isWide ? 96 : 72;
  const heroGlowSize = isVeryCompact ? 56 : isMobile ? 68 : isWide ? 120 : 100;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        isMobile && styles.scrollContentMobile,
        Platform.OS === "web" && styles.scrollContentWeb,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={Platform.OS !== "web"}
    >
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
        <View
          style={[
            styles.page,
            isMobile && styles.pageMobile,
            { maxWidth: contentMax, paddingHorizontal: pagePad },
          ]}
        >
          <LandingHeader compact={isMobile} />

          {/* Entry panel — standard mobile game lobby UI */}
          <View
            style={[styles.entryPanel, isMobile && styles.entryPanelMobile]}
            {...webClass("landing-entry-panel")}
          >
            <View style={[styles.hero, isMobile && styles.heroMobile]}>
              <View
                style={[
                  styles.heroStack,
                  isMobile && styles.heroStackMobile,
                  lockEntryViewport && styles.heroStackEntry,
                ]}
              >
                <Animated.View style={{ transform: [{ translateY: bounce }] }}>
                  <View
                    style={[
                      styles.heroEggGlow,
                      isMobile && styles.heroEggGlowMobile,
                      {
                        width: heroGlowSize,
                        height: heroGlowSize,
                        borderRadius: heroGlowSize / 2,
                      },
                    ]}
                  >
                    <Egg size={eggIconSize} color="#FFD700" strokeWidth={1.5} />
                    <View
                      style={[
                        styles.heroEggRing,
                        {
                          width: heroGlowSize + 8,
                          height: heroGlowSize + 8,
                          borderRadius: (heroGlowSize + 8) / 2,
                        },
                      ]}
                    />
                  </View>
                </Animated.View>

                <SemanticHeading
                  level={1}
                  style={[
                    styles.heroTitle,
                    isWide && styles.heroTitleWide,
                    isMobile && styles.heroTitleMobile,
                    isVeryCompact && styles.heroTitleVeryCompact,
                  ]}
                  {...webClass("landing-hero-title")}
                >
                  {LANDING_HERO.tagline}
                </SemanticHeading>

                <Text
                  style={[
                    styles.heroSubtitle,
                    isMobile && styles.heroSubtitleMobile,
                    isVeryCompact && styles.heroSubtitleVeryCompact,
                  ]}
                  numberOfLines={isVeryCompact ? 2 : 3}
                >
                  {LANDING_HERO.subtitle}
                </Text>

                <View
                  style={[
                    styles.heroFeatures,
                    isMobile && styles.heroFeaturesMobile,
                    isVeryCompact && styles.heroFeaturesVeryCompact,
                  ]}
                >
                  <View style={[styles.heroFeature, isMobile && styles.heroFeatureMobile]}>
                    <View style={[styles.heroFeatureIcon, { backgroundColor: "rgba(255,107,107,0.2)" }]}>
                      <Zap size={isVeryCompact ? 13 : 14} color="#FF6B6B" />
                    </View>
                    <Text style={styles.heroFeatureText} numberOfLines={1}>
                      Multiplayer
                    </Text>
                  </View>
                  <View style={[styles.heroFeature, isMobile && styles.heroFeatureMobile]}>
                    <View style={[styles.heroFeatureIcon, { backgroundColor: "rgba(255,215,0,0.2)" }]}>
                      <Trophy size={isVeryCompact ? 13 : 14} color="#FFD700" />
                    </View>
                    <Text style={styles.heroFeatureText} numberOfLines={1}>
                      Real prizes
                    </Text>
                  </View>
                  <View style={[styles.heroFeature, isMobile && styles.heroFeatureMobile]}>
                    <View style={[styles.heroFeatureIcon, { backgroundColor: "rgba(78,205,196,0.2)" }]}>
                      <Users size={isVeryCompact ? 13 : 14} color="#4ECDC4" />
                    </View>
                    <Text style={styles.heroFeatureText} numberOfLines={1}>
                      Play together
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.ctaBlock, isMobile && styles.ctaBlockMobile]}>
                <TouchableOpacity
                  style={[styles.playBtn, guestLoading && styles.btnDisabled]}
                  onPress={onGuestPress}
                  disabled={guestLoading}
                >
                  <LinearGradient colors={["#FFD700", "#E6A800", "#C99200"]} style={styles.playBtnInner}>
                    {guestLoading ? (
                      <ActivityIndicator color="#1a1a2e" size="small" />
                    ) : (
                      <>
                        <Text style={styles.playBtnText}>Play Now</Text>
                        <ChevronRight size={18} color="#1a1a2e" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
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
                <Text style={[styles.ctaNote, isMobile && styles.ctaNoteMobile]}>
                  No payment required to win. Power-ups are optional.
                </Text>
              </View>
            </View>
          </View>

          {/* How it works */}
          <View style={[styles.section, isMobile && styles.sectionMobile]}>
            <SectionTitle compact={isMobile}>How Tap2Crack Works</SectionTitle>
            <View style={styles.stepsGrid}>
              {HOW_IT_WORKS_STEPS.map((step, index) => (
                <View key={step.title} style={styles.stepCard}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                  <SemanticHeading level={3} style={styles.stepTitle}>
                    {step.title}
                  </SemanticHeading>
                  <Text style={styles.stepBody}>{step.body}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Egg types */}
          <View style={[styles.section, isMobile && styles.sectionMobile]}>
            <SectionTitle compact={isMobile}>Crack Eggs and Discover Rewards</SectionTitle>
            <View
              style={[styles.eggGrid, { rowGap: gridGap }]}
              {...webClass("landing-egg-grid")}
            >
              {EGG_TYPES.map((egg) => (
                <View
                  key={egg.key}
                  style={[
                    styles.eggCard,
                    isMobile && styles.eggCardMobile,
                    eggCols === 2 && styles.eggCardHalf,
                    eggCols === 3 && styles.eggCardThird,
                    {
                      borderColor: `${egg.color}55`,
                      borderTopColor: egg.color,
                      borderTopWidth: 3,
                    },
                  ]}
                  {...webClass("landing-egg-card")}
                >
                  <View style={styles.eggCardTop}>
                    <View style={[styles.eggShape, { backgroundColor: egg.color }]}>
                      <Text style={styles.eggCardChicken}>{egg.chicken}</Text>
                    </View>
                    <SemanticHeading level={3} style={styles.eggCardName} numberOfLines={2}>
                      {egg.name}
                    </SemanticHeading>
                  </View>
                  <Text style={[styles.eggCardCopy, isMobile && styles.eggCardCopyMobile]} numberOfLines={isMobile ? 3 : 4}>
                    {egg.copy}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recent winners */}
          <View style={[styles.section, isMobile && styles.sectionMobile]}>
            <SectionTitle compact={isMobile}>Recent Winners</SectionTitle>
            {!isMobile && <SectionBody>{WINNERS_SECTION.subtitle}</SectionBody>}
            <Text style={styles.updatedNote}>Updated regularly from live game results.</Text>
            <WinnersCarousel compact={isMobile} />
          </View>

          {/* Prizes */}
          <View style={[styles.section, isMobile && styles.sectionMobile]}>
            <SectionTitle compact={isMobile}>What Can You Win?</SectionTitle>
            <View
              style={[styles.prizeGrid, { rowGap: gridGap }]}
              {...webClass("landing-prize-grid")}
            >
              {PRIZES_SECTION.groups.map((group) => (
                <View
                  key={group.title}
                  style={[
                    styles.prizeCard,
                    isMobile && styles.prizeCardMobile,
                    styles.prizeCardHalf,
                  ]}
                  {...webClass("landing-prize-card")}
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

          {/* FAQ preview */}
          <View style={[styles.section, isMobile && styles.sectionMobile]}>
            <SectionTitle compact={isMobile}>Frequently Asked Questions</SectionTitle>
            <View style={styles.faqGrid}>
              {LANDING_FAQ_PREVIEW.map((item) => (
                <View key={item.question} style={styles.faqCard}>
                  <SemanticHeading level={3} style={styles.faqQuestion}>
                    {item.question}
                  </SemanticHeading>
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                </View>
              ))}
            </View>
            <Link href="/faq" style={styles.faqLink}>
              View all FAQ
            </Link>
          </View>

          {/* Trust */}
          <View style={[styles.section, styles.trustSection, isMobile && styles.sectionMobile]}>
            <SectionTitle compact={isMobile}>Why Play Tap2Crack?</SectionTitle>
            <Text style={styles.trustBody}>
              Tap2Crack is a free-to-play multiplayer reward game. Play on mobile or desktop,
              win real prizes when you crack eggs, and review our rules and privacy policy anytime.
            </Text>
            <View style={styles.trustLinks}>
              <Link href="/how-to-play" style={styles.trustLink}>How to Play</Link>
              <Link href="/terms" style={styles.trustLink}>Terms</Link>
              <Link href="/privacy-policy" style={styles.trustLink}>Privacy</Link>
              <Link href="/sponsor" style={styles.trustLink}>Contact</Link>
            </View>
            <Text style={styles.trustEmail}>Support: {SUPPORT_EMAIL}</Text>
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
  scroll: { flex: 1, backgroundColor: "#1a1a2e" },
  scrollContent: {
    flexGrow: 0,
    paddingBottom: 24,
  },
  scrollContentMobile: {
    paddingBottom: 16,
  },
  scrollContentWeb: {
    flexGrow: 0,
    alignItems: "stretch",
  },
  gradient: {
    width: "100%",
    flexGrow: 0,
    alignSelf: "stretch",
  },
  page: {
    width: "100%",
    alignSelf: "center",
    paddingTop: 4,
    paddingBottom: 24,
  },
  pageMobile: {
    paddingTop: 8,
  },
  dashboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,215,0,0.15)",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  dashboardHeaderCompact: {
    paddingVertical: 6,
    marginBottom: 4,
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
  entryPanel: {
    width: "100%",
    marginBottom: 22,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.22)",
    backgroundColor: "rgba(15,52,96,0.35)",
  },
  entryPanelMobile: {
    padding: 14,
    marginBottom: 18,
  },
  hero: {
    width: "100%",
    marginBottom: 0,
  },
  heroMobile: {
    marginBottom: 18,
  },
  heroStack: {
    width: "100%",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  heroStackMobile: {
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  heroStackEntry: {
    flexGrow: 0,
    flexShrink: 0,
  },
  heroEggGlow: {
    backgroundColor: "rgba(255,215,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    position: "relative",
  },
  heroEggGlowMobile: {
    backgroundColor: "rgba(255,215,0,0.12)",
  },
  heroEggRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(255,215,0,0.35)",
    top: -4,
    left: -4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 0,
    marginTop: 0,
    letterSpacing: -0.3,
    width: "100%",
    alignSelf: "stretch",
  },
  heroTitleWide: { fontSize: 34 },
  heroTitleMobile: {
    fontSize: 21,
    lineHeight: 26,
    paddingHorizontal: 0,
    flexGrow: 0,
    flexShrink: 0,
  },
  heroTitleVeryCompact: {
    fontSize: 19,
    lineHeight: 24,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 0,
    paddingHorizontal: 4,
    width: "100%",
  },
  heroSubtitleMobile: {
    fontSize: 13,
    lineHeight: 18,
  },
  heroSubtitleVeryCompact: {
    fontSize: 12,
    lineHeight: 17,
  },
  heroFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  heroFeaturesMobile: {
    flexWrap: "nowrap",
    justifyContent: "space-between",
    gap: 6,
  },
  heroFeaturesVeryCompact: {
    gap: 4,
  },
  heroFeature: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  heroFeatureMobile: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  heroFeatureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  heroFeatureText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
  ctaBlock: { width: "100%", gap: 10, alignSelf: "stretch" },
  ctaBlockMobile: { gap: 8 },
  playBtn: { borderRadius: 14, overflow: "hidden" },
  playBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 15,
  },
  playBtnText: { color: "#1a1a2e", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
  googleBtn: { borderRadius: 12, overflow: "hidden" },
  googleBtnInner: { paddingVertical: 12, alignItems: "center" },
  googleBtnText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  btnDisabled: { opacity: 0.6 },
  ctaNote: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 2,
  },
  ctaNoteMobile: {
    fontSize: 10,
    lineHeight: 15,
  },
  section: { marginBottom: 26 },
  sectionMobile: { marginBottom: 22 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 10,
    marginTop: 0,
    letterSpacing: -0.2,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(255,215,0,0.35)",
  },
  sectionTitleCompact: {
    fontSize: 16,
    marginBottom: 8,
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
    justifyContent: "space-between",
    alignContent: "flex-start",
    width: "100%",
  },
  eggCardHalf: {
    width: "48%",
    maxWidth: "48%",
    flexGrow: 0,
    flexShrink: 0,
  },
  eggCardThird: {
    width: "31.5%",
    maxWidth: "31.5%",
    flexGrow: 0,
    flexShrink: 0,
  },
  eggCard: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    marginBottom: 0,
  },
  eggCardMobile: {
    padding: 8,
    borderRadius: 10,
  },
  eggCardTop: { flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 6 },
  eggShape: {
    width: 32,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
    flexShrink: 0,
  },
  eggCardChicken: { fontSize: 13 },
  eggCardName: { fontSize: 12, fontWeight: "700", color: "#FFF", textAlign: "center", flex: 0 },
  eggCardCopy: { fontSize: 11, lineHeight: 16, color: "rgba(255,255,255,0.6)", textAlign: "center" },
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
  winnerCardDate: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 },
  carouselEmpty: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  carouselEmptyText: { fontSize: 13, lineHeight: 20, color: "rgba(255,255,255,0.55)", textAlign: "center" },
  updatedNote: { fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 10 },
  stepsGrid: { gap: 10 },
  stepCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFD700",
    marginBottom: 6,
  },
  stepTitle: { fontSize: 15, fontWeight: "600", color: "#FFF", marginBottom: 6 },
  stepBody: { fontSize: 13, lineHeight: 20, color: "rgba(255,255,255,0.65)" },
  faqGrid: { gap: 10 },
  faqCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  faqQuestion: { fontSize: 14, fontWeight: "600", color: "#FFF", marginBottom: 6 },
  faqAnswer: { fontSize: 13, lineHeight: 20, color: "rgba(255,255,255,0.65)" },
  faqLink: {
    alignSelf: "flex-start",
    marginTop: 12,
    fontSize: 13,
    color: "#FFD700",
    fontWeight: "600",
  },
  trustSection: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  trustBody: { fontSize: 14, lineHeight: 22, color: "rgba(255,255,255,0.65)", marginBottom: 12 },
  trustLinks: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  trustLink: { fontSize: 13, color: "#FFD700", fontWeight: "600" },
  trustEmail: { fontSize: 12, color: "rgba(255,255,255,0.45)" },
  prizeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "flex-start",
    width: "100%",
  },
  prizeCardHalf: {
    width: "48%",
    maxWidth: "48%",
    flexGrow: 0,
    flexShrink: 0,
  },
  prizeCard: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  prizeCardMobile: {
    padding: 10,
  },
  prizeCardTitle: { fontSize: 13, fontWeight: "600", color: "#FFF", marginBottom: 5 },
  prizeCardItems: { fontSize: 11, lineHeight: 16, color: "rgba(255,255,255,0.55)" },
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
