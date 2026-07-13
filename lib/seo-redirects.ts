import type { Redirect } from "next/dist/lib/load-custom-routes";

export const APEX_HOST = "gethealthcare.ie";
export const WWW_HOST = `www.${APEX_HOST}`;
export const APEX_ORIGIN = `https://${APEX_HOST}`;

/** www → apex (all paths). Also enforced in middleware via X-Forwarded-Host. */
export const WWW_TO_APEX_REDIRECT: Redirect = {
  source: "/:path*",
  has: [{ type: "host", value: WWW_HOST }],
  destination: `${APEX_ORIGIN}/:path*`,
  permanent: true,
};

/** Short legacy slugs → canonical /{category}/{slug} product URLs. */
function duplicateProductRedirects(
  category: string,
  slugs: string[],
): Redirect[] {
  return slugs.map((slug) => ({
    source: `/${slug}`,
    destination: `/${category}/${slug}`,
    permanent: true,
  }));
}

const DUPLICATE_PRODUCT_REDIRECTS: Redirect[] = [
  ...duplicateProductRedirects("online-medical-certificates", [
    "pre-employment-medical-fit-certificate-for-healthcare-employees",
    "unfit-for-travel-certificate",
    "fit-to-fly-certificate",
    "pre-employment-medical-fit-certificate-for-employment",
    "fit-to-return-to-work-certificate",
  ]),
  ...duplicateProductRedirects("occupational-health", [
    "review-of-medical-reports-specialist-liaison",
    "occupational-vaccination-counselling",
    "sickness-absence-review-short-long-term",
    "mental-health-work-related-stress-assessment",
    "remote-workstation-ergonomic-assessment",
    "case-management-review",
    "health-surveillance-review",
    "ill-health-retirement-assessment",
    "health-promotion-lifestyle-counselling",
    "workplace-exposure-history-risk-review",
    "pre-employment-medical-assessment",
    "fit-for-work-return-after-illness-injury",
  ]),
  ...duplicateProductRedirects("mens-health", [
    "acne",
    "migraine",
    "hay-fever",
    "eczema",
    "cystitis-bladder-infection-and-uti-in-men",
    "premature-ejaculation",
  ]),
  ...duplicateProductRedirects("womens-health", [
    "contraceptive-pill-patch",
    "hay-fever-women",
    "migraine-women",
    "eczema-women",
    "acne-women",
    "cystitis-uti",
    "urinary-tract-infection-women",
  ]),
];

/**
 * Legacy URL 301 redirects (SEO migration).
 * Pending targets (e.g. /online-doctor-ireland) are intentionally omitted.
 */
export const SEO_REDIRECTS: Redirect[] = [
  WWW_TO_APEX_REDIRECT,
  { source: "/treatment", destination: "/treatments", permanent: true },
  { source: "/prescriptions/express", destination: "/treatments", permanent: true },
  { source: "/prescriptions/standard", destination: "/treatments", permanent: true },
  { source: "/employee-form", destination: "/my-account", permanent: true },
  { source: "/dashboard", destination: "/my-account", permanent: true },
  {
    source: "/womens-health",
    destination: "/treatments?subcategory=womens-health",
    permanent: true,
  },
  {
    source: "/medical-cert/standard",
    destination: "/online-medical-certificates",
    permanent: true,
  },
  {
    source: "/medical-cert/express",
    destination: "/online-medical-certificates",
    permanent: true,
  },
  {
    source: "/clinic/ghc-clinic-gorey",
    destination: "/online-gp-appointment",
    permanent: true,
  },
  {
    source: "/medical-cert-employment/express-within-24-hrs",
    destination: "/online-medical-certificates",
    permanent: true,
  },
  {
    source: "/medical-cert-employment/standard-within-48-72-hrs",
    destination: "/online-medical-certificates",
    permanent: true,
  },
  {
    source: "/sick-certificate",
    destination: "/online-medical-certificates/sick-certificate",
    permanent: true,
  },
  ...DUPLICATE_PRODUCT_REDIRECTS,
];
