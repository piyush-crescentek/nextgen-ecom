"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation, Mousewheel, Keyboard } from 'swiper/modules';
import { useAuthStore } from "@/store/useAuthStore";
import { isVisible, getRestrictionMessage } from "@/lib/visibility";
import BusinessGroupBadge from "../products/BusinessGroupBadge";
import { toast } from "sonner";
import { getMockRelatedProducts } from "@/lib/mock-data";

interface RelatedProduct {
    id: number | string;
    category_id?: number | string;
    title: string;
    image: string;
    slug: string;
    category_slug?: string;
    subcategory_slug?: string;
    price: {
        max: string;
        min: string;
        currency: string;
    };
    description: string;
}

export default function ProductSlider({ relatedProductIds }: { relatedProductIds?: number[] }) {
    const { user } = useAuthStore();
    const [products, setProducts] = useState<RelatedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const getProductUrl = (product: RelatedProduct) => {
        if (product.subcategory_slug && product.category_slug) {
            return `/${product.subcategory_slug}/${product.slug}`;
        } else if (product.category_slug) {
            return `/${product.category_slug}/${product.slug}`;
        }

        return `/${product.slug}`;
    };

    const lastFetchedRef = useRef<string>("");

    useEffect(() => {
        // Static mock data — no API call is made.
        const idsString = JSON.stringify(relatedProductIds);
        if (!relatedProductIds || relatedProductIds.length === 0 || idsString === lastFetchedRef.current) return;

        lastFetchedRef.current = idsString;
        setIsLoading(true);
        setProducts(getMockRelatedProducts(relatedProductIds).map((p) => ({
            ...p,
            subcategory_slug: p.subcategory_slug ?? undefined,
        })));
        setIsLoading(false);
    }, [relatedProductIds]);

    if (!relatedProductIds || relatedProductIds.length === 0) return null;
    if (isLoading) return <div className="py-10 text-center">Loading related products...</div>;
    if (products.length === 0) return null;

    return (
        <div className="relative product-slider-container">
            <Swiper
                slidesPerView={3}
                spaceBetween={30}
                loop={products.length >= 3}
                enabled={true}
                speed={1000}
                navigation={{
                    nextEl: '.custom-next',
                    prevEl: '.custom-prev',
                }}
                breakpoints={{
                    320: { slidesPerView: 1, spaceBetween: 10 },
                    640: { slidesPerView: 2, spaceBetween: 20 },
                    768: { slidesPerView: 2, spaceBetween: 25 },
                    1024: { slidesPerView: 3, spaceBetween: 30 }
                }}
                modules={[Navigation, Mousewheel, Keyboard]}
                className="treatmentSwiper !overflow-visible"
            >
                {products.map((product, index) => (
                    <SwiperSlide key={product.slug || index}>
                        <div className={`group flex flex-col h-[454px] bg-(--foreground) rounded-lg relative overflow-hidden shadow-sm hover:shadow-md transition-shadow ${!isVisible({ id: product.id, category_id: product.category_id }, user?.business_group) ? 'opacity-50 grayscale' : ''}`}>
                            <div className="w-full h-[290px] overflow-hidden">
                                <Link
                                    href={isVisible({ id: product.id, category_id: product.category_id }, user?.business_group) ? getProductUrl(product) : "#"}
                                    onClick={(e) => {
                                        if (!isVisible({ id: product.id, category_id: product.category_id }, user?.business_group)) {
                                            e.preventDefault();
                                            toast.error(getRestrictionMessage());
                                        }
                                    }}
                                    className="block h-full"
                                >
                                    <Image
                                        className="w-full h-full object-cover object-center transition duration-500 group-hover:scale-105"
                                        src={product.image || "/images/placeholder.jpg"}
                                        alt={product.title}
                                        width={400}
                                        height={290}
                                    />
                                </Link>
                            </div>
                            <div className="text-(--maincolor) flex flex-col items-start justify-start grow space-y-2 p-6">
                                <div className="flex items-start justify-between gap-2 mb-3 min-w-0 pr-1 w-full">
                                    <h3 className="text-(--maincolor) text-lg xl:text-xl font-bold line-clamp-1 flex-1">{product.title}</h3>
                                    <BusinessGroupBadge product={{ id: product.id, category_id: product.category_id }} className="shrink-0 translate-y-0.5" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h6 className="text-lg font-normal flex items-center gap-2">
                                        <span className="amount font-bold">
                                            <bdi><span className="currencySymbol">{product.price.currency}</span>{product.price.min}</bdi>
                                        </span>
                                        {product.price.min !== product.price.max && (
                                            <>
                                                <span>–</span>
                                                <span className="amount font-bold">
                                                    <bdi><span className="currencySymbol">{product.price.currency}</span>{product.price.max}</bdi>
                                                </span>
                                            </>
                                        )}
                                    </h6>
                                </div>
                                <Link
                                    href={isVisible({ id: product.id, category_id: product.category_id }, user?.business_group) ? getProductUrl(product) : "#"}
                                    onClick={(e) => {
                                        if (!isVisible({ id: product.id, category_id: product.category_id }, user?.business_group)) {
                                            e.preventDefault();
                                            toast.error(getRestrictionMessage());
                                        }
                                    }}
                                    className="inline-flex items-center group pr-11 -ml-6 relative before:absolute before:top-1/2 before:left-30 before:-translate-y-1/2 before:w-10 before:h-[1px] before:bg-(--maincolor) transition-all duration-500 hover:pr-7 hover:ml-0 hover:before:w-6 hover:before:left-[116px] before:transition-width before:duration-700"
                                >
                                    <span className="text-(--maincolor) opacity-0 group-hover:opacity-100 group-hover:transition-opacity group-hover:duration-700 mr-2">
                                        <svg className="fill-(--maincolor) size-4" xmlns="http://www.w3.org/2000/svg" width="20" height="12" viewBox="0 0 20 12" fill="none"><path d="M19.5303 6.53033C19.8232 6.23744 19.8232 5.76256 19.5303 5.46967L14.7574 0.696699C14.4645 0.403806 13.9896 0.403806 13.6967 0.696699C13.4038 0.989593 13.4038 1.46447 13.6967 1.75736L17.9393 6L13.6967 10.2426C13.4038 10.5355 13.4038 11.0104 13.6967 11.3033C13.9896 11.5962 14.4645 11.5962 14.7574 11.3033L19.5303 6.53033ZM0 6.75H19V5.25H0V6.75Z" fill="" /></svg>
                                    </span>
                                    {isVisible({ id: product.id, category_id: product.category_id }, user?.business_group) ? "Learn more" : "Unavailable"}
                                </Link>
                            </div>

                            {/* Overlay Card on Hover */}
                            <div className="absolute top-full left-0 w-full h-full bg-(--foreground) flex items-center opacity-0 p-6 transition-all duration-500 group-hover:top-0 group-hover:opacity-100 z-10">
                                <div className="text-(--maincolor) block space-y-6">
                                    <div>
                                        <Link
                                            href={isVisible({ id: product.id, category_id: product.category_id }, user?.business_group) ? getProductUrl(product) : "#"}
                                            onClick={(e) => {
                                                if (!isVisible({ id: product.id, category_id: product.category_id }, user?.business_group)) {
                                                    e.preventDefault();
                                                    toast.error(getRestrictionMessage());
                                                }
                                            }}
                                            className="block"
                                        >
                                        <div className="flex items-center gap-2 mb-2 min-w-0">
                                            <h3 className="text-(--maincolor) text-xl xl:text-2xl font-bold line-clamp-1 shrink-1">{product.title}</h3>
                                            <BusinessGroupBadge product={{ id: product.id, category_id: product.category_id }} className="shrink-0 z-30" />
                                        </div>
                                        </Link>
                                        <h6 className="text-lg font-normal flex items-center gap-2">
                                            <span className="amount font-bold">
                                                <bdi><span className="currencySymbol">{product.price.currency}</span>{product.price.min}</bdi>
                                            </span>
                                            {product.price.min !== product.price.max && (
                                                <>
                                                    <span>–</span>
                                                    <span className="amount font-bold">
                                                        <bdi><span className="currencySymbol">{product.price.currency}</span>{product.price.max}</bdi>
                                                    </span>
                                                </>
                                            )}
                                        </h6>
                                    </div>
                                    <p className="!text-(--maincolor) text-sm/5 line-clamp-4">
                                        {product.description || `Consult our Irish-registered doctors for ${product.title.toLowerCase()} treatment online.`}
                                    </p>
                                    <Link
                                        href={isVisible({ id: product.id, category_id: product.category_id }, user?.business_group) ? getProductUrl(product) : "#"}
                                        onClick={(e) => {
                                            if (!isVisible({ id: product.id, category_id: product.category_id }, user?.business_group)) {
                                                e.preventDefault();
                                                toast.error(getRestrictionMessage());
                                            }
                                        }}
                                        className="inline-flex items-center group/link pr-11 -ml-6 relative before:absolute before:top-1/2 before:left-30 before:-translate-y-1/2 before:w-10 before:h-[1px] before:bg-(--maincolor) transition-all duration-500 hover:pr-7 hover:ml-0 hover:before:w-6 hover:before:left-[116px] before:transition-width before:duration-700"
                                    >
                                        <span className="text-(--maincolor) opacity-0 group-hover/link:opacity-100 group-hover/link:transition-opacity group-hover/link:duration-300 mr-2">
                                            <svg className="fill-(--maincolor) size-4" xmlns="http://www.w3.org/2000/svg" width="20" height="12" viewBox="0 0 20 12" fill="none"><path d="M19.5303 6.53033C19.8232 6.23744 19.8232 5.76256 19.5303 5.46967L14.7574 0.696699C14.4645 0.403806 13.9896 0.403806 13.6967 0.696699C13.4038 0.989593 13.4038 1.46447 13.6967 1.75736L17.9393 6L13.6967 10.2426C13.4038 10.5355 13.4038 11.0104 13.6967 11.3033C13.9896 11.5962 14.4645 11.5962 14.7574 11.3033L19.5303 6.53033ZM0 6.75H19V5.25H0V6.75Z" fill="" /></svg>
                                        </span>
                                        {isVisible({ id: product.id, category_id: product.category_id }, user?.business_group) ? "Learn more" : "Service Unavailable"}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Navigation Buttons */}
            {products.length > 3 && (
                <>
                    <div className="custom-prev absolute -left-12 top-1/2 -translate-y-1/2 z-10 cursor-pointer group hidden xl:block">
                        <div className="w-10 h-10 bg-(--blockground) rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                            <svg className="w-4.5 h-4.5 text-(--maincolor)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </div>
                    </div>
                    <div className="custom-next absolute -right-12 top-1/2 -translate-y-1/2 z-10 cursor-pointer group hidden xl:block">
                        <div className="w-10 h-10 bg-(--blockground) rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                            <svg className="w-4.5 h-4.5 text-(--maincolor)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}