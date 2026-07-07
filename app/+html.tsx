import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>Tap2Crack  Egg - Tap, Crack, Win Money, Credits, Coupons</title>
        <meta
          name="description"
          content="Tap2Crack is an egg tapping game where you tap, crack eggs, and win money, airtime, discount vouchers, coupons, and tickets. Egg-citing fun: crack smart, win big, and don't loose your chance!"
        />
        <meta
          name="keywords"
          content="tap2crack, Tap2Crack, game, egg game, tap game, crack game, win money, tap, crack, win, loose, lose, credit, airtime credit, discount, voucher, coupons, ticket, prizes, egg jokes, play to win"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.tap2crackgame.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.tap2crackgame.com/" />
        <meta property="og:title" content="Tap2Crack - Tap, Crack, Win Money, Airtime And Discount Coupons" />
        <meta
          property="og:description"
          content="Crack eggs to win money, airtime, coupons, vouchers."
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tap2Crack" />
        <meta
          name="twitter:description"
          content="Tap, crack, and win money, credit, discount vouchers, coupons, and tickets."
        />
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
