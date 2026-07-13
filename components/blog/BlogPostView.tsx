import React from "react";
import Link from "next/link";
import BlogSidebar from "./BlogSidebar";
import {
    type BlogPost,
    getAdjacentPosts,
    getCategoryUrl,
    getPostUrl,
    getRelatedPosts,
    getTagUrl,
} from "@/lib/blogs";

export default function BlogPostView({ post }: { post: BlogPost }) {
    const related = getRelatedPosts(post, 2);
    const { prev, next } = getAdjacentPosts(post);

    return (
        <>
            {/* Banner */}
            <div className="flex items-center bg-top bg-center bg-no-repeat bg-cover min-h-[400px] md:min-h-[440px] relative">
                <img
                    src={post.image}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                />
                <div
                    className="absolute top-0 left-0 w-full h-full bg-transparent
            bg-gradient-to-r from-(--maincolor) via-[#FFFFFF] via-[50%]
            mix-blend-multiply opacity-100"
                />
                <div className="container relative z-10">
                    <div className="flex flex-col text-white md:mt-16 max-w-3xl">
                        <Link
                            href={getCategoryUrl(post.category.slug)}
                            className="inline-block self-start bg-(--btncolor) text-white text-xs font-bold px-3 py-1 rounded mb-4 uppercase tracking-wider hover:bg-white hover:text-(--btncolor) transition-colors"
                        >
                            {post.category.name}
                        </Link>
                        <h1 className="text-2xl md:text-[40px] md:leading-tight font-bold mb-4">
                            {post.title}
                        </h1>
                        <div className="flex items-center gap-3 text-sm text-white/90">
                            <span>{post.author}</span>
                            <span className="opacity-60">•</span>
                            <span>{post.dateDisplay}</span>
                        </div>
                    </div>
                </div>
            </div>

            <section className="py-12 lg:py-20">
                <div className="container">
                    <div className="flex flex-col lg:flex-row gap-10 xl:gap-14">
                        <div className="lg:w-2/3">
                            <div className="mb-8 rounded-md overflow-hidden shadow-sm">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-auto"
                                    referrerPolicy="no-referrer"
                                />
                            </div>

                            <div
                                className="blog-prose"
                                dangerouslySetInnerHTML={{
                                    __html: post.content,
                                }}
                            />

                            {post.tags.length > 0 && (
                                <div className="mt-12 pt-8 border-t border-(--maincolor)/10">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-xs font-black text-(--maincolor) uppercase tracking-widest">
                                            Tags:
                                        </span>
                                        {post.tags.map((tag) => (
                                            <Link
                                                key={tag.slug}
                                                href={getTagUrl(tag.slug)}
                                                className="text-xs font-normal text-(--textcolor) bg-(--greenItem) px-3 py-1.5 rounded-full hover:bg-(--maincolor) hover:text-white transition-all border border-(--maincolor)/10"
                                            >
                                                {tag.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-16 border-t border-(--maincolor)/10 pt-8 flex justify-between text-xs font-bold uppercase tracking-widest gap-4">
                                {prev ? (
                                    <Link
                                        href={getPostUrl(prev)}
                                        className="text-(--textcolor) hover:text-(--btncolor) flex flex-col gap-1 max-w-[45%] transition-colors"
                                    >
                                        <span>&lsaquo; Previous</span>
                                        <span className="text-xs lowercase font-normal text-(--textcolor)/70 line-clamp-2">
                                            {prev.title}
                                        </span>
                                    </Link>
                                ) : (
                                    <span className="text-(--textcolor)/30 cursor-default">
                                        &lsaquo; Previous
                                    </span>
                                )}
                                {next ? (
                                    <Link
                                        href={getPostUrl(next)}
                                        className="text-(--textcolor) hover:text-(--btncolor) flex flex-col items-end gap-1 max-w-[45%] text-right transition-colors"
                                    >
                                        <span>Next &rsaquo;</span>
                                        <span className="text-xs lowercase font-normal text-(--textcolor)/70 line-clamp-2">
                                            {next.title}
                                        </span>
                                    </Link>
                                ) : (
                                    <span className="text-(--textcolor)/30 cursor-default">
                                        Next &rsaquo;
                                    </span>
                                )}
                            </div>

                            {related.length > 0 && (
                                <div className="mt-20">
                                    <h3 className="text-(--maincolor) text-2xl/8 md:text-3xl font-bold mb-8">
                                        You may also like
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {related.map((rel) => (
                                            <Link
                                                key={rel.id}
                                                href={getPostUrl(rel)}
                                                className="group"
                                            >
                                                <div className="relative h-48 rounded-md overflow-hidden mb-4 shadow-sm">
                                                    <img
                                                        src={rel.image}
                                                        alt={rel.title}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                    <div className="absolute top-3 right-3">
                                                        <span className="bg-(--btncolor) text-white text-xs font-bold px-3 py-1 rounded">
                                                            {rel.category.name}
                                                        </span>
                                                    </div>
                                                </div>
                                                <h4 className="text-base font-bold text-(--maincolor) group-hover:text-(--btncolor) leading-snug transition-colors">
                                                    {rel.title}
                                                </h4>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-12 text-center">
                                <Link
                                    href="/blog"
                                    className="btn btn-primary px-10 py-3 text-sm font-bold rounded-md uppercase tracking-wider"
                                    data-hover="All Blogs"
                                >
                                    All Blogs
                                </Link>
                            </div>
                        </div>

                        <BlogSidebar activeCategory={post.category.slug} />
                    </div>
                </div>
            </section>
        </>
    );
}
