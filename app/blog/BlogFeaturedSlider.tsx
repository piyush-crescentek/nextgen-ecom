"use client";

import React from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

interface FeaturedPost {
    id: string;
    title: string;
    slug: string;
    category: string;
    image: string;
    href: string;
}

export default function BlogFeaturedSlider({ posts }: { posts: FeaturedPost[] }) {
    return (
        <section className="relative z-20 blog-featured-slider">
            <Swiper
                modules={[Pagination, Autoplay]}
                spaceBetween={24}
                slidesPerView={1}
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000 }}
                breakpoints={{
                    640: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                }}
            >
                {posts.map((post) => (
                    <SwiperSlide key={post.id}>
                        <Link
                            href={post.href}
                            className="group relative block bg-white overflow-hidden rounded-md shadow-sm"
                        >
                            <div className="relative h-48 sm:h-56">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-3 right-3">
                                    <span className="bg-(--btncolor) text-white text-xs font-bold px-3 py-1 rounded">
                                        {post.category}
                                    </span>
                                </div>
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <h3 className="text-white text-base font-bold line-clamp-2 leading-snug">
                                        {post.title}
                                    </h3>
                                </div>
                            </div>
                        </Link>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
}
