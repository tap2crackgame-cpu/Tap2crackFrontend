// Runs after `expo export` (see vercel.json). Needs Node 22.6+ (uses --experimental-strip-types).
// 1. Writes dist/<route>/index.html for every public page, each with its own title, description,
//    canonical, social tags, JSON-LD and readable text, so crawlers that don't run JS see the right page.
// 2. Writes dist/llms-full.txt from the same data as the site, so it never drifts.
import fs from "node:fs";
import path from "node:path";
import {
  PAGE_SEO, FAQ_ITEMS, LANDING_FAQ_PREVIEW, HOW_IT_WORKS_STEPS, SITE_DESCRIPTION,
  SUPPORT_EMAIL, pageUrl, buildFaqJsonLd, buildBreadcrumbJsonLd,
} from "../constants/seo.ts";

const DIST = path.resolve(process.argv[2] ?? "dist");
const base = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ld = (id, obj) => `<script type="application/ld+json" id="${id}">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;
let warnings = 0;
const swap = (html, re, fn, label) => {
  if (!re.test(html)) { console.warn(`[prerender] no match for ${label}`); warnings++; return html; }
  return html.replace(re, fn);
};
const meta = (html, attr, val, content) =>
  swap(html, new RegExp(`(<meta[^>]*${attr}="${val}"[^>]*content=")[^"]*(")`), (_, a, b) => a + esc(content) + b, `${attr}=${val}`);

const steps = `<ol>${HOW_IT_WORKS_STEPS.map((s) => `<li><strong>${esc(s.title)}</strong>: ${esc(s.body)}</li>`).join("")}</ol>`;
const faq = (list) => `<dl>${list.map((q) => `<dt>${esc(q.question)}</dt><dd>${esc(q.answer)}</dd>`).join("")}</dl>`;
const nav = `<nav aria-label="Primary">${[["/", "Home"], ["/how-to-play", "How to Play"], ["/faq", "FAQ"], ["/sponsor", "Contact"], ["/terms", "Terms"], ["/privacy-policy", "Privacy"]]
  .map(([p, n]) => `<a href="${pageUrl(p)}">${n}</a>`).join(" ")}</nav>`;

function content(key, seo) {
  const h1 = key === "home" ? "Tap2Crack: Tap the egg, crack it, win real rewards" : seo.title.split(" – ")[0];
  let extra = "";
  if (key === "home") extra = `<h2>How Tap2Crack Works</h2>${steps}<h2>Frequently asked questions</h2>${faq(LANDING_FAQ_PREVIEW)}`;
  if (key === "howToPlay") extra = steps;
  if (key === "faq") extra = faq(FAQ_ITEMS);
  if (key === "sponsor") extra = `<p>Email <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> for player support, partnerships or to sponsor an egg.</p>`;
  return `<main><h1>${esc(h1)}</h1><p>${esc(seo.description)}</p>${extra}${nav}</main>`;
}

function render(key) {
  const seo = PAGE_SEO[key];
  const url = pageUrl(seo.path);
  let h = swap(base, /<title>[\s\S]*?<\/title>/, () => `<title>${esc(seo.title)}</title>`, "title");
  h = meta(h, "name", "description", seo.description);
  for (const [a, v, c] of [["property", "og:title", seo.title], ["property", "og:description", seo.description], ["property", "og:url", url],
    ["name", "twitter:title", seo.title], ["name", "twitter:description", seo.description]]) h = meta(h, a, v, c);
  h = swap(h, /(<link[^>]*rel="canonical"[^>]*href=")[^"]*(")/, (_, a, b) => a + url + b, "canonical");
  h = swap(h, /(<div id="seo-static"[^>]*>)[\s\S]*?(<\/div>)/, (_, a, b) => a + content(key, seo) + b, "#seo-static");
  const extra = key === "home"
    ? ld("ld-faq", buildFaqJsonLd(LANDING_FAQ_PREVIEW))
    : ld("ld-breadcrumb", buildBreadcrumbJsonLd(seo.path, seo.title.split(" – ")[0])) + (key === "faq" ? ld("ld-faq", buildFaqJsonLd()) : "");
  h = h.replace("</head>", extra + "</head>");
  const out = key === "home" ? path.join(DIST, "index.html") : path.join(DIST, seo.path, "index.html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, h);
  console.log(`[prerender] ${seo.path}`);
}

Object.keys(PAGE_SEO).filter((k) => k !== "notFound").forEach(render);

const full = `# Tap2Crack: full guide

> ${SITE_DESCRIPTION}

Website: ${pageUrl("/")}
Support: ${SUPPORT_EMAIL}

## What it is
Tap2Crack is a free-to-play, real-time multiplayer game. Every player sees the same egg. Players tap it together and a shared progress bar fills up. The number of taps an egg needs is set by the game server. The player who makes the final, cracking tap wins that round's prize, then a short cooldown runs and the next egg starts.

## How a round works
${HOW_IT_WORKS_STEPS.map((s, i) => `${i + 1}. ${s.title}: ${s.body}`).join("\n")}

## Fair play
Egg progress, the cracking tap and the winner are decided by the server. Tap rates are limited so no one can win by flooding the game.

## Egg types
Normal, Silver, Gold, Business, Company and Pure eggs. Business and Company eggs carry coupons and discounts from partner brands. Each egg has its own live room.

## Prizes
Currently: mobile airtime, coupons and discounts. Winners see their prize in the app, and signed-in players can check prize details and status on the Prizes page. More prize types may be added over time.

## Power-ups
2x and 3x tap boosts make each tap count double or triple for a round. They can be bought, and a 2x boost can be earned by watching sponsor ads. They are optional.

## Accounts
Sign in with Google, or play as a guest. Players earn ranks from Egg Novice up to Egg Legend as they win.

## Frequently asked questions
${FAQ_ITEMS.map((q) => `### ${q.question}\n${q.answer}`).join("\n\n")}

## Pages
${Object.values(PAGE_SEO).filter((p) => !p.robots).map((p) => `- [${p.title}](${pageUrl(p.path)}): ${p.description}`).join("\n")}
`;
fs.writeFileSync(path.join(DIST, "llms-full.txt"), full);
console.log(`[prerender] llms-full.txt${warnings ? ` (${warnings} warning(s), check the log above)` : ""}`);
