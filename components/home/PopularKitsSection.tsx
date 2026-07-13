"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { TESTING_KITS_SLUG } from "@/lib/constants";
import { getMockPopularKits, type MockPhysicalProduct } from "@/lib/mock-data";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

/** Marketing details per popular kit, keyed by slug. */
const KIT_DETAILS: Record<
    string,
    { tagline: string; biomarkers: number; rating: number; reviews: number }
> = {
    "vitamin-d-test-kit": { tagline: "Ireland's sunshine vitamin", biomarkers: 1, rating: 4.8, reviews: 742 },
    "blood-glucose-test-kit": { tagline: "Small test, big insights", biomarkers: 1, rating: 4.7, reviews: 511 },
    "tsh-test-kit": { tagline: "Check your thyroid", biomarkers: 1, rating: 4.7, reviews: 388 },
    "lipid-profile-test-kit": { tagline: "Know your heart health", biomarkers: 4, rating: 4.8, reviews: 623 },
    "vitamin-b12-test-kit": { tagline: "Beat the brain fog", biomarkers: 1, rating: 4.6, reviews: 456 },
    "complete-blood-count-cbc-test-kit": { tagline: "The complete overview", biomarkers: 12, rating: 4.9, reviews: 302 },
    "iron-profile-test-kit": { tagline: "Fight fatigue at the source", biomarkers: 4, rating: 4.7, reviews: 419 },
    "comprehensive-health-check-kit": { tagline: "Take control of your health", biomarkers: 47, rating: 4.9, reviews: 824 },
};

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={16}
                        className={
                            star <= Math.round(rating)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-slate-200 text-slate-200"
                        }
                    />
                ))}
            </div>
            <span className="text-sm text-(--btncolor)">({reviews})</span>
        </div>
    );
}

function KitSlideCard({ kit }: { kit: MockPhysicalProduct }) {
    const details = KIT_DETAILS[kit.slug] ?? {
        tagline: "Doctor-reviewed results",
        biomarkers: 1,
        rating: 4.7,
        reviews: 250,
    };
    const href = `/${kit.category_slug || TESTING_KITS_SLUG}/${kit.slug}`;
    const collection =
        kit.test_type === "urine_test"
            ? "Urine sample collection"
            : "Finger-prick collection";
    const price = kit.price.discounted_price || kit.price.price;

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
            {/* Tagline header */}
            <div className="bg-(--maincolor) px-4 py-3 text-center">
                <span className="text-sm font-semibold text-white">{details.tagline}</span>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-5">
                <h3 className="mb-2 text-lg font-bold text-(--maincolor)">{kit.name}</h3>
                <p className="mb-5 text-sm leading-relaxed text-slate-600 line-clamp-2">
                    {kit.description}
                </p>

                <div className="mb-4 space-y-1">
                    <p className="text-sm font-semibold text-(--maincolor)">
                        Results estimated in {kit.results_delivery} working days
                    </p>
                    <p className="text-sm text-(--maincolor)">
                        {details.biomarkers} biomarker{details.biomarkers === 1 ? "" : "s"}
                    </p>
                </div>

                <div className="mb-4">
                    <StarRating rating={details.rating} reviews={details.reviews} />
                </div>

                <p className="mb-4 text-2xl font-bold text-(--maincolor)">
                    {kit.price.currency}{price}
                </p>

                <div className="mt-auto space-y-3">
                    <p className="text-center text-sm text-slate-600">{collection}</p>
                    <Link
                        href={href}
                        className="block w-full border border-(--maincolor) px-4 py-3 text-center text-base font-medium text-(--maincolor) transition-colors hover:bg-(--maincolor) hover:text-white"
                    >
                        Select test
                    </Link>
                </div>
            </div>
        </div>
    );
}

/** Home page product catalog — the most popular blood testing kits. */
export default function PopularKitsSection() {
    const kits = getMockPopularKits();

    return (
        <section className="bg-white py-12 lg:py-20">
            <div className="container">
                <div className="mb-8 text-center lg:mb-12">
                    <span className="mb-2 block text-base text-(--maincolor)/70">
                        Results you can act on
                    </span>
                    <h2 className="text-2xl/8 font-bold text-(--maincolor) md:text-3xl">
                        Most Popular Test Kits
                    </h2>
                </div>

                <Swiper
                    modules={[Navigation, Pagination]}
                    navigation={{
                        nextEl: ".popular-kits-next",
                        prevEl: ".popular-kits-prev",
                    }}
                    pagination={{
                        clickable: true,
                        el: ".popular-kits-dots",
                    }}
                    spaceBetween={20}
                    grabCursor
                    loop={kits.length > 4}
                    speed={600}
                    breakpoints={{
                        320: { slidesPerView: 1.1, spaceBetween: 14 },
                        640: { slidesPerView: 2, spaceBetween: 16 },
                        1024: { slidesPerView: 3, spaceBetween: 20 },
                        1280: { slidesPerView: 4, spaceBetween: 20 },
                    }}
                    className="[&_.swiper-wrapper]:items-stretch"
                >
                    {kits.map((kit) => (
                        <SwiperSlide key={kit.slug} style={{ height: "auto" }}>
                            <KitSlideCard kit={kit} />
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Dots left, arrows right */}
                <div className="mt-8 flex items-center justify-between">
                    <div className="popular-kits-dots flex items-center gap-1.5 [&_.swiper-pagination-bullet]:size-2.5 [&_.swiper-pagination-bullet]:rounded-full [&_.swiper-pagination-bullet]:bg-slate-300 [&_.swiper-pagination-bullet]:opacity-100 [&_.swiper-pagination-bullet-active]:bg-(--maincolor)" />
                    <div className="flex items-center gap-3">
                        <button
                            aria-label="Previous kits"
                            className="popular-kits-prev flex size-11 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-(--maincolor) transition-colors hover:border-(--maincolor) hover:bg-(--maincolor) hover:text-white disabled:pointer-events-none disabled:opacity-30"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <button
                            aria-label="Next kits"
                            className="popular-kits-next flex size-11 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-(--maincolor) transition-colors hover:border-(--maincolor) hover:bg-(--maincolor) hover:text-white disabled:pointer-events-none disabled:opacity-30"
                        >
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
