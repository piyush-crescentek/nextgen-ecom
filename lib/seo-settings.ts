import type { Metadata, MetadataRoute } from "next";
import type { SeoSettings } from "@/lib/server-api";
import { siteUrl as envSiteUrl } from "@/lib/env";

function cleanText(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeUrl(value?: string | null): string | undefined {
  const cleaned = cleanText(value);
  if (!cleaned) return undefined;
  return cleaned.replace(/\\/g, "/");
}

function toPositiveDimension(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = typeof value === "number" ? value : parseInt(String(value).trim(), 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n);
}

/** Builds a single Open Graph image object with optional width, height, and alt from SEO settings. */
export function getOpenGraphImageFields(
  imageUrl: string | undefined,
  settings?: SeoSettings | null,
): { url: string; width?: number; height?: number; alt?: string } | undefined {
  const url = normalizeUrl(imageUrl);
  if (!url) return undefined;
  const width = toPositiveDimension(settings?.og_image_width);
  const height = toPositiveDimension(settings?.og_image_height);
  const alt = cleanText(settings?.og_image_alt) || cleanText(settings?.featured_image_alt);
  return {
    url,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(alt ? { alt } : {}),
  };
}

function parseBooleanRobots(policy?: string | null): { index: boolean; follow: boolean } {
  const normalized = (policy || "").toLowerCase();
  const hasNoIndex = normalized.includes("noindex");
  const hasNoFollow = normalized.includes("nofollow");
  return {
    index: !hasNoIndex,
    follow: !hasNoFollow,
  };
}

export function getSeoSiteUrl(): string {
  return envSiteUrl;
}

/** Safe metadataBase — invalid NEXT_PUBLIC_SITE_URL must not 500 every page. */
export function getMetadataBaseUrl(): URL {
  try {
    return new URL(`${getSeoSiteUrl()}/`);
  } catch {
    return new URL("https://gethealthcare.ie/");
  }
}

/** Rewrites any path or absolute URL to the configured production site (e.g. gethealthcare.ie). */
export function resolveToSiteUrl(pathOrUrl?: string | null): string {
  const siteUrl = getSeoSiteUrl();
  const cleaned = cleanText(pathOrUrl);
  if (!cleaned || cleaned === "/") return `${siteUrl}/`;
  if (cleaned.startsWith("/")) return `${siteUrl}${cleaned}`;
  return rewriteSitemapHost(cleaned, siteUrl);
}

export function getSeoOgImage(globalSettings?: SeoSettings | null): string | undefined {
  return cleanText(globalSettings?.default_og_image);
}

export function getSeoRobotsFromPolicy(globalSettings?: SeoSettings | null): {
  index: boolean;
  follow: boolean;
} {
  return parseBooleanRobots(globalSettings?.default_robots_policy);
}

export type TwitterCard = "summary" | "summary_large_image" | "player" | "app";

const TWITTER_CARDS: readonly TwitterCard[] = [
  "summary",
  "summary_large_image",
  "player",
  "app",
];

function normalizeTwitterCard(raw?: string | null): TwitterCard {
  const cleaned = cleanText(raw)?.toLowerCase();
  if (!cleaned) return "summary_large_image";
  return (TWITTER_CARDS as readonly string[]).includes(cleaned)
    ? (cleaned as TwitterCard)
    : "summary_large_image";
}

// Next.js validates `openGraph.type` against this closed set at runtime and
// throws "Invalid OpenGraph type" for anything else. To preserve CMS values
// outside this set (e.g. "product"), we omit `openGraph.type` entirely and
// emit `og:type` via `Metadata.other`, which renders a raw <meta property>.
const NEXT_OG_TYPES: ReadonlySet<string> = new Set([
  "website",
  "article",
  "book",
  "profile",
  "music.song",
  "music.album",
  "music.playlist",
  "music.radio_station",
  "video.movie",
  "video.episode",
  "video.tv_show",
  "video.other",
]);

type StandardOgType =
  | "website"
  | "article"
  | "book"
  | "profile"
  | "music.song"
  | "music.album"
  | "music.playlist"
  | "music.radio_station"
  | "video.movie"
  | "video.episode"
  | "video.tv_show"
  | "video.other";

function resolveOgType(raw?: string | null): {
  value: string;
  isStandard: boolean;
} {
  const cleaned = cleanText(raw)?.toLowerCase();
  if (!cleaned) return { value: "website", isStandard: true };
  return { value: cleaned, isStandard: NEXT_OG_TYPES.has(cleaned) };
}

export function getSeoPageTitleDescription(
  dynamicSettings: SeoSettings | null,
  fallback: { title: string; description: string },
): { title: string; description: string } {
  return {
    title:
      cleanText(dynamicSettings?.meta_title) ||
      cleanText(dynamicSettings?.title) ||
      fallback.title,
    description:
      cleanText(dynamicSettings?.meta_description) ||
      cleanText(dynamicSettings?.description) ||
      fallback.description,
  };
}

export function buildDynamicPageMetadata(
  dynamicSettings: SeoSettings | null,
  globalSettings: SeoSettings | null,
  fallback: {
    title: string;
    description: string;
    path: string;
  },
): Metadata {
  const siteName = cleanText(globalSettings?.brand_name) || "Get Health care";
  const { title, description } = getSeoPageTitleDescription(dynamicSettings, fallback);

  // Page-level OG image wins; otherwise fall back to the Global Settings
  // `default_og_image` and source its alt/width/height from Global Settings
  // too (using dynamic page's alt for a global image would be misleading).
  const dynamicOgImage = normalizeUrl(dynamicSettings?.og_image);
  const ogImage = dynamicOgImage || getSeoOgImage(globalSettings);
  const ogImageFields = getOpenGraphImageFields(
    ogImage,
    dynamicOgImage ? dynamicSettings : globalSettings,
  );

  // `seo_title` and `meta_description` are normalized into `meta_title` /
  // `meta_description` upstream in fetchSeoSettings, so reading them here
  // already covers the CMS aliases.
  const canonical = resolveToSiteUrl(
    cleanText(dynamicSettings?.canonical_url) || fallback.path,
  );
  const ogTitle = cleanText(dynamicSettings?.og_title) || title;
  const ogDescription = cleanText(dynamicSettings?.og_description) || description;

  // Twitter falls back to OG (which itself falls back to seo_title /
  // meta_description). twitter:image:alt mirrors og:image:alt.
  const twitterTitle = cleanText(dynamicSettings?.twitter_title) || ogTitle;
  const twitterDescription = cleanText(dynamicSettings?.twitter_description) || ogDescription;
  const twitterImageUrl = normalizeUrl(dynamicSettings?.twitter_image) || ogImage;
  const twitterImageAlt = ogImageFields?.alt;
  const twitterImage = twitterImageUrl
    ? twitterImageAlt
      ? { url: twitterImageUrl, alt: twitterImageAlt }
      : twitterImageUrl
    : undefined;

  const ogTypeInfo = resolveOgType(dynamicSettings?.og_type);
  const twitterCard = normalizeTwitterCard(dynamicSettings?.twitter_card);
  const robotsRaw = cleanText(dynamicSettings?.robots || dynamicSettings?.index_status);
  const robots = robotsRaw
    ? {
        index: !robotsRaw.toLowerCase().includes("noindex"),
        follow: !robotsRaw.toLowerCase().includes("nofollow"),
      }
    : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      // Only set `type` when it's a Next.js-supported value. Non-standard
      // CMS values like "product" are emitted via `other.og:type` below;
      // omitting the key here avoids Next's "Invalid OpenGraph type" throw.
      ...(ogTypeInfo.isStandard
        ? { type: ogTypeInfo.value as StandardOgType }
        : {}),
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName,
      images: ogImageFields ? [ogImageFields] : undefined,
    },
    twitter: {
      card: twitterCard,
      title: twitterTitle,
      description: twitterDescription,
      images: twitterImage ? [twitterImage] : undefined,
    },
    robots,
    ...(!ogTypeInfo.isStandard
      ? { other: { "og:type": ogTypeInfo.value } }
      : {}),
  };
}

