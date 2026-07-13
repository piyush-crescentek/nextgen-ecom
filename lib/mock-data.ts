/**
 * Static mock data layer.
 *
 * The whole storefront runs from this file — no backend API calls are made.
 * Menu, category listings, physical product kits (with filters), product
 * details, related products, doctors and landing-page content all resolve
 * from the exports below.
 *
 * The physical catalog is generated from `MOCK_BLOOD_TESTING_KITS_MENU`
 * (lib/mockBloodTestingKitsMenu.ts) so the header mega-menu, the categories
 * page, the /testing-kits listing and the product detail pages all share
 * the same category and product slugs.
 */

import type { Category } from "@/store/useMenuStore";
import type { Product, ProductDisplay } from "@/lib/types";
import { TESTING_KITS_SLUG } from "@/lib/constants";
import { MOCK_BLOOD_TESTING_KITS_MENU } from "@/lib/mockBloodTestingKitsMenu";

/* ------------------------------------------------------------------ */
/* Physical products (testing kits)                                   */
/* ------------------------------------------------------------------ */

export interface MockKitPrice {
    currency: string;
    price: string;
    discounted_price: string;
    discount_percentage?: number;
}

export interface MockPhysicalProduct {
    id: number;
    name: string;
    title: string;
    slug: string;
    description: string;
    image: string;
    category_id: number;
    category_slug: string;
    subcategory_slug: string;
    subcategory_name: string;
    turnaround_time: string;
    results_delivery: string;
    test_type: string;
    price: MockKitPrice;
}

const KIT_IMAGES = [
    "/images/photo-kits1.jpg",
    "/images/photo-kits2.jpg",
    "/images/photo-kits3.jpg",
    "/images/kits-1.jpg",
];

export const TESTING_KITS_CATEGORY_ID = 9001;

/** Deterministic attribute cycles so every kit gets stable, varied data. */
const BASE_PRICES = [39, 45, 49, 55, 59, 65, 75, 89, 99, 119];
const TURNAROUNDS = [
    { value: "1_2_days", delivery: "1-2 days" },
    { value: "2_3_days", delivery: "2-3 days" },
    { value: "3_5_days", delivery: "3-5 days" },
];

function buildKitPrice(index: number): MockKitPrice {
    const base = BASE_PRICES[index % BASE_PRICES.length];
    const hasDiscount = index % 3 === 0;
    const discounted = hasDiscount ? Math.round(base * 0.8) : base;
    return {
        currency: "€",
        price: `${base}.00`,
        discounted_price: `${discounted}.00`,
        discount_percentage: hasDiscount ? 20 : undefined,
    };
}

export const MOCK_PHYSICAL_PRODUCTS: MockPhysicalProduct[] =
    MOCK_BLOOD_TESTING_KITS_MENU.subcategories.flatMap((sub) =>
        sub.products.map((product) => {
            // Offset ids so they never collide with service product ids.
            const id = 1000 + product.id;
            const index = product.id;
            const turnaround = TURNAROUNDS[index % TURNAROUNDS.length];
            return {
                id,
                name: product.name,
                title: product.name,
                slug: product.slug,
                description: `${product.name} — at-home sample collection with accredited laboratory analysis and doctor-reviewed results.`,
                image: KIT_IMAGES[index % KIT_IMAGES.length],
                category_id: TESTING_KITS_CATEGORY_ID,
                category_slug: TESTING_KITS_SLUG,
                subcategory_slug: sub.slug,
                subcategory_name: sub.name,
                turnaround_time: turnaround.value,
                results_delivery: turnaround.delivery,
                test_type: index % 5 === 4 ? "urine_test" : "blood_test",
                price: buildKitPrice(index),
            };
        }),
    );

/* ------------------------------------------------------------------ */
/* Physical product filters                                           */
/* ------------------------------------------------------------------ */

export const MOCK_PHYSICAL_FILTERS = {
    subcategories: MOCK_BLOOD_TESTING_KITS_MENU.subcategories.map((sub) => ({
        value: sub.slug,
        label: sub.name,
    })),
    price_ranges: [
        { label: "Under €50", min: 0, max: 50 },
        { label: "€50 - €75", min: 50, max: 75 },
        { label: "€75 - €100", min: 75, max: 100 },
        { label: "Over €100", min: 100, max: Infinity },
    ],
    test_types: [
        { value: "blood_test", label: "Blood Test" },
        { value: "urine_test", label: "Urine Test" },
    ],
    turnaround_times: [
        { value: "1_2_days", label: "1-2 Days" },
        { value: "2_3_days", label: "2-3 Days" },
        { value: "3_5_days", label: "3-5 Days" },
    ],
};

