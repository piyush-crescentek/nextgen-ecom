import type { Metadata } from "next";
import ContactUs from "@/components/contact/ContactUs";
import { fetchGlobalSeoSettings, fetchSeoSettings } from "@/lib/server-api";
import { buildDynamicPageMetadata } from "@/lib/seo-settings";
import {
  buildBreadcrumbSchema,
  buildMedicalBusinessSchema,
  jsonLdString,
} from "@/lib/schema";

export async function generateMetadata(): Promise<Metadata> {
  const [staticSeo, globalSeo] = await Promise.all([
    fetchSeoSettings("Static Pages", "contact-us"),
    fetchGlobalSeoSettings(),
  ]);

  return buildDynamicPageMetadata(staticSeo, globalSeo, {
    title: "Contact Us | Get Healthcare",
    description: "Contact Get Healthcare for online GP and healthcare support in Ireland.",
    path: "/contact-us",
  });
}

export default async function contactPage() {
  const globalSeo = await fetchGlobalSeoSettings();
  const pageSchemas = [
    buildMedicalBusinessSchema(globalSeo),
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Contact Us", path: "/contact-us" },
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(pageSchemas) }}
      />
      <ContactUs />
    </>
  );
}
