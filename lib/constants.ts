export const API_ENDPOINTS = {
  LOGIN: "customer/login",
  REGISTER: "customer/register",
  LOGOUT: "customer/logout",

  FORGOT_PASSWORD: "customer/forgot-password",
  RESET_PASSWORD: "customer/reset-password",
  VERIFY_EMAIL: "customer/verify-email",
  PROFILE: "customer/profile",
  PROFILE_UPDATE: "customer/profile/update",
  RESEND_VERIFICATION: "customer/email/verification-notification",
  STATISTICS: "customer/statistics",
  INVITE_STAFF: "customer/staff/invite",
  INVITATIONS: "customer/staff/invitations",
  DELETE_STAFF_INVITATION: (id: number) => `customer/staff/invitations/${id}`,
  BLOCK_CUSTOMER: (id: number) => `customers/${id}/block`,
  ACCEPT_INVITATION: "customer/staff/accept",
  GET_FORM: "frontend/forms",
  WALLET_TRANSACTIONS: "customer/wallet/transactions",
  WALLET_ADD_FUNDS_STRIPE: "customer/wallet/add-funds/stripe",
  WALLET_ADD_FUNDS_BANK: "customer/wallet/add-funds/bank-transfer",
  WALLET_STRIPE_CANCEL: "customer/wallet/add-funds/stripe/cancel",
  SUBMIT_FORM: "frontend/forms/submit",
  BANK_TRANSFER_TICKETS: "customer/bank-transfer-tickets",
  SEND_BANK_DETAILS: "customer/send-bank-details",
  STAFF_TOPUP: (id: number) => `customer/staff/invitations/${id}/wallet/top-up`,
  MENU: "frontend/menu",
  PRODUCT_DETAILS: (slug: string) => `frontend/products/${slug}`,
  CATEGORY_PRODUCTS: (slug: string) => `frontend/categories/${slug}/products`,
  SUBCATEGORY_PRODUCTS: (slug: string) =>
    `frontend/subcategories/${slug}/products`,
  PHYSICAL_PRODUCTS: "frontend/physical-products",
  RELATED_PRODUCTS: "frontend/related-products",
  LANDING_PAGE: "frontend/landing-page",
  LANDING_PAGE_CATEGORY: (id: number | string) =>
    `frontend/landing-page/categories/${id}`,
  TREATMENTS: "frontend/treatments",
  PRODUCTS: "frontend/products",
  CHECKOUT_AUTH: {
    CHECK_EMAIL: "checkout-auth/check-email",
    FORGOT_PASSWORD: "checkout-auth/forgot-password",
    VERIFY_OTP: "checkout-auth/verify-otp",
    RESET_PASSWORD: "checkout-auth/reset-password",
    LOGIN: "checkout-auth/login",
    REGISTER: "checkout-auth/register",
  },
  PLACE_ORDER: "frontend/checkout/place-order",
  ID_PROOF_UPLOAD: "frontend/checkout/upload-id-proof",
  SEND_WALLET_OTP: "frontend/checkout/send-wallet-otp",
  PAYMENT_PROCESS: "frontend/checkout/payment-process",
  CHECKOUT_PAYMENT_STATUS: (id: number | string) =>
    `checkout/payment-status/${id}`,
  ORDER_DETAILS: (id: number | string) =>
    `frontend/checkout/order-details/${id}`,
  CARD_DETAILS: "frontend/checkout/card-details",
  PAYMENT_METHODS: "frontend/checkout/payment-methods",
  FEATURED_KITS: "frontend/featured-kits",
  PHYSICAL_PRODUCT_FILTERS: "frontend/physical-product-filters",
  BUSINESS_GROUPS: "customer/business-groups",
  PRODUCT_TRANSACTIONS: "customer/product-transactions",
  ORDER_HISTORY: "customer/order-history",
  CERTIFICATE_ORDER: "frontend/certificates/order",
  HEALTH_TEST_HOME_PRODUCTS: "frontend/health-test-home-products",
  PRODUCTS_BY_CATEGORY: "frontend/products-by-category",
  DOCTORS: "frontend/doctors",
  DOCTORS_LIST: "frontend/doctors-list",
  DOCTOR_AVAILABILITIES: "frontend/doctor-availabilities",
  SEO_SETTINGS: "frontend/seo-settings",
  SEND_INQUIRY: "frontend/contact-inquiries",
};

export const TESTING_KITS_SLUG = "testing-kits";
export const ALL_TEST_KITS_SLUG = "health-testing-kits";

export const EXCLUDED_PRODUCT_SLUGS = [
  "emp-fit-cert-healthcarenight",
  "emp-fit-cert-for-food",
  "referral-letter",
  "urinary-tract-infection-women-standard",
  "management-referral-consultations",
  "migraine-women-express",
  "urinary-tract-infection-women-express",
  "urinary-tract-infection-women-variant",
  "migraine-women-a",
  "urinary-tract-infection-women-a",
  "urinary-tract-infection-women-b",
];

export const EXCLUDED_CATEGORY_NAMES = ["Prescription"];

export const CATEGORY_SPECIFIC_EXCLUSIONS: Record<string, string[]> = {
  "online-gp": ["ghc-clinic-gorey", "ghc-bray-clinic"],
  "occupational-health": ["management-referral-consultations"],
};

/** Temporary static hero banners per category slug (ibb.co). */
export const CATEGORY_HERO_IMAGES: Record<string, string> = {
  "online-medical-certificates":
    "https://i.ibb.co/B5Zv4r4s/banner.webp",
  treatments: "https://i.ibb.co/5XbTvyDZ/teatment-bnnr.webp",
  "occupational-health": "https://i.ibb.co/Kp9CYCwZ/occupational-bnr.webp",
};

/** Tailwind object-position classes for static category hero crops. */
export const CATEGORY_HERO_IMAGE_CLASS: Record<string, string> = {
  "online-medical-certificates": "object-cover object-[72%_center] md:object-[88%_center]",
  treatments: "object-cover object-[68%_center] md:object-[82%_center]",
  "occupational-health": "object-cover object-[72%_center] md:object-[88%_center]",
};

export function getCategoryHeroImage(slug: string): string | undefined {
  return CATEGORY_HERO_IMAGES[slug];
}

export function getCategoryHeroImageClass(slug: string): string {
  return (
    CATEGORY_HERO_IMAGE_CLASS[slug] ??
    "object-cover object-center md:object-[0%_100%]"
  );
}
