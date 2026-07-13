import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";
import BlogIndexView from "@/components/blog/BlogIndexView";
import { buildBreadcrumbSchema, buildWebPageSchema, jsonLdString } from "@/lib/schema";
import {
    getAllTags,
    getPostsByTag,
    getTagBySlug,
    getTagUrl,
    paginate,
} from "@/lib/blogs";

export const revalidate = 3600;

export function generateStaticParams() {
    return getAllTags().map(({ tag }) => ({ slug: tag.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const tag = getTagBySlug(slug);
    if (!tag) {
        return {
            title: slug,
            alternates: { canonical: getTagUrl(slug) },
        };
    }
    const title = `Posts tagged "${tag.name}" — Get Healthcare`;
    const description = `Articles tagged ${tag.name} from Get Healthcare's online GP service in Ireland.`;
    return {
        title,
        description,
        alternates: { canonical: getTagUrl(slug) },
        openGraph: {
            title,
            description,
            type: "website",
            url: getTagUrl(slug),
        },
    };
}

export default async function TagArchivePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const tag = getTagBySlug(slug);
    if (!tag) notFound();
    const allPosts = getPostsByTag(slug);
    const page = paginate(allPosts, 1);
    const tagUrl = getTagUrl(slug);
    const webPageSchema = buildWebPageSchema({
        path: tagUrl,
        name: `Posts tagged "${tag.name}" — Get Healthcare`,
        description: `Articles tagged ${tag.name} from Get Healthcare's online GP service in Ireland.`,
    });
    const breadcrumb = buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: tag.name, path: tagUrl },
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
                heading={`#${tag.name}`}
                subheading={`${allPosts.length} ${allPosts.length === 1 ? "post" : "posts"} tagged ${tag.name}`}
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
