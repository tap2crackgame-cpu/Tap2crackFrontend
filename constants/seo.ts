export const SITE_URL = "https://www.tap2crackgame.com";

export const SITE_NAME = "Tap2Crack";

export const SITE_TITLE = "Tap2Crack – Crack Eggs & Win Real Rewards";

export const SITE_DESCRIPTION =
  "Play Tap2Crack free online. Tap and crack eggs in real time with other players to win airtime, coupons, vouchers, and real rewards.";

export const SITE_KEYWORDS = [
  "Tap2Crack",
  "tap to crack",
  "crack eggs",
  "egg game",
  "win rewards",
  "win prizes",
  "real rewards",
  "free to play",
  "multiplayer game",
  "airtime",
  "coupons",
  "mobile credit",
  "casual game",
  "online game",
].join(", ");

export const OG_IMAGE = `${SITE_URL}/og-image.png`;
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_ALT =
  "Clucky the Tap2Crack chicken mascot next to a golden egg with the text Tap the egg, crack it, win real rewards";
const ORG_ID = `${SITE_URL}/#organization`;

export const OG_TITLE = SITE_TITLE;

export const OG_DESCRIPTION = SITE_DESCRIPTION;

export const SUPPORT_EMAIL = "tap2crackgame@gmail.com";

export type PageSeo = {
  title: string;
  description: string;
  path: string;
  robots?: string;
};

export const PAGE_SEO: Record<string, PageSeo> = {
  home: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    path: "/",
  },
  howToPlay: {
    title: "How Tap2Crack Works – Play & Win Rewards",
    description:
      "Learn how to play Tap2Crack: choose an egg, tap with other players, and discover rewards when you win a round.",
    path: "/how-to-play",
  },
  faq: {
    title: "Tap2Crack FAQ – Rewards, Gameplay & Support",
    description:
      "Answers about Tap2Crack gameplay, prizes, free play, mobile support, reward delivery, and how to contact support.",
    path: "/faq",
  },
  sponsor: {
    title: "Contact Tap2Crack – Sponsorship & Support",
    description:
      "Contact Tap2Crack for sponsorship opportunities, partnerships, or player support.",
    path: "/sponsor",
  },
  terms: {
    title: "Tap2Crack Terms & Conditions",
    description: "Read the Tap2Crack terms and conditions for gameplay, accounts, and rewards.",
    path: "/terms",
  },
  privacy: {
    title: "Tap2Crack Privacy Policy",
    description: "Learn how Tap2Crack collects, uses, and protects your information.",
    path: "/privacy-policy",
  },
  notFound: {
    title: "Page Not Found – Tap2Crack",
    description: "The page you requested could not be found on Tap2Crack.",
    path: "/404",
    robots: "noindex, follow",
  },
};

export const HOW_IT_WORKS_STEPS = [
  {
    title: "Choose an egg",
    body: "Pick a live egg room — Normal, Silver, Gold, Business, Company, or Pure — and see what reward type is available.",
  },
  {
    title: "Tap and crack",
    body: "Tap together with other players in real time. Every tap adds to the shared crack progress bar until the egg breaks.",
  },
  {
    title: "Discover your reward",
    body: "If you land the final cracking tap, you win that round's prize. Signed-in players can track codes and status in their profile.",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "What is Tap2Crack?",
    answer:
      "Tap2Crack is a free real-time multiplayer egg cracking game. Players tap shared eggs together, and the player who makes the final tap can win rewards such as airtime, coupons, and sponsor gifts.",
  },
  {
    question: "How does Tap2Crack work?",
    answer:
      "Join a live egg room, tap to add cracks, and compete with other players. When the egg reaches 100%, the last tap wins the round prize according to the game's rules.",
  },
  {
    question: "How do I play?",
    answer:
      "Sign in with Google or play as a guest, open the game, choose an egg room, and start tapping. Optional power-ups can boost your tap strength but are not required to play.",
  },
  {
    question: "What can I win?",
    answer:
      "Right now Tap2Crack rewards are mobile airtime, coupons and discounts, depending on the egg you play. More prize types may be added over time.",
  },
  {
    question: "How are rewards delivered?",
    answer:
      "Delivery depends on the prize type. Airtime and coupon codes are shown to winners in-app. Signed-in users can view prize details and settlement status on the Prizes page.",
  },
  {
    question: "Is Tap2Crack free to play?",
    answer:
      "Yes. No payment is required to play or win. Power-ups are optional and not required to participate.",
  },
  {
    question: "Can I play on mobile?",
    answer:
      "Yes. Tap2Crack works in mobile browsers and supports touch gameplay on phones and tablets.",
  },
  {
    question: "Who can play?",
    answer:
      "Tap2Crack is intended for users who can create an account or play as a guest and follow the platform terms. Some rewards may be region-specific.",
  },
  {
    question: "What happens after I win?",
    answer:
      "Winners see their prize in the win popup. Signed-in users can review prize codes and fulfillment status from their profile and Prizes page.",
  },
  {
    question: "How do I contact Tap2Crack support?",
    answer: `Email ${SUPPORT_EMAIL} or visit the Contact page for sponsorship and support requests.`,
  },
] as const;

export const LANDING_FAQ_PREVIEW = FAQ_ITEMS.slice(0, 4);

export function pageUrl(path: string) {
  if (!path || path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: pageUrl("/"),
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@id": ORG_ID },
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: pageUrl("/"),
    logo: `${SITE_URL}/favicon.png`,
    email: SUPPORT_EMAIL,
    sameAs: [
      "https://www.instagram.com/tap2crackgame/",
      "https://www.tiktok.com/@tap2crack",
      "https://x.com/Tap2Crack_",
    ],
  };
}

export function buildSoftwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "VideoGame"],
    name: SITE_NAME,
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    genre: ["Casual", "Multiplayer", "Reward game"],
    playMode: "MultiPlayer",
    isAccessibleForFree: true,
    inLanguage: "en",
    image: OG_IMAGE,
    publisher: { "@id": ORG_ID },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: SITE_DESCRIPTION,
    url: pageUrl("/"),
  };
}

export function buildFaqJsonLd(
  items: ReadonlyArray<{ question: string; answer: string }> = FAQ_ITEMS
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(path: string, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: pageUrl("/") },
      { "@type": "ListItem", position: 2, name, item: pageUrl(path) },
    ],
  };
}

export function buildJsonLdScripts() {
  return [buildWebsiteJsonLd(), buildOrganizationJsonLd(), buildSoftwareApplicationJsonLd()];
}