/** Resolve a price-range filter label to a numeric [min, max) window. */
export function getMockPriceRange(label: string): { min: number; max: number } | null {
    const range = MOCK_PHYSICAL_FILTERS.price_ranges.find((r) => r.label === label);
    return range ? { min: range.min, max: range.max } : null;
}

/* ------------------------------------------------------------------ */
/* Menu                                                               */
/* ------------------------------------------------------------------ */

const kitsBySub = (sub: string) =>
    MOCK_PHYSICAL_PRODUCTS.filter((p) => p.subcategory_slug === sub).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
    }));

/** Physical testing kits only — digital/service categories are not offered. */
export const MOCK_MENU: Category[] = [
    {
        id: TESTING_KITS_CATEGORY_ID,
        name: "Testing Kits",
        slug: TESTING_KITS_SLUG,
        type: "physical",
        order: 1,
        subcategories: MOCK_BLOOD_TESTING_KITS_MENU.subcategories.map((sub) => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            products: kitsBySub(sub.slug),
        })),
        products: [],
    },
];

/* ------------------------------------------------------------------ */
/* Product details                                                    */
/* ------------------------------------------------------------------ */

const BADGES = [
    { title: "No Appointment Needed", imgUrl: "/images/No-physical-appointment-required.svg" },
    { title: "Express Delivery", imgUrl: "/images/Express-delivery-within-24-to-72-hours.svg" },
    { title: "IMC Registered Doctors", imgUrl: "/images/approve_icon.svg" },
    { title: "Cost Effective", imgUrl: "/images/cost-effective-icon.svg" },
];

