import type { Metadata } from "next";
import TermsCondition from "@/components/terms-conditions/TermsCondition";
import { fetchGlobalSeoSettings, fetchSeoSettings } from "@/lib/server-api";
import { buildDynamicPageMetadata } from "@/lib/seo-settings";

export async function generateMetadata(): Promise<Metadata> {
    const [staticSeo, globalSeo] = await Promise.all([
        fetchSeoSettings("Static Pages", "terms-conditions"),
        fetchGlobalSeoSettings(),
    ]);

    return buildDynamicPageMetadata(staticSeo, globalSeo, {
        title: "Terms & Conditions | NexGen Healthcare",
        description: "Read the terms and conditions for ordering at-home blood testing kits from NexGen Healthcare.",
        path: "/terms-conditions",
    });
}

export default function TermsPage() {
    return <TermsCondition />;
}