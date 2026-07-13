import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { TESTING_KITS_SLUG } from "@/lib/constants";
import {
    fetchMenu,
    fetchMenuRaw,
    fetchCategoryLanding,
    fetchGlobalSeoSettings,
    fetchSeoSettings,
} from "@/lib/server-api";
import CategoryPageClient from "./CategoryPageClient";
import { buildBreadcrumbSchema, buildWebPageSchema, jsonLdString } from "@/lib/schema";
import {
    buildDynamicPageMetadata,
    getSeoPageTitleDescription,
    parseDynamicFaqSchema,
} from "@/lib/seo-settings";

export const revalidate = 3600;
// Only physical testing-kit routes exist now; any category slug not produced
// by generateStaticParams (i.e. all of them) returns 404 without rendering.
export const dynamicParams = false;

export async function generateStaticParams() {
    const menu = await fetchMenu();
    return menu
        .filter((c) => c.slug && c.type !== "physical")
        .map((c) => ({ category: c.slug }));
}

function categoryFallbackCopy(
    category: string,
    cat?: { name: string } | null,
    data?: { title?: string | null; name?: string | null; description?: string | null } | null,
) {
    const title =
        data?.title ||
        data?.name ||
        cat?.name ||
        category
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    const description =
        data?.description ||
        `${title} services from Get Healthcare. IMC-registered Irish GPs available 24/7.`;
    return { title, description };
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ category: string }>;
}): Promise<Metadata> {
    const { category } = await params;
    const [menu, staticSeo, globalSeo] = await Promise.all([
        fetchMenu(),
        fetchSeoSettings("Category Pages", category),
        fetchGlobalSeoSettings(),
    ]);
    const cat = menu.find((c) => c.slug === category);
    const data = cat ? await fetchCategoryLanding(cat.id || category, category) : null;
    const fallback = categoryFallbackCopy(category, cat, data);

    return buildDynamicPageMetadata(staticSeo, globalSeo, {
        ...fallback,
        path: `/${category}`,
    });
}

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ category: string }>;
}) {
    const { category } = await params;

    // Use the raw (unfiltered) menu for route resolution so that physical
    // categories which are hidden from the visible nav still redirect.
    const rawMenu = await fetchMenuRaw();
    const rawCat = rawMenu.find((c) => c.slug === category);
    if (rawCat?.type === "physical") {
        permanentRedirect(`/${TESTING_KITS_SLUG}`);
    }
    // Only physical testing-kit categories exist — anything else is not a page.
    if (!rawCat) {
        notFound();
    }

    const [menu, staticSeo] = await Promise.all([
        fetchMenu(),
        fetchSeoSettings("Category Pages", category),
    ]);
    const data = rawCat
        ? await fetchCategoryLanding(rawCat.id || category, category)
        : null;

    const fallback = categoryFallbackCopy(category, rawCat, data);
    const { title: pageTitle, description: pageDescription } = getSeoPageTitleDescription(
        staticSeo,
        fallback,
    );
    const categoryName = data?.name || rawCat?.name || fallback.title;
    const categoryPath = `/${category}`;
    const webPageSchema = buildWebPageSchema({
        path: categoryPath,
        name: pageTitle,
        description: pageDescription,
    });
    const breadcrumb = buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: categoryName, path: categoryPath },
    ]);
    const faqSchema = parseDynamicFaqSchema(staticSeo);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLdString([webPageSchema, breadcrumb, faqSchema]),
                }}
            />
            <CategoryPageClient
                categorySlug={category}
                initialCategoryData={data}
                initialMenuData={menu}
            />
        </>
    );
}
