import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";
import BlogIndexView from "@/components/blog/BlogIndexView";
import { buildBreadcrumbSchema, buildWebPageSchema, jsonLdString } from "@/lib/schema";
import {
    getCategoriesWithCount,
    getCategoryBySlug,
    getCategoryUrl,
    getPostsByCategory,
    paginate,
} from "@/lib/blogs";

export const revalidate = 3600;

export function generateStaticParams() {
    return getCategoriesWithCount().map(({ category }) => ({
        slug: category.slug,
    }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const cat = getCategoryBySlug(slug);
    if (!cat) {
        return {
            title: slug,
            alternates: { canonical: getCategoryUrl(slug) },
        };
    }
    const title = `${cat.name} — Get Healthcare`;
    const description = `Articles in ${cat.name} from Get Healthcare.`;
    return {
        title,
        description,
        alternates: { canonical: getCategoryUrl(slug) },
        openGraph: {
            title,
            description,
            type: "website",
            url: getCategoryUrl(slug),
        },
    };
}

export default async function CategoryArchivePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const cat = getCategoryBySlug(slug);
    if (!cat) notFound();

    const allPosts = getPostsByCategory(slug);
    const page = paginate(allPosts, 1);
    const categoryUrl = getCategoryUrl(slug);
    const webPageSchema = buildWebPageSchema({
        path: categoryUrl,
        name: `${cat.name} — Get Healthcare`,
        description: `Articles in ${cat.name} from Get Healthcare.`,
    });
    const breadcrumb = buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: cat.name, path: categoryUrl },
    ]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLdString([webPageSchema, breadcrumb]),
                }}
            />
            <BlogIndexView
                posts={page.items}
                heading={cat.name}
                subheading={`${allPosts.length} ${allPosts.length === 1 ? "post" : "posts"} in ${cat.name}`}
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