function buildDisplay(p: {
    slug: string;
    description: string;
    image: string;
    price: MockKitPrice;
    name: string;
}): ProductDisplay {
    const display: ProductDisplay = {
        slug: p.slug,
        short_description: p.description,
        price_range: {
            currency: p.price.currency,
            min: p.price.discounted_price,
            max: p.price.price,
            price: p.price.price,
            discounted_price: p.price.discounted_price,
            discount_percentage: p.price.discount_percentage ? String(p.price.discount_percentage) : "",
        },
        cta_text: "Order Test Kit Now",
        slider_images: [
            { imgUrl: p.image, altText: p.name },
            { imgUrl: "/images/photo-kits4.jpg", altText: `${p.name} contents` },
            { imgUrl: "/images/blood_testing_landing_hero.png", altText: `${p.name} results` },
        ],
        badges: BADGES,
        highlights: [
            "CE-marked home sample collection kit",
            "Analysed in an accredited Irish laboratory",
            "Results reviewed by IMC-registered doctors",
            "Free tracked delivery and prepaid return envelope",
        ],
        sections: [],
        process_cards: { key: "process", title: null, cards: [] },
        faq: {
            title: "Frequently Asked Questions",
            subtitle: "Everything you need to know",
            items: [
                {
                    question: "Ordering & Delivery",
                    sub_items: [
                        {
                            question: "How quickly will my kit arrive?",
                            answer: "<p>Kits are dispatched the same working day and typically arrive within 1-2 working days anywhere in Ireland.</p>",
                        },
                        {
                            question: "Is the packaging discreet?",
                            answer: "<p>Yes — all kits ship in plain, unbranded packaging with no reference to the contents.</p>",
                        },
                    ],
                },
                {
                    question: "Taking the Test",
                    sub_items: [
                        {
                            question: "Do I need to fast before the test?",
                            answer: "<p>Most tests do not require fasting. If your panel includes cholesterol or glucose, we recommend a 10-12 hour overnight fast.</p>",
                        },
                        {
                            question: "How do I collect my sample?",
                            answer: "<p>Each kit includes lancets, a collection tube and step-by-step instructions. The finger-prick collection takes about 5 minutes.</p>",
                        },
                    ],
                },
                {
                    question: "Results",
                    sub_items: [
                        {
                            question: "How do I receive my results?",
                            answer: "<p>Results are delivered securely to your online account and reviewed by a doctor, who will contact you if any values need attention.</p>",
                        },
                    ],
                },
            ],
        },
        status: "active",
    };

    display.physical_details = {
        title: `About the ${p.name}`,
        description: `<p>${p.description} Samples are analysed in an INAB-accredited laboratory and every result is reviewed by an IMC-registered doctor.</p>`,
        image_url: p.image,
        features: [
            {
                id: 1,
                title: "What's Measured",
                content: "<ul><li>Clinically validated biomarkers</li><li>Laboratory-grade accuracy</li><li>Doctor-reviewed results</li></ul>",
                iconUrl: "/images/approve_icon.svg",
            },
            {
                id: 2,
                title: "What's In The Box",
                content: "<ul><li>Lancets and collection tube</li><li>Step-by-step instructions</li><li>Prepaid return envelope</li></ul>",
                iconUrl: "/images/icon2.svg",
            },
        ],
    };
    display.physical_how_it_works = {
        title: "How It Works",
        subtitle: "From order to results in four simple steps",
        steps: [
            { id: 1, title: "Order Online", iconUrl: "/images/cost-effective-icon.svg", description: "<p>Order your kit online — no appointment or GP referral needed.</p>" },
            { id: 2, title: "Collect Sample", iconUrl: "/images/icon2.svg", description: "<p>Collect your sample at home following the included instructions.</p>" },
            { id: 3, title: "Post It Back", iconUrl: "/images/Express-delivery-within-24-to-72-hours.svg", description: "<p>Return your sample with the prepaid tracked envelope.</p>" },
            { id: 4, title: "Get Results", iconUrl: "/images/approve_icon.svg", description: "<p>Receive doctor-reviewed results securely online.</p>" },
        ],
    };
    display.physical_kit_usage = {
        title: "Using Your Kit",
        subtitle: "Simple at-home sample collection",
        video_title: "Watch: How to collect your sample",
        video_subtitle: "A short step-by-step video guide",
        video_url: "https://www.youtube.com/embed/xNRJwmlRBNU",
        video_thumbnail_url: "/images/photo-kits4.jpg",
        list_title: "Before you start",
        list_items: [
            "Wash your hands with warm water to improve blood flow",
            "Collect your sample in the morning before 10am",
            "Post the sample the same day you collect it",
            "Register your kit online before returning it",
        ],
        note_content: "<p>If you have difficulty collecting your sample, our support team is available 7 days a week to help.</p>",
    };
    display.physical_what_to_expect = {
        title: "What To Expect",
        subtitle: "Your journey from sample to results",
        stages: [
            { id: 1, title: "Day 1", imageUrl: "/images/Express-delivery-within-24-to-72-hours.svg", description: "<p><strong>Kit dispatched</strong> — your kit ships the same working day in discreet packaging.</p>" },
            { id: 2, title: "Day 2-3", imageUrl: "/images/icon2.svg", description: "<p><strong>Sample analysed</strong> — your returned sample is processed in an accredited lab.</p>" },
            { id: 3, title: "Day 3-5", imageUrl: "/images/approve_icon.svg", description: "<p><strong>Results ready</strong> — a doctor reviews your results and you're notified securely.</p>" },
        ],
    };

    return display;
}

/** Related kits: prefer same subcategory, then pad with other kits. */
function relatedKitIds(product: MockPhysicalProduct): number[] {
    const sameSub = MOCK_PHYSICAL_PRODUCTS.filter(
        (p) => p.subcategory_slug === product.subcategory_slug && p.id !== product.id,
    );
    const others = MOCK_PHYSICAL_PRODUCTS.filter(
        (p) => p.subcategory_slug !== product.subcategory_slug,
    );
    return [...sameSub, ...others].slice(0, 6).map((p) => p.id);
}

function buildPhysicalProduct(p: MockPhysicalProduct): Product {
    return {
        id: p.id,
        type: "physical",
        type_label: "Testing Kit",
        category_id: p.category_id,
        category_name: "Testing Kits",
        subcategory_id: null,
        subcategory_name: p.subcategory_name,
        name: p.name,
        sku: `KIT-${p.id}`,
        slug: p.slug,
        category_slug: p.category_slug,
        subcategory_slug: p.subcategory_slug,
        price: parseFloat(p.price.discounted_price),
        session_duration: null,
        description: p.description,
        result_template_ids: [],
        wp_form_url: null,
        form_id: null,
        product_display: buildDisplay(p),
        related_product_ids: relatedKitIds(p),
        related_kit_ids: relatedKitIds(p),
        turnaround_time: p.turnaround_time,
        results_delivery: p.results_delivery,
        test_type: p.test_type,
    };
}

