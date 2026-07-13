import type { Metadata } from "next";
import Link from "next/link";
import AllKits from "@/components/all-kits/AllKits";
import ProductDetail from "@/components/products/ProductDetail";
import {
    fetchGlobalSeoSettings,
    fetchMenu,
    fetchProductDetail,
    fetchRelatedProducts,
    fetchSeoSettings,
} from "@/lib/server-api";
import { buildDynamicPageMetadata } from "@/lib/seo-settings";
import { TESTING_KITS_SLUG } from "@/lib/constants";
import type { Product } from "@/lib/types";
import {
    buildBreadcrumbSchema,
    buildProductSchema,
    buildFAQSchema,
    buildRelatedItemsSchema,
    buildWebPageSchema,
    jsonLdString,
} from "@/lib/schema";

export const revalidate = 3600;

type Resolution =
    | { type: "subcategory" }
    | { type: "product"; product: Product }
    | { type: "unknown" };

async function resolveSlug(slug: string): Promise<Resolution> {
    const menu = await fetchMenu();
    for (const cat of menu) {
        if (cat.slug === slug) return { type: "subcategory" };
        if (cat.subcategories?.some((sub) => sub.slug === slug)) {
            return { type: "subcategory" };
        }
    }
    const product = await fetchProductDetail(slug);
    if (product) return { type: "product", product };
    return { type: "unknown" };
}

export async function generateStaticParams() {
    const menu = await fetchMenu();
    const params: { subcategorySlug: string }[] = [];
    for (const cat of menu) {
        if (cat.type !== "physical") continue;
        if (cat.slug) params.push({ subcategorySlug: cat.slug });
        for (const sub of cat.subcategories || []) {
            if (sub.slug) params.push({ subcategorySlug: sub.slug });
            for (const product of sub.products || []) {
                if (product.slug) params.push({ subcategorySlug: product.slug });
            }
        }
        for (const product of cat.products || []) {
            if (product.slug) params.push({ subcategorySlug: product.slug });
        }
    }
    return params;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ subcategorySlug: string }>;
}): Promise<Metadata> {
    const { subcategorySlug } = await params;
    const path = `/${TESTING_KITS_SLUG}/${subcategorySlug}`;
    const [resolution, dynamicSeo, globalSeo] = await Promise.all([
        resolveSlug(subcategorySlug),
        fetchSeoSettings("Dynamic Pages", subcategorySlug),
        fetchGlobalSeoSettings(),
    ]);

    if (resolution.type === "product") {
        const product = resolution.product;
        const description =
            product.product_display?.short_description ||
            product.description ||
            `${product.name} from Get Healthcare.`;
        return buildDynamicPageMetadata(dynamicSeo, globalSeo, {
            title: product.name,
            description,
            path,
        });
    }

    const fallback = subcategorySlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    const description = `${fallback} — health test kits from Get Healthcare. IMC-registered Irish GPs.`;
    return buildDynamicPageMetadata(dynamicSeo, globalSeo, {
        title: fallback,
        description,
        path,
    });
}

export default async function SubcategoryOrProductPage({
    params,
}: {
    params: Promise<{ subcategorySlug: string }>;
}) {
    const { subcategorySlug } = await params;
    const resolution = await resolveSlug(subcategorySlug);

    if (resolution.type === "subcategory") {
        const subcategoryName = subcategorySlug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        const subcategoryPath = `/${TESTING_KITS_SLUG}/${subcategorySlug}`;
        const webPageSchema = buildWebPageSchema({
            path: subcategoryPath,
            name: subcategoryName,
            description: `${subcategoryName} — health test kits from Get Healthcare. IMC-registered Irish GPs.`,
        });
        const breadcrumb = buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Testing Kits", path: `/${TESTING_KITS_SLUG}` },
            { name: subcategoryName, path: subcategoryPath },
        ]);
        return (
            <>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: jsonLdString([webPageSchema, breadcrumb]) }}
                />
                <AllKits subcategorySlug={subcategorySlug} />
            </>
        );
    }

    if (resolution.type === "product") {
        const [initialRelatedProducts, globalSeo] = await Promise.all([
            fetchRelatedProducts(resolution.product.related_product_ids || []),
            fetchGlobalSeoSettings(),
        ]);
        const productPath = `/${TESTING_KITS_SLUG}/${subcategorySlug}`;
        const breadcrumb = buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Testing Kits", path: `/${TESTING_KITS_SLUG}` },
            { name: resolution.product.name, path: productPath },
        ]);
        const productSchema = buildProductSchema(resolution.product, productPath, globalSeo);
        const faqSchema = buildFAQSchema(resolution.product.product_display?.faq);
        const relatedSchema = buildRelatedItemsSchema(
            initialRelatedProducts.map((p) => ({
                title: p.title,
                slug: p.slug,
                category_slug: p.category_slug,
                subcategory_slug: p.subcategory_slug,
                image: p.image,
            })),
            productPath,
        );
        return (
            <>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: jsonLdString([breadcrumb, productSchema, faqSchema, relatedSchema]),
                    }}
                />
                <ProductDetail
                    product={resolution.product}
                    initialRelatedProducts={initialRelatedProducts}
                />
            </>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#E7E9ED]">
            <div className="text-center md:pt-[115px]">
                <h1 className="text-2xl font-bold text-[var(--maincolor)] mb-4">
                    Product Not Found
                </h1>
                <Link
                    href={`/${TESTING_KITS_SLUG}/categories`}
                    className="text-[var(--btncolor)] hover:underline"
                >
                    Return to All Kits
                </Link>
            </div>
        </div>
    );
}
