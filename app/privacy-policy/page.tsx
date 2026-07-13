import type { Metadata } from "next";
import PrivacyPolicy from "@/components/privacy-policy/PrivacyPolicy";
import { fetchGlobalSeoSettings, fetchSeoSettings } from "@/lib/server-api";
import { buildDynamicPageMetadata } from "@/lib/seo-settings";

export async function generateMetadata(): Promise<Metadata> {
  const [staticSeo, globalSeo] = await Promise.all([
    fetchSeoSettings("Static Pages", "privacy-policy"),
    fetchGlobalSeoSettings(),
  ]);

  return buildDynamicPageMetadata(staticSeo, globalSeo, {
    title: "Privacy Policy | NexGen Healthcare",
    description: "Read the privacy policy for NexGen Healthcare's at-home blood testing kit store.",
    path: "/privacy-policy",
  });
}

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}