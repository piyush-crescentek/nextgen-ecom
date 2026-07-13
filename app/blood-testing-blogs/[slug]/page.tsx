import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";
import BlogPostView from "@/components/blog/BlogPostView";
import {
    articleSchemaId,
    buildArticleSchema,
    buildBreadcrumbSchema,
    buildWebPageSchema,
    jsonLdString,
} from "@/lib/schema";
import { getCategoryUrl, getPostBySlug, getPostsByCategory } from "@/lib/blogs";

const CATEGORY_SLUG = "blood-testing-blogs";
export const revalidate = 3600;

export function generateStaticParams() {
    return getPostsByCategory(CATEGORY_SLUG).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const post = getPostBySlug(slug);
    if (!post || post.category.slug !== CATEGORY_SLUG) {
        return {
            title: slug,
            alternates: { canonical: `/${CATEGORY_SLUG}/${slug}` },
        };
    }
    const description = post.excerpt || `${post.title} — NexGen Healthcare blog.`;
    return {
        title: post.title,
        description,
        alternates: { canonical: `/${CATEGORY_SLUG}/${slug}` },
        openGraph: {
            title: post.title,
            description,
            type: "article",
            url: `/${CATEGORY_SLUG}/${slug}`,
            images: post.image ? [post.image] : [],
        },
    };
}

export default async function BloodTestingBlogPost({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const post = getPostBySlug(slug);
    if (!post || post.category.slug !== CATEGORY_SLUG) notFound();

    const urlPath = `/${CATEGORY_SLUG}/${post.slug}`;
    const description = post.excerpt || `${post.title} — NexGen Healthcare blog.`;
    const webPageSchema = buildWebPageSchema({
        path: urlPath,
        name: post.title,
        description,
        dateModified: post.modified,
        mainEntityId: articleSchemaId(urlPath),
    });
    const articleSchema = buildArticleSchema({
        title: post.title,
        slug: post.slug,
        image: post.image,
        date: post.date,
        modified: post.modified,
        author: post.author,
        category: post.category.name,
        excerpt: post.excerpt,
        urlPath,
    });
    const breadcrumb = buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: post.category.name, path: getCategoryUrl(CATEGORY_SLUG) },
        { name: post.title, path: urlPath },
    ]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLdString([webPageSchema, articleSchema, breadcrumb]),
                }}
            />
            <BlogPostView post={post} />
        </>
    );
}
