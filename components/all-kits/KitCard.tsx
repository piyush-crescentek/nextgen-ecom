"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, TestTube, Eye, ShoppingCart } from "lucide-react";
import { TESTING_KITS_SLUG } from "@/lib/constants";
import { useCartStore } from "@/store/useCartStore";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { isVisible, getRestrictionMessage, getDiscountPercentage, getVolumeTiers } from "@/lib/visibility";
import BusinessGroupBadge from "../products/BusinessGroupBadge";
import { toast } from "sonner";

export interface Kit {
    id: string | number;
    image: string;
    title: string;
    description: string;
    results: string;
    price: string;
    badge?: {
        text: string;
        variant: "popular" | "fast" | "value";
    };
    href?: string;
    // New API fields
    turnaround_time?: string | null;
    results_delivery?: string | null;
    test_type?: string | null;
    raw_price?: number;
    category_name?: string;
    slug?: string;
    product_id?: string | number;
    pk?: string | number;
    category_id?: number;
}

interface KitCardProps {
    kit: Kit;
    onQuickView?: (kit: Kit) => void;
}

const KitCard = ({ kit, onQuickView }: KitCardProps) => {
    const { addItem } = useCartStore();
    const { user } = useAuthStore();
    const router = useRouter();
    const checkItem = { id: (kit.id || kit.product_id || kit.pk || 0), category_id: (kit.category_id || 0) };
    const bgDiscount = getDiscountPercentage(checkItem, user?.business_group);
    const hasVolumeTiers = !!getVolumeTiers(checkItem, user?.business_group);
    
    const isKitVisible = isVisible(checkItem, user?.business_group);

    const handleRestrictedClick = (e: React.MouseEvent) => {
        if (!isKitVisible) {
            e.preventDefault();
            e.stopPropagation();
            toast.error(getRestrictionMessage());
        }
    };
    const badgeColors = {
        popular: "bg-(--btncolor) text-white",
        fast: "bg-green-100 text-green-700",
        value: "bg-blue-100 text-blue-700",
    };

    // Helper function to format API values: replace _ with space and capitalize
    const formatValue = (value: string | null | undefined): string => {
        if (!value) return "";
        return value
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Use API fields if available, fallback to legacy 'results' field
    const displayResults = formatValue(kit.turnaround_time || kit.results_delivery || kit.results);
    const displayTestType = formatValue(kit.test_type);

    const kitHref = kit.href || `/${TESTING_KITS_SLUG}`;

    return (
        <div className="group bg-(--blockground) border border-slate-100 rounded-xl overflow-hidden hover:shadow-xl hover:border-[#0F4C5C]/10 transition-all duration-300 relative flex flex-col h-full">
            {/* Overlay Link - Makes whole card clickable */}
            <Link
                href={isKitVisible ? kitHref : "#"}
                onClick={handleRestrictedClick}
                className="absolute inset-0 z-10"
                aria-label={`View ${kit.title}`}
            />

            {/* Image — tall and dominant */}
            <div className="relative h-44 sm:h-64 overflow-hidden bg-slate-50 shrink-0">
                <Image
                    src={kit.image}
                    alt={kit.title}
                    fill
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />

                {/* Quick View Button */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isKitVisible) {
                            toast.error(getRestrictionMessage());
                            return;
                        }
                        onQuickView?.(kit);
                    }}
                    className="absolute inset-0 m-auto size-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-(--maincolor) opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 z-20 hover:bg-(--maincolor) hover:text-white shadow-xl"
                    title="Quick View"
                >
                    <Eye size={18} />
                </button>

                {/* Show manual badge ONLY if there is no business group discount OR volume tiers */}
                {kit.badge && bgDiscount <= 0 && !hasVolumeTiers && (
                    <div
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold absolute top-2 right-2 border-0 shadow-md z-20 ${badgeColors[kit.badge.variant]}`}
                    >
                        {kit.badge.text}
                    </div>
                )}

                {/* Business Group Discount Badge - Now the primary badge if active */}
                <BusinessGroupBadge 
                    product={{ id: kit.id || kit.product_id || kit.pk, category_id: kit.category_id }} 
                    className="absolute top-2 right-2 z-20" 
                />
            </div>

            {/* Compact content */}
            <div className="p-3 sm:p-4 flex flex-col flex-grow">
                <div className="flex items-start justify-between gap-2 mb-1 min-w-0 pr-1">
                    <h3 className="text-sm sm:text-base font-semibold text-(--maincolor) line-clamp-1 group-hover:text-(--btncolor) transition-colors relative z-20 pointer-events-none flex-1">
                        {kit.title}
                    </h3>
                </div>
                <p className="text-slate-500 mb-2 line-clamp-1 text-xs relative z-20 pointer-events-none">
                    {kit.description}
                </p>

                <div className="space-y-1 mb-2 relative z-20 pointer-events-none">
                    {displayTestType && (
                        <div className="flex items-center gap-1.5">
                            <TestTube className="w-3 h-3 text-(--maincolor) shrink-0" />
                            <span className="text-xs text-slate-600 truncate">
                                <span className="font-medium">Type:</span> {displayTestType}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-(--maincolor) shrink-0" />
                        <span className="text-xs text-slate-600 truncate">
                            <span className="font-medium">Results:</span> {displayResults}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col mb-4 relative z-20 pointer-events-none">
                    <span className={`text-lg sm:text-xl font-bold text-(--maincolor) ${!isKitVisible ? 'opacity-50' : ''}`}>
                        {kit.price}
                    </span>
                </div>

                <div className="mt-auto relative z-20 px-0.5 pb-0.5">
                    {isKitVisible ? (
                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                href={kitHref}
                                className="flex items-center justify-center h-10 px-2 bg-white border border-(--maincolor) text-(--maincolor) text-[11px] font-bold hover:bg-slate-50 transition-all uppercase"
                            >
                                View Details
                            </Link>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addItem({
                                        id: kit.id || kit.product_id || kit.pk || 0,
                                        name: kit.title,
                                        price: kit.raw_price || 0,
                                        image: kit.image,
                                        quantity: 1,
                                        slug: kit.slug || "",
                                        category: kit.category_name || "Testing Kit"
                                    });
                                    router.push('/cart');
                                }}
                                className="flex items-center justify-center gap-1.5 h-10 px-2 bg-(--btncolor) text-white text-[11px] font-bold hover:opacity-95 transition-all uppercase shadow-lg shadow-(--btncolor)/10"
                            >
                                <ShoppingCart size={13} />
                                Order Kit
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-inner">
                            <p className="text-(--maincolor) text-[11px] font-bold text-center leading-relaxed">
                                {getRestrictionMessage()}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KitCard;
