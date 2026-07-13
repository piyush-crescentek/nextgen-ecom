import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import { SEO_REDIRECTS } from "./lib/seo-redirects";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Next.js default HTML-limited bots, plus common SEO audit crawlers (e.g. Screaming Frog).
// Avoid /.*/ — matching every browser breaks when generateMetadata uses runtime data.
const HTML_LIMITED_BOTS =
  /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|Screaming Frog|Sitebulb|SemrushBot|AhrefsBot|MJ12bot|DotBot|PetalBot/i;

const nextConfig: NextConfig = {
  async redirects() {
    return SEO_REDIRECTS;
  },
  // Blocking metadata for HTML-limited bots so <title>/<meta>/canonical stay in <head>.
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  htmlLimitedBots: HTML_LIMITED_BOTS,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "piyush-crescentek-bucket.s3.ap-south-1.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gethealthcare-assests.s3.eu-west-1.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "getsickcert-api.makeitlive.info",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gethealthcare.ie",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.gethealthcare.ie",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "png.pngtree.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
