import type { MetadataRoute } from "next";
import {
    fetchGlobalSeoSettings,
    fetchMenu,
    fetchSitemapSeoSettings,
} from "@/lib/server-api";
import {
    getAllPosts,
    getAllTags,
    getCategoriesWithCount,
    getCategoryPageUrl,
    getCategoryUrl,
    getPostsByCategory,
    getPostsByTag,
    getPostUrl,
    getTagPageUrl,
    getTagUrl,
    paginate,
} from "@/lib/blogs";
import { TESTING_KITS_SLUG } from "@/lib/constants";
import { isProduction } from "@/lib/env";
import { getSeoSiteUrl, parseSitemapEntries } from "@/lib/seo-settings";

export const revalidate = 3600;

interface StaticEntry {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
}

const STATIC_PAGES: StaticEntry[] = [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/about-us", changeFrequency: "monthly", priority: 0.7 },
    { path: "/contact-us", changeFrequency: "monthly", priority: 0.7 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
    { path: `/${TESTING_KITS_SLUG}`, changeFrequency: "weekly", priority: 0.8 },
    { path: `/${TESTING_KITS_SLUG}/categories`, changeFrequency: "weekly", priority: 0.7 },
    { path: "/blood-test-kits", changeFrequency: "monthly", priority: 0.6 },
    { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms-conditions", changeFrequency: "yearly", priority: 0.3 },
    { path: "/refund-policy", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();
    const [menu, globalSeo, sitemapSeo] = await Promise.all([
        fetchMenu(),
        fetchGlobalSeoSettings(),
        fetchSitemapSeoSettings(),
    ]);
    const dynamicSitemap = parseSitemapEntries(sitemapSeo, globalSeo);
    if (dynamicSitemap && dynamicSitemap.length > 0) {
        if (!isProduction) {
            console.warn(`[seo-health] sitemap.ts using Sitemap module (${dynamicSitemap.length} entries)`);
        }
        return dynamicSitemap;
    }
    if (!isProduction) {
        console.warn("[seo-health] sitemap.ts using generated fallback sitemap");
    }
    const siteUrl = getSeoSiteUrl();
    const url = (path: string) => `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;

    const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
        url: url(p.path),
        lastModified: now,
        changeFrequency: p.changeFrequency,
        priority: p.priority,
    }));

    const categoryEntries: MetadataRoute.Sitemap = menu
        .filter((c) => c.slug && c.type !== "physical")
        .map((c) => ({
            url: url(`/${c.slug}`),
            lastModified: now,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));

    const productEntries: MetadataRoute.Sitemap = [];
    for (const cat of menu) {
        if (!cat.slug || cat.type === "physical") continue;
        for (const product of cat.products || []) {
            if (
                cat.slug === "online-gp-appointment" &&
                product.slug === "online-gp-appointment"
            ) {
                continue; // canonical lives at /online-gp-appointment
            }
            productEntries.push({
                url: url(`/${cat.slug}/${product.slug}`),
                lastModified: now,
                changeFrequency: "weekly",
                priority: 0.7,
            });
        }
        for (const sub of cat.subcategories || []) {
            for (const product of sub.products || []) {
                productEntries.push({
                    url: url(`/${cat.slug}/${product.slug}`),
                    lastModified: now,
                    changeFrequency: "weekly",
                    priority: 0.7,
                });
            }
        }
    }

    const testingKitEntries: MetadataRoute.Sitemap = [];
    for (const cat of menu) {
        if (cat.type !== "physical") continue;
        for (const sub of cat.subcategories || []) {
            if (sub.slug) {
                testingKitEntries.push({
                    url: url(`/${TESTING_KITS_SLUG}/${sub.slug}`),
                    lastModified: now,
                    changeFrequency: "weekly",
                    priority: 0.7,
                });
            }
            for (const product of sub.products || []) {
                if (product.slug) {
                    testingKitEntries.push({
                        url: url(`/${TESTING_KITS_SLUG}/${product.slug}`),
                        lastModified: now,
                        changeFrequency: "weekly",
                        priority: 0.6,
                    });
                }
            }
        }
        for (const product of cat.products || []) {
            if (product.slug) {
                testingKitEntries.push({
                    url: url(`/${TESTING_KITS_SLUG}/${product.slug}`),
                    lastModified: now,
                    changeFrequency: "weekly",
                    priority: 0.6,
                });
            }
        }
    }

    const allBlogPosts = getAllPosts();
    const blogIndexPagination = paginate(allBlogPosts, 1).totalPages;
    const blogIndexPageEntries: MetadataRoute.Sitemap = [];
    for (let i = 2; i <= blogIndexPagination; i++) {
        blogIndexPageEntries.push({
            url: url(`/blog/page/${i}`),
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.5,
        });
    }

    const blogCategoryEntries: MetadataRoute.Sitemap = [];
    for (const { category } of getCategoriesWithCount()) {
        blogCategoryEntries.push({
            url: url(getCategoryUrl(category.slug)),
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.7,
        });
        const totalPages = paginate(getPostsByCategory(category.slug), 1).totalPages;
        for (let i = 2; i <= totalPages; i++) {
            blogCategoryEntries.push({
                url: url(getCategoryPageUrl(category.slug, i)),
                lastModified: now,
                changeFrequency: "weekly",
                priority: 0.5,
            });
        }
    }

    const blogTagEntries: MetadataRoute.Sitemap = [];
    for (const { tag } of getAllTags()) {
        blogTagEntries.push({
            url: url(getTagUrl(tag.slug)),
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.5,
        });
        const totalPages = paginate(getPostsByTag(tag.slug), 1).totalPages;
        for (let i = 2; i <= totalPages; i++) {
            blogTagEntries.push({
                url: url(getTagPageUrl(tag.slug, i)),
                lastModified: now,
                changeFrequency: "weekly",
                priority: 0.4,
            });
        }
    }

    const blogEntries: MetadataRoute.Sitemap = allBlogPosts.map((post) => {
        const parsed = new Date(post.modified || post.date);
        const lastModified = Number.isNaN(parsed.getTime()) ? now : parsed;
        return {
            url: url(getPostUrl(post)),
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.6,
        };
    });

    const all = [
        ...staticEntries,
        ...categoryEntries,
        ...productEntries,
        ...testingKitEntries,
        ...blogCategoryEntries,
        ...blogTagEntries,
        ...blogIndexPageEntries,
        ...blogEntries,
    ];

    // Dedupe by URL (later entries lose to earlier).
    const seen = new Set<string>();
    return all.filter((e) => {
        if (seen.has(e.url)) return false;
        seen.add(e.url);
        return true;
    });
}
