import { ScrollViewStyleReset } from 'expo-router/html';
import {
  OG_DESCRIPTION,
  OG_TITLE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_TITLE,
} from '@/constants/seo';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta name="keywords" content={SITE_KEYWORDS} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.tap2crackgame.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.tap2crackgame.com/" />
        <meta property="og:title" content={OG_TITLE} />
        <meta property="og:description" content={OG_DESCRIPTION} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={OG_TITLE} />
        <meta name="twitter:description" content={OG_DESCRIPTION} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
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
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
