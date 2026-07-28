export const LANDING_HERO = {
  title: "Tap2Crack",
  tagline: "Tap, Crack, & Win Real Rewards!",
  subtitle: "Tap, crack, and win money, credit, vouchers & coupons.",
};

export const CRACKING_SECTION = {
  title: "Let's get Cracking! 🥚",
  body:
    "We're not eggs-aggerating—this is the most thrilling real-time multiplayer reward game you've ever played! Join the community, master the tap, and crack your way to victory. 🐣🔥",
};

export const HERO_PHOTOS = [
  {
    uri: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=480&q=80",
    alt: "Friends laughing and playing on their phones",
  },
  {
    uri: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=480&q=80",
    alt: "Happy players excited about mobile gaming",
  },
  {
    uri: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=480&q=80",
    alt: "Person smiling while using a smartphone",
  },
] as const;

export const EGG_TYPES = [
  {
    key: "normal",
    name: "Normal Egg",
    color: "#F4A460",
    chicken: "🐔",
    copy: "This egg was discovered in the kitchen. Some ask, which came first… the chicken or the egg? (We just hope the answer is not \"the omelet.\") 👀",
  },
  {
    key: "business",
    name: "Business Egg",
    color: "#4ECDC4",
    chicken: "🐓",
    copy: "Spotted in a small business, normally carries coupons from that small business to you! It's an eggs-pert at finding deals. 💼",
  },
  {
    key: "company",
    name: "Company Egg",
    color: "#FF6B6B",
    chicken: "🐔",
    copy: "The big companies didn't want to be left shell-shocked. They have sponsored eggs to represent them! 🏢",
  },
  {
    key: "silver",
    name: "Silver Egg",
    color: "#C0C0C0",
    chicken: "🐔",
    copy: "Ouuuu shiny! Eggs-quisite quality, but we need more polish! ✨",
  },
  {
    key: "golden",
    name: "Gold Egg",
    color: "#FFD700",
    chicken: "🐔",
    copy: "Ouuuuuuuu Shinier! A truly egg-stravagant find! 🥇",
  },
  {
    key: "pure",
    name: "Pure Egg",
    color: "#E8E8E8",
    chicken: "🐔",
    copy: "We still don't know where this egg came from but it has 100% natural essence and purity. This discovery is a hatch-tag blessing! 💎",
  },
] as const;

export const WINNERS_SECTION = {
  title: "Recent Egg hunters! 🏆",
  subtitle: "We are not ovary-acting—real people are winning real prizes right now!",
};

export const PRIZES_SECTION = {
  title: "Various Prizes! 🎁",
  intro:
    "This section is cracking with variety! We've got a buffet of prizes for you to peck at. Don't worry, we won't let you leave empty-handed—we are determined not to have any more lay-offs. 😂",
  groups: [
    {
      title: "Discounts (Online/Offline)",
      emoji: "🎟️",
      items: ["KFC", "Chicken Republic", "Pie Express", "AliExpress", "Namecheap", "Cold Stone Creamery", "and more"],
    },
    {
      title: "Mobile Credit",
      emoji: "📱",
      items: ["MTN", "Glo", "Airtel", "9mobile", "and more"],
    },
    {
      title: "Tickets to the movies!",
      emoji: "🍿",
      items: ["Cinema tickets from partner theaters"],
    },
    {
      title: "Sweet treats",
      emoji: "🍰",
      items: ["Cake slices from your favorite vendors"],
    },
    {
      title: "Pizza boxes",
      emoji: "🍕",
      items: ["Domino's", "Pizza Hut"],
    },
    {
      title: "Merch",
      emoji: "👕",
      items: ["Mugs", "Stylish crop jackets", "Hoodies", "Snapbacks", "Keychains", "Shoes"],
    },
  ],
};

export const WINNER_QUOTES = [
  "I can't even call this an addiction it's fun 🤣. I'm eggs-cited every single morning.",
  "What's with the egg jokes? 🤣 They are egg-scruciatingly bad!",
  "Do not play this in your office. You'd be carried away lmao. My boss is mad but I love the jacket tho 🌝. It was an egg-cellent decision.",
  "I need to kiss the developers cus the mechanics tho. Totally un-egg-septable.",
  "Very good way to lay off the stress negl. Nice work guys !",
  "I've been here since the beta. I haven't bought a house in the past month but I've gotten 3 tickets to the movies and some cool merch. I'm living an egg-ceptional life.",
  "Why can't I win mtn credit and I stay in Germany ☹️. Don't eggs-clude me!",
] as const;

export const COMING_SOON_SECTION = {
  title: "Still coming! 🐣",
  body: "This is just the beginning. Hatch this thought: The chickens will rage war. That's why we need the Egg legend! Keep your eye on the nest. 🐔⚔️🥚",
};

export const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/how-to-play", label: "How to Play" },
  { href: "/faq", label: "FAQ" },
  { href: "/sponsor", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy-policy", label: "Privacy" },
] as const;
