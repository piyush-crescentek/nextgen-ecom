import type { Metadata } from "next";
import AboutUs from "@/components/about/AboutUs";
import { fetchGlobalSeoSettings, fetchSeoSettings } from "@/lib/server-api";
import { buildDynamicPageMetadata } from "@/lib/seo-settings";
import {
  buildBreadcrumbSchema,
  buildMedicalBusinessSchema,
  jsonLdString,
} from "@/lib/schema";

export async function generateMetadata(): Promise<Metadata> {
  const [staticSeo, globalSeo] = await Promise.all([
    fetchSeoSettings("Static Pages", "about-us"),
    fetchGlobalSeoSettings(),
  ]);
// TODO: Add dynamic metadata for about us page
  return buildDynamicPageMetadata(staticSeo, globalSeo, {
    title: "About Us | NexGen Healthcare",
    description: "Learn more about NexGen Healthcare and our at-home blood testing kits delivered across Ireland.",
    path: "/about-us",
  });
}

export default async function aboutPage() {
  const globalSeo = await fetchGlobalSeoSettings();
  const pageSchemas = [
    buildMedicalBusinessSchema(globalSeo),
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "About Us", path: "/about-us" },
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(pageSchemas) }}
      />
      <AboutUs />
    </>
  );
}