type FaqJsonItem = { question?: string; answer?: string };

export function parseDynamicFaqSchema(dynamicSettings?: SeoSettings | null): Record<string, unknown> | null {
  const rawFaqJson = cleanText(dynamicSettings?.faqs_json);
  if (!rawFaqJson) return null;

  try {
    const parsed = JSON.parse(rawFaqJson) as unknown;
    const items: FaqJsonItem[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { items?: FaqJsonItem[] })?.items)
        ? (parsed as { items: FaqJsonItem[] }).items
        : [];

    const mainEntity = items
      .map((item) => ({
        question: cleanText(item?.question),
        answer: cleanText(item?.answer),
      }))
      .filter((item) => item.question && item.answer)
      .map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      }));

    if (mainEntity.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity,
    };
  } catch {
    return null;
  }
}

type SitemapEntryShape = {
  // Standard XML sitemap field names
  loc?: string | null;
  lastmod?: string | null;
  changefreq?: string | null;
  // API / Next.js-style field names returned by the CMS
  url?: string | null;
  lastModified?: string | null;
  changeFrequency?: string | null;
  priority?: number | string | null;
};

type SitemapChangeFrequency = MetadataRoute.Sitemap[number]["changeFrequency"];

const SITEMAP_CHANGE_FREQUENCIES: ReadonlySet<string> = new Set([
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
]);

