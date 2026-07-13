"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from 'swiper/react';
import { useAuthStore } from "@/store/useAuthStore";
import { isVisible, getRestrictionMessage } from "@/lib/visibility";
import { toast } from "sonner";
import { Navigation, Mousewheel, Autoplay } from 'swiper/modules';
import { apiAssetUrl } from "@/lib/env";
import { getMockHealthTestHomeProducts } from "@/lib/mock-data";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

interface ProductPrice {
    max: string | null;
    min: string | null;
    price: string;
    currency: string;
    discounted_price?: string;
    discount_percentage?: string;
}

interface Product {
    id: number | string;
    category_id?: number | string;
    title: string;
    image: string;
    slug: string;
    category_slug: string;
    subcategory_slug: string;
    price: ProductPrice;
    description: string;
    test_type: string;
    turnaround_time: string;
    results_delivery: string;
}

type ProductData = Record<string, Product[]>;

import { PopularTreatmentsSkeleton } from "./Skeletons";

export default function PhysicalProductsSlider() {
    const { user } = useAuthStore();
    const [data, setData] = useState<ProductData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("");
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        // Static mock data — no API call is made.
        const productData = getMockHealthTestHomeProducts() as unknown as ProductData;
        setData(productData);
        const keys = Object.keys(productData).sort((a, b) => {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();
            if (aLower.includes('female')) return -1;
            if (bLower.includes('female')) return 1;
            return 0;
        });
        if (keys.length > 0) {
            setActiveTab(keys[0]);
        } else {
            setHasError(true);
        }
        setLoading(false);
    }, []);

    const categories = data ? Object.keys(data).sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        if (aLower.includes('female')) return -1;
        if (bLower.includes('female')) return 1;
        return 0;
    }) : [];

    if (loading) {
        return <PopularTreatmentsSkeleton />;
    }

    if (hasError || !data || !activeTab) {
        return (
            <div className="bg-(--maincolor) py-12 lg:py-20">
                <div className="container">
                    <div className="mb-9">
                        <h6 className="text-white text-sm/6 font-bold uppercase">Health Test Kits</h6>
                        <h2 className="text-white text-2xl/8 lg:text-3xl font-bold">At Home Health Test Kits</h2>
                    </div>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
                            <svg className="size-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 0 0-1.022-.547l-2.387-.477a6 6 0 0 0-3.86.517l-.318.158a6 6 0 0 1-3.86.517L6.05 15.21a2 2 0 0 0-1.806.547M8 4h8l-1 1v5.172a2 2 0 0 0 .586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 0 0 9 10.172V5L8 4Z" />
                            </svg>
                        </div>
                        <h3 className="text-white text-xl font-bold mb-2">No Test Kits Available</h3>
                        <p className="text-white/60 text-sm max-w-sm">
                            We&apos;re currently updating our health test kit catalogue. Please check back soon for our full range of at-home testing solutions.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const products = data[activeTab] || [];

    // Helper to group products into slides of alternating 2 items and 1 item
    const getSlides = (items: Product[]) => {
        const slides: Product[][] = [];
        let i = 0;
        let pair = true;

        while (i < items.length) {
            if (pair) {
                slides.push(items.slice(i, i + 2));
                i += 2;
            } else {
                slides.push(items.slice(i, i + 1));
                i += 1;
            }
            pair = !pair;
        }
        return slides;
    };

    const slides = getSlides(products);

    return (
        <div className="bg-(--maincolor) py-12 lg:py-20 overflow-x-hidden">
            <div className="container">
                <div className="block mb-9">
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                        <div className="flex-1">
                            <h6 className="text-white text-sm/6 font-bold uppercase">Health Test Kits</h6>
                            <h2 className="text-white text-2xl/8 lg:text-3xl font-bold">
                                At Home Health Test Kits
                            </h2>
                        </div>
                        <div className="hidden sm:flex sm:w-32 md:w-34 xl:w-28 h-14 relative">
                            {/* Previous Button */}
                            <div className="custom-prev-products absolute left-0 top-1/2 -translate-y-1/2 z-10 cursor-pointer group">
                                <div className="w-12 h-12 bg-(--blockground) rounded-full shadow-lg flex items-center justify-center transition-all duration-300">
                                    <svg className="size-6 text-(--maincolor)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </div>
                            </div>
                            {/* Next Button */}
                            <div className="custom-next-products absolute right-0 top-1/2 -translate-y-1/2 z-10 cursor-pointer group">
                                <div className="w-12 h-12 bg-(--blockground) rounded-full shadow-lg flex items-center justify-center transition-all duration-300">
                                    <svg className="size-6 text-(--maincolor)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    {/* Tab Buttons */}
                    <div className="contents sm:flex items-center justify-between gap-6 mb-5">
                        <div className="contents sm:flex justify-start flex-wrap w-full xl:w-auto gap-3 md:gap-6 mb-2">
                            {categories.map((label) => (
                                <button
                                    key={label}
                                    onClick={() => setActiveTab(label)}
                                    className={`
                                        flex items-center justify-center gap-2 px-6 py-3 rounded-md text-base md:text-lg font-medium
                                        transition-all duration-500 cursor-pointer
                                        ${activeTab === label
                                            ? 'text-white bg-(--btncolor) border border-(--btncolor)'
                                            : 'bg-[#152A47] text-white border border-white'
                                        }
                                    `}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="contents">
                        <div className="sm:hidden flex w-26 h-14 ml-auto mb-5 relative">
                            {/* Previous Button */}
                            <div className="custom-prev-products absolute left-0 top-1/2 -translate-y-1/2 z-10 cursor-pointer group">
                                <div className="w-12 h-12 bg-(--blockground) rounded-full shadow-lg flex items-center justify-center transition-all duration-300">
                                    <svg className="size-6 text-(--maincolor)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </div>
                            </div>
                            {/* Next Button */}
                            <div className="custom-next-products absolute right-0 top-1/2 -translate-y-1/2 z-10 cursor-pointer group">
                                <div className="w-12 h-12 bg-(--blockground) rounded-full shadow-lg flex items-center justify-center transition-all duration-300">
                                    <svg className="size-6 text-(--maincolor)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="block w-full lg:w-[calc(100%+350px)]">
                            <Swiper
                                slidesPerView={4}
                                spaceBetween={30}
                                loop={true}
                                enabled={true}
                                speed={1500}
                                autoplay={{
                                    delay: 3000,
                                    disableOnInteraction: false,
                                    pauseOnMouseEnter: true,
                                }}
                                navigation={{
                                    nextEl: '.custom-next-products',
                                    prevEl: '.custom-prev-products',
                                }}
                                pagination={{
                                    clickable: false,
                                }}
                                breakpoints={{
                                    320: { slidesPerView: 1, spaceBetween: 10 },
                                    640: { slidesPerView: 2, spaceBetween: 20 },
                                    768: { slidesPerView: 2, spaceBetween: 25 },
                                    1024: { slidesPerView: 3, spaceBetween: 30 },
                                    1366: { slidesPerView: 4, spaceBetween: 30 }
                                }}
                                modules={[Navigation, Mousewheel, Autoplay]}
                                className="popularSwiper"
                                key={activeTab} // Force re-render on tab change to reset swiper
                            >
                                {slides.map((slideItems, slideIndex) => (
                                    <SwiperSlide key={`${activeTab}-slide-${slideIndex}`}>
                                        <div className="flex flex-col gap-7 h-[600px]">
                                            {slideItems.map((item) => (
                                                    <div
                                                        key={item.slug}
                                                        className={`group flex flex-col ${slideItems.length === 1 ? 'h-full' : 'h-1/2'} rounded-xl relative overflow-hidden before:absolute before:bottom-0 before:left-0 before:w-full before:h-[112px] before:z-[1] before:bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,#dae7d6_100%)] ${!isVisible({ id: item.id, category_id: item.category_id }, user?.business_group) ? 'opacity-50 grayscale' : ''}`}
                                                    >
                                                        <div className="w-full h-full bg-black overflow-hidden text-center">
                                                            <Link
                                                                href={isVisible({ id: item.id, category_id: item.category_id }, user?.business_group) ? `/${item.category_slug}/${item.slug}` : "#"}
                                                                onClick={(e) => {
                                                                    if (!isVisible({ id: item.id, category_id: item.category_id }, user?.business_group)) {
                                                                        e.preventDefault();
                                                                        toast.error(getRestrictionMessage());
                                                                    }
                                                                }}
                                                                className="block h-full"
                                                            >
                                                                <Image
                                                                    className="w-full h-full object-cover object-center transition-opacity duration-500"
                                                                    src={apiAssetUrl(item.image)}
                                                                    alt={item.title}
                                                                    width={500}
                                                                    height={400}
                                                                />
                                                            </Link>
                                                        </div>
                                                        {/* overlay div */}
                                                        <div className="absolute top-[calc(100%-110px)] left-0 w-full h-full z-[2] flex flex-col space-y-4 p-6 transition-[top,background-color] duration-500">
                                                            <h3 className="inline-block mb-2">
                                                                <Link
                                                                    href={isVisible({ id: item.id, category_id: item.category_id }, user?.business_group) ? `/${item.category_slug}/${item.slug}` : "#"}
                                                                    onClick={(e) => {
                                                                        if (!isVisible({ id: item.id, category_id: item.category_id }, user?.business_group)) {
                                                                            e.preventDefault();
                                                                            toast.error(getRestrictionMessage());
                                                                        }
                                                                    }}
                                                                    className="text-(--maincolor) text-xl xl:text-2xl font-bold"
                                                                >
                                                                    {item.title}
                                                                </Link>
                                                            </h3>
                                                            <h6 className="text-(--maincolor) text-lg font-normal flex items-center gap-2 opacity-0">
                                                                {item.price.discounted_price ? (
                                                                    <>
                                                                        <span className="amount">
                                                                            <bdi><span className="currencySymbol">{item.price.currency}</span>{item.price.discounted_price}</bdi>
                                                                        </span>
                                                                        <span className="text-sm line-through opacity-60">
                                                                            <bdi><span className="currencySymbol">{item.price.currency}</span>{item.price.price}</bdi>
                                                                        </span>
                                                                        <span className="text-xs bg-(--btncolor) text-white px-1.5 py-0.5 rounded ml-1 font-bold">
                                                                            -{item.price.discount_percentage}%
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="amount">
                                                                            <bdi><span className="currencySymbol">{item.price.currency}</span>{item.price.price || item.price.min}</bdi>
                                                                        </span>
                                                                        {(item.price.max && item.price.min !== item.price.max) && (
                                                                            <>
                                                                                <span>–</span>
                                                                                <span className="amount">
                                                                                    <bdi><span className="currencySymbol">{item.price.currency}</span>{item.price.max}</bdi>
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </h6>
                                                            <p className="!text-(--maincolor) text-sm/5">{item.description}</p>

                                                            {/* Additional info from new API */}
                                                            <div className="flex flex-col gap-2 mt-4 opacity-0 transition-opacity duration-500 delay-100">
                                                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-(--maincolor) font-bold uppercase tracking-wider">
                                                                    <span className="bg-[#dae7d6] px-2 py-1 rounded shadow-sm">{item.test_type}</span>
                                                                    <span className="bg-[#dae7d6] px-2 py-1 rounded shadow-sm">{item.turnaround_time}</span>
                                                                    <span className="bg-[#dae7d6] px-2 py-1 rounded shadow-sm">{item.results_delivery}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 p-6 w-full z-[3]">
                                                            <Link
                                                                href={isVisible({ id: item.id, category_id: item.category_id }, user?.business_group) ? `/${item.category_slug}/${item.slug}` : "#"}
                                                                onClick={(e) => {
                                                                    if (!isVisible({ id: item.id, category_id: item.category_id }, user?.business_group)) {
                                                                        e.preventDefault();
                                                                        toast.error(getRestrictionMessage());
                                                                    }
                                                                }}
                                                                className="text-(--maincolor) inline-flex items-center group/link pr-14 -ml-6 relative before:absolute before:top-1/2 before:left-34 before:-translate-y-1/2 before:w-10 before:h-[1px] before:bg-(--maincolor) transition-all duration-500 before:transition-width before:duration-700 font-bold"
                                                            >
                                                                <span className="text-(--maincolor) opacity-0 mr-2">
                                                                    <svg className="fill-(--maincolor) size-4" xmlns="http://www.w3.org/2000/svg" width="20" height="12" viewBox="0 0 20 12" fill="none">
                                                                        <path d="M19.5303 6.53033C19.8232 6.23744 19.8232 5.76256 19.5303 5.46967L14.7574 0.696699C14.4645 0.403806 13.9896 0.403806 13.6967 0.696699C13.4038 0.989593 13.4038 1.46447 13.6967 1.75736L17.9393 6L13.6967 10.2426C13.4038 10.5355 13.4038 11.0104 13.6967 11.3033C13.9896 11.5962 14.4645 11.5962 14.7574 11.3033L19.5303 6.53033ZM0 6.75H19V5.25H0V6.75Z" fill="" />
                                                                    </svg>
                                                                </span>
                                                                {isVisible({ id: item.id, category_id: item.category_id }, user?.business_group) ? "View Test Kit" : "Service Unavailable"}
                                                            </Link>
                                                        </div>
                                                    </div>

                                            ))}
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
