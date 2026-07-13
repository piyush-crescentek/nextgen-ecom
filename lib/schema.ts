import type { Product, ProductFAQ } from "@/lib/types";
import type { SeoSettings } from "@/lib/server-api";

import { siteUrl as SITE_URL } from "@/lib/env";

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

function abs(path: string): string {
    if (!path) return SITE_URL;
    if (/^https?:\/\//i.test(path)) {
        try {
            const parsed = new URL(path);
            const base = new URL(`${SITE_URL}/`);
            parsed.protocol = base.protocol;
            parsed.host = base.host;
            return parsed.toString();
        } catch {
            return path;
        }
    }
    return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function stripHtml(s: string | null | undefined): string {
    if (!s) return "";
    return s
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function parsePrice(s: string | number | null | undefined): string | null {
    if (s == null) return null;
    const cleaned = String(s).replace(/[^0-9.]/g, "");
    return cleaned || null;
}

function normalizeCurrency(c: string | null | undefined): string {
    if (!c) return "EUR";
    const upper = c.toUpperCase();
    if (upper === "€" || upper.includes("EURO")) return "EUR";
    if (upper === "$" || upper.includes("USD")) return "USD";
    if (upper === "£" || upper.includes("GBP")) return "GBP";
    return upper.slice(0, 3) || "EUR";
}

function tryISO(s: string | null | undefined): string | undefined {
    if (!s) return undefined;
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
    return undefined;
}

export interface Crumb {
    name: string;
    path: string;
}

export function buildBreadcrumbSchema(crumbs: Crumb[]) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: abs(c.path),
        })),
    };
}

function trimOrUndefined(v: string | null | undefined): string | undefined {
    const t = v?.trim();
    return t ? t : undefined;
}

function uniqueStrings(arr: unknown): string[] {
    if (!Array.isArray(arr)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of arr) {
        if (typeof v !== "string") continue;
        const t = v.trim();
        if (!t || seen.has(t)) continue;
        seen.add(t);
        out.push(t);
    }
    return out;
}

const DEFAULT_SAME_AS = [
    "https://twitter.com/_gethealthcare_",
    "https://www.facebook.com/gethealthcare.ie/",
    "https://www.instagram.com/gethealthcare.ie/",
    "https://www.tiktok.com/@gethealthcare.ie",
    "https://www.linkedin.com/company/gethealthcare/",
    "https://www.youtube.com/@gethealthcareireland",
];

const COUNTRY_NAME_TO_ISO: Record<string, string> = {
    ireland: "IE",
    "united kingdom": "GB",
    "great britain": "GB",
    england: "GB",
    "united states": "US",
    "united states of america": "US",
};

function normalizeCountry(v: string | null | undefined): string | undefined {
    const t = trimOrUndefined(v);
    if (!t) return undefined;
    if (t.length === 2) return t.toUpperCase();
    return COUNTRY_NAME_TO_ISO[t.toLowerCase()] ?? t;
}

const DAY_ORDER = ["mo", "tu", "we", "th", "fr", "sa", "su"] as const;
const DAY_CODE_TO_NAME: Record<string, string> = {
    mo: "Monday",
    tu: "Tuesday",
    we: "Wednesday",
    th: "Thursday",
    fr: "Friday",
    sa: "Saturday",
    su: "Sunday",
};

function padTime(t: string): string {
    return t.length === 4 ? `0${t}` : t;
}

function parseOpeningHoursEntry(entry: string): Record<string, unknown> | null {
    const match = entry
        .trim()
        .match(/^([A-Za-z,\-\s]+?)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
    if (!match) return null;
    const [, dayPart, opensRaw, closesRaw] = match;

    const days: string[] = [];
    for (const token of dayPart.split(",")) {
        const t = token.trim().toLowerCase();
        if (!t) continue;
        if (t.includes("-")) {
            const [startRaw, endRaw] = t.split("-").map((s) => s.trim());
            const startIdx = DAY_ORDER.indexOf(startRaw as (typeof DAY_ORDER)[number]);
            const endIdx = DAY_ORDER.indexOf(endRaw as (typeof DAY_ORDER)[number]);
            if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) continue;
            for (let i = startIdx; i <= endIdx; i++) {
                days.push(DAY_CODE_TO_NAME[DAY_ORDER[i]]);
            }
        } else if (DAY_CODE_TO_NAME[t]) {
            days.push(DAY_CODE_TO_NAME[t]);
        }
    }

    const uniqueDays = Array.from(new Set(days));
    if (uniqueDays.length === 0) return null;

    return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: uniqueDays.length === 1 ? uniqueDays[0] : uniqueDays,
        opens: padTime(opensRaw),
        closes: padTime(closesRaw),
    };
}

function buildOpeningHoursSpecification(raw: unknown): Record<string, unknown>[] {
    return uniqueStrings(raw)
        .map(parseOpeningHoursEntry)
        .filter((s): s is Record<string, unknown> => s !== null);
}

