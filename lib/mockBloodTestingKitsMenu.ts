import type { Category } from "@/store/useMenuStore";
import { TESTING_KITS_SLUG } from "@/lib/constants";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type MockCategoryInput = {
  name: string;
  products: string[];
};

const MOCK_CATEGORIES: MockCategoryInput[] = [
  {
    name: "Diabetes Monitoring",
    products: [
      "Blood Glucose Test Kit",
      "HbA1c Test Kit",
      "Insulin Resistance Test Kit",
      "C-Peptide Test Kit",
    ],
  },
  {
    name: "Heart Health",
    products: [
      "Lipid Profile Test Kit",
      "Cholesterol Test Kit",
      "ApoB Test Kit",
      "hs-CRP Test Kit",
    ],
  },
  {
    name: "Liver Health",
    products: [
      "Liver Function Test (LFT) Kit",
      "Hepatitis B Test Kit",
      "Hepatitis C Test Kit",
    ],
  },
  {
    name: "Kidney Health",
    products: [
      "Kidney Function Test (KFT) Kit",
      "Creatinine Test Kit",
      "Urea Test Kit",
      "eGFR Test Kit",
    ],
  },
  {
    name: "Hematology",
    products: [
      "Complete Blood Count (CBC) Test Kit",
      "ESR Test Kit",
      "Blood Group Test Kit",
    ],
  },
  {
    name: "Thyroid & Hormones",
    products: [
      "TSH Test Kit",
      "T3 & T4 Test Kit",
      "Thyroid Antibody Test Kit",
    ],
  },
  {
    name: "Vitamins & Nutrition",
    products: [
      "Vitamin D Test Kit",
      "Vitamin B12 Test Kit",
      "Iron Profile Test Kit",
      "Folate Test Kit",
    ],
  },
  {
    name: "Infection & Inflammation",
    products: [
      "C-Reactive Protein (CRP) Test Kit",
      "Procalcitonin Test Kit",
      "Dengue Test Kit",
      "Malaria Test Kit",
    ],
  },
  {
    name: "Women's Health",
    products: [
      "Pregnancy Blood Test (hCG) Kit",
      "Fertility Hormone Test Kit",
      "PCOS Hormone Test Kit",
    ],
  },
  {
    name: "General Health",
    products: [
      "Comprehensive Health Check Kit",
      "Wellness Screening Kit",
      "Annual Blood Checkup Kit",
    ],
  },
];

let productId = 1;
let subcategoryId = 1;

export const MOCK_BLOOD_TESTING_KITS_MENU: Category = {
  id: 9001,
  name: "Blood Testing Kits",
  slug: "blood-testing-kits",
  type: "physical",
  order: 0,
  products: [],
  subcategories: MOCK_CATEGORIES.map((category) => {
    const categorySlug = slugify(category.name);
    return {
      id: subcategoryId++,
      name: category.name,
      slug: categorySlug,
      products: category.products.map((productName) => ({
        id: productId++,
        name: productName,
        slug: slugify(productName),
      })),
    };
  }),
};

export const BLOOD_TESTING_KITS_CATEGORIES_URL = `/${TESTING_KITS_SLUG}/categories`;

/** Featured categories shown directly in the header nav */
export const TOP_NAV_CATEGORY_SLUGS = [
  "diabetes-monitoring",
  "heart-health",
  "general-health",
  "womens-health",
  "vitamins-nutrition",
] as const;

export const ALL_CATEGORIES_NAV = {
  name: "All Categories",
  slug: "all-categories",
  href: BLOOD_TESTING_KITS_CATEGORIES_URL,
};

export function getTopNavCategories() {
  return MOCK_BLOOD_TESTING_KITS_MENU.subcategories.filter((sub) =>
    TOP_NAV_CATEGORY_SLUGS.includes(sub.slug as (typeof TOP_NAV_CATEGORY_SLUGS)[number])
  );
}

export function getCategoryHref(slug: string) {
  return `/${TESTING_KITS_SLUG}/${slug}`;
}
