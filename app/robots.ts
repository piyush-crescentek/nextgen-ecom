import type { MetadataRoute } from "next";
import {
  fetchGlobalSeoSettings,
  fetchRobotsSeoSettings,
} from "@/lib/server-api";
import { isProduction } from "@/lib/env";
import { getSeoSiteUrl, parseRobotsTxt } from "@/lib/seo-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Prefer the dedicated `robots-txt` module; fall back to Global Settings
  // for backward compatibility with CMS versions that stored the raw
  // robots.txt directly on the global settings row.
  const [robotsSeo, globalSeo] = await Promise.all([
    fetchRobotsSeoSettings(),
    fetchGlobalSeoSettings(),
  ]);
  const siteUrl = getSeoSiteUrl();
  const dynamicRobots =
    parseRobotsTxt(robotsSeo) || parseRobotsTxt(globalSeo);

  if (dynamicRobots) {
    if (!isProduction) {
      const source = parseRobotsTxt(robotsSeo)
        ? "robots-txt module"
        : "Global Settings";
      console.warn(`[seo-health] robots.ts using ${source} robots_txt`);
    }
    return {
      ...dynamicRobots,
      host: siteUrl,
      sitemap: dynamicRobots.sitemap || `${siteUrl}/sitemap.xml`,
    };
  }

  if (!isProduction) {
    console.warn("[seo-health] robots.ts using fallback robots rules");
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/my-account",
          "/cart",
          "/checkout",
          "/profile/",
          "/thank-you",
          "/lost-password",
          "/create-password",
          "/reset-password",
          "/verify-email",
          "/stripe/",
          "/wallet/",
          "/*?sessionId=*",
          "/*/checkout",
          "/*/form",
          "/testing-kits/*/physical-checkout-form",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
