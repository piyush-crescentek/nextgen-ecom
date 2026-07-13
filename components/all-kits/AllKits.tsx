"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { TESTING_KITS_SLUG, ALL_TEST_KITS_SLUG } from "@/lib/constants";
import {
    MOCK_PHYSICAL_PRODUCTS,
    MOCK_PHYSICAL_FILTERS,
    getMockPriceRange,
    type MockPhysicalProduct,
} from "@/lib/mock-data";
import { Activity, Battery, Dumbbell, MessageCircle, Scissors, Zap, SearchX, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import ConcernCard, { Concern } from "./ConcernCard";
import FAQAccordionItem from "./FAQAccordionItem";
import FilterSidebar, { FilterGroup } from "./FilterSidebar";
import KitCard, { Kit } from "./KitCard";
import QuickViewModal from "./QuickViewModal";

interface AllKitsProps {
    subcategorySlug?: string;
}

type FilterableKit = Kit & { subcategory_slug: string };

function toKit(product: MockPhysicalProduct): FilterableKit {
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
        raw_price: parseFloat(product.price.discounted_price || product.price.price || '0'),
        category_name: product.subcategory_name || "General Test",
        category_id: product.category_id,
        slug: product.slug,
        subcategory_slug: product.subcategory_slug,
    };
}

const FILTER_GROUPS: FilterGroup[] = [
    {
        title: "Category",
        showSearch: true,
        options: MOCK_PHYSICAL_FILTERS.subcategories.map((c) => ({ id: c.value, label: c.label })),
    },
    {
        title: "Price Range (EUR)",
        options: MOCK_PHYSICAL_FILTERS.price_ranges.map((p) => ({ id: p.label, label: p.label })),
    },
    {
        title: "Type",
        options: MOCK_PHYSICAL_FILTERS.test_types.map((t) => ({ id: t.value, label: t.label })),
    },
    {
        title: "Turnaround Time",
        options: MOCK_PHYSICAL_FILTERS.turnaround_times.map((tt) => ({ id: tt.value, label: tt.label })),
    },
];

