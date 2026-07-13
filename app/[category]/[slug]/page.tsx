import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import ProductDetail from "@/components/products/ProductDetail";
import {
  fetchProductDetail,
  fetchGlobalSeoSettings,
  fetchRelatedProducts,
  fetchMenu,
  fetchSeoSettings,
} from "@/lib/server-api";
import { buildDynamicPageMetadata, parseDynamicFaqSchema } from "@/lib/seo-settings";
import {
  buildBreadcrumbSchema,
  buildProductSchema,
  buildFAQSchema,
  buildRelatedItemsSchema,
  jsonLdString,
} from "@/lib/schema";

export const revalidate = 60;
// Physical product detail pages live under /testing-kits/[slug]; this route
// no longer serves any product, so unknown params 404 without rendering.
export const dynamicParams = false;

export async function generateStaticParams() {
  const menu = await fetchMenu();
  const params: { category: string; slug: string }[] = [];
  for (const cat of menu) {
    if (!cat.slug || cat.type === "physical") continue;
    for (const product of cat.products || []) {
      // Skip the duplicate /online-gp-appointment/online-gp-appointment route;
      // the dedicated /online-gp-appointment page is canonical for that product.
      if (cat.slug === "online-gp-appointment" && product.slug === "online-gp-appointment") continue;
      params.push({ category: cat.slug, slug: product.slug });
    }
    for (const sub of cat.subcategories || []) {
      for (const product of sub.products || []) {
        params.push({ category: cat.slug, slug: product.slug });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const [product, dynamicSeo, globalSeo] = await Promise.all([
    fetchProductDetail(slug),
    fetchSeoSettings("Dynamic Pages", slug),
    fetchGlobalSeoSettings(),
  ]);
  if (!product) {
    return buildDynamicPageMetadata(dynamicSeo, globalSeo, {
      title: slug,
      description: `${slug} from Get Healthcare.`,
      path: `/${category}/${slug}`,
    });
  }
  const description =
    product.product_display?.short_description ||
    product.description ||
    `${product.name} from Get Healthcare. IMC-registered Irish GPs.`;
  return buildDynamicPageMetadata(dynamicSeo, globalSeo, {
    title: product.name,
    description,
    path: `/${category}/${slug}`,
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  if (
    category === "treatments" &&
    (slug === "mens-health" || slug === "womens-health")
  ) {
    permanentRedirect(`/treatments?subcategory=${encodeURIComponent(slug)}`);
  }

  const [product, dynamicSeo, globalSeo] = await Promise.all([
    fetchProductDetail(slug),
    fetchSeoSettings("Dynamic Pages", slug),
    fetchGlobalSeoSettings(),
  ]);
  if (!product) notFound();
  const initialRelatedProducts = await fetchRelatedProducts(
    product.related_product_ids || [],
  );

  const productPath = `/${category}/${slug}`;
  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: product.category_name || category, path: `/${category}` },
    { name: product.name, path: productPath },
  ]);
  const productSchema = buildProductSchema(product, productPath, globalSeo);
  const faqSchema = parseDynamicFaqSchema(dynamicSeo) || buildFAQSchema(product.product_display?.faq);
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
    <div className="no-btn-hover">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString([breadcrumb, productSchema, faqSchema, relatedSchema]),
        }}
      />
      <ProductDetail
        product={product}
        initialRelatedProducts={initialRelatedProducts}
      />
    </div>
  );
}