export function buildMedicalBusinessSchema(globalSettings?: SeoSettings | null) {
    const name = trimOrUndefined(globalSettings?.brand_name) || "Get Health care";
    const legalName = trimOrUndefined(globalSettings?.legal_name);
    const phone = trimOrUndefined(globalSettings?.phone) || "+353 21 245 5185";
    const email = trimOrUndefined(globalSettings?.email);
    const logo = trimOrUndefined(globalSettings?.logo_url) || abs("/images/logo.svg");
    // `image` represents the entity's primary visual (used by rich results,
    // social previews). It should be the Global Settings `default_og_image`
    // when set, falling back to the logo so we never emit an empty value.
    const image = trimOrUndefined(globalSettings?.default_og_image) || logo;

    const addr = globalSettings?.address;
    const streetParts = [
        trimOrUndefined(addr?.line_1),
        trimOrUndefined(addr?.line_2),
    ].filter((s): s is string => Boolean(s));
    const streetAddress =
        streetParts.length > 0
            ? streetParts.join(", ")
            : "Ludgate Hub, Old Bakery, Townshend Street";
    const addressLocality = trimOrUndefined(addr?.city) || "Skibbereen";
    const addressRegion = trimOrUndefined(addr?.county) || "Co. Cork";
    const postalCode = trimOrUndefined(addr?.postcode) || "P81T324";
    const addressCountry = normalizeCountry(addr?.country) || "IE";

    const social = uniqueStrings(globalSettings?.social_profiles);
    const openingHours = buildOpeningHoursSpecification(globalSettings?.opening_hours);
    const areas = uniqueStrings(globalSettings?.areas_served);

    return {
        "@context": "https://schema.org",
        "@type": "MedicalBusiness",
        "@id": ORG_ID,
        name,
        ...(legalName ? { legalName } : {}),
        url: SITE_URL,
        logo,
        image,
        telephone: phone,
        ...(email ? { email } : {}),
        priceRange: "€€",
        address: {
            "@type": "PostalAddress",
            streetAddress,
            addressLocality,
            addressRegion,
            postalCode,
            addressCountry,
        },
        areaServed: areas.length > 0 ? areas : "IE",
        ...(openingHours.length > 0
            ? { openingHoursSpecification: openingHours }
            : {}),
        sameAs: social.length > 0 ? social : DEFAULT_SAME_AS,
        hasCredential: {
            "@type": "EducationalOccupationalCredential",
            name: "IMC-registered General Practitioners",
            credentialCategory: "Professional registration",
            recognizedBy: {
                "@type": "Organization",
                name: "Irish Medical Council",
                url: "https://www.medicalcouncil.ie/",
            },
        },
    };
}

export function buildWebSiteSchema(globalSettings?: SeoSettings | null) {
    const name = trimOrUndefined(globalSettings?.brand_name) || "Get Health care";
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name,
        url: SITE_URL,
        inLanguage: "en-IE",
    };
}

export function buildWebPageSchema(opts: {
    path: string;
    name: string;
    description?: string;
    dateModified?: string;
    /** Schema.org @id of the page's primary entity (e.g. a Product or Article). */
    mainEntityId?: string;
}) {
    const url = abs(opts.path);
    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: opts.name,
        ...(opts.description ? { description: opts.description } : {}),
        isPartOf: { "@id": WEBSITE_ID },
        inLanguage: "en-IE",
        ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
        ...(opts.mainEntityId ? { mainEntity: { "@id": opts.mainEntityId } } : {}),
    };
}

/** Schema.org @id for the Article node a given blog post emits. */
export function articleSchemaId(urlPath: string): string {
    return `${abs(urlPath)}#article`;
}

export interface RelatedItemForSchema {
    title?: string | null;
    slug?: string | null;
    category_slug?: string | null;
    subcategory_slug?: string | null;
    image?: string | null;
}

/**
 * Matches the URL-building rule used by ProductSlider.getProductUrl so the
 * JSON-LD links resolve to the same routes the visible UI links to.
 */
function buildRelatedProductUrl(item: RelatedItemForSchema): string | null {
    const slug = item.slug?.trim();
    if (!slug) return null;
    const sub = item.subcategory_slug?.trim();
    const cat = item.category_slug?.trim();
    if (sub && cat) return abs(`/${sub}/${slug}`);
    if (cat) return abs(`/${cat}/${slug}`);
    return abs(`/${slug}`);
}

/**
 * Returns an ItemList JSON-LD node listing the related products shown on a
 * product page. Returns null when there are no valid items so callers can
 * `.filter(Boolean)` and skip the script when empty.
 */
export function buildRelatedItemsSchema(
    items: RelatedItemForSchema[] | null | undefined,
    currentPath: string,
) {
    if (!items || items.length === 0) return null;
    const listItems = items
        .map((item, idx) => {
            const url = buildRelatedProductUrl(item);
            const name = item.title?.trim();
            if (!url || !name) return null;
            const image = item.image?.trim();
            return {
                "@type": "ListItem",
                position: idx + 1,
                url,
                name,
                ...(image ? { image: abs(image) } : {}),
            };
        })
        .filter(
            (x): x is {
                "@type": string;
                position: number;
                url: string;
                name: string;
                image?: string;
            } => x !== null,
        );
    if (listItems.length === 0) return null;
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "@id": `${abs(currentPath)}#related`,
        name: "Related products",
        numberOfItems: listItems.length,
        itemListElement: listItems,
    };
}

