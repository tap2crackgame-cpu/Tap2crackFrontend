import React from "react";
import { ScrollViewStyleReset } from "expo-router/html";
import {
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  OG_TITLE,
  OG_DESCRIPTION,
  OG_IMAGE,
  OG_IMAGE_ALT,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  LANDING_FAQ_PREVIEW,
  SUPPORT_EMAIL,
  SITE_NAME,
  pageUrl,
  buildJsonLdScripts,
  HOW_IT_WORKS_STEPS,
} from "@/constants/seo";
import { EGG_TYPES } from "@/constants/landingCopy";

const JSON_LD = buildJsonLdScripts();

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta name="keywords" content={SITE_KEYWORDS} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href={pageUrl("/")} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:url" content={pageUrl("/")} />
        <meta property="og:title" content={OG_TITLE} />
        <meta property="og:description" content={OG_DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
        <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
        <meta property="og:image:alt" content={OG_IMAGE_ALT} />
        <meta property="og:locale" content="en_US" />
        <meta name="theme-color" content="#1A1A2E" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&display=swap" rel="stylesheet" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={OG_TITLE} />
        <meta name="twitter:description" content={OG_DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <meta name="twitter:image:alt" content={OG_IMAGE_ALT} />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        {JSON_LD.map((schema, index) => (
          <script
            id={`ld-site-${index}`}
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}

        <ScrollViewStyleReset />

        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                touch-action: manipulation;
                -ms-touch-action: manipulation;
                overscroll-behavior: none;
              }
              html, body, #root, #root * {
                -webkit-user-select: none;
                user-select: none;
                -webkit-touch-callout: none;
              }
              input, textarea, [contenteditable="true"], [data-allow-select="true"] {
                -webkit-user-select: text !important;
                user-select: text !important;
                touch-action: auto;
              }
              h1, h2, h3, h4 {
                margin: 0;
                padding: 0;
                display: block;
                box-sizing: border-box;
                font-family: inherit;
                line-height: normal;
                flex-grow: 0;
                flex-shrink: 0;
                min-height: 0;
              }
              #seo-noscript {
                display: none;
              }

              /* Landing page — responsive grids & gaming entry panel (web) */
              .landing-egg-grid,
              .landing-prize-grid {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: wrap !important;
                justify-content: space-between !important;
                align-content: flex-start !important;
                width: 100% !important;
                row-gap: 8px;
              }
              .landing-egg-card,
              .landing-prize-card {
                box-sizing: border-box !important;
                flex-grow: 0 !important;
                flex-shrink: 0 !important;
                width: 48% !important;
                max-width: 48% !important;
                flex-basis: 48% !important;
              }
              .landing-entry-panel {
                box-sizing: border-box;
                background: linear-gradient(180deg, rgba(255,215,0,0.06) 0%, rgba(15,52,96,0.4) 100%);
                border: 1px solid rgba(255,215,0,0.22);
                border-radius: 16px;
                box-shadow: 0 0 24px rgba(255,215,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06);
              }
              .landing-hero-title {
                text-shadow: 0 0 20px rgba(255,215,0,0.35), 0 2px 8px rgba(0,0,0,0.5);
              }
              @media (min-width: 640px) {
                .landing-egg-grid,
                .landing-prize-grid {
                  row-gap: 12px;
                }
              }
              @media (min-width: 768px) {
                .landing-egg-card {
                  width: 31.5% !important;
                  max-width: 31.5% !important;
                  flex-basis: 31.5% !important;
                }
              }
              @media (max-width: 359px) {
                .landing-egg-card,
                .landing-prize-card {
                  width: 48% !important;
                  max-width: 48% !important;
                  flex-basis: 48% !important;
                }
              }
            `,
          }}
        />
      </head>
      <body>
        <div
          id="seo-static"
          aria-hidden="true"
          style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}
        >
          <main>
            <h1>Tap2Crack: Tap the egg, crack it, win real rewards</h1>
            <p>{SITE_DESCRIPTION}</p>
            <h2>How Tap2Crack Works</h2>
            <ol>
              {HOW_IT_WORKS_STEPS.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}</strong>: {step.body}
                </li>
              ))}
            </ol>
            <h2>Egg types</h2>
            <ul>
              {EGG_TYPES.map((egg) => (
                <li key={egg.key}>{egg.name}</li>
              ))}
            </ul>
            <h2>Frequently asked questions</h2>
            <dl>
              {LANDING_FAQ_PREVIEW.map((item) => (
                <React.Fragment key={item.question}>
                  <dt>{item.question}</dt>
                  <dd>{item.answer}</dd>
                </React.Fragment>
              ))}
            </dl>
            <nav aria-label="Primary">
              <a href={pageUrl("/")}>Home</a> <a href={pageUrl("/how-to-play")}>How to Play</a>{" "}
              <a href={pageUrl("/faq")}>FAQ</a> <a href={pageUrl("/terms")}>Terms</a>{" "}
              <a href={pageUrl("/privacy-policy")}>Privacy</a> <a href={pageUrl("/sponsor")}>Contact</a>{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </nav>
          </main>
        </div>
        {children}
      </body>
    </html>
  );
}
