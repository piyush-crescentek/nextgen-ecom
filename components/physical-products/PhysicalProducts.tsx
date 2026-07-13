"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import { TESTING_KITS_SLUG } from "@/lib/constants";
import { getMockFeaturedKits } from "@/lib/mock-data";
import { Product } from "@/lib/types";
import { isVisible, getRestrictionMessage, getVolumeTiers, getDiscountPercentage } from "@/lib/visibility";
import BusinessGroupBadge from "../products/BusinessGroupBadge";
import VolumePricingTable from "../products/VolumePricingTable";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/pagination';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import Image from "next/image";
import KitCard, { Kit } from "../all-kits/KitCard";
import QuickViewModal from "../all-kits/QuickViewModal";
import FAQAccordionItem from "../all-kits/FAQAccordionItem";
import {
    ChevronDown,
    ChevronRight,
    Search,
    X,
    Check,
    Play,
    MessageCircleQuestion,
    ArrowRight,
    Clock,
    MessageCircle,
    Battery,
    ShieldAlert,
    Waves,
    Stethoscope,
    Heart,
    CircleAlert,
    Shield
} from "lucide-react";


export default function PhysicalProducts({ product }: { product: Product }) {
    const [relatedKits, setRelatedKits] = useState<Kit[]>([]);
    const [isLoadingRelated, setIsLoadingRelated] = useState(false);
    const router = useRouter();
    const { addItem } = useCartStore();
    const { user } = useAuthStore();
    const checkItem = { id: (product.id || product.product_id || product.pk || 0), category_id: (product.category_id || 0) };
    const isType2 = user?.customer_type === 2;
    const bgDiscount = isType2 ? getDiscountPercentage(checkItem, user?.business_group) : 0;
    const hasVolumeTiers = isType2 ? !!getVolumeTiers(checkItem, user?.business_group) : false;

    const product_display = product.product_display;
    const physical_details = product_display.physical_details;
    const physical_kit_usage = product_display.physical_kit_usage;
    const physical_how_it_works = product_display.physical_how_it_works;
    const physical_what_to_expect = product_display.physical_what_to_expect;
    const price_range = product_display.price_range;

    // Static mock data — no API call is made.
    const fetchRelatedKits = useCallback(async () => {
        const ids = product.related_kit_ids;

        if (!ids || ids.length === 0) return;

        setIsLoadingRelated(true);
        try {
            const rawData = getMockFeaturedKits(ids);

            const kits: Kit[] = rawData.map((item: {
                id: number;
                image?: string;
                title?: string;
                name?: string;
                description?: string;
                results_delivery?: string;
                results?: string;
                turnaround_time?: string;
                price?: string | number | { currency?: string; discounted_price?: string; price?: string } | null;
                href?: string;
                category_slug?: string;
                slug: string;
                raw_price?: number;
                category_name?: string;
                test_type?: string;
                category_id?: number;
            }) => ({
                id: item.id,
                image: item.image || "/images/photo-kits1.jpg",
                title: item.title || item.name || "",
                description: item.description || "",
                results: item.results_delivery || item.results || item.turnaround_time || "",
                price: typeof item.price === 'object'
                    ? `${item.price?.currency || '€'}${item.price?.discounted_price || item.price?.price || ''}`
                    : String(item.price || ""),
                href: item.href || `/${item.category_slug || TESTING_KITS_SLUG}/${item.slug}`,
                slug: item.slug,
                raw_price: item.raw_price || (typeof item.price === 'object'
                    ? parseFloat(item.price?.discounted_price || item.price?.price || '0')
                    : parseFloat(String(item.price).replace(/[^0-9.]/g, '') || '0')),
                category_name: item.category_name || "",
                turnaround_time: item.turnaround_time || "",
                results_delivery: item.results_delivery || "",
                test_type: item.test_type || "",
                category_id: item.category_id,
            }));

            setRelatedKits(kits);
        } catch (err) {
            console.error("Error fetching related kits:", err);
        } finally {
            setIsLoadingRelated(false);
        }
    }, [product.related_kit_ids]);

    useEffect(() => {
        fetchRelatedKits();
    }, [fetchRelatedKits]);


    const [activeIndex, setActiveIndex] = useState(0);

    const images = product_display.slider_images || [];

    const handleThumbnailClick = (index: number) => {
        setActiveIndex(index);
    };

    const [isPlaying, setIsPlaying] = useState(false);

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    // Simple flat FAQ accordion — all questions in one list, no grouping.
    const faq = product_display.faq;
    const accordionData = (faq?.items || []).flatMap((item) =>
        (item.sub_items || []).map((sub) => ({
            title: sub.question,
            content: sub.answer,
        })),
    );

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };
    // FAQs Accordion

    const [isFullScreen, setIsFullScreen] = useState(false);
    const [selectedQuickViewKit, setSelectedQuickViewKit] = useState<Kit | null>(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    const handleQuickView = (kit: Kit) => {
        setSelectedQuickViewKit(kit);
        setIsQuickViewOpen(true);
    };

    return (
        <>

            {/* Banner */}
            <div className="flex md:items-center md:flex-row flex-col bg-[#E7E9ED] md:pt-[115px] relative md:before:absolute md:before:top-0 md:before:left-0 md:before:w-1/2 md:before:h-full md:before:bg-(--foreground)">
                <div className="md:container mx-auto h-full">
                    <div className="flex flex-col md:flex-row justify-end w-full h-full">
                        <div className="w-full md:w-1/2 h-full bg-(--foreground) md:bg-transparent">
                            <div className="p-6 lg:py-8 xl:pr-[140px]">
                                <nav aria-label="Breadcrumb" className="mb-8 md:mb-12 relative">
                                    <ol role="list" className="flex items-center whitespace-nowrap overflow-x-auto scrollbar-hide gap-y-2 text-(--maincolor) text-[11px] sm:text-sm font-medium">
                                        <li className="flex items-center shrink-0">
                                            <Link
                                                href="/"
                                                className="hover:text-(--btncolor) transition-colors">
                                                Home
                                            </Link>
                                        </li>
                                        <li className="flex items-center shrink-0">
                                            <ChevronRight className="size-3.5 mx-1 md:mx-2 text-slate-400 shrink-0" />
                                            <Link
                                                href={product.category_slug ? `/${product.category_slug}` : `/${TESTING_KITS_SLUG}`}
                                                className="hover:text-(--btncolor) transition-colors">
                                                {product.category_name || "Blood Testing Kits"}
                                            </Link>
                                        </li>
                                        <li className="flex items-center min-w-0" aria-current="page">
                                            <ChevronRight className="size-3.5 mx-1 md:mx-2 text-slate-400 shrink-0" />
                                            <span className="text-slate-500 truncate">{product.name}</span>
                                        </li>
                                    </ol>
                                </nav>

                                {/* Main Slider */}
                                <div
                                    className="relative rounded-xl overflow-hidden shadow-2xl cursor-pointer group/image"
                                    onClick={() => setIsFullScreen(true)}
                                >
                                    <div className="absolute top-4 right-4 z-10 size-9
                                    bg-white/90 backdrop-blur-sm rounded-full shadow-2xl
                                    flex items-center justify-center
                                    text-black cursor-pointer
                                    transition-all duration-300
                                    hover:scale-110 hover:shadow-xl opacity-0 group-hover/image:opacity-100"
                                    >
                                        <Search className="size-5" />
                                    </div>
                                    <div className="aspect-3/2 relative">
                                        {images.length > 0 && (
                                            <Image
                                                src={images[activeIndex].imgUrl}
                                                alt={images[activeIndex].altText || product.name}
                                                fill
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105"
                                            />
                                        )}
                                    </div>
                                    {/* Hover overlay hint */}
                                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-all duration-300 flex items-center justify-center">
                                        <div className="opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-3 shadow-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-6 text-gray-800">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                {/* Thumbnail Slider */}
                                <div className="w-full mt-5 relative">
                                    <div className="flex gap-3 overflow-x-auto pb-5 scrollbar-hide">
                                        {images.map((image, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleThumbnailClick(index)}
                                                className={`flex-shrink-0 relative group transition-all duration-300 cursor-pointer ${activeIndex === index
                                                    ? 'ring-0 ring-blue-500 scale-105'
                                                    : 'ring-0 ring-transparent hover:ring-gray-400'
                                                    } rounded-lg overflow-hidden`}
                                            >
                                                <div className="size-20 lg:w-32 lg:h-32 relative">
                                                    <Image
                                                        src={image.imgUrl}
                                                        alt={image.altText || `Thumbnail ${index + 1}`}
                                                        fill
                                                        className={`w-full h-full object-cover transition-all duration-300 ${activeIndex === index
                                                            ? 'brightness-100'
                                                            : 'brightness-50 group-hover:brightness-75'
                                                            }`}
                                                    />
                                                    {activeIndex !== index && (
                                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/10 transition-all" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 h-full">
                            <div className="flex flex-col items-start justify-center h-full p-6 lg:pt-8 lg:pb-20 xl:pl-[140px] overflow-hidden">
                                <div className="space-y-3 md:space-y-5 text-center sm:text-left">
                                    <div className="mb-2 w-full">
                                        <h1 className="text-(--maincolor) text-2xl lg:text-3xl font-bold leading-tight whitespace-normal inline-block align-middle">
                                            {product.name}
                                            <BusinessGroupBadge product={product} className="ml-3 align-top inline-flex" />
                                        </h1>
                                    </div>
                                    <div className='text-(--maincolor) text-base/6 font-normal'>{product_display.short_description}</div>

                                    {/* Price */}
                                    <div className="flex flex-col items-center sm:items-start pb-5">
                                        <div className="flex items-baseline justify-center sm:justify-start gap-3 mb-1 w-full">
                                            <span className="text-(--maincolor) text-xl md:text-2xl font-bold">
                                                {price_range.currency}{price_range.discounted_price || price_range.price}
                                            </span>
                                            {price_range.discounted_price && price_range.price !== price_range.discounted_price && (
                                                <span className="text-lg text-slate-500 line-through tracking-tight text-slate-400">
                                                    {price_range.currency}{price_range.price}
                                                </span>
                                            )}
                                        </div>
                                        {/* Show standard discount ONLY if no dynamic business group discount or volume tiers are active */}
                                        {price_range.discount_percentage && bgDiscount <= 0 && !hasVolumeTiers && (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
                                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                                    Save {price_range.discount_percentage}%
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Feature */}
                                    <div className="flex flex-wrap justify-center border-b border-[#BFC8C6] pb-5 mb-6 w-full">
                                        {product_display.badges.map((badge, idx) => (
                                            <div key={idx} className="flex flex-col items-center justify-center gap-2 text-center p-3 w-full sm:w-1/2 md:w-1/4 border-[#BFC8C6] border-b last:border-b-0 sm:border-b-0 sm:border-r sm:even:border-r-0 md:border-r md:even:border-r md:[&:nth-child(4n)]:border-r-0 last:border-r-0">
                                                <Image src={badge.imgUrl} alt={badge.title} width={40} height={40} />
                                                <p className="!text-(--maincolor) text-sm font-medium">{badge.title}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-white rounded-lg p-5 mb-6 shadow-sm border border-slate-100">
                                        <h3 className="text-lg font-semibold text-(--maincolor) mb-3">Key Highlights:</h3>
                                        <ul className="text-(--maincolor) space-y-2">
                                            {product_display.highlights.map((highlight, idx) => (
                                                <li key={idx} className="flex items-start text-left gap-2 text-base text-slate-600">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-(--btncolor) flex-shrink-0 mt-2" />
                                                    {highlight}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Volume Tiers Table */}
                                    {isType2 && user && (() => {
                                        const vt = getVolumeTiers(product, user.business_group);
                                        if (!vt || vt.tiers.length === 0) return null;
                                        return (
                                            <div className="mt-4">
                                                <VolumePricingTable 
                                                    tiers={vt.tiers} 
                                                    billing_cycle={vt.billing_cycle}
                                                    currency={price_range.currency}
                                                />
                                            </div>
                                        );
                                    })()}

                                    {/* Add to cart */}
                                    <div className="mt-6 flex flex-col gap-4">
                                        <button
                                            disabled={!isVisible(product, user?.business_group)}
                                            onClick={() => {
                                                if (!isVisible(product, user?.business_group)) {
                                                    toast.error(getRestrictionMessage());
                                                    return;
                                                }
                                                const basePrice = parseFloat(String(price_range.discounted_price || price_range.price).replace(/[^0-9.]/g, '') || '0');
                                                const finalId = product.id || product.product_id || product.pk || 0;

                                                addItem({
                                                    id: finalId,
                                                    name: product.name,
                                                    price: basePrice,
                                                    image: images[0]?.imgUrl || images[activeIndex]?.imgUrl || "/images/photo-kits1.jpg",
                                                    quantity: 1,
                                                    slug: product.slug,
                                                    category: product.category_name || "Testing Kit"
                                                });
                                                router.push('/cart');
                                            }}
                                            className={`btn btn-primary h-14 px-6 lg:px-5 bg-(--btncolor) text-lg font-semibold before:bg-(--btncolor) before:border-(--btncolor) cursor-pointer ${!isVisible(product, user?.business_group) ? 'opacity-50 grayscale' : ''}`}
                                        >
                                            {!isVisible(product, user?.business_group) ? "Product Unavailable" : "Order Test Kit Now"}
                                        </button>
                                        <Link
                                            href="#howItWork"
                                            data-hover="How It Works"
                                            className="btn
                                            h-14 px-6 lg:px-8
                                            bg-(--background)
                                            !text-(--maincolor)
                                            text-lg
                                            before:bg-(--background)/90
                                            before:border-(--background)"
                                        >
                                            How It Works
                                        </Link>
                                    </div>

                                    <div className="bg-[#FEF3F0] rounded-xl p-4 border-l-4 border-[#E07A5F] flex items-start gap-3">
                                        <CircleAlert className="lucide-circle-alert w-5 h-5 text-[#E07A5F] flex-shrink-0 mt-0.5" />
                                        <p className="!text-sm text-slate-700"><strong>Important:</strong> Not for emergency use. If symptoms are severe, seek urgent medical care.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {physical_details && (
                <div className="py-12 lg:py-20 bg-white">
                    <div className="container">
                        <div className="lg:max-w-7xl mx-auto lg:px-8">
                            <div className="text-center mb-6">
                                <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold mb-5">{physical_details.title}</h2>
                                <div
                                    className="text-(--maincolor) leading-relaxed !text-lg mb-6 prose max-w-none text-center"
                                    dangerouslySetInnerHTML={{ __html: physical_details.description }}
                                />
                            </div>
                        </div>
                        <div className="prose prose-slate lg:max-w-5xl mx-auto lg:px-8">
                            <div className="grid md:grid-cols-2 gap-8 mt-10">
                                {physical_details.features.map((feature, idx) => (
                                    <div key={feature.id || idx} className={`${idx === 0 ? 'bg-(--blockground)' : 'bg-white border border-slate-200'} rounded-2xl p-8`}>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div key={feature.id || idx} className={`${idx === 0 ? 'bg-white' : 'bg-[#E8F4F2]'} w-12 h-12 rounded-lg flex items-center justify-center`}>
                                                <Image src={feature.iconUrl} alt={feature.title} width={30} height={30} />
                                            </div>
                                            <h3 className="text-xl font-semibold text-(--maincolor)">{feature.title}</h3>
                                        </div>
                                        <div
                                            className="text-slate-600 prose prose-sm max-w-none
                                            [&_ul]:!list-disc [&_ul]:!list-outside [&_ul]:pl-6 [&_ul]:pb-3 
                                            [&_li]:marker:text-(--btncolor) [&_li]:marker:text-lg [&_li+li]:mt-3"
                                            dangerouslySetInnerHTML={{ __html: feature.content }}

                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )
            }


            {
                physical_how_it_works && (
                    <div className="py-12 lg:py-20 bg-[#FAFBFC] scroll-mt-10" id="howItWork">
                        <div className="container">
                            <div className="text-center mb-8 lg:mb-12">
                                <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold lg:mb-3">{physical_how_it_works.title}</h2>
                                <p className="!text-lg text-(--maincolor) max-w-2xl mx-auto">{physical_how_it_works.subtitle}</p>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
                                {physical_how_it_works.steps.map((step, idx) => (
                                    <div key={step.id || idx} className="relative">
                                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-center mb-4">
                                                <div className="relative">
                                                    <div className="w-14 h-14 bg-(--blockground) rounded-full flex items-center justify-center">
                                                        <Image src={step.iconUrl} alt={step.title} width={28} height={28} />
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-(--btncolor) rounded-full flex items-center justify-center">
                                                        <span className="text-white font-bold text-xs">{idx + 1}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <h3 className="text-base font-semibold text-(--maincolor) text-center mb-2">{step.title}</h3>
                                            <div
                                                className="text-slate-600 text-center text-sm prose max-w-none"
                                                dangerouslySetInnerHTML={{ __html: step.description }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {
                physical_kit_usage && (
                    <div className="py-12 lg:py-20 bg-white">
                        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-8 lg:mb-12">
                                <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold">{physical_kit_usage.title}</h2>
                                <p className="text-(--maincolor) !text-lg max-w-2xl mx-auto lg:mt-3">{physical_kit_usage.subtitle}</p>
                            </div>
                            <div className="grid lg:grid-cols-2 gap-10 items-center">
                                <div className="order-2 lg:order-1">
                                    <div className="mb-3">
                                        <h3 className="text-lg font-bold text-(--maincolor) mb-2">{physical_kit_usage.video_title}</h3>
                                        <p className="text-slate-600">{physical_kit_usage.video_subtitle}</p>
                                    </div>
                                    <div className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer shadow-lg" onClick={() => setIsPlaying(true)}>
                                        {!isPlaying ? (
                                            <>
                                                {physical_kit_usage.video_thumbnail_url && (
                                                    <Image
                                                        src={physical_kit_usage.video_thumbnail_url}
                                                        alt="Video Tutorial"
                                                        fill
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                )}
                                                <div className="absolute inset-0 bg-(--maincolor)/80 flex items-center flex-col justify-center group-hover:bg-black/20 transition-all duration-300">
                                                    <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 mb-4">
                                                        <Play className="lucide-play size-6 text-(--maincolor) fill-(--maincolor) ml-1" />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <iframe
                                                src={physical_kit_usage.video_url.includes('?') ? `${physical_kit_usage.video_url}&autoplay=1` : `${physical_kit_usage.video_url}?autoplay=1`}
                                                className="w-full h-full"
                                                allow="autoplay; encrypted-media"
                                                allowFullScreen
                                            />
                                        )}
                                    </div>
                                    <div className="mt-6 flex flex-wrap gap-4">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                            <Clock className="size-4" />
                                            <span>3:45 Duration</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-(--maincolor) rounded-full text-sm font-medium">
                                            <Shield className="size-4" />
                                            <span>Step-by-step guidance</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="order-1 lg:order-2">
                                    <div className="bg-(--blockground) rounded-2xl p-8">
                                        <h3 className="text-2xl font-bold text-(--maincolor) mb-6">{physical_kit_usage.list_title}</h3>
                                        <ul className="text-base/5 space-y-4 grid grid-cols-1_sm:grid-cols-2_gap-4">
                                            {physical_kit_usage.list_items.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-(--maincolor) rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                        <Check className="lucide-check size-4 text-white" />
                                                    </div>
                                                    <span className="text-slate-600">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-8 p-5 bg-white rounded-xl border-l-4 border-[#E07A5F]">
                                            <div className="[&_p]:!text-sm text-slate-700 italic" dangerouslySetInnerHTML={{ __html: physical_kit_usage.note_content }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <div className="py-12 lg:py-20 bg-(--maincolor)">
                <div className="container">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                    <MessageCircleQuestion className="size-6 text-white" />
                                </div>
                                <span className="text-(--btncolor) font-medium">Test Guidance</span>
                            </div>
                            <h2 className="text-white text-2xl/8 lg:text-3xl font-bold mb-6">Not Sure Which Test Kit to Choose?</h2>
                            <p className="text-white/80 !text-lg leading-relaxed mb-8">Let us help you find the right test based on your
                                symptoms or health concerns. Here are some common starting points:</p>
                            <Link
                                href="#"
                                data-hover="Get Help Choosing a Test"
                                className="btn btn-primary
                                    !inline-flex items-center justify-center gap-2
                                    [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
                                    h-14
                                    px-6 lg:px-8
                                    bg-(--btncolor)
                                    text-lg
                                    before:bg-(--btncolor)
                                    before:border-(--btncolor)"
                            >
                                Get Help Choosing a Test
                                <ArrowRight className="size-5 ml-2" />
                            </Link>
                        </div>
                        <div className="space-y-4">
                            <Link href={`/${TESTING_KITS_SLUG}`}
                                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all group">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Battery className="size-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">Tiredness or fatigue</p>
                                    <p className="text-(--btncolor) !text-sm">→ Vitamins & Iron Tests</p>
                                </div>
                                <ArrowRight className="size-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </Link>
                            <Link href={`/${TESTING_KITS_SLUG}`}
                                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all group">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <ShieldAlert className="size-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">Frequent infections</p>
                                    <p className="text-(--btncolor) !text-sm">→ Immunology / Infection Screening</p>
                                </div>
                                <ArrowRight className="size-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </Link>
                            <Link href={`/${TESTING_KITS_SLUG}`}
                                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all group">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Waves className="size-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">Thyroid symptoms</p>
                                    <p className="text-(--btncolor) !text-sm">→ Endocrinology Tests</p>
                                </div>
                                <ArrowRight className="size-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </Link>
                            <Link href={`/${TESTING_KITS_SLUG}`}
                                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all group">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Stethoscope className="size-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">Digestive issues</p>
                                    <p className="text-(--btncolor) !text-sm">→ Gastrointestinal Tests</p>
                                </div>
                                <ArrowRight className="size-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </Link>
                            <Link href={`/${TESTING_KITS_SLUG}`}
                                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all group">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Heart className="size-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">Sexual health concerns</p>
                                    <p className="text-(--btncolor) !text-sm">→ Sexual Health Kits</p>
                                </div>
                                <ArrowRight className="size-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {
                physical_what_to_expect && (
                    <div className="py-12 lg:py-20 bg-[#FAFBFC]">
                        <div className="container">
                            <div className="text-center mb-8 lg:mb-12">
                                <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold">{physical_what_to_expect.title}</h2>
                                <p className="text-(--maincolor) !text-lg max-w-2xl mx-auto lg:mt-3">{physical_what_to_expect.subtitle}</p>
                            </div>
                            <div className="grid md:grid-cols-3 gap-6">
                                {physical_what_to_expect.stages.map((stage, idx) => (
                                    <div key={stage.id || idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-5 overflow-hidden">
                                            <Image src={stage.imageUrl} alt={stage.title} width={56} height={56} className="size-7" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-(--maincolor) mb-1">{stage.title}</h3>
                                        <div
                                            className="text-slate-600 prose prose-sm max-w-none [&_p]:text-slate-600 [&_p_strong]:pt-4 [&_p_strong]:text-(--maincolor) [&_p]:flex"
                                            dangerouslySetInnerHTML={{ __html: stage.description }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            <div className="py-12 lg:py-20">
                <div className="container">
                    <div className="text-center mb-8 lg:mb-12">
                        <span className="block text-(--maincolor)/70 text-base capitalize mb-2">Most Frequently</span>
                        <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold">Frequently Asked Questions</h2>
                    </div>
                    <div className="mx-auto max-w-3xl space-y-4">
                        {accordionData.map((item, index) => (
                            <FAQAccordionItem
                                key={index}
                                item={item}
                                isOpen={openIndex === index}
                                onToggle={() => toggleAccordion(index)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="py-12 lg:py-20 bg-[#FAFBFC]">
                <div className="container">
                    <div className="text-center mb-8 lg:mb-12">
                        <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold">Related Test Kits</h2>
                        <p className="!text-(--maincolor) !text-lg/6 font-normal lg:mt-3 max-w-2xl mx-auto">Customers also viewed these tests</p>
                    </div>

                    {isLoadingRelated ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--maincolor)" />
                        </div>
                    ) : relatedKits.length > 0 ? (
                        <div className="relative related-kits-slider sm:px-5 pb-10 sm:pb-0">
                            <Swiper
                                modules={[Navigation, Pagination]}
                                navigation={{
                                    nextEl: '.related-kits-next',
                                    prevEl: '.related-kits-prev',
                                }}
                                pagination={{
                                    clickable: true,
                                    el: '.related-kits-dots',
                                }}
                                spaceBetween={16}
                                grabCursor={true}
                                loop={relatedKits.length > 4}
                                speed={600}
                                breakpoints={{
                                    320: { slidesPerView: 1.1, spaceBetween: 12 },
                                    480: { slidesPerView: 1.5, spaceBetween: 14 },
                                    640: { slidesPerView: 2, spaceBetween: 20 },
                                    1024: { slidesPerView: 3, spaceBetween: 24 },
                                    1280: { slidesPerView: 4, spaceBetween: 24 },
                                }}
                                style={{ overflow: 'hidden' }}
                                className="[&_.swiper-wrapper]:items-stretch"
                            >
                                {relatedKits.map((kit) => (
                                    <SwiperSlide key={kit.id} style={{ height: 'auto' }}>
                                        <KitCard key={kit.id} kit={kit} onQuickView={handleQuickView} />
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            {/* Pagination dots — mobile only */}
                            <div className="related-kits-dots sm:hidden flex justify-center mt-4 gap-1.5 [&_.swiper-pagination-bullet]:size-2 [&_.swiper-pagination-bullet]:rounded-full [&_.swiper-pagination-bullet]:bg-slate-300 [&_.swiper-pagination-bullet-active]:bg-(--maincolor) [&_.swiper-pagination-bullet-active]:w-5" />

                            {/* Prev arrow — desktop only */}
                            <button
                                aria-label="Previous"
                                className="related-kits-prev hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 size-10 bg-white border border-slate-200 rounded-full shadow-md items-center justify-center text-(--maincolor) hover:bg-(--maincolor) hover:text-white hover:border-(--maincolor) transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            {/* Next arrow — desktop only */}
                            <button
                                aria-label="Next"
                                className="related-kits-next hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 size-10 bg-white border border-slate-200 rounded-full shadow-md items-center justify-center text-(--maincolor) hover:bg-(--maincolor) hover:text-white hover:border-(--maincolor) transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-500">No related kits found.</div>
                    )}
                </div>
            </div>

            <div className="py-12 lg:py-20 bg-(--blockground)">
                <div className="container">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold mb-3">Browse At-Home Blood & Urine Test Kits</h2>
                        <div className="text-(--maincolor) text-base/6 md:text-lg lg:text-lg font-normal mb-10 max-w-2xl mx-auto">Order online anytime. Discreet delivery across Ireland.</div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href={`/${TESTING_KITS_SLUG}`}
                                data-hover="Browse All Test Kits"
                                className="btn btn-primary
                                    !inline-flex items-center justify-center gap-2
                                    [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
                                    h-14
                                    px-6 lg:px-8
                                    bg-(--btncolor)
                                    text-lg
                                    before:bg-(--btncolor)
                                    before:border-(--btncolor)"
                            >
                                Browse All Test Kits
                                <ArrowRight className="size-5 ml-2" />
                            </Link>
                            <Link
                                href="#"
                                data-hover="Contact Support"
                                className="btn
                                    !inline-flex items-center justify-center gap-2
                                    [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0
                                    !text-(--maincolor)
                                    text-lg
                                    font-semibold
                                    whitespace-nowrap
                                    h-14
                                    px-6 lg:px-8
                                    bg-white
                                    border-1
                                    border-(--maincolor)
                                    before:bg-white
                                    before:border-none"
                            >
                                <MessageCircle className="size-5 mr-2" />
                                Contact Support
                            </Link>
                        </div>
                        <p className="mt-10 !text-sm text-slate-500 max-w-lg mx-auto">Results are for informational screening and do not
                            replace emergency care. Contact your GP or emergency services for urgent symptoms.</p>
                    </div>
                </div>
            </div>


            {/* Full Screen Image Modal */}
            <AnimatePresence>
                {isFullScreen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
                        onClick={() => setIsFullScreen(false)}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setIsFullScreen(false)}
                            className="absolute top-4 right-4 z-10 size-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
                            aria-label="Close full screen"
                        >
                            <X className="size-6" />
                        </button>

                        {/* Image counter */}
                        <div className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white font-medium">
                            {activeIndex + 1} / {images.length}
                        </div>

                        {/* Navigation arrows */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                                    }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 size-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
                                    aria-label="Previous image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 size-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
                                    aria-label="Next image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            </>
                        )}

                        {/* Full screen image */}
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="relative max-w-7xl max-h-[90vh] w-full h-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {images.length > 0 && (
                                <Image
                                    src={images[activeIndex].imgUrl}
                                    alt={images[activeIndex].altText || product.name}
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            )}
                        </motion.div>

                        {/* Thumbnail strip at bottom */}
                        {images.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 max-w-4xl w-full px-4">
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center">
                                    {images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveIndex(index);
                                            }}
                                            className={`flex-shrink-0 relative transition-all duration-300 rounded-lg overflow-hidden ${activeIndex === index
                                                ? 'ring-2 ring-white scale-110'
                                                : 'ring-1 ring-white/30 hover:ring-white/60'
                                                }`}
                                        >
                                            <div className="size-16 lg:size-20 relative">
                                                <Image
                                                    src={image.imgUrl}
                                                    alt={image.altText || `Thumbnail ${index + 1}`}
                                                    fill
                                                    className={`object-cover transition-all duration-300 ${activeIndex === index ? 'brightness-100' : 'brightness-50 hover:brightness-75'
                                                        }`}
                                                />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick View Modal */}
            <QuickViewModal
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
                kit={selectedQuickViewKit}
            />
        </>
    );
}