/**
 * Maps the home landing-page FAQ shape (faqCategories[].items[]) into
 * a single FAQPage JSON-LD node. Returns null when there are no items.
 */
export function buildFaqPageSchemaFromCategories(
    faqCategories:
        | Array<{ items?: Array<{ question?: string; answer?: string }> }>
        | null
        | undefined,
) {
    if (!faqCategories || faqCategories.length === 0) return null;
    const mainEntity = faqCategories
        .flatMap((cat) => cat?.items ?? [])
        .filter((q) => q?.question && q?.answer)
        .map((q) => ({
            "@type": "Question",
            name: q.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: stripHtml(q.answer),
            },
        }));
    if (mainEntity.length === 0) return null;
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity,
    };
}

export function buildHomePageSchemas(
    globalSettings?: SeoSettings | null,
    faqCategories?:
        | Array<{ items?: Array<{ question?: string; answer?: string }> }>
        | null,
) {
    return [
        buildMedicalBusinessSchema(globalSettings),
        buildFaqPageSchemaFromCategories(faqCategories),
    ].filter((schema): schema is NonNullable<typeof schema> => schema != null);
}

/**
 * Returns a JSON-LD @graph containing both a MedicalProcedure node
 * (clinical context) and a Product node with Offer (price snippet in SERPs).
 */
export function buildProductSchema(
    product: Product,
    urlPath: string,
    globalSettings?: SeoSettings | null,
) {
    const url = abs(urlPath);
    const display = product.product_display;
    const description = stripHtml(
        display?.short_description || product.description || product.name,
    );
    const image = display?.slider_images?.[0]?.imgUrl
        ? abs(display.slider_images[0].imgUrl)
        : undefined;
    const priceObj = display?.price_range;
    const price = parsePrice(
        priceObj?.discounted_price ||
            priceObj?.price ||
            priceObj?.min ||
            (product.price ?? null),
    );
    const currency = normalizeCurrency(priceObj?.currency);
    const brandName = trimOrUndefined(globalSettings?.brand_name) || "Get Health care";

    const procedure: Record<string, unknown> = {
        "@type": "MedicalProcedure",
        "@id": `${url}#procedure`,
        name: product.name,
        description,
        url,
    };

    const offer: Record<string, unknown> = {
        "@type": "Offer",
        priceCurrency: currency,
        availability: "https://schema.org/InStock",
        url,
    };
    if (price) offer.price = price;

    const productNode: Record<string, unknown> = {
        "@type": "Product",
        "@id": `${url}#product`,
        name: product.name,
        description,
        url,
        brand: { "@type": "Organization", name: brandName },
        offers: offer,
    };
    if (image) productNode.image = image;

    return {
        "@context": "https://schema.org",
        "@graph": [procedure, productNode],
    };
}

export function buildFAQSchema(faq: ProductFAQ | null | undefined) {
    if (!faq?.items) return null;
    const flat = faq.items.flatMap((tab) =>
        (tab.sub_items || []).map((sub) => ({
            question: sub.question,
            answer: sub.answer,
        })),
    );
    if (flat.length === 0) return null;
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: flat
            .filter((q) => q.question && q.answer)
            .map((q) => ({
                "@type": "Question",
                name: q.question,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: stripHtml(q.answer),
                },
            })),
    };
}

export interface ArticlePost {
    title: string;
    slug: string;
    image: string;
    date: string;
    author: string;
    excerpt?: string;
    category?: string;
    urlPath?: string;
    modified?: string;
}

export function buildArticleSchema(post: ArticlePost) {
    const url = abs(post.urlPath ?? `/blog/${post.slug}`);
    const datePublished = tryISO(post.date);
    const dateModified = tryISO(post.modified);
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": `${url}#article`,
        headline: post.title,
        ...(post.excerpt ? { description: post.excerpt } : {}),
        ...(post.image ? { image: post.image } : {}),
        author: { "@type": "Person", name: post.author },
        url,
        mainEntityOfPage: { "@id": `${url}#webpage` },
        ...(datePublished ? { datePublished } : {}),
        ...(dateModified ? { dateModified } : {}),
        ...(post.category ? { articleSection: post.category } : {}),
    };
}

/**
 * Serialise one or more JSON-LD objects into the inner-HTML payload of a
 * single <script type="application/ld+json"> tag. Filters out null/undefined.
 */
export function jsonLdString(data: unknown | unknown[]): string {
    const arr = Array.isArray(data) ? data : [data];
    const filtered = arr.filter((d): d is object => d != null);
    const payload = filtered.length === 1 ? filtered[0] : filtered;
    return JSON.stringify(payload);
}
