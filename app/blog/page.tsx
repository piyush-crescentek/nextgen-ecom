import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";
import BlogIndexView from "@/components/blog/BlogIndexView";
import { getAllPosts, paginate } from "@/lib/blogs";
import { fetchGlobalSeoSettings, fetchSeoSettings } from "@/lib/server-api";
import { buildDynamicPageMetadata } from "@/lib/seo-settings";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const [staticSeo, globalSeo] = await Promise.all([
        fetchSeoSettings("Static Pages", "blog"),
        fetchGlobalSeoSettings(),
    ]);

    return buildDynamicPageMetadata(staticSeo, globalSeo, {
        title: "Health Blog — Blood Testing Guides & At-Home Screening Articles",
        description:
            "Articles and guides on at-home blood testing kits, vitamin and hormone screening, understanding your results, and preventive health in Ireland.",
        path: "/blog",
    });
}

export default function BlogPage() {
    const allPosts = getAllPosts();
    const featured = allPosts.slice(0, 3);
    const page = paginate(allPosts, 1);

    if (page.totalPages === 0) notFound();

    return (
        <BlogIndexView
            posts={page.items}
            heading="Our Blogs"
            showFeaturedSlider
            featuredPosts={featured}
            pagination={{
                currentPage: page.currentPage,
                totalPages: page.totalPages,
                baseUrl: "/blog",
            }}
        />
    );
}
