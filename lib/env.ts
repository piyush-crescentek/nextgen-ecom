/**
 * Central environment configuration.
 * Values are read from `.env` / `.env.local` (see `.env.example` for all options).
 */

function trim(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function withTrailingSlash(url: string): string {
  const base = stripTrailingSlash(url);
  return `${base}/`;
}

/** Next.js runtime mode. Options: `development` | `production` | `test` */
export type NodeEnv = "development" | "production" | "test";

export const nodeEnv: NodeEnv =
  (trim(process.env.NODE_ENV) as NodeEnv | undefined) || "development";

export const isProduction = nodeEnv === "production";
export const isDevelopment = nodeEnv === "development";
export const isTest = nodeEnv === "test";

/**
 * Backend API origin (no trailing slash).
 * @see `.env.example` — `NEXT_PUBLIC_API_URL`
 */
export const apiUrl = stripTrailingSlash(
  trim(process.env.NEXT_PUBLIC_API_URL) ?? "https://api.gethealthcare.ie",
);

/** API base URL with trailing slash (for axios `baseURL`). */
export const apiUrlWithSlash = withTrailingSlash(apiUrl);

/**
 * Public marketing site origin (no trailing slash).
 * Used for canonical URLs, Open Graph, sitemap, JSON-LD.
 * @see `.env.example` — `NEXT_PUBLIC_SITE_URL`
 */
export const siteUrl = stripTrailingSlash(
  trim(process.env.NEXT_PUBLIC_SITE_URL) ?? "https://gethealthcare.ie",
);

/**
 * Stripe publishable key (client-side checkout).
 * @see `.env.example` — `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
 */
export const stripePublishableKey =
  trim(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) ??
  "pk_test_51TOfMmRiC1bBdl1kf3MR6GIBdd8Hkq3qzrQm3YQ7dCvQntDzTgoAFqTbkqWy8BZ3NkqaAK6nipfH4d8GM3Oz1U8y00lRInpk3w";

function envSource(value: string | undefined): "env" | "fallback" {
  return trim(value) ? "env" : "fallback";
}

export function maskStripeKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

/** Debug info for Stripe checkout (publishable key is client-safe). */
export function getStripeEnvDebug() {
  const raw = trim(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  return {
    stripePublishableKey,
    source: envSource(raw),
    mode: stripePublishableKey.startsWith("pk_live") ? "live" : "test",
    masked: maskStripeKey(stripePublishableKey),
  };
}

/** Resolve a relative API media path to an absolute URL. */
export function apiAssetUrl(path: string | null | undefined, fallback?: string): string {
  const raw = trim(path ?? undefined) || fallback;
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${apiUrlWithSlash}${raw.replace(/^\//, "")}`;
}