/** Accepts a CMS `changefreq` value only when it's a valid sitemap token. */
function normalizeChangeFrequency(value?: string | null): SitemapChangeFrequency {
  const cleaned = cleanText(value)?.toLowerCase();
  return cleaned && SITEMAP_CHANGE_FREQUENCIES.has(cleaned)
    ? (cleaned as SitemapChangeFrequency)
    : undefined;
}

/** Parses a CMS `priority` value and clamps it to the sitemap 0.0–1.0 range. */
function normalizeSitemapPriority(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = typeof value === "number" ? value : parseFloat(String(value).trim());
  if (!Number.isFinite(n)) return undefined;
  return Math.min(1, Math.max(0, n));
}

function rewriteSitemapHost(loc: string, siteUrl: string): string {
  try {
    const parsed = new URL(loc);
    const base = new URL(siteUrl);
    parsed.protocol = base.protocol;
    parsed.host = base.host;
    return parsed.toString();
  } catch {
    if (loc.startsWith("/")) return `${siteUrl}${loc}`;
    return loc;
  }
}

/**
 * Reads the sitemap entries from the dedicated "Sitemap" SEO module's
 * `sitemap_json` field exclusively. Every entry's host is rewritten to the
 * current site URL so a CMS row carrying a staging domain still produces
 * production-host links.
 */
export function parseSitemapEntries(
  sitemapSettings?: SeoSettings | null,
  globalSettings?: SeoSettings | null,
): MetadataRoute.Sitemap | null {
  if (!sitemapSettings) return null;
  if (sitemapSettings.sitemap_enabled === false) return null;

  const json = cleanText(sitemapSettings.sitemap_json);
  if (!json) return null;

  let rawEntries: SitemapEntryShape[] = [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (Array.isArray(parsed)) {
      rawEntries = parsed as SitemapEntryShape[];
    }
  } catch {
    return null;
  }
  if (rawEntries.length === 0) return null;

  void globalSettings;
  const siteUrl = getSeoSiteUrl();
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];
  for (const entry of rawEntries) {
    const loc = cleanText(entry?.loc) || cleanText(entry?.url);
    if (!loc) continue;
    const rewritten = rewriteSitemapHost(loc, siteUrl);
    if (seen.has(rewritten)) continue;
    seen.add(rewritten);

    const parsedDate = cleanText(entry?.lastmod) || cleanText(entry?.lastModified);
    const lastModifiedDate = parsedDate ? new Date(parsedDate) : new Date();
    const lastModified = Number.isNaN(lastModifiedDate.getTime())
      ? new Date()
      : lastModifiedDate;

    const changeFrequency = normalizeChangeFrequency(entry?.changefreq) || normalizeChangeFrequency(entry?.changeFrequency);
    const priority = normalizeSitemapPriority(entry?.priority);

    entries.push({
      url: rewritten,
      lastModified,
      ...(changeFrequency ? { changeFrequency } : {}),
      ...(priority !== undefined ? { priority } : {}),
    });
  }
  return entries.length > 0 ? entries : null;
}

export function parseRobotsTxt(globalSettings?: SeoSettings | null): MetadataRoute.Robots | null {
  const robotsTxt = cleanText(globalSettings?.robots_txt);
  if (!robotsTxt) return null;

  const lines = robotsTxt.split(/\r?\n/);
  const rules: MetadataRoute.Robots["rules"] = [];
  let currentUserAgent = "*";
  let currentAllow: string[] = [];
  let currentDisallow: string[] = [];

  const pushCurrentRule = () => {
    if (!currentUserAgent) return;
    const hasRules = currentAllow.length > 0 || currentDisallow.length > 0;
    if (!hasRules) return;
    rules.push({
      userAgent: currentUserAgent,
      allow: currentAllow.length === 1 ? currentAllow[0] : currentAllow,
      disallow: currentDisallow.length === 1 ? currentDisallow[0] : currentDisallow,
    });
  };

  let sitemap: string | undefined;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const [keyRaw, ...rest] = line.split(":");
    if (!keyRaw || rest.length === 0) continue;
    const key = keyRaw.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (!value) continue;

    if (key === "user-agent") {
      pushCurrentRule();
      currentUserAgent = value;
      currentAllow = [];
      currentDisallow = [];
      continue;
    }
    if (key === "allow") {
      currentAllow.push(value);
      continue;
    }
    if (key === "disallow") {
      currentDisallow.push(value);
      continue;
    }
    if (key === "sitemap") {
      sitemap = value;
    }
  }
  pushCurrentRule();

  if (rules.length === 0) return null;
  return { rules, sitemap };
}