export function getMockProductDetail(slug: string): Product | null {
    const physical = MOCK_PHYSICAL_PRODUCTS.find((p) => p.slug === slug);
    if (physical) return buildPhysicalProduct(physical);
    return null;
}

/* ------------------------------------------------------------------ */
/* Related products / featured kits                                   */
/* ------------------------------------------------------------------ */

export interface MockRelatedGridItem {
    id: number;
    title: string;
    image: string;
    slug: string;
    category_slug: string;
    subcategory_slug: string | null;
    price: { max: string; min: string; currency: string };
    description: string;
}

function toGridItem(p: MockPhysicalProduct): MockRelatedGridItem {
    return {
        id: p.id,
        title: p.name,
        image: p.image,
        slug: p.slug,
        category_slug: p.category_slug,
        subcategory_slug: p.subcategory_slug,
        price: { max: p.price.price, min: p.price.discounted_price, currency: p.price.currency },
        description: p.description,
    };
}

export function getMockRelatedProducts(ids: number[]): MockRelatedGridItem[] {
    if (!ids || ids.length === 0) return [];
    return MOCK_PHYSICAL_PRODUCTS.filter((p) => ids.includes(p.id)).map(toGridItem);
}

/** Most-popular kits for the home page product catalog section. */
const POPULAR_KIT_SLUGS = [
    "vitamin-d-test-kit",
    "blood-glucose-test-kit",
    "tsh-test-kit",
    "lipid-profile-test-kit",
    "vitamin-b12-test-kit",
    "complete-blood-count-cbc-test-kit",
    "iron-profile-test-kit",
    "comprehensive-health-check-kit",
];

export function getMockPopularKits(): MockPhysicalProduct[] {
    return POPULAR_KIT_SLUGS
        .map((slug) => MOCK_PHYSICAL_PRODUCTS.find((p) => p.slug === slug))
        .filter((p): p is MockPhysicalProduct => Boolean(p));
}

/** Featured kits payload — same card shape AllKits/PhysicalProducts map from. */
export function getMockFeaturedKits(ids?: number[]) {
    const kits = ids && ids.length > 0
        ? MOCK_PHYSICAL_PRODUCTS.filter((p) => ids.includes(p.id))
        : MOCK_PHYSICAL_PRODUCTS.slice(0, 6);
    return kits.map((p) => ({
        id: p.id,
        image: p.image,
        title: p.title,
        name: p.name,
        description: p.description,
        slug: p.slug,
        category_slug: p.category_slug,
        category_id: p.category_id,
        category_name: "Testing Kits",
        turnaround_time: p.turnaround_time,
        results_delivery: p.results_delivery,
        test_type: p.test_type,
        price: p.price,
    }));
}

/* ------------------------------------------------------------------ */
/* Category landing pages                                             */
/* ------------------------------------------------------------------ */

export interface MockCategoryLanding {
    name: string;
    title: string;
    description: string;
    short_description: string;
    image: string;
    products: Array<MockRelatedGridItem>;
}

export function getMockCategoryLanding(categorySlug: string): MockCategoryLanding | null {
    const category = MOCK_MENU.find((c) => c.slug === categorySlug);
    if (!category) return null;

    return {
        name: category.name,
        title: "At-Home Blood Testing Kits",
        description: "Order discreet at-home testing kits with fast laboratory results and secure online access.",
        short_description: "At-home health testing kits delivered across Ireland.",
        image: "/images/photo-kits4.jpg",
        products: MOCK_PHYSICAL_PRODUCTS.map(toGridItem),
    };
}

/* ------------------------------------------------------------------ */
/* Home page — health test kits slider                                */
/* ------------------------------------------------------------------ */

