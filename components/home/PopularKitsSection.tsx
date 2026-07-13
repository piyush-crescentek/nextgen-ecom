"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TESTING_KITS_SLUG } from "@/lib/constants";
import { getMockPopularKits, type MockPhysicalProduct } from "@/lib/mock-data";
import KitCard, { Kit } from "@/components/all-kits/KitCard";
import QuickViewModal from "@/components/all-kits/QuickViewModal";

function toKit(product: MockPhysicalProduct): Kit {
    return {
        id: product.id,
        image: product.image || "/images/photo-kits1.jpg",
        title: product.title || product.name,
        description: product.description || "",
        results: product.results_delivery || "2-5 days",
        price: `${product.price.currency}${product.price.discounted_price || product.price.price}`,
        badge: product.price.discount_percentage ? {
            text: `${product.price.discount_percentage}% OFF`,
            variant: "popular"
        } : undefined,
        href: `/${product.category_slug || TESTING_KITS_SLUG}/${product.slug}`,
        turnaround_time: product.turnaround_time,
        results_delivery: product.results_delivery,
        test_type: product.test_type,
        raw_price: parseFloat(product.price.discounted_price || product.price.price || "0"),
        category_name: product.subcategory_name || "Testing Kit",
        category_id: product.category_id,
        slug: product.slug,
    };
}

/** Home page product catalog — the most popular blood testing kits. */
export default function PopularKitsSection() {
    const kits = getMockPopularKits().map(toKit);
    const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    const handleQuickView = (kit: Kit) => {
        setSelectedKit(kit);
        setIsQuickViewOpen(true);
    };

    return (
        <section className="py-12 lg:py-20 bg-white">
            <div className="container">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-12">
                    <div>
                        <span className="block text-(--maincolor)/70 text-base capitalize mb-2">
                            Best Sellers
                        </span>
                        <h2 className="text-(--maincolor) text-2xl/8 md:text-3xl font-bold">
                            Most Popular Test Kits
                        </h2>
                        <p className="text-slate-600 text-base mt-2 max-w-xl">
                            Our most ordered at-home blood testing kits — laboratory analysed
                            and doctor reviewed, delivered discreetly across Ireland.
                        </p>
                    </div>
                    <Link
                        href={`/${TESTING_KITS_SLUG}`}
                        className="inline-flex items-center gap-2 shrink-0 text-(--btncolor) font-semibold text-base hover:gap-3 transition-all"
                    >
                        View all kits
                        <ArrowRight className="size-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {kits.map((kit) => (
                        <KitCard key={kit.slug || kit.id} kit={kit} onQuickView={handleQuickView} />
                    ))}
                </div>
            </div>

            <QuickViewModal
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
                kit={selectedKit}
            />
        </section>
    );
}
