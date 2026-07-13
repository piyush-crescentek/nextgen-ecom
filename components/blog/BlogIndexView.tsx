import React from "react";
import Link from "next/link";
import BlogFeaturedSlider from "@/app/blog/BlogFeaturedSlider";
import BlogSidebar from "./BlogSidebar";
import BlogPagination from "./BlogPagination";
import { type BlogPost, getPostUrl } from "@/lib/blogs";

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
}

interface BlogIndexViewProps {
    posts: BlogPost[];
    heading?: string;
    subheading?: string;
    activeCategorySlug?: string;
    activeTagSlug?: string;
    showFeaturedSlider?: boolean;
    featuredPosts?: BlogPost[];
    pagination?: PaginationInfo;
}

export default function BlogIndexView({
    posts,
    heading = "Our Blogs",
    subheading,
    activeCategorySlug,
    activeTagSlug,
    showFeaturedSlider = false,
    featuredPosts,
    pagination,
}: BlogIndexViewProps) {
    const featuredForSlider = (featuredPosts ?? []).map((p) => ({
        id: String(p.id),
        title: p.title,
        slug: p.slug,
        category: p.category.name,
        image: p.image,
        href: getPostUrl(p),
    }));

    return (
        <>
            {/* Banner */}
            <div className="flex items-center bg-[url(/images/banner.jpg)] bg-top bg-center bg-no-repeat bg-cover min-h-[400px] md:min-h-[440px] relative">
                <div
                    className="absolute top-0 left-0 w-full h-full bg-transparent
            bg-gradient-to-r from-(--maincolor) via-[#FFFFFF] via-[50%]
            mix-blend-multiply opacity-100"
                />
                <div className="container">
                    <div className="flex flex-col text-white md:mt-16">
                        <h1 className="text-[40px] font-bold mb-2">
                            {heading}
                        </h1>
                        {subheading && (
                            <div className="text-base font-normal">
                                {subheading}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showFeaturedSlider && featuredForSlider.length > 0 && (
                <div className="pt-12 lg:pt-16">
                    <div className="container">
                        <BlogFeaturedSlider posts={featuredForSlider} />
                    </div>
                </div>
            )}

            <section className="py-12 lg:py-20">
                <div className="container">
                    <div className="flex flex-col lg:flex-row gap-10 xl:gap-14">
                        <div className="lg:w-2/3">
                            {posts.length === 0 ? (
                                <div className="rounded-md border border-dashed border-(--maincolor)/20 bg-(--blockground) p-10 text-center">
                                    <p className="text-(--maincolor) font-bold mb-2">
                                        No posts yet
                                    </p>
                                    <p className="text-base text-(--textcolor) mb-5">
                                        Nothing here right now. Check back
                                        soon.
                                    </p>
                                    <Link
                                        href="/blog"
                                        className="btn btn-primary px-6 py-2 text-sm font-bold rounded-md"
                                        data-hover="All Blogs"
                                    >
                                        All Blogs
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {posts.map((post) => (
                                        <article
                                            key={post.id}
                                            className="group"
                                        >
                                            <Link href={getPostUrl(post)}>
                                                <div className="relative h-56 overflow-hidden rounded-md mb-4 shadow-sm">
                                                    <img
                                                        src={post.image}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                    <div className="absolute top-3 right-3">
                                                        <span className="bg-(--btncolor) text-white text-xs font-bold px-3 py-1 rounded">
                                                            {post.category.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                            <div className="flex items-center gap-2 text-xs text-(--textcolor)/70 mb-2 uppercase tracking-wider">
                                                <span>
                                                    {post.dateDisplay}
                                                </span>
                                                <span>•</span>
                                                <span>{post.author}</span>
                                            </div>
                                            <h2 className="text-lg font-bold text-(--maincolor) mb-3 leading-tight line-clamp-2">
                                                <Link
                                                    href={getPostUrl(post)}
                                                    className="hover:text-(--btncolor) transition-colors"
                                                >
                                                    {post.title}
                                                </Link>
                                            </h2>
                                            {post.excerpt && (
                                                <p className="text-base text-(--textcolor) line-clamp-3 leading-relaxed">
                                                    {post.excerpt}
                                                </p>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            )}

                            {pagination && (
                                <BlogPagination
                                    currentPage={pagination.currentPage}
                                    totalPages={pagination.totalPages}
                                    baseUrl={pagination.baseUrl}
                                />
                            )}
                        </div>

                        <BlogSidebar
                            activeCategory={activeCategorySlug}
                            activeTag={activeTagSlug}
                        />
                    </div>
                </div>
            </section>
        </>
    );
}
