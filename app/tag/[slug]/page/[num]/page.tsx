import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import React from "react";
import BlogIndexView from "@/components/blog/BlogIndexView";
import { buildBreadcrumbSchema, jsonLdString } from "@/lib/schema";
import {
    getAllTags,
    getPostsByTag,
    getTagBySlug,
    getTagPageUrl,
    getTagUrl,
    paginate,
    parsePageParam,
} from "@/lib/blogs";

export const revalidate = 3600;

export function generateStaticParams() {
    const params: { slug: string; num: string }[] = [];
    for (const { tag } of getAllTags()) {
        const totalPages = paginate(getPostsByTag(tag.slug), 1).totalPages;
        for (let i = 2; i <= totalPages; i++) {
            params.push({ slug: tag.slug, num: String(i) });
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
    const tag = getTagBySlug(slug);
    const page = parsePageParam(num);
    const name = tag?.name ?? slug;
    return {
        title: `Posts tagged "${name}" — Page ${page} — Get Healthcare`,
        description: `Page ${page} of articles tagged ${name}.`,
        alternates: { canonical: getTagPageUrl(slug, page) },
        robots: { index: false, follow: true },
    };
}

export default async function TagPagedPage({
    params,
}: {
    params: Promise<{ slug: string; num: string }>;
}) {
    const { slug, num } = await params;
    const requested = parsePageParam(num);
    if (requested === 1) permanentRedirect(getTagUrl(slug));

    const tag = getTagBySlug(slug);
    if (!tag) notFound();

    const allPosts = getPostsByTag(slug);
    const page = paginate(allPosts, requested);
    if (requested > page.totalPages) notFound();

    const breadcrumb = buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: tag.name, path: getTagUrl(slug) },
        { name: `Page ${page.currentPage}`, path: getTagPageUrl(slug, page.currentPage) },
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
                heading={`#${tag.name}`}
                subheading={`Page ${page.currentPage} of ${page.totalPages}`}
                activeTagSlug={slug}
                pagination={{
                    currentPage: page.currentPage,
                    totalPages: page.totalPages,
                    baseUrl: getTagUrl(slug),
                }}
            />
        </>
    );
}
