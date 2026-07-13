import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import React from "react";
import BlogIndexView from "@/components/blog/BlogIndexView";
import { getAllPosts, paginate, parsePageParam } from "@/lib/blogs";

export const revalidate = 3600;

export function generateStaticParams() {
    const total = paginate(getAllPosts(), 1).totalPages;
    const params: { num: string }[] = [];
    for (let i = 2; i <= total; i++) params.push({ num: String(i) });
    return params;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ num: string }>;
}): Promise<Metadata> {
    const { num } = await params;
    const page = parsePageParam(num);
    return {
        title: `Healthcare Blog — Page ${page}`,
        description:
            "Articles and guides on online GP consultations, prescriptions, medical certificates, occupational health, and patient safety in Ireland.",
        alternates: { canonical: `/blog/page/${page}` },
        robots: { index: false, follow: true },
    };
}

export default async function BlogPagedPage({
    params,
}: {
    params: Promise<{ num: string }>;
}) {
    const { num } = await params;
    const requested = parsePageParam(num);
    if (requested === 1) permanentRedirect("/blog");

    const allPosts = getAllPosts();
    const page = paginate(allPosts, requested);
    if (requested > page.totalPages) notFound();

    return (
        <BlogIndexView
            posts={page.items}
            heading="Our Blogs"
            subheading={`Page ${page.currentPage} of ${page.totalPages}`}
            pagination={{
                currentPage: page.currentPage,
                totalPages: page.totalPages,
                baseUrl: "/blog",
            }}
        />
    );
}
