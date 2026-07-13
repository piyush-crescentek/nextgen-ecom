"use client";

import { useEffect, useMemo, useState } from "react";
import NextImage from "next/image";
import { useSearchParams } from "next/navigation";
import { getCategoryHeroImage, getCategoryHeroImageClass } from "@/lib/constants";
import ProductGrid, { type Product } from "./ProductGrid";
import ProductSlider from "../layout/ProductSlider";
import Trustpilot from "../layout/Trustpilot";

interface CategoryListingProps {
    title: string;
    image: string;
    description: string;
    shortDescription: string;
    products: Product[];
    categorySlug: string;
}

export default function CategoryListing({ title, image, description: _description, shortDescription, products, categorySlug }: CategoryListingProps) {
    const searchParams = useSearchParams();
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(categorySlug === 'treatments' ? 'mens-health' : null);

    useEffect(() => {
        if (categorySlug !== "treatments") return;
        const raw = (searchParams?.get("subcategory") || "").toLowerCase();
        if (raw === "mens-health" || raw === "womens-health") {
            setSelectedSubcategory(raw);
        }
    }, [categorySlug, searchParams]);

    const filteredProducts = useMemo(() => {
        if (!selectedSubcategory || categorySlug !== 'treatments') return products;
        return products.filter(product => product.subcategory_slug === selectedSubcategory);
    }, [products, selectedSubcategory, categorySlug]);

    const staticHero = getCategoryHeroImage(categorySlug);
    const heroSrc = staticHero ?? (image || "/images/banner.jpg");
    const heroImageClass = getCategoryHeroImageClass(categorySlug);

    return (
        <>
            {/* Banner */}
            <section className="bg-[#E7E9ED] overflow-hidden">
                <div className="grid md:grid-cols-2 md:min-h-[550px]">
                    <div className="order-2 md:order-1 flex items-center bg-[#E7E9ED]">
                        <div className="container w-full py-8 md:py-12 md:pr-9">
                            <div className="space-y-2 md:space-y-4 text-center sm:text-left max-w-xl animated fadeInRight">
                                <h1 className="text-(--maincolor) text-[30px] md:text-[40px] md:leading-none lg:text-6xl xl:text-[64px] font-bold">
                                    {title}
                                </h1>
                                <p className="text-(--maincolor) text-base/6 md:text-lg lg:text-xl/8 font-normal">
                                    {shortDescription}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 md:order-2 relative w-full h-[280px] sm:h-[360px] md:h-full md:min-h-[550px]">
                        <NextImage
                            className={heroImageClass}
                            src={heroSrc}
                            alt={title}
                            fill
                            priority
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>
                </div>
            </section>

            <div className="py-12 lg:py-20">
                <div className="container">

                    {categorySlug === 'treatments' && (
                        <div>
                            {/* <div className="flex flex-col items-center w-full mb-8 lg:mb-10">
                                <h2 className="text-(--maincolor) text-2xl/8 md:text-3xl font-bold text-center">
                                    Comprehensive Treatments at Your Fingertips!
                                </h2>
                                <div className="contents md:flex justify-center gap-6 my-8 lg:my-12" role="tablist">
                                    <button
                                        onClick={() => setSelectedSubcategory('mens-health')}
                                        className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-md font-normal transition-all duration-500 cursor-pointer ${selectedSubcategory === 'mens-health'
                                            ? 'text-white bg-(--maincolor) border border-(--maincolor)'
                                            : 'bg-(--blockground) text-(--maincolor) border border-(--maincolor)'
                                            }`}
                                        role="tab"
                                        aria-selected={selectedSubcategory === 'mens-health'}
                                    >
                                        <span className="shrink-0">
                                            <svg fill="none" stroke="currentColor" width="24" height="24" viewBox="0 0 20.46 20.77" className={selectedSubcategory === 'mens-health' ? "size-6" : "size-6"}>
                                                <path d="M6.31,11.59c-.68-.56-1.04-1.28-1.2-2.1-.01-.07-.07-.17-.13-.19-.37-.16-.66-.42-.85-.76-.17-.31-.33-.64-.43-.97-.2-.69.02-1.12.67-1.39-.08-.36-.18-.72-.25-1.08-.45-2.25.84-4.04,2.63-4.74,1.7-.67,3.28-.37,4.66.85.65.58.97,1.33.97,2.19,0,.84-.07,1.69-.11,2.53,0,.07,0,.14-.01.22.73.14.95.78.75,1.46-.15.52-.38.99-.78,1.37-.05.05-.1.12-.17.14-.39.12-.47.43-.55.78-.16.65-.49,1.19-1,1.63-.05.04-.08.15-.06.22.05.2.12.39.2.58.03.07.12.15.19.17.06.01.15-.06.2-.12,1.08-1.38,2.49-2.09,4.23-2.09,3.02,0,5.42,2.62,5.19,5.63-.21,2.74-2.44,4.85-5.2,4.86-4.74.01-9.48,0-14.22,0-.34,0-.59-.14-.77-.42-.19-.28-.26-.6-.26-.93,0-.88,0-1.77,0-2.65-.01-1.06.42-1.9,1.25-2.55.79-.61,1.7-.95,2.63-1.24.6-.19,1.21-.36,1.83-.53.15-.04.24-.11.3-.25.09-.21.19-.41.3-.62ZM5.4,13.18c-.48.14-.95.27-1.42.42-.81.26-1.6.55-2.29,1.06-.72.54-1.1,1.24-1.08,2.15.02.85,0,1.69,0,2.54,0,.16.03.33.08.49.06.22.2.32.45.32,3.78,0,7.55,0,11.33,0h.25c-1.97-1.21-2.86-2.93-2.74-5.19-1.82,1.03-3.97.18-4.59-1.79ZM10.59,15.52c0,2.53,2.07,4.62,4.59,4.63,2.58.01,4.67-2.07,4.68-4.64,0-2.52-2.08-4.62-4.6-4.63-2.59,0-4.66,2.05-4.67,4.64ZM8.79,4.93c.11.12.16.18.22.24.07.07.14.13.2.2.18.21.1.47-.17.51-.21.04-.44.05-.65.04-.69-.03-1.23-.33-1.57-.95-.13-.24-.22-.5-.32-.76-.13-.34-.24-.39-.55-.18-.12.08-.24.2-.31.33-.11.19-.22.39-.25.6-.08.51-.1,1.03-.16,1.54-.02.16-.09.35-.2.46-.14.13-.29.01-.42-.09-.15-.12-.3-.07-.35.12-.02.1-.03.21,0,.3.1.41.25.8.54,1.11.12.13.27.26.44.31.4.13.41.11.46.53.26,2.06,2.59,3.1,4.28,1.89.68-.49.96-1.2,1.06-2,.03-.29.09-.35.36-.41.12-.03.26-.08.35-.16.42-.37.62-.85.72-1.39.01-.06,0-.14-.02-.19-.04-.07-.09-.17-.15-.19-.06-.02-.17.04-.22.1-.1.11-.2.19-.36.15-.17-.05-.21-.2-.24-.36-.08-.53-.16-1.07-.27-1.59-.07-.34-.2-.67-.31-1.01-.02,0-.04,0-.06,0-.46.76-1.16.96-2.04.84ZM11.76,4.56c0-.41.03-.89,0-1.36-.05-.66-.34-1.22-.85-1.64-1.26-1.03-2.67-1.24-4.12-.55-1.43.68-2.2,1.85-2.13,3.48,0,.15.04.3.07.47.13-.32.23-.6.37-.86.18-.35.46-.6.84-.73.59-.2.89-.06,1.11.51.1.26.2.53.32.79.18.36.48.57.91.62-.09-.14-.17-.26-.23-.39-.15-.33.03-.61.39-.61.18,0,.36.02.54.04.75.07,1.12-.13,1.47-.79.03-.05.05-.11.08-.16.15-.28.41-.31.58-.04.24.41.46.84.66,1.21ZM6.02,13.01c.03.1.06.2.09.29.44,1.05,1.55,1.65,2.67,1.45.96-.17,1.62-.8,1.77-1.72-.31-.02-.41-.25-.49-.5-.06-.21-.14-.41-.22-.6-1.02.39-2.01.38-2.99,0-.32.35-.27.94-.84,1.09Z" />
                                            </svg>
                                        </span>
                                        <span>Men’s Health</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedSubcategory('womens-health')}
                                        className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-md font-normal transition-all duration-500 cursor-pointer ${selectedSubcategory === 'womens-health'
                                            ? 'text-white bg-(--maincolor) border border-(--maincolor)'
                                            : 'bg-(--blockground) text-(--maincolor) border border-(--maincolor)'
                                            }`}
                                        role="tab"
                                        aria-selected={selectedSubcategory === 'womens-health'}
                                    >
                                        <span className="shrink-0">
                                            <svg fill="none" stroke="currentColor" width="24" height="24" viewBox="0 0 20.69 20.46" className={selectedSubcategory === 'womens-health' ? "size-6" : "size-6"}>
                                                <path d="M13.82,10.28c.67-.21,1.32-.29,1.99-.25,2.3.14,4.27,1.82,4.76,4.08.64,2.94-1.29,5.8-4.27,6.29-.28.05-.56.06-.85.06-4.75,0-9.5,0-14.24,0-.84,0-1.37-.66-1.17-1.48.21-.92.44-1.83.67-2.75.22-.89.72-1.59,1.41-2.17.15-.12.24-.25.3-.44.57-1.8.69-3.64.59-5.51-.11-2.03.21-3.98,1.27-5.76.67-1.12,1.6-1.95,2.91-2.22,1.59-.33,3.08-.1,4.31,1.08.71.69,1.12,1.56,1.41,2.49.33,1.05.5,2.13.61,3.22.11,1.1.2,2.21.31,3.35ZM5.52,13.05c-.91.3-1.79.61-2.58,1.14-.85.58-1.45,1.32-1.69,2.34-.2.87-.42,1.73-.62,2.6-.1.42.15.7.59.7,3.83,0,7.66,0,11.5,0h.25c-2.02-1.27-2.9-3.06-2.67-5.41-1.51,1.23-4.03.79-4.77-1.38ZM15.47,10.63c-2.65.05-4.66,2.12-4.61,4.75.05,2.5,2.16,4.52,4.7,4.47,2.53-.04,4.57-2.15,4.53-4.68-.04-2.52-2.15-4.59-4.62-4.54ZM4.67,6.06c.02-.34.02-.68.05-1.02.08-.7.3-1.34.83-1.85.25-.24.48-.17.58.16.2.64.59,1.1,1.27,1.24.71.15,1.28-.14,1.75-.65.38-.41.88-.49,1.38-.24.57.29.76.8.81,1.38.03.44,0,.89,0,1.36.05-.03.07-.03.08-.05.29-.26.62-.34.98-.15.31.16.51.53.42.92-.09.38-.24.76-.41,1.11-.16.34-.43.61-.79.75-.14.06-.18.14-.2.27-.15.75-.48,1.41-1.08,1.91-.05.04-.09.13-.09.2,0,.24-.06.52.04.7.09.14.39.14.6.21.02,0,.04.02.06.02.08-.02.19-.03.23-.08.51-.71,1.15-1.27,1.92-1.66.1-.05.13-.1.12-.22-.15-1.48-.28-2.96-.45-4.44-.12-1.03-.37-2.04-.82-2.99C10.84.58,7.91-.16,5.89,1.41c-.64.5-1.1,1.15-1.43,1.89-.7,1.55-.95,3.17-.84,4.86.08,1.29.04,2.58-.19,3.86-.08.43-.18.86-.27,1.3.03,0,.05,0,.07-.02.86-.44,1.78-.74,2.7-1.02q.54-.16.54-.73s.01-.08,0-.11c-.03-.08-.05-.18-.11-.23-.53-.44-.87-1-1.02-1.66-.07-.3-.18-.49-.46-.65-.54-.32-.89-.87-.95-1.46-.21-.75.02-1.17.74-1.39ZM5.68,3.95c-.08.19-.17.35-.22.51-.21.65-.21,1.31-.11,1.98.03.16.04.32-.12.43-.17.1-.3.03-.43-.09-.14-.12-.25-.09-.3.09-.02.07-.04.15-.03.21.09.47.26.9.61,1.22.11.11.28.17.44.21.17.05.29.13.3.32,0,.08.02.16.03.24.16.94.61,1.67,1.53,2.03,1.19.47.75.48,1.97-.02.72-.29,1.18-.83,1.39-1.57.07-.23.1-.47.14-.7.03-.17.12-.26.28-.29.54-.12,1.16-1.01,1.06-1.55-.01-.08-.09-.19-.15-.21-.07-.02-.19.03-.24.09-.12.13-.22.29-.31.45-.14.25-.27.52-.4.77-.08.14-.2.21-.36.16-.16-.05-.23-.17-.21-.34,0-.08.02-.16.03-.24.06-.71.14-1.43.17-2.14.01-.3-.05-.61-.15-.89-.18-.5-.69-.58-1.06-.21-1.22,1.25-3,1.03-3.79-.36-.01-.02-.03-.05-.08-.11ZM10.58,12.86c-.19-.06-.38-.11-.58-.17-.31-.09-.36-.16-.36-.47,0-.19,0-.37,0-.59-.19.08-.35.13-.49.2-.53.29-1.06.3-1.59,0-.15-.08-.31-.13-.49-.2,0,.22,0,.41,0,.6,0,.28-.06.35-.32.44-.21.06-.42.13-.63.19.31,1.02,1.25,1.67,2.34,1.63,1.03-.04,1.95-.74,2.13-1.64Z" />
                                                <path d="M15.43,13.13c.24-.16.44-.33.67-.44.69-.31,1.42-.07,1.81.57.35.57.39,1.19.15,1.8-.17.42-.41.83-.68,1.2-.45.62-1.04,1.11-1.67,1.55-.16.11-.31.13-.48.01-.73-.52-1.4-1.11-1.91-1.85-.44-.63-.71-1.32-.55-2.11.12-.59.41-1.06,1.02-1.24.61-.18,1.14-.02,1.59.44.02.02.04.04.06.06,0,0,.01,0-.02,0ZM15.47,17.24c.74-.56,1.4-1.15,1.84-1.95.22-.4.33-.82.26-1.27-.08-.47-.44-.83-.86-.85-.42-.02-.81.28-.91.7-.02.08-.01.17-.03.26-.04.16-.14.26-.31.25-.16,0-.27-.1-.29-.27,0-.06,0-.12-.02-.17-.08-.43-.42-.74-.83-.77-.46-.03-.77.2-.91.67-.13.43-.07.85.11,1.25.42.91,1.15,1.55,1.94,2.15Z" />
                                            </svg>
                                        </span>
                                        <span>Women’s Health</span>
                                    </button>
                                </div>
                                <div className="max-w-6xl mx-auto flex flex-col place-items-center text-center mb-14">
                                    <p className="!text-(--maincolor) !text-lg/6 font-normal leading-relaxed">
                                        {selectedSubcategory === 'mens-health' ? (
                                            "Get quick access to top-quality healthcare from dependable and registered Irish doctors to a wide range of medical ailments tailored for men. Enclosed are the illnesses our dedicated GPs treat to ensure you receive care on time from the comfort of your home."
                                        ) : (
                                            "Get quick access to top-quality healthcare from dependable and registered Irish doctors to a wide range of medical ailments tailored for women. Enclosed are the illnesses our dedicated GPs treat to ensure you receive care on time from the comfort of your home."
                                        )}
                                    </p>
                                </div>
                            </div> */}

                            <div className="flex justify-center mb-8 lg:mb-12">
                                <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold text-center">
                                    Comprehensive Treatments at Your Fingertips!
                                </h2>
                            </div>
                            <div className="flex flex-col gap-4">
                                {/* Tab Buttons */}
                                <div className="contents md:flex justify-center gap-6 mb-5" role="tablist">
                                    <button
                                        onClick={() => setSelectedSubcategory('mens-health')}
                                        className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-md font-normal transition-all duration-500 cursor-pointer ${selectedSubcategory === 'mens-health'
                                            ? 'text-white bg-(--maincolor) border border-(--maincolor)'
                                            : 'bg-(--blockground) text-(--maincolor) border border-(--maincolor)'
                                            }`}
                                        role="tab"
                                        aria-selected={selectedSubcategory === 'mens-health'}
                                    >
                                        <span className="shrink-0">
                                            <svg fill="none" stroke="currentColor" width="24" height="24" viewBox="0 0 20.46 20.77" className={selectedSubcategory === 'mens-health' ? "size-6" : "size-6"}>
                                                <path d="M6.31,11.59c-.68-.56-1.04-1.28-1.2-2.1-.01-.07-.07-.17-.13-.19-.37-.16-.66-.42-.85-.76-.17-.31-.33-.64-.43-.97-.2-.69.02-1.12.67-1.39-.08-.36-.18-.72-.25-1.08-.45-2.25.84-4.04,2.63-4.74,1.7-.67,3.28-.37,4.66.85.65.58.97,1.33.97,2.19,0,.84-.07,1.69-.11,2.53,0,.07,0,.14-.01.22.73.14.95.78.75,1.46-.15.52-.38.99-.78,1.37-.05.05-.1.12-.17.14-.39.12-.47.43-.55.78-.16.65-.49,1.19-1,1.63-.05.04-.08.15-.06.22.05.2.12.39.2.58.03.07.12.15.19.17.06.01.15-.06.2-.12,1.08-1.38,2.49-2.09,4.23-2.09,3.02,0,5.42,2.62,5.19,5.63-.21,2.74-2.44,4.85-5.2,4.86-4.74.01-9.48,0-14.22,0-.34,0-.59-.14-.77-.42-.19-.28-.26-.6-.26-.93,0-.88,0-1.77,0-2.65-.01-1.06.42-1.9,1.25-2.55.79-.61,1.7-.95,2.63-1.24.6-.19,1.21-.36,1.83-.53.15-.04.24-.11.3-.25.09-.21.19-.41.3-.62ZM5.4,13.18c-.48.14-.95.27-1.42.42-.81.26-1.6.55-2.29,1.06-.72.54-1.1,1.24-1.08,2.15.02.85,0,1.69,0,2.54,0,.16.03.33.08.49.06.22.2.32.45.32,3.78,0,7.55,0,11.33,0h.25c-1.97-1.21-2.86-2.93-2.74-5.19-1.82,1.03-3.97.18-4.59-1.79ZM10.59,15.52c0,2.53,2.07,4.62,4.59,4.63,2.58.01,4.67-2.07,4.68-4.64,0-2.52-2.08-4.62-4.6-4.63-2.59,0-4.66,2.05-4.67,4.64ZM8.79,4.93c.11.12.16.18.22.24.07.07.14.13.2.2.18.21.1.47-.17.51-.21.04-.44.05-.65.04-.69-.03-1.23-.33-1.57-.95-.13-.24-.22-.5-.32-.76-.13-.34-.24-.39-.55-.18-.12.08-.24.2-.31.33-.11.19-.22.39-.25.6-.08.51-.1,1.03-.16,1.54-.02.16-.09.35-.2.46-.14.13-.29.01-.42-.09-.15-.12-.3-.07-.35.12-.02.1-.03.21,0,.3.1.41.25.8.54,1.11.12.13.27.26.44.31.4.13.41.11.46.53.26,2.06,2.59,3.1,4.28,1.89.68-.49.96-1.2,1.06-2,.03-.29.09-.35.36-.41.12-.03.26-.08.35-.16.42-.37.62-.85.72-1.39.01-.06,0-.14-.02-.19-.04-.07-.09-.17-.15-.19-.06-.02-.17.04-.22.1-.1.11-.2.19-.36.15-.17-.05-.21-.2-.24-.36-.08-.53-.16-1.07-.27-1.59-.07-.34-.2-.67-.31-1.01-.02,0-.04,0-.06,0-.46.76-1.16.96-2.04.84ZM11.76,4.56c0-.41.03-.89,0-1.36-.05-.66-.34-1.22-.85-1.64-1.26-1.03-2.67-1.24-4.12-.55-1.43.68-2.2,1.85-2.13,3.48,0,.15.04.3.07.47.13-.32.23-.6.37-.86.18-.35.46-.6.84-.73.59-.2.89-.06,1.11.51.1.26.2.53.32.79.18.36.48.57.91.62-.09-.14-.17-.26-.23-.39-.15-.33.03-.61.39-.61.18,0,.36.02.54.04.75.07,1.12-.13,1.47-.79.03-.05.05-.11.08-.16.15-.28.41-.31.58-.04.24.41.46.84.66,1.21ZM6.02,13.01c.03.1.06.2.09.29.44,1.05,1.55,1.65,2.67,1.45.96-.17,1.62-.8,1.77-1.72-.31-.02-.41-.25-.49-.5-.06-.21-.14-.41-.22-.6-1.02.39-2.01.38-2.99,0-.32.35-.27.94-.84,1.09Z" />
                                            </svg>
                                        </span>
                                        <span>Men’s Health</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedSubcategory('womens-health')}
                                        className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-md font-normal transition-all duration-500 cursor-pointer ${selectedSubcategory === 'womens-health'
                                            ? 'text-white bg-(--maincolor) border border-(--maincolor)'
                                            : 'bg-(--blockground) text-(--maincolor) border border-(--maincolor)'
                                            }`}
                                        role="tab"
                                        aria-selected={selectedSubcategory === 'womens-health'}
                                    >
                                        <span className="shrink-0">
                                            <svg fill="none" stroke="currentColor" width="24" height="24" viewBox="0 0 20.69 20.46" className={selectedSubcategory === 'womens-health' ? "size-6" : "size-6"}>
                                                <path d="M13.82,10.28c.67-.21,1.32-.29,1.99-.25,2.3.14,4.27,1.82,4.76,4.08.64,2.94-1.29,5.8-4.27,6.29-.28.05-.56.06-.85.06-4.75,0-9.5,0-14.24,0-.84,0-1.37-.66-1.17-1.48.21-.92.44-1.83.67-2.75.22-.89.72-1.59,1.41-2.17.15-.12.24-.25.3-.44.57-1.8.69-3.64.59-5.51-.11-2.03.21-3.98,1.27-5.76.67-1.12,1.6-1.95,2.91-2.22,1.59-.33,3.08-.1,4.31,1.08.71.69,1.12,1.56,1.41,2.49.33,1.05.5,2.13.61,3.22.11,1.1.2,2.21.31,3.35ZM5.52,13.05c-.91.3-1.79.61-2.58,1.14-.85.58-1.45,1.32-1.69,2.34-.2.87-.42,1.73-.62,2.6-.1.42.15.7.59.7,3.83,0,7.66,0,11.5,0h.25c-2.02-1.27-2.9-3.06-2.67-5.41-1.51,1.23-4.03.79-4.77-1.38ZM15.47,10.63c-2.65.05-4.66,2.12-4.61,4.75.05,2.5,2.16,4.52,4.7,4.47,2.53-.04,4.57-2.15,4.53-4.68-.04-2.52-2.15-4.59-4.62-4.54ZM4.67,6.06c.02-.34.02-.68.05-1.02.08-.7.3-1.34.83-1.85.25-.24.48-.17.58.16.2.64.59,1.1,1.27,1.24.71.15,1.28-.14,1.75-.65.38-.41.88-.49,1.38-.24.57.29.76.8.81,1.38.03.44,0,.89,0,1.36.05-.03.07-.03.08-.05.29-.26.62-.34.98-.15.31.16.51.53.42.92-.09.38-.24.76-.41,1.11-.16.34-.43.61-.79.75-.14.06-.18.14-.2.27-.15.75-.48,1.41-1.08,1.91-.05.04-.09.13-.09.2,0,.24-.06.52.04.7.09.14.39.14.6.21.02,0,.04.02.06.02.08-.02.19-.03.23-.08.51-.71,1.15-1.27,1.92-1.66.1-.05.13-.1.12-.22-.15-1.48-.28-2.96-.45-4.44-.12-1.03-.37-2.04-.82-2.99C10.84.58,7.91-.16,5.89,1.41c-.64.5-1.1,1.15-1.43,1.89-.7,1.55-.95,3.17-.84,4.86.08,1.29.04,2.58-.19,3.86-.08.43-.18.86-.27,1.3.03,0,.05,0,.07-.02.86-.44,1.78-.74,2.7-1.02q.54-.16.54-.73s.01-.08,0-.11c-.03-.08-.05-.18-.11-.23-.53-.44-.87-1-1.02-1.66-.07-.3-.18-.49-.46-.65-.54-.32-.89-.87-.95-1.46-.21-.75.02-1.17.74-1.39ZM5.68,3.95c-.08.19-.17.35-.22.51-.21.65-.21,1.31-.11,1.98.03.16.04.32-.12.43-.17.1-.3.03-.43-.09-.14-.12-.25-.09-.3.09-.02.07-.04.15-.03.21.09.47.26.9.61,1.22.11.11.28.17.44.21.17.05.29.13.3.32,0,.08.02.16.03.24.16.94.61,1.67,1.53,2.03,1.19.47.75.48,1.97-.02.72-.29,1.18-.83,1.39-1.57.07-.23.1-.47.14-.7.03-.17.12-.26.28-.29.54-.12,1.16-1.01,1.06-1.55-.01-.08-.09-.19-.15-.21-.07-.02-.19.03-.24.09-.12.13-.22.29-.31.45-.14.25-.27.52-.4.77-.08.14-.2.21-.36.16-.16-.05-.23-.17-.21-.34,0-.08.02-.16.03-.24.06-.71.14-1.43.17-2.14.01-.3-.05-.61-.15-.89-.18-.5-.69-.58-1.06-.21-1.22,1.25-3,1.03-3.79-.36-.01-.02-.03-.05-.08-.11ZM10.58,12.86c-.19-.06-.38-.11-.58-.17-.31-.09-.36-.16-.36-.47,0-.19,0-.37,0-.59-.19.08-.35.13-.49.2-.53.29-1.06.3-1.59,0-.15-.08-.31-.13-.49-.2,0,.22,0,.41,0,.6,0,.28-.06.35-.32.44-.21.06-.42.13-.63.19.31,1.02,1.25,1.67,2.34,1.63,1.03-.04,1.95-.74,2.13-1.64Z" />
                                                <path d="M15.43,13.13c.24-.16.44-.33.67-.44.69-.31,1.42-.07,1.81.57.35.57.39,1.19.15,1.8-.17.42-.41.83-.68,1.2-.45.62-1.04,1.11-1.67,1.55-.16.11-.31.13-.48.01-.73-.52-1.4-1.11-1.91-1.85-.44-.63-.71-1.32-.55-2.11.12-.59.41-1.06,1.02-1.24.61-.18,1.14-.02,1.59.44.02.02.04.04.06.06,0,0,.01,0-.02,0ZM15.47,17.24c.74-.56,1.4-1.15,1.84-1.95.22-.4.33-.82.26-1.27-.08-.47-.44-.83-.86-.85-.42-.02-.81.28-.91.7-.02.08-.01.17-.03.26-.04.16-.14.26-.31.25-.16,0-.27-.1-.29-.27,0-.06,0-.12-.02-.17-.08-.43-.42-.74-.83-.77-.46-.03-.77.2-.91.67-.13.43-.07.85.11,1.25.42.91,1.15,1.55,1.94,2.15Z" />
                                            </svg>
                                        </span>
                                        <span>Women’s Health</span>
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div className="contents">
                                    <div className="max-w-7xl mx-auto flex flex-col place-items-center text-center mb-8 lg:mb-10">
                                        <p className="!text-(--maincolor) !text-lg/6 font-normal leading-relaxed">
                                            {selectedSubcategory === 'mens-health' ? (
                                                "Get quick access to top-quality healthcare from dependable and registered Irish doctors to a wide range of medical ailments tailored for men. Enclosed are the illnesses our dedicated GPs treat to ensure you receive care on time from the comfort of your home."
                                            ) : (
                                                "Get quick access to top-quality healthcare from dependable and registered Irish doctors to a wide range of medical ailments tailored for women. Enclosed are the illnesses our dedicated GPs treat to ensure you receive care on time from the comfort of your home."
                                            )}
                                        </p>
                                    </div>

                                    {/* Product List */}
                                    <ProductGrid products={filteredProducts} categorySlug={categorySlug} />

                                </div>
                            </div>
                        </div>


                    )}

                    {categorySlug === 'occupational-health' && (
                        <div className="max-w-7xl mx-auto flex flex-col place-items-center text-center space-y-4 mb-8 lg:mb-12">
                            <h2 className="text-(--maincolor) text-2xl/8 md:text-3xl font-bold text-center">
                                Expert Occupational Health Support for Your Workforce
                            </h2>
                            <p className="!text-(--maincolor) !text-lg/6 font-normal text-center max-w-7xl leading-relaxed">
                                Get Healthcare provides Occupational Health services across Ireland, helping employers reduce sickness absence, meet compliance requirements, and support employee wellbeing. Our services are designed for small businesses, corporates, and recruitment agencies who require independent medical assessments, fitness-to-work reviews, and employee health monitoring. Whether you need a one-off consultation or ongoing support, our team of Occupational Health physicians and specialists can provide fast, reliable, and confidential advice.
                            </p>
                            <p className="!text-(--maincolor) !text-lg/6 font-normal text-center max-w-7xl leading-relaxed">
                                We cover a wide range of occupational health services including pre-employment medicals, fitness-for-work assessments, absence management, ergonomic reviews, stress and mental health evaluations, vaccination counselling, and health surveillance programmes. Employers benefit from clear, actionable reports that support HR decision-making, workplace safety, and employee retention.
                            </p>
                        </div>
                    )}

                    {categorySlug === 'online-medical-certificates' && (
                        <div className="flex flex-col items-center mb-8 lg:mb-12">
                            <h2 className="text-(--maincolor) text-2xl/8 md:text-3xl font-bold text-center">
                                Your Trusted Source for GP-Issued Medical Certificates in Ireland
                            </h2>
                        </div>
                    )}

                    {/* Product List */}
                    {categorySlug !== 'treatments' && (
                        <ProductGrid products={filteredProducts} categorySlug={categorySlug} />
                    )}

                </div>
            </div>

            <Trustpilot />
        </>
    );
}
