"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { isVisible, getRestrictionMessage } from "@/lib/visibility";
import { toast } from "sonner";
import { apiAssetUrl } from "@/lib/env";
import { resolveTieredPricing } from "@/lib/pricing-options";
import type { OhPrice, ProductPricingField } from "@/lib/types";
import ProductDetailPricingList from "@/components/products/ProductDetailPricingList";

export interface Product {
    id?: number;
    title: string;
    image: string;
    slug: string;
    category_slug: string;
    subcategory_slug: string | null;
    price: {
        max: string;
        min: string;
        currency: string;
    };
    description: string;
    category_id?: number;
    oh_prices?: OhPrice[];
    forms_pricing?: ProductPricingField | null;
}

function ProductGridPrice({
    product,
    className = "",
}: {
    product: Product;
    className?: string;
}) {
    const currency = product.price?.currency || "€";
    const tiered = resolveTieredPricing(product);

    if (tiered.hasTieredPricing) {
        return (
            <ProductDetailPricingList
                ohPrices={tiered.ohPrices}
                pricingOptions={tiered.pricingOptions}
                currency={currency}
                variant="compact"
                showInfoButton={false}
                className={className}
            />
        );
    }

    return (
        <h6
            className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-normal sm:text-lg ${className}`}
        >
            <span className="amount">
                <bdi>
                    <span className="currencySymbol">{currency}</span>
                    {product.price?.min}
                </bdi>
            </span>
            {product.price?.max !== product.price?.min && (
                <>
                    <span>–</span>
                    <span className="amount">
                        <bdi>
                            <span className="currencySymbol">{currency}</span>
                            {product.price?.max}
                        </bdi>
                    </span>
                </>
            )}
        </h6>
    );
}

interface ProductGridProps {
    products: Product[];
    categorySlug: string;
    categoryId?: number;
}

export default function ProductGrid({ products, categorySlug, categoryId }: ProductGridProps) {
    const { user } = useAuthStore();

    return (
        <div className="grid w-full grid-cols-1 justify-center gap-5 sm:gap-6 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-7 xl:grid-cols-4">
            {products.map((product, index) => {
                const isProductVisible = isVisible({ id: product.id, category_id: product.category_id || categoryId }, user?.business_group);
                const productHref = `/${product.subcategory_slug || product.category_slug || categorySlug}/${product.slug}`;

                const handleRestrictedClick = (e: React.MouseEvent) => {
                    if (!isProductVisible) {
                        e.preventDefault();
                        toast.error(getRestrictionMessage());
                    }
                };

                const learnMoreClass =
                    "inline-flex items-center group/link pr-11 -ml-6 relative before:absolute before:top-1/2 before:left-30 before:-translate-y-1/2 before:w-10 before:h-px before:bg-(--maincolor) transition-all duration-500 group-hover:pr-7 group-hover:ml-0 group-hover:before:w-6 group-hover:before:left-[116px] before:transition-width before:duration-700";

                return (
                    <div
                        key={product.id || index}
                        className={`group relative flex min-h-[min(22rem,78svh)] flex-col overflow-hidden rounded-lg bg-[var(--foreground)] sm:min-h-[454px] ${isProductVisible ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                        {isProductVisible && (
                            <Link
                                href={productHref}
                                aria-label={`View ${product.title}`}
                                className="absolute inset-0 z-[1]"
                            />
                        )}

                        <div className={`relative z-0 h-[13.5rem] w-full overflow-hidden sm:h-64 md:h-72.5 ${!isProductVisible ? "grayscale-[0.5] opacity-60" : ""}`}>
                            <Image
                                className="object-cover object-center transition duration-700 group-hover:scale-110"
                                src={apiAssetUrl(product.image, "images/sick-certificate.jpg")}
                                alt={product.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            />
                        </div>

                        <div className="relative z-0 flex grow flex-col items-start justify-start space-y-2 p-4 text-[var(--maincolor)] sm:p-6">
                            <h3 className="mb-2 text-lg font-bold text-[var(--maincolor)] sm:mb-3 sm:text-xl lg:text-2xl">{product.title}</h3>
                            <ProductGridPrice product={product} />
                            <span className={`${learnMoreClass} ${!isProductVisible ? "opacity-50" : ""}`}>
                                <span className="text-[var(--maincolor)] opacity-0 transition-opacity duration-700 group-hover:opacity-100 mr-2">
                                    <svg className="fill-(--maincolor) size-4" xmlns="http://www.w3.org/2000/svg" width="20" height="12" viewBox="0 0 20 12" fill="none"><path d="M19.5303 6.53033C19.8232 6.23744 19.8232 5.76256 19.5303 5.46967L14.7574 0.696699C14.4645 0.403806 13.9896 0.403806 13.6967 0.696699C13.4038 0.989593 13.4038 1.46447 13.6967 1.75736L17.9393 6L13.6967 10.2426C13.4038 10.5355 13.4038 11.0104 13.6967 11.3033C13.9896 11.5962 14.4645 11.5962 14.7574 11.3033L19.5303 6.53033ZM0 6.75H19V5.25H0V6.75Z" fill="" /></svg>
                                </span>
                                Learn more
                            </span>
                        </div>

                        {/* Hover Overlay */}
                        <div className="pointer-events-none absolute top-full left-0 z-0 flex h-full w-full items-center bg-(--foreground) p-6 opacity-0 transition-all duration-500 group-hover:top-0 group-hover:opacity-100">
                            <div className="block space-y-6 text-(--maincolor)">
                                <div>
                                    <p className="mb-2 translate-y-[20px] text-xl font-bold text-(--maincolor) opacity-0 transition-all duration-700 group-hover:translate-y-0 group-hover:opacity-100 lg:text-2xl">
                                        {product.title}
                                    </p>
                                    <ProductGridPrice
                                        product={product}
                                        className="translate-y-[20px] opacity-0 transition-all duration-700 delay-100 group-hover:translate-y-0 group-hover:opacity-100"
                                    />
                                </div>
                                <p className="line-clamp-4 translate-y-[20px] text-sm text-(--maincolor) opacity-0 transition-all duration-700 delay-200 group-hover:translate-y-0 group-hover:opacity-100">
                                    {product.description}
                                </p>
                                <span className={`${learnMoreClass} translate-y-[20px] opacity-0 transition-all duration-700 delay-300 group-hover:translate-y-0 group-hover:opacity-100`}>
                                    <span className="mr-2 text-(--maincolor) opacity-0 transition-opacity duration-700 group-hover:opacity-100">
                                        <svg className="fill-(--maincolor) size-4" xmlns="http://www.w3.org/2000/svg" width="20" height="12" viewBox="0 0 20 12" fill="none"><path d="M19.5303 6.53033C19.8232 6.23744 19.8232 5.76256 19.5303 5.46967L14.7574 0.696699C14.4645 0.403806 13.9896 0.403806 13.6967 0.696699C13.4038 0.989593 13.4038 1.46447 13.6967 1.75736L17.9393 6L13.6967 10.2426C13.4038 10.5355 13.4038 11.0104 13.6967 11.3033C13.9896 11.5962 14.4645 11.5962 14.7574 11.3033L19.5303 6.53033ZM0 6.75H19V5.25H0V6.75Z" fill="" /></svg>
                                    </span>
                                    Learn more
                                </span>
                            </div>
                        </div>

                        {!isProductVisible && (
                            <button
                                type="button"
                                onClick={handleRestrictedClick}
                                aria-label={getRestrictionMessage()}
                                className="absolute inset-0 z-10 flex cursor-not-allowed items-center justify-center bg-white/20 p-6 text-center shadow-inner backdrop-blur-[1px]"
                            >
                                <div className="rounded-xl border border-(--maincolor)/10 bg-white/95 p-4 shadow-xl transition-transform duration-300 group-hover:scale-105">
                                    <p className="text-sm font-bold leading-tight text-(--maincolor)">
                                        {getRestrictionMessage()}
                                    </p>
                                </div>
                            </button>
                        )}
                    </div>
            );
          })}
        </div>
    );
}
