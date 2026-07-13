"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  BLOOD_TESTING_KITS_CATEGORIES_URL,
  MOCK_BLOOD_TESTING_KITS_MENU,
} from "@/lib/mockBloodTestingKitsMenu";
import { TESTING_KITS_SLUG } from "@/lib/constants";

interface BloodTestingMegaMenuProps {
  variant?: "mobile" | "desktop";
  onNavigate?: () => void;
}

function CategorySection({
  category,
  variant,
  onNavigate,
}: {
  category: (typeof MOCK_BLOOD_TESTING_KITS_MENU.subcategories)[number];
  variant: "mobile" | "desktop";
  onNavigate?: () => void;
}) {
  const isDesktop = variant === "desktop";

  return (
    <section
      className={
        isDesktop
          ? "flex flex-col"
          : "border-b border-gray-200/80 bg-[#F3F4F6] px-5 py-5"
      }
    >
      <div className={`flex items-center gap-3 ${isDesktop ? "mb-3" : "mb-4"}`}>
        <span
          className={`font-semibold text-(--maincolor) ${
            isDesktop ? "text-base" : "text-[17px]"
          }`}
        >
          {category.name}
        </span>
        <span className="h-px flex-1 bg-gray-300" aria-hidden />
      </div>

      <ul className={isDesktop ? "space-y-1.5" : "space-y-0"}>
        {category.products.map((product) => (
          <li key={product.id}>
            <Link
              href={`/${TESTING_KITS_SLUG}/${product.slug}`}
              onClick={onNavigate}
              className={
                isDesktop
                  ? "block py-1 text-sm text-(--maincolor)/85 transition-colors hover:text-(--btncolor)"
                  : "flex items-center justify-between border-b border-gray-200/60 py-3.5 text-[15px] font-normal text-(--maincolor) transition-colors last:border-b-0 hover:text-(--btncolor)"
              }
            >
              <span>{product.name}</span>
              {!isDesktop && (
                <ChevronRight
                  size={16}
                  className="shrink-0 text-gray-400"
                  aria-hidden
                />
              )}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={`/${TESTING_KITS_SLUG}/${category.slug}`}
        onClick={onNavigate}
        className={`inline-flex items-center gap-2 font-medium text-(--maincolor) transition-colors hover:text-(--btncolor) ${
          isDesktop ? "mt-2 text-xs" : "mt-3 text-sm"
        }`}
      >
        See all {category.name.toLowerCase()}
        <span className="flex size-5 items-center justify-center rounded-full border border-(--maincolor)/20 bg-white">
          <ArrowRight size={10} />
        </span>
      </Link>
    </section>
  );
}

export default function BloodTestingMegaMenu({
  variant = "mobile",
  onNavigate,
}: BloodTestingMegaMenuProps) {
  const { subcategories } = MOCK_BLOOD_TESTING_KITS_MENU;

  if (variant === "desktop") {
    return (
      <div className="max-h-[70vh] w-full overflow-y-auto bg-white">
        <div className="container mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-8">
            {subcategories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                variant="desktop"
                onNavigate={onNavigate}
              />
            ))}
          </div>
          <div className="mt-8 flex justify-center border-t border-gray-100 pt-6">
            <Link
              href={BLOOD_TESTING_KITS_CATEGORIES_URL}
              onClick={onNavigate}
              className="inline-flex items-center justify-center rounded-lg bg-(--maincolor) px-8 py-3 text-base font-medium text-white transition-colors hover:bg-(--btncolor)"
            >
              View all blood testing kits
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F3F4F6]">
      {subcategories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          variant="mobile"
          onNavigate={onNavigate}
        />
      ))}

      <div className="bg-white px-5 py-6">
        <Link
          href={BLOOD_TESTING_KITS_CATEGORIES_URL}
          onClick={onNavigate}
          className="flex w-full items-center justify-center rounded-lg bg-(--maincolor) px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-(--btncolor)"
        >
          View all blood testing kits
        </Link>
      </div>
    </div>
  );
}
