import { ScrollViewStyleReset } from "expo-router/html";
import {
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  OG_TITLE,
  OG_DESCRIPTION,
  OG_IMAGE,
  SITE_NAME,
  pageUrl,
  buildJsonLdScripts,
  HOW_IT_WORKS_STEPS,
} from "@/constants/seo";

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
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={pageUrl("/")} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:url" content={pageUrl("/")} />
        <meta property="og:title" content={OG_TITLE} />
        <meta property="og:description" content={OG_DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={OG_TITLE} />
        <meta name="twitter:description" content={OG_DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        {JSON_LD.map((schema, index) => (
          <script
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
            `,
          }}
        />
      </head>
      <body>
        <noscript id="seo-noscript">
          <main>
            <h1>Tap, Crack, &amp; Win Real Rewards!</h1>
            <p>{SITE_DESCRIPTION}</p>
            <h2>How Tap2Crack Works</h2>
            <ol>
              {HOW_IT_WORKS_STEPS.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}</strong> — {step.body}
                </li>
              ))}
            </ol>
            <nav aria-label="Primary">
              <a href={pageUrl("/")}>Home</a>
              {" · "}
              <a href={pageUrl("/how-to-play")}>How to Play</a>
              {" · "}
              <a href={pageUrl("/faq")}>FAQ</a>
              {" · "}
              <a href={pageUrl("/terms")}>Terms</a>
              {" · "}
              <a href={pageUrl("/privacy-policy")}>Privacy</a>
              {" · "}
              <a href={pageUrl("/sponsor")}>Contact</a>
            </nav>
          </main>
        </noscript>
        {children}
      </body>
    </html>
  );
}