export default function AllKits({ subcategorySlug }: AllKitsProps) {
    const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    // Selected filter option ids, keyed by group title.
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

    const handleQuickView = (kit: Kit) => {
        setSelectedKit(kit);
        setIsQuickViewOpen(true);
    };

    const toggleFilter = (groupTitle: string, optionId: string) => {
        setSelectedFilters((prev) => {
            const current = prev[groupTitle] || [];
            const next = current.includes(optionId)
                ? current.filter((id) => id !== optionId)
                : [...current, optionId];
            return { ...prev, [groupTitle]: next };
        });
    };

    const clearFilters = () => setSelectedFilters({});

    const isMainCategory = !subcategorySlug ||
        subcategorySlug === TESTING_KITS_SLUG ||
        subcategorySlug === ALL_TEST_KITS_SLUG;

    // Static mock data — no API call is made.
    const kits = useMemo(() => {
        let products = MOCK_PHYSICAL_PRODUCTS;
        if (!isMainCategory) {
            products = products.filter((p) => p.subcategory_slug === subcategorySlug);
        }
        let mapped = products.map(toKit);

        const categories = selectedFilters["Category"] || [];
        if (categories.length > 0) {
            mapped = mapped.filter((k) => categories.includes(k.subcategory_slug));
        }

        const priceRanges = selectedFilters["Price Range (EUR)"] || [];
        if (priceRanges.length > 0) {
            mapped = mapped.filter((k) =>
                priceRanges.some((label) => {
                    const range = getMockPriceRange(label);
                    if (!range) return false;
                    const price = k.raw_price || 0;
                    return price >= range.min && price < range.max;
                })
            );
        }

        const testTypes = selectedFilters["Type"] || [];
        if (testTypes.length > 0) {
            mapped = mapped.filter((k) => k.test_type && testTypes.includes(k.test_type));
        }

        const turnarounds = selectedFilters["Turnaround Time"] || [];
        if (turnarounds.length > 0) {
            mapped = mapped.filter((k) => k.turnaround_time && turnarounds.includes(k.turnaround_time));
        }

        return mapped;
    }, [isMainCategory, subcategorySlug, selectedFilters]);

    const concerns: Concern[] = [
        {
            id: 1,
            href: "#",
            icon: Battery,
            title: "Fatigue & Low Energy",
            description: "Vitamin D, B12, Iron"
        },
        {
            id: 2,
            href: "#",
            icon: Zap,
            title: "Vitamin D / B12 Concerns",
            description: "Specific vitamin tests"
        },
        {
            id: 3,
            href: "#",
            icon: Scissors,
            title: "Hair Loss / Brittle Nails",
            description: "Iron, Zinc, B vitamins"
        },
        {
            id: 4,
            href: "#",
            icon: Dumbbell,
            title: "Sports Performance / Lifestyle",
            description: "Magnesium, B12, Vitamin D"
        },
        {
            id: 5,
            href: "#",
            icon: Activity,
            title: "General Wellness Screening",
            description: "Complete nutrition panel"
        },
        {
            id: 6,
            href: "/contact-us",
            icon: MessageCircle,
            title: "Still Not Sure?",
            description: "Contact our support team",
            variant: "gradient"
        }
    ];

    // Simple flat FAQ accordion
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const accordionData = [
        {
            title: "How do at-home blood testing kits work?",
            content: "Order online, collect your sample at home with the included finger-prick instructions, and post it back in the prepaid envelope. Your sample is analysed in an INAB-accredited Irish laboratory and doctor-reviewed results arrive in your secure account within days."
        },
        {
            title: "Do I need to fast before taking a vitamin blood test?",
            content: "Most vitamin tests do not require fasting. However, if your test includes cholesterol or glucose markers, an overnight fast of 10-12 hours may be recommended. Check your specific kit instructions for guidance."
        },
        {
            title: "How do I collect the blood sample?",
            content: "Blood tests typically use a simple finger-prick method. You'll use the provided lancet to make a small prick on your fingertip, then collect a few drops of blood into the collection tube. Detailed instructions and video guides are included with every kit."
        },
        {
            title: "How quickly will I receive my results?",
            content: "Most panels are processed within 1-3 working days of the laboratory receiving your sample. You'll get an email notification the moment your doctor-reviewed report is ready in your secure online account."
        },
        {
            title: "Are these tests suitable if I'm already taking supplements?",
            content: "Yes, these tests can be useful to check if your supplement regime is effective and bringing your levels into optimal range. However, for the most accurate baseline reading, some practitioners recommend testing before starting supplementation. Consult your GP if unsure."
        },
        {
            title: "Is my order and result data private?",
            content: "Completely. Kits ship in plain, unbranded packaging, and your results are encrypted and visible only to you and the reviewing clinician — never shared with employers, insurers, or anyone else."
        }
    ];
    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };
    // FAQs Accordion

    return (
        <>

            {/* Banner */}
            {/* <div className="flex md:items-center md:flex-row flex-col bg-(--foreground) md:pt-[115px] relative">
            <div className="container">
                <div className="flex flex-col items-center justify-center h-full pt-16 pb-20 overflow-hidden">
                    <div className="space-y-3 md:space-y-5 text-center text-center">
                        <div className="animated fadeInUp">
                            <h1 className="text-(--maincolor) text-3xl sm:text-4xl lg:text-5xl font-bold md:leading-none mb-2">
                                All Blood Test Kits
                                <span className="text-lg font-semibold text-(--maincolor) block mt-3">At-Home Blood Testing Kits • Ireland</span>
                            </h1>
                            <div className='text-slate-600 text-base/6 font-normal'>Order discreet at-home blood testing kits with fast results and secure online access. Professional laboratory analysis delivered to your door.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div> */}

            <div className="flex items-center bg-[url(/images/photo-kits4.jpg)] bg-top bg-center bg-no-repeat bg-cover min-h-[300px] sm:min-h-[400px] md:min-h-[440px] relative">
                <div className='absolute top-0 left-0 w-full h-full bg-transparent
                    bg-gradient-to-r from-(--maincolor) via-(--maincolor)/90 via-[50%]
                    mix-blend-multiply
                    opacity-100
                    transition-[background,border-radius,opacity]
                    duration-300'
                />
                <div className="container">
                    <div className="flex flex-col items-center justify-center h-full md:mt-16 max-w-6xl mx-auto overflow-hidden">
                        <div className="space-y-3 md:space-y-5 text-center">
                            <div className="animated fadeInUp">
                                <h1 className="text-white text-2xl sm:text-4xl lg:text-5xl font-bold md:leading-none mb-2 px-4">
                                    Blood Testing Kits
                                    <span className="text-base sm:text-lg font-semibold text-white block mt-2 sm:mt-3">At-Home Blood Testing Kits • Ireland</span>
                                </h1>
                                <div className='text-gray-300 text-sm sm:text-base/6 font-normal max-w-2xl mx-auto px-4'>Order discreet at-home blood testing kits with fast results and secure online access. Professional laboratory analysis delivered to your door.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-8 sm:pt-12 lg:pt-20 pb-8 sm:pb-12 lg:pb-20 bg-white">
                <div className="container">
                    <div className="flex flex-col xl:flex-row justify-between gap-6 sm:gap-8">
                        <FilterSidebar
                            groups={FILTER_GROUPS}
                            selected={selectedFilters}
                            onToggle={toggleFilter}
                            onClear={clearFilters}
                        />
                        <div className="lg:mx-auto w-full xl:w-3/4">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <p className="text-(--maincolor) text-sm sm:text-base">Showing {kits.length} test kits</p>
                            </div>
                            <div className="relative min-h-[300px] sm:min-h-[400px]">
                                {kits.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className="flex flex-col items-center justify-center py-24 px-4 text-center"
                                    >
                                        <div className="size-24 rounded-[32px] bg-slate-50 flex items-center justify-center mb-8 relative group">
                                            <SearchX className="size-12 text-slate-300 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute inset-0 bg-slate-100 rounded-[32px] -z-10"
                                            />
                                        </div>
                                        <h3 className="text-2xl font-bold text-(--maincolor) mb-3 font-mainfont">No Kits Found</h3>
                                        <p className="text-slate-500 max-w-sm leading-relaxed mb-10">We couldn&apos;t find any test kits matching your current category or filters. Please try checking another category.</p>
                                        {Object.values(selectedFilters).some((ids) => ids.length > 0) && (
                                            <button
                                                onClick={clearFilters}
                                                className="mb-4 px-8 h-12 rounded-full border border-(--maincolor) text-(--maincolor) font-bold text-base hover:bg-(--maincolor) hover:text-white transition-all duration-300 cursor-pointer"
                                            >
                                                Clear Filters
                                            </button>
                                        )}
                                        <Link
                                            href={`/${TESTING_KITS_SLUG}`}
                                            className="px-8 h-14 rounded-full bg-(--maincolor) text-white font-bold text-lg flex items-center gap-3 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                        >
                                            Browse All Categories
                                            <ArrowRight size={18} />
                                        </Link>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                            {kits.map((kit) => (
                                                <KitCard key={kit.slug || kit.id} kit={kit} onQuickView={handleQuickView} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {kits.length > 0 && (
                <>
                    <div className="py-12 lg:py-20 bg-[#FAFBFC]">
                        <div className="container">
                            <div className="text-center mb-8 lg:mb-12">
                                <h2 className="text-(--maincolor) text-2xl/8 md:text-3xl font-bold lg:mb-3">Not Sure Which Test to Choose?</h2>
                                <p className="!text-lg text-(--maincolor) max-w-2xl mx-auto">Select your primary concern below to find the most relevant test kits for your needs.</p>
                            </div>
                            <div className="max-w-5xl mx-auto">
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                    {concerns.map((concern) => (
                                        <ConcernCard key={concern.id} concern={concern} />
                                    ))}
                                </div>
                                <div className="text-center">
                                    <Link
                                        href="#"
                                        data-hover="Contact Support"
                                        className="btn btn-primary
                                            !inline-flex items-center justify-center gap-2
                                            [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0
                                            h-14
                                            px-6 lg:px-8
                                            bg-(--btncolor)
                                            text-lg
                                            before:bg-(--btncolor)
                                            before:border-(--btncolor)"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle w-5 h-5 mr-2">
                                            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                                        </svg>
                                        Contact Support
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="py-12 lg:py-20">
                        <div className="container">
                            <div className="text-center mb-8 lg:mb-12">
                                <span className="block text-(--maincolor)/70 text-base capitalize mb-2">Most Frequently</span>
                                <h2 className="text-(--maincolor) text-2xl/8 md:text-3xl font-bold">Frequently Asked Questions</h2>
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
                                <h2 className="text-(--maincolor) text-2xl/8 md:text-3xl font-bold">Explore More Test Categories</h2>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300">
                                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                            strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-droplets w-7 h-7 text-blue-600">
                                            <path
                                                d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
                                            <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">Browse All Blood Testing Kits</h3>
                                    <p className="text-slate-600 text-sm mb-4">Explore our complete range of at-home test kits</p>
                                    <Link
                                        href={`/${TESTING_KITS_SLUG}`}
                                        className="inline-flex gap-2"
                                    >
                                        <div className="flex items-center text-(--btncolor) font-medium text-sm">
                                            View category
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                                strokeLinecap="round" strokeLinejoin="round"
                                                className="lucide lucide-arrow-right w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform">
                                                <path d="M5 12h14" />
                                                <path d="m12 5 7 7-7 7" />
                                            </svg>
                                        </div>
                                    </Link>
                                </div>
                                <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300">
                                    <div className="w-14 h-14 bg-pink-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                            strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart w-7 h-7 text-pink-600">
                                            <path
                                                d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">Sexual Health Tests</h3>
                                    <p className="text-slate-600 text-sm mb-4">Discreet STI screening & sexual wellness tests</p>
                                    <Link
                                        href="/sexual-health"
                                        className="inline-flex gap-2"
                                    >
                                        <div className="flex items-center text-(--btncolor) font-medium text-sm">
                                            View category
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                                strokeLinecap="round" strokeLinejoin="round"
                                                className="lucide lucide-arrow-right w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform">
                                                <path d="M5 12h14" />
                                                <path d="m12 5 7 7-7 7" />
                                            </svg>
                                        </div>
                                    </Link>
                                </div>
                                <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300">
                                    <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                            strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gauge w-7 h-7 text-indigo-600">
                                            <path d="m12 14 4-4" />
                                            <path d="M3.34 19a10 10 0 1 1 17.32 0" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">Endocrinology
                                        Tests</h3>
                                    <p className="text-slate-600 text-sm mb-4">Thyroid function & hormone marker testing</p>
                                    <Link
                                        href="/endocrinology-tests"
                                        className="inline-flex gap-2"
                                    >
                                        <div className="flex items-center text-(--btncolor) font-medium text-sm">
                                            View category
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                                strokeLinecap="round" strokeLinejoin="round"
                                                className="lucide lucide-arrow-right w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform">
                                                <path d="M5 12h14" />
                                                <path d="m12 5 7 7-7 7" />
                                            </svg>
                                        </div>
                                    </Link>
                                </div>
                                <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 relative overflow-hidden">
                                    <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                            strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-horizontal w-7 h-7 text-slate-600">
                                            <circle cx="12" cy="12" r="1" />
                                            <circle cx="19" cy="12" r="1" />
                                            <circle cx="5" cy="12" r="1" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">Explore All Categories</h3>
                                    <p className="text-slate-600 text-sm mb-4">Discover our full directory of medical tests</p>
                                    <Link
                                        href={`/${TESTING_KITS_SLUG}/categories`}
                                        className="inline-flex gap-2"
                                    >
                                        <div className="flex items-center text-(--btncolor) font-medium text-sm">
                                            View category
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                                strokeLinecap="round" strokeLinejoin="round"
                                                className="lucide lucide-arrow-right w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform">
                                                <path d="M5 12h14" />
                                                <path d="m12 5 7 7-7 7" />
                                            </svg>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )
            }

            <div className="py-12 lg:py-20 bg-(--blockground)">
                <div className="container">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-(--maincolor) text-2xl/8 md:text-3xl font-bold mb-3">Browse At-Home Blood & Urine Test Kits</h2>
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
                                Blood Testing Kits
                                <svg width="24" height="24" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    className="size-5 ml-2">
                                    <path d="M5 12h14" />
                                    <path d="m12 5 7 7-7 7" />
                                </svg>
                            </Link>
                            <Link
                                href="/contact-us"
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
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    className="size-5 mr-2">
                                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                                </svg>
                                Contact Support
                            </Link>
                        </div>
                        <p className="mt-10 !text-sm text-slate-500 max-w-lg mx-auto">Results are for informational screening and do not
                            replace emergency care. Contact your GP or emergency services for urgent symptoms.</p>
                    </div>
                </div>
            </div>


            {/* Quick View Modal */}
            <QuickViewModal
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
                kit={selectedKit}
            />
        </>

    );
}