/** Grouped tab → kits payload for the home PhysicalProductsSlider. */
export function getMockHealthTestHomeProducts() {
    const groups: Record<string, unknown[]> = {};
    // Limit to the first few categories so the home tabs stay tidy.
    for (const sub of MOCK_PHYSICAL_FILTERS.subcategories.slice(0, 4)) {
        groups[sub.label] = MOCK_PHYSICAL_PRODUCTS.filter((p) => p.subcategory_slug === sub.value).map((p) => ({
            id: p.id,
            category_id: p.category_id,
            title: p.title,
            image: p.image,
            slug: p.slug,
            category_slug: p.category_slug,
            subcategory_slug: p.subcategory_slug,
            price: {
                max: p.price.price,
                min: p.price.discounted_price,
                price: p.price.price,
                currency: p.price.currency,
                discounted_price: p.price.discounted_price,
                discount_percentage: p.price.discount_percentage ? String(p.price.discount_percentage) : undefined,
            },
            description: p.description,
            test_type: p.test_type,
            turnaround_time: p.turnaround_time,
            results_delivery: p.results_delivery,
        }));
    }
    return groups;
}

/* ------------------------------------------------------------------ */
/* Doctors                                                            */
/* ------------------------------------------------------------------ */

export const MOCK_DOCTORS = [
    {
        doctor_picture: null,
        doctor_name: "Dr. Aoife Murphy",
        featured: 1,
        display_order: 1,
        speciality: "General Practice",
        year_of_experience: 12,
        degree: "MB BCh BAO, MICGP",
        registration_number: "409123",
        languages_spoken: "English, Irish",
    },
    {
        doctor_picture: null,
        doctor_name: "Dr. Sean O'Brien",
        featured: 1,
        display_order: 2,
        speciality: "Occupational Health",
        year_of_experience: 15,
        degree: "MB BCh BAO, MFOM",
        registration_number: "398456",
        languages_spoken: "English",
    },
    {
        doctor_picture: null,
        doctor_name: "Dr. Priya Sharma",
        featured: 1,
        display_order: 3,
        speciality: "Women's Health",
        year_of_experience: 10,
        degree: "MB BCh BAO, DRCOG",
        registration_number: "412789",
        languages_spoken: "English, Hindi",
    },
    {
        doctor_picture: null,
        doctor_name: "Dr. Liam Byrne",
        featured: 1,
        display_order: 4,
        speciality: "Clinical Pathology",
        year_of_experience: 14,
        degree: "MB BCh BAO, FRCPath",
        registration_number: "401567",
        languages_spoken: "English",
    },
];

/* ------------------------------------------------------------------ */
/* Landing page sections                                              */
/* ------------------------------------------------------------------ */

export const MOCK_LANDING_PAGE = {
    doctorSection: {
        headerTitle: "Speak to a Doctor Online",
        headerDescription: "Connect with IMC-registered Irish GPs from the comfort of your home, 7 days a week.",
        stepsTitle: "How it works",
        steps: [
            { title: "Choose your service", description: "Select a certificate, consultation or test kit online." },
            { title: "Complete a short form", description: "Answer a few quick medical questions — it takes under 5 minutes." },
            { title: "Doctor review", description: "An IMC-registered GP reviews your request the same day." },
            { title: "Receive your outcome", description: "Get your certificate, prescription or results securely online." },
        ],
        comfortTitle: "Healthcare from the comfort of home",
        sideCards: [
            { image: "/images/about.jpg", description: "No waiting rooms — everything is handled online." },
            { image: "/images/contact1.jpg", description: "Same-day responses from registered Irish doctors." },
        ],
        middleCard: { text: "Trusted by thousands of patients across Ireland", image: "/images/hero-image1.jpg" },
    },
    faqSection: {
        title: "Frequently Asked Questions",
        subtitle: "Answers to the most common questions about our services",
        faqCategories: [
            {
                categoryTitle: "General",
                items: [
                    { question: "Are your doctors registered in Ireland?", answer: "Yes — every doctor is registered with the Irish Medical Council (IMC)." },
                    { question: "How fast will I get my certificate?", answer: "Most requests are reviewed and issued the same day, often within a few hours." },
                ],
            },
            {
                categoryTitle: "Testing Kits",
                items: [
                    { question: "How do at-home test kits work?", answer: "Order online, collect your sample at home, post it back with the prepaid envelope, and receive doctor-reviewed results securely online." },
                    { question: "Is my data confidential?", answer: "Yes — all results and personal data are stored securely and never shared without your consent." },
                ],
            },
        ],
    },
    orgSection: {
        ctaLink: "/contact-us",
        ctaText: "Learn More",
        mainImage: "/images/employment.jpg",
        headerTitle: "For Organisations",
        contentTitle: "Occupational health for your team",
        contentDescription: "Fitness-for-work certification, health surveillance and wellbeing screening for employers of every size.",
    },
};
