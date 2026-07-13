/**
 * Server-side data layer — now fully static.
 *
 * All functions resolve from `lib/mock-data.ts`; no network requests are made.
 * The original function signatures are preserved so pages and components
 * keep working unchanged.
 */

import type { Category } from "@/store/useMenuStore";
import type { Product } from "@/lib/types";
import {
  MOCK_MENU,
  getMockProductDetail,
  getMockRelatedProducts,
  getMockCategoryLanding,
  MOCK_DOCTORS,
  MOCK_LANDING_PAGE,
} from "@/lib/mock-data";

/**
 * Raw, unfiltered menu — used for route resolution (e.g. detecting that a
 * physical category exists even when it's hidden from the visible nav).
 */
export async function fetchMenuRaw(): Promise<Category[]> {
  return [...MOCK_MENU].sort((a, b) => a.order - b.order);
}

export async function fetchMenu(): Promise<Category[]> {
  return fetchMenuRaw();
}

export async function fetchProductDetail(
  slug: string,
): Promise<Product | null> {
  return getMockProductDetail(slug);
}

interface CategoryLandingProduct {
  id?: number;
  title: string;
  image: string;
  slug: string;
  category_slug: string;
  subcategory_slug: string | null;
  price: { max: string; min: string; currency: string };
  description: string;
  oh_prices?: Array<{
    label: string;
    amount: string;
    duration: string;
    duration_unit: string;
    discount_type?: string | null;
    discount_value?: string | null;
    discounted_amount?: string | null;
  }>;
  forms_pricing?: {
    pricingOptions?: Array<{
      title: string;
      key: string;
      duration?: number;
      durationUnit?: string;
      price: number;
      discountType?: string;
      discountValue?: number | string;
      finalAmount?: number | string;
    }>;
  } | null;
}

export interface CategoryLandingData {
  name?: string;
  title?: string;
  description: string;
  short_description?: string;
  image?: string;
  products: CategoryLandingProduct[];
}

export async function fetchCategoryLanding(
  _identifier: string | number,
  categorySlug: string,
): Promise<CategoryLandingData | null> {
  return getMockCategoryLanding(categorySlug);
}

export interface RelatedProductGridItem {
  id?: number;
  title: string;
  image: string;
  slug: string;
  category_slug: string;
  subcategory_slug: string | null;
  price: { max: string; min: string; currency: string };
  description: string;
}

export async function fetchRelatedProducts(
  ids: number[],
): Promise<RelatedProductGridItem[]> {
  return getMockRelatedProducts(ids);
}

type SeoSettingAddress = {
  city?: string | null;
  county?: string | null;
  line_1?: string | null;
  line_2?: string | null;
  country?: string | null;
  postcode?: string | null;
};

export interface SeoSettings {
  email?: string | null;
  phone?: string | null;
  address?: SeoSettingAddress | null;
  logo_url?: string | null;
  brand_name?: string | null;
  legal_name?: string | null;
  robots_txt?: string | null;
  areas_served?: string[] | null;
  sitemap_json?: string | null;
  sitemap_urls?: Array<{ loc?: string; lastmod?: string }> | null;
  opening_hours?: string[] | null;
  sitemap_enabled?: boolean | null;
  social_profiles?: string[] | null;
  default_og_image?: string | null;
  /** Pixel width for default Open Graph image (Global Settings). */
  og_image_width?: number | string | null;
  /** Pixel height for default Open Graph image (Global Settings). */
  og_image_height?: number | string | null;
  consent_mode_enabled?: boolean | null;
  cookie_consent_status?: string | null;
  default_robots_policy?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  title?: string | null;
  description?: string | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  og_image_alt?: string | null;
  twitter_title?: string | null;
  twitter_description?: string | null;
  twitter_image?: string | null;
  index_status?: string | null;
  robots?: string | null;
  sitemap_include?: boolean | null;
  seo_title?: string | null;
  page_name?: string | null;
  featured_image?: string | null;
  featured_image_alt?: string | null;
  og_type?: string | null;
  twitter_card?: string | null;
  faqs_json?: string | null;
  custom_schema_json?: string | null;
  /** Injected in document head (Header & Footer module). */
  header_scripts?: string | null;
  /** Injected before </body> (Header & Footer module). */
  footer_scripts?: string | null;
  /** Raw LLMs.txt content (`llms-txt` SEO module). */
  llms_txt?: string | null;
  [key: string]: unknown;
}

export interface DoctorListItem {
  id?: number;
  name: string;
  image?: string | null;
  credentials?: string | null;
  specialty?: string | null;
  description?: string | null;
}

export async function fetchDoctorsList(): Promise<DoctorListItem[]> {
  return MOCK_DOCTORS.map((d, idx) => ({
    id: idx + 1,
    name: d.doctor_name,
    image: d.doctor_picture,
    credentials: d.registration_number
      ? `Medical Council Registration ${d.registration_number}`
      : null,
    specialty: d.speciality,
  }));
}

export interface LandingPageFaqItem {
  question: string;
  answer: string;
}

export interface LandingPageFaqCategory {
  categoryTitle?: string;
  items?: LandingPageFaqItem[];
}

export interface LandingPageFaqSection {
  title?: string;
  subtitle?: string;
  faqCategories?: LandingPageFaqCategory[];
}

export interface LandingPagePayload {
  faqSection?: LandingPageFaqSection | null;
  doctorSection?: unknown;
  orgSection?: unknown;
}

export async function fetchLandingPageData(): Promise<LandingPagePayload | null> {
  return MOCK_LANDING_PAGE;
}

const MOCK_GLOBAL_SEO: SeoSettings = {
  brand_name: "NexGen Healthcare",
  legal_name: "NexGen Healthcare Ireland",
  email: "info@nexgenhealthcare.ie",
  default_og_image: "/images/blood_testing_landing_hero.png",
};

export async function fetchSeoSettings(
  moduleName: string,
  _slug?: string,
): Promise<SeoSettings | null> {
  if (moduleName === "Global Settings") return MOCK_GLOBAL_SEO;
  return null;
}

export async function fetchGlobalSeoSettings(): Promise<SeoSettings | null> {
  return MOCK_GLOBAL_SEO;
}

export async function fetchHeaderFooterSeoSettings(): Promise<SeoSettings | null> {
  return null;
}

export async function fetchSitemapSeoSettings(): Promise<SeoSettings | null> {
  return null;
}

export async function fetchRobotsSeoSettings(): Promise<SeoSettings | null> {
  return null;
}

export async function fetchLlmsTxtSeoSettings(): Promise<SeoSettings | null> {
  return null;
}
