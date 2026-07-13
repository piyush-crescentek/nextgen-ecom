import type { Metadata } from "next";
import Link from "next/link";
import ProductDetail from "@/components/products/ProductDetail";
import {
    fetchGlobalSeoSettings,
    fetchProductDetail,
    fetchRelatedProducts,
    fetchSeoSettings,
} from "@/lib/server-api";
import { buildDynamicPageMetadata } from "@/lib/seo-settings";
import {
    buildBreadcrumbSchema,
    buildProductSchema,
    buildFAQSchema,
    buildRelatedItemsSchema,
    jsonLdString,
} from "@/lib/schema";

export const revalidate = 3600;

const SLUG = "online-gp-appointment";

export async function generateMetadata(): Promise<Metadata> {
    const [product, dynamicSeo, globalSeo] = await Promise.all([
        fetchProductDetail(SLUG),
        fetchSeoSettings("Dynamic Pages", SLUG),
        fetchGlobalSeoSettings(),
    ]);
    if (!product) {
        return buildDynamicPageMetadata(dynamicSeo, globalSeo, {
            title: "Online GP Appointment",
            description:
                "Online GP appointment from Get Healthcare. IMC-registered Irish GPs available 24/7.",
            path: `/${SLUG}`,
        });
    }
    const description =
        product.product_display?.short_description ||
        product.description ||
        `${product.name} from Get Healthcare. IMC-registered Irish GPs available 24/7.`;
    return buildDynamicPageMetadata(dynamicSeo, globalSeo, {
        title: product.name,
        description,
        path: `/${SLUG}`,
    });
}

export default async function OnlineGPAppointmentPage() {
    const [product, globalSeo] = await Promise.all([
        fetchProductDetail(SLUG),
        fetchGlobalSeoSettings(),
    ]);

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#E7E9ED]">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[var(--maincolor)] mb-4">Product Not Found</h1>
                    <Link href="/" className="text-[var(--btncolor)] hover:underline">Return to Home</Link>
                </div>
            </div>
        );
    }

    const initialRelatedProducts = await fetchRelatedProducts(product.related_product_ids || []);

    const productPath = `/${SLUG}`;
    const breadcrumb = buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: product.name, path: productPath },
    ]);
    const productSchema = buildProductSchema(product, productPath, globalSeo);
    const faqSchema = buildFAQSchema(product.product_display?.faq);
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
            <ProductDetail product={product} initialRelatedProducts={initialRelatedProducts} />
        </>
    );
}
