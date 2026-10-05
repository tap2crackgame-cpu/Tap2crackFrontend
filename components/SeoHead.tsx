import { useEffect } from "react";
import { Platform } from "react-native";
import Head from "expo-router/head";
import {
  LANDING_FAQ_PREVIEW,
  OG_DESCRIPTION,
  OG_IMAGE,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  OG_TITLE,
  PAGE_SEO,
  SITE_NAME,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  pageUrl,
  type PageSeo,
} from "@/constants/seo";

type Props = {
  page?: keyof typeof PAGE_SEO;
  custom?: Partial<PageSeo>;
  faqSchema?: boolean;
};

// The build step (scripts/prerender-seo.mjs) already writes these into the HTML for crawlers
// that don't run JavaScript. Skip them here so they never appear twice.
const alreadyInHtml = (id: string) =>
  typeof document !== "undefined" && !!document.getElementById(id);

export default function SeoHead({ page = "home", custom, faqSchema = false }: Props) {
  const seo: PageSeo = { ...PAGE_SEO[page], ...custom };
  const canonical = pageUrl(seo.path);
  const robots =
    seo.robots ?? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const { title, description } = seo;

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    document.title = title;
  }, [title]);

  if (Platform.OS !== "web") return null;

  const isHome = seo.path === "/";
  const indexable = !robots.includes("noindex");
  const jsonLd: { id: string; schema: object }[] = [];
  if (faqSchema && !alreadyInHtml("ld-faq")) {
    jsonLd.push({ id: "ld-faq", schema: buildFaqJsonLd(isHome ? LANDING_FAQ_PREVIEW : undefined) });
  }
  if (!isHome && indexable && !alreadyInHtml("ld-breadcrumb")) {
    jsonLd.push({
      id: "ld-breadcrumb",
      schema: buildBreadcrumbJsonLd(seo.path, title.split(" – ")[0]),
    });
  }

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title || OG_TITLE} />
      <meta property="og:description" content={description || OG_DESCRIPTION} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
      <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
      <meta property="og:image:alt" content={OG_IMAGE_ALT} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || OG_TITLE} />
      <meta name="twitter:description" content={description || OG_DESCRIPTION} />
      <meta name="twitter:image" content={OG_IMAGE} />
      <meta name="twitter:image:alt" content={OG_IMAGE_ALT} />

      {jsonLd.map(({ id, schema }) => (
        <script
          key={id}
          id={id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Head>
  );
}
