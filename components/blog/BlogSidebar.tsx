import React from "react";
import Link from "next/link";
import {
    getAllPosts,
    getAllTags,
    getCategoriesWithCount,
    getCategoryUrl,
    getPostUrl,
    getTagUrl,
} from "@/lib/blogs";

export default function BlogSidebar({
    activeCategory,
    activeTag,
}: {
    activeCategory?: string;
    activeTag?: string;
}) {
    const categories = getCategoriesWithCount();
    const tags = getAllTags();
    const recentPosts = getAllPosts().slice(0, 3);

    return (
        <aside className="lg:w-1/3 space-y-12">
            <div>
                <h4 className="text-xs font-black text-(--maincolor) mb-6 uppercase tracking-widest flex items-center">
                    Categories
                    <span className="ml-3 h-[2px] w-8 bg-(--maincolor) opacity-40" />
                </h4>
                <ul className="space-y-4">
                    {categories.map(({ category, count }) => {
                        const isActive = activeCategory === category.slug;
                        return (
                            <li key={category.slug}>
                                <Link
                                    href={getCategoryUrl(category.slug)}
                                    className="flex justify-between items-center group"
                                >
                                    <span
                                        className={`text-sm font-normal transition-colors ${
                                            isActive
                                                ? "text-(--btncolor)"
                                                : "text-(--textcolor) group-hover:text-(--btncolor)"
                                        }`}
                                    >
                                        {category.name}
                                    </span>
                                    <span className="text-(--btncolor) text-sm font-bold">
                                        ({count})
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <div>
                <h4 className="text-xs font-black text-(--maincolor) mb-6 uppercase tracking-widest flex items-center">
                    Recent Posts
                    <span className="ml-3 h-[2px] w-8 bg-(--maincolor) opacity-40" />
                </h4>
                <div className="space-y-6">
                    {recentPosts.map((post) => (
                        <Link
                            key={post.id}
                            href={getPostUrl(post)}
                            className="flex gap-4 group"
                        >
                            <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-(--blockground)">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                            <div className="flex flex-col justify-center">
                                <h5 className="text-sm font-bold text-(--maincolor) line-clamp-2 group-hover:text-(--btncolor) transition-colors leading-snug">
                                    {post.title}
                                </h5>
                                <span className="text-xs text-(--textcolor)/70 mt-1">
                                    {post.dateDisplay}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {tags.length > 0 && (
                <div>
                    <h4 className="text-xs font-black text-(--maincolor) mb-6 uppercase tracking-widest flex items-center">
                        Tags
                        <span className="ml-3 h-[2px] w-8 bg-(--maincolor) opacity-40" />
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {tags.map(({ tag }) => {
                            const isActive = activeTag === tag.slug;
                            return (
                                <Link
                                    key={tag.slug}
                                    href={getTagUrl(tag.slug)}
                                    className={`text-xs font-normal px-3 py-1.5 rounded-full transition-all border ${
                                        isActive
                                            ? "bg-(--maincolor) text-white border-(--maincolor)"
                                            : "text-(--textcolor) bg-(--greenItem) border-(--maincolor)/10 hover:bg-(--maincolor) hover:text-white"
                                    }`}
                                >
                                    {tag.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="relative h-64 rounded-md overflow-hidden group shadow-sm">
                <img
                    src="/images/photo-kits4.jpg"
                    alt="At-home blood testing kits"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-(--maincolor)/85 flex flex-col items-center justify-center text-center p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <h4 className="text-white font-bold mb-3 uppercase tracking-widest text-xs">
                        Stay Connected
                    </h4>
                    <p className="text-white/80 text-xs mb-6 tracking-wide">
                        Subscribe for the latest healthcare news.
                    </p>
                    <Link
                        href="/contact-us"
                        className="btn btn-primary text-xs font-bold px-6 py-2 rounded-full"
                        data-hover="Join Now"
                    >
                        Join Now
                    </Link>
                </div>
            </div>
        </aside>
    );
}
