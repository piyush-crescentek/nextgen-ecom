import type { Metadata } from "next";
import RefundPolicy from "@/components/refund-policy/RefundPolicy";
import { fetchGlobalSeoSettings, fetchSeoSettings } from "@/lib/server-api";
import { buildDynamicPageMetadata } from "@/lib/seo-settings";

export async function generateMetadata(): Promise<Metadata> {
    const [staticSeo, globalSeo] = await Promise.all([
        fetchSeoSettings("Static Pages", "refund-policy"),
        fetchGlobalSeoSettings(),
    ]);

    return buildDynamicPageMetadata(staticSeo, globalSeo, {
        title: "Refund Policy | NexGen Healthcare",
        description: "Read the refund and returns policy for NexGen Healthcare blood testing kits.",
        path: "/refund-policy",
    });
}

export default function RefundPage() {
    return <RefundPolicy />;
}