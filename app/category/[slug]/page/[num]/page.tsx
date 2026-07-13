import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import React from "react";
import BlogIndexView from "@/components/blog/BlogIndexView";
import { buildBreadcrumbSchema, jsonLdString } from "@/lib/schema";
import {
    getCategoriesWithCount,
    getCategoryBySlug,
    getCategoryUrl,
    getPostsByCategory,
    paginate,
    parsePageParam,
} from "@/lib/blogs";

export const revalidate = 3600;

export function generateStaticParams() {
    const params: { slug: string; num: string }[] = [];
    for (const { category } of getCategoriesWithCount()) {
        const totalPages = paginate(getPostsByCategory(category.slug), 1).totalPages;
        for (let i = 2; i <= totalPages; i++) {
            params.push({ slug: category.slug, num: String(i) });
        }
    }
    return params;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string; num: string }>;
}): Promise<Metadata> {
    const { slug, num } = await params;
    const cat = getCategoryBySlug(slug);
    const page = parsePageParam(num);
    const name = cat?.name ?? slug;
    return {
        title: `${name} — Page ${page} — Get Healthcare`,
        description: `Page ${page} of articles in ${name}.`,
        alternates: { canonical: `${getCategoryUrl(slug)}/page/${page}` },
        robots: { index: false, follow: true },
    };
}

export default async function CategoryPagedPage({
    params,
}: {
    params: Promise<{ slug: string; num: string }>;
}) {
    const { slug, num } = await params;
    const requested = parsePageParam(num);
    if (requested === 1) permanentRedirect(getCategoryUrl(slug));

    const cat = getCategoryBySlug(slug);
    if (!cat) notFound();

    const allPosts = getPostsByCategory(slug);
    const page = paginate(allPosts, requested);
    if (requested > page.totalPages) notFound();

    const breadcrumb = buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: cat.name, path: getCategoryUrl(slug) },
        { name: `Page ${page.currentPage}`, path: `${getCategoryUrl(slug)}/page/${page.currentPage}` },
    ]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLdString(breadcrumb),
                }}
            />
            <BlogIndexView
                posts={page.items}
                heading={cat.name}
                subheading={`Page ${page.currentPage} of ${page.totalPages}`}
                activeCategorySlug={slug}
                pagination={{
                    currentPage: page.currentPage,
                    totalPages: page.totalPages,
                    baseUrl: getCategoryUrl(slug),
                }}
            />
        </>
    );
}
