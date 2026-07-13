import type { Metadata } from "next";
import HeroBanner from "@/components/banner/HeroBanner";
import PopularKitsSection from "@/components/home/PopularKitsSection";
import CliniciansSection from "@/components/home/CliniciansSection";
import {
    DoctorSection,
    FaqSection,
    PhysicalProductsSlider,
} from "@/components/layout";
import { MENU_VISIBILITY_SETTINGS } from "@/lib/menu-visibility";
import { FAQ_SECTION_CONTENT } from "@/lib/mockFaqSection";
import {
    fetchGlobalSeoSettings,
    fetchSeoSettings,
} from "@/lib/server-api";import {
    buildHomePageSchemas,
    jsonLdString,
} from "@/lib/schema";
import { buildDynamicPageMetadata, resolveToSiteUrl, type TwitterCard } from "@/lib/seo-settings";

export const revalidate = 3600;

const HOME_OG_TITLE =
    "Online Medical Certificate In Ireland, Get Sick Cert from GP, GHC";
const HOME_OG_DESCRIPTION =
    "Quick, trusted online medical certificates from €24.99, Online GP. No sign-up, no video needed. Student offers, express certs available. Irish registered doctors.";
const HOME_OG_IMAGE = "/images/hero-image1.webp";

export async function generateMetadata(): Promise<Metadata> {
    const [staticSeo, globalSeo] = await Promise.all([
        fetchSeoSettings("Static Pages", "home-page"),
        fetchGlobalSeoSettings(),
    ]);

    const base = buildDynamicPageMetadata(staticSeo, globalSeo, {
        title: "Online Medical Certificate in Ireland - Get Health Care",
        description:
            "Are you looking for a Medical Certificate? We provide online medical certificate services in Ireland. our service connects you with registered doctors. Book An Appointment.",
        path: "/",
    });

    const absoluteTitle =
        typeof base.title === "string" ?
            base.title
        :   "Online Medical Certificate in Ireland - Get Health Care";

    const ogFromBase = base.openGraph?.images;
    const hasOgImages =
        Array.isArray(ogFromBase) ? ogFromBase.length > 0 : Boolean(ogFromBase);

    const twitterFromBase = base.twitter?.images;
    const hasTwitterImages =
        Array.isArray(twitterFromBase) ? twitterFromBase.length > 0 : Boolean(twitterFromBase);

    const baseTwitterCard = (base.twitter as { card?: TwitterCard } | undefined)?.card;

    return {
        ...base,
        title: { absolute: absoluteTitle },
        openGraph: {
            ...base.openGraph,
            title: base.openGraph?.title ?? HOME_OG_TITLE,
            description: base.openGraph?.description ?? HOME_OG_DESCRIPTION,
            url: resolveToSiteUrl("/"),
            images:
                hasOgImages ?
                    base.openGraph?.images
                :   [
                        {
                            url: HOME_OG_IMAGE,
                            width: 864,
                            height: 950,
                            type: "image/webp",
                        },
                    ],
        },
        twitter: {
            ...base.twitter,
            card: baseTwitterCard ?? "summary_large_image",
            title: base.twitter?.title ?? HOME_OG_TITLE,
            description: base.twitter?.description ?? HOME_OG_DESCRIPTION,
            images: hasTwitterImages ? base.twitter?.images : [HOME_OG_IMAGE],
        },
        other: {
            ...(base.other as Record<string, string | number | (string | number)[]> | undefined),
            "article:modified_time": "2026-03-18T06:48:50+00:00",
        },
    };
}

export default async function Home() {
    const globalSeo = await fetchGlobalSeoSettings();
    const pageSchemas = buildHomePageSchemas(
        globalSeo,
        FAQ_SECTION_CONTENT.faqCategories,
    );

    return (
        <>
            {pageSchemas.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: jsonLdString(pageSchemas) }}
                />
            )}
            <div className="no-btn-hover">
                <HeroBanner />

                <PopularKitsSection />

                <div id="service_part" className="scroll-mt-18">
                    <DoctorSection />
                </div>
                {MENU_VISIBILITY_SETTINGS.SHOW_HOME_HEALTH_TEST_KITS_SECTION ? <PhysicalProductsSlider /> : null}
                <CliniciansSection />
                <FaqSection />
            </div>
        </>
    );
}