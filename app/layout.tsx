import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { Header, Footer, CartDrawer } from "@/components/layout";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import GlobalStateInitializer from "@/components/providers/GlobalStateInitializer";
import { Toaster } from "sonner";
import { buildWebSiteSchema, jsonLdString } from "@/lib/schema";
import { fetchGlobalSeoSettings, fetchHeaderFooterSeoSettings } from "@/lib/server-api";
import {
  getMetadataBaseUrl,
  getOpenGraphImageFields,
  getSeoOgImage,
  getSeoRobotsFromPolicy,
  resolveToSiteUrl,
} from "@/lib/seo-settings";
import CmsNextScripts from "@/components/seo/CmsNextScripts";
import MaintenanceMode from "@/components/common/MaintenanceMode";
import { dedupeCmsScriptGroups, parseCmsNextScriptMarkup } from "@/lib/parse-cms-script-markup";
import {
  getActiveMaintenanceWindow,
  getMaintenanceWindowDurationMs,
} from "@/lib/visibility";
import "./globals.css";


const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  // Do not call headers() here — with htmlLimitedBots enabled, runtime data in
  // generateMetadata can make Next.js fail static-shell validation (500 on live).
  // Per-route generateMetadata sets path-specific canonicals; this is the default.
  const globalSeo = await fetchGlobalSeoSettings();
  const canonicalUrl = resolveToSiteUrl("/");
  const brandName = globalSeo?.brand_name?.trim() || "Get Health care";
  const defaultTitle =
    globalSeo?.meta_title?.trim() ||
    `${brandName} | Online GP Consultations & Medical Certificates Ireland`;
  const defaultOgImage = getSeoOgImage(globalSeo);
  const defaultOgImageFields = getOpenGraphImageFields(defaultOgImage, globalSeo);
  const description =
    "IMC-registered Irish GPs online. Medical certificates, prescriptions, and consultations from €24.99. Available 24/7.";

  return {
    metadataBase: getMetadataBaseUrl(),
    icons: {
      icon: { url: "/favicon.png", type: "image/png" },
    },
    title: {
      default: defaultTitle,
      template: "%s",
    },
    description,
    openGraph: {
      title: defaultTitle,
      description,
      type: "website",
      url: canonicalUrl,
      locale: "en_IE",
      siteName: brandName,
      images: defaultOgImageFields ? [defaultOgImageFields] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      site: "@_gethealthcare_",
      images: defaultOgImage ? [defaultOgImage] : undefined,
    },
    verification: {
      google: "RTvQFFXrQEYErUkCSBYXcgjHFttDKuOh0pkQOKIoIV8",
    },
    other: {
      "article:publisher": "https://www.facebook.com/gethealthcare.ie",
    },
    robots: getSeoRobotsFromPolicy(globalSeo),
    alternates: { canonical: canonicalUrl },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // No request-time APIs (headers/cookies) here — the whole site renders
  // statically at build time from mock data.
  const [headerFooterSeo, globalSeo] = await Promise.all([
    fetchHeaderFooterSeoSettings(),
    fetchGlobalSeoSettings(),
  ]);
  const activeMaintenance = getActiveMaintenanceWindow();
  const siteSchemas = [buildWebSiteSchema(globalSeo)];
  const [headerScripts, footerScripts] = dedupeCmsScriptGroups(
    parseCmsNextScriptMarkup(headerFooterSeo?.header_scripts),
    parseCmsNextScriptMarkup(headerFooterSeo?.footer_scripts),
  );

  if (activeMaintenance) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${roboto.variable} antialiased`}
          suppressHydrationWarning
        >
          <MaintenanceMode
            window={activeMaintenance}
            durationMs={getMaintenanceWindowDurationMs(activeMaintenance)}
          />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://insightlens-api.goforlive.site/tracker/insightlens.js"
          data-site-key="il_c2faf2866dd27969d7bc24405324828d"
          data-ingest="https://insightlens-api.goforlive.site/api/v1/collect"
        />
      </head>
      <body
        className={`${roboto.variable} antialiased flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        <CmsNextScripts
          scripts={headerScripts}
          strategyOverride="beforeInteractive"
        />
        {siteSchemas.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdString(siteSchemas) }}
          />
        )}
        <Toaster position="top-right" richColors />
        <GlobalStateInitializer />
        <Header />
        <CartDrawer />
        <main className="grow">
          {children}
        </main>
        <WhatsAppButton />
        <Footer />
        <CmsNextScripts scripts={footerScripts} />
      </body>
    </html>
  );
}
