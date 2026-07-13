"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import CategoryListing from "@/components/products/CategoryListing";
import { useMenuStore, type Category } from "@/store/useMenuStore";
import { useProductStore } from "@/store/useProductStore";
import { LandingPageProvider } from "@/context/LandingPageContext";
import { getCategoryHeroImage } from "@/lib/constants";
import type { CategoryLandingData } from "@/lib/server-api";

interface Props {
    categorySlug: string;
    initialCategoryData: CategoryLandingData | null;
    initialMenuData: Category[];
}

export default function CategoryPageClient({
    categorySlug,
    initialCategoryData,
    initialMenuData,
}: Props) {
    const setMenuData = useMenuStore((s) => s.setMenuData);
    const setCategoryData = useProductStore((s) => s.setCategoryData);

    useEffect(() => {
        if (initialMenuData && initialMenuData.length > 0) setMenuData(initialMenuData);
        if (initialCategoryData) setCategoryData(categorySlug, initialCategoryData);
    }, [categorySlug, initialCategoryData, initialMenuData, setMenuData, setCategoryData]);

    const categoryData = initialCategoryData;
    const title =
        categoryData?.name ||
        categorySlug
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    const description =
        categoryData?.description ||
        `The ${title} section is currently under development to ensure the best medical experience for you.`;

    if (!categoryData || (categoryData.products && categoryData.products.length === 0)) {
        return (
            <LandingPageProvider>
                <div className="no-btn-hover min-h-screen flex items-center justify-center bg-[#E7E9ED] px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-md w-full text-center space-y-8 p-12 bg-white rounded-3xl shadow-[0_20px_50px_rgba(12,32,59,0.05)] border border-(--maincolor)/10"
                    >
                        <div className="space-y-4">
                            <div className="inline-flex items-center justify-center size-20 bg-(--blockground) rounded-full mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-10 text-[var(--maincolor)]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.673 2.673 0 0113.917 21l-5.833-5.833m5.833-2.917h.008v.008H13.5V12.25zM10.125 10.125l.008.008h-.008v-.008zm-2.25 2.25l.008.008h-.008v-.008zm0-2.25l.008.008h-.008v-.008zm2.25-2.25l.008.008h-.008v-.008zm10.5 4.5V9a2.25 2.25 0 00-2.25-2.25h-4.5m4.5 4.5l-4.5 4.5M20.25 18a2.25 2.25 0 01-2.25 2.25h-4.5m4.5-4.5l-4.5 4.5m1.5-12.75V2.25m3 3h3.75m-3.75 3v13.5m-3-13.5a2.25 2.25 0 00-2.25-2.25H9M3 13.5V9a2.25 2.25 0 012.25-2.25h4.5m-4.5 4.5l4.5-4.5M3 18a2.25 2.25 0 002.25 2.25h4.5m-4.5-4.5l4.5 4.5m15-1.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-15 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-(--maincolor)">
                                Coming Soon
                            </h1>
                            <p className="text-[#494949] text-base lg:text-lg leading-relaxed">
                                {description}
                            </p>
                        </div>

                        <div className="pt-4">
                            <Link
                                href="/"
                                data-hover="Return to Home"
                                className="btn btn-primary
                                    !inline-flex items-center justify-center gap-3
                                    [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0
                                    h-14
                                    text-lg
                                    px-8 lg:px-10
                                    before:bg-(--btncolor)
                                    before:border-(--btncolor)"
                            >
                                Return to Home
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </LandingPageProvider>
        );
    }

    return (
        <LandingPageProvider>
            <div className="no-btn-hover">
                <CategoryListing
                    title={categoryData.title || categoryData.name || title}
                    description={categoryData.description || description}
                    shortDescription={categoryData.short_description || ""}
                    products={categoryData.products || []}
                    categorySlug={categorySlug}
                    image={
                        getCategoryHeroImage(categorySlug) ??
                        categoryData.image ??
                        ""
                    }
                />
            </div>
        </LandingPageProvider>
    );
}
