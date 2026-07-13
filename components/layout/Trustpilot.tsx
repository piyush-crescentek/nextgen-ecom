"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
    interface Window {
        carouselInlineWidget: any;
    }
}

export default function Trustpilot() {
    useEffect(() => {
        const initReviewsIoWidget = () => {
            if (typeof window === "undefined") return;
            const container = document.getElementById("reviewsio-carousel-widget-category");
            if (!container) return;

            if (typeof window.carouselInlineWidget !== "function") {
                setTimeout(initReviewsIoWidget, 250);
                return;
            }

            // Clear previous content to ensure fresh reload
            container.innerHTML = "";

            new window.carouselInlineWidget('reviewsio-carousel-widget-category', {
                store: 'gethealthcare.ie',
                sku: '',
                lang: 'en',
                carousel_type: 'default',
                styles_carousel: 'CarouselWidget--sideHeader--withcards',
                options: {
                    general: {
                        review_type: 'company, product',
                        min_reviews: '1',
                        max_reviews: '20',
                        address_format: 'CITY, COUNTRY',
                        enable_auto_scroll: 10000,
                        enable_pause_button: true,
                        enable_sorting: false,
                    },
                    header: {
                        enable_overall_stars: true,
                        rating_decimal_places: 2,
                    },
                    reviews: {
                        enable_customer_name: true,
                        enable_customer_location: true,
                        enable_verified_badge: true,
                        enable_subscriber_badge: true,
                        enable_recommends_badge: true,
                        enable_photos: true,
                        enable_videos: true,
                        enable_review_date: true,
                        disable_same_customer: true,
                        min_review_percent: 4,
                        third_party_source: true,
                        hide_empty_reviews: true,
                        enable_product_name: true,
                        tags: "",
                        branch: "",
                        enable_branch_name: false,
                    },
                    popups: {
                        enable_review_popups: true,
                        enable_helpful_buttons: true,
                        enable_helpful_count: true,
                        enable_share_buttons: true,
                    },
                },
                translations: {
                    verified_customer: "Verified Customer",
                },
            });
        };

        initReviewsIoWidget();

        const intervalId = setInterval(initReviewsIoWidget, 60000); // 1 minute

        return () => clearInterval(intervalId);
    }, []);

    return (
        <>
            <Script
                src="https://widget.reviews.io/carousel-inline-iframeless/dist.js?_t=2026042009"
                strategy="afterInteractive"
            />

            <div className="py-12 lg:py-20">
                <div className="container">
                    <div className="mb-6 text-center md:mb-8 md:text-left">
                        <h2 className="text-(--maincolor) text-2xl/8 font-bold sm:text-3xl">
                            Our Customer Reviews
                        </h2>
                        <p className="mt-2 text-(--textcolor) text-base/6 sm:text-lg/7">
                            Read real feedback from real customers who use Get Healthcare.
                        </p>
                    </div>
                    <div id="reviewsio-carousel-widget-category" />
                </div>
            </div>
        </>
    );
}