import { useEffect } from "react";
import { Platform } from "react-native";
import Head from "expo-router/head";
import {
  OG_DESCRIPTION,
  OG_IMAGE,
  OG_TITLE,
  PAGE_SEO,
  SITE_NAME,
  buildFaqJsonLd,
  pageUrl,
  type PageSeo,
} from "@/constants/seo";

type Props = {
  page?: keyof typeof PAGE_SEO;
  custom?: Partial<PageSeo>;
  faqSchema?: boolean;
};

export default function SeoHead({ page = "home", custom, faqSchema = false }: Props) {
  const seo: PageSeo = {
    ...PAGE_SEO[page],
    ...custom,
  };

  const canonical = pageUrl(seo.path);
  const robots = seo.robots ?? "index, follow";
  const title = seo.title;
  const description = seo.description;

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    document.title = title;
  }, [title]);

  if (Platform.OS !== "web") return null;

  const jsonLd = faqSchema ? [buildFaqJsonLd()] : [];

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

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || OG_TITLE} />
      <meta name="twitter:description" content={description || OG_DESCRIPTION} />
      <meta name="twitter:image" content={OG_IMAGE} />

      {jsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Head>
  );
}
