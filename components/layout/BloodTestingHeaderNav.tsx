"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  ALL_CATEGORIES_NAV,
  getCategoryHref,
  getTopNavCategories,
} from "@/lib/mockBloodTestingKitsMenu";
import { TESTING_KITS_SLUG } from "@/lib/constants";
import BloodTestingMegaMenu from "./BloodTestingMegaMenu";

const navLinkClass =
  "flex items-center gap-2 cursor-pointer relative z-10 text-(--maincolor) text-base font-normal px-4 py-2 hover:text-(--btncolor) transition hover:-translate-y-0.5 whitespace-nowrap lg:text-[17px] lg:px-5";

const dropdownPanelClass =
  "absolute top-full left-0 z-30 min-w-[17rem] rounded-b-lg border border-gray-100 bg-white py-3 shadow-xl opacity-0 pointer-events-none -translate-y-2 transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100";

const megaMenuPanelClass =
  "invisible fixed left-0 right-0 top-[5.25rem] z-40 w-full border-t border-gray-100 bg-white opacity-0 shadow-xl transition-all duration-300 pointer-events-none group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100";

interface DesktopBloodTestingNavProps {
  onNavigate?: () => void;
}

export function DesktopBloodTestingNav({ onNavigate }: DesktopBloodTestingNavProps) {
  const topCategories = getTopNavCategories();

  return (
    <>
      {topCategories.map((category) => (
        <div key={category.id} className="group relative py-8">
          <Link
            href={getCategoryHref(category.slug)}
            onClick={onNavigate}
            className={`${navLinkClass} pe-8`}
          >
            <span>{category.name}</span>
            <ChevronDown className="absolute right-0 size-5 transition-transform duration-200 group-hover:rotate-180" />
          </Link>

          <div className={dropdownPanelClass}>
            <p className="mb-2 px-4 text-sm font-semibold text-(--maincolor)">
              {category.name}
            </p>
            <ul className="max-h-64 overflow-y-auto">
              {category.products.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/${TESTING_KITS_SLUG}/${product.slug}`}
                    onClick={onNavigate}
                    className="block px-4 py-2 text-sm text-(--maincolor)/90 transition-colors hover:bg-[#F3F4F6] hover:text-(--btncolor)"
                  >
                    {product.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-2 border-t border-gray-100 px-4 pt-2">
              <Link
                href={getCategoryHref(category.slug)}
                onClick={onNavigate}
                className="text-xs font-medium text-(--btncolor) hover:underline"
              >
                View all {category.name.toLowerCase()}
              </Link>
            </div>
          </div>
        </div>
      ))}

      <div className="group relative py-8">
        <Link href={ALL_CATEGORIES_NAV.href} onClick={onNavigate} className={`${navLinkClass} pe-9`}>
          <span>{ALL_CATEGORIES_NAV.name}</span>
          <ChevronDown className="absolute right-0 size-5 transition-transform duration-200 group-hover:rotate-180" />
        </Link>
        <div className={megaMenuPanelClass}>
          <BloodTestingMegaMenu variant="desktop" onNavigate={onNavigate} />
        </div>
      </div>
    </>
  );
}

interface MobileBloodTestingNavProps {
  openSubmenu: string | null;
  toggleSubmenu: (key: string) => void;
  onNavigate?: () => void;
}

export function MobileBloodTestingNav({
  openSubmenu,
  toggleSubmenu,
  onNavigate,
}: MobileBloodTestingNavProps) {
  const topCategories = getTopNavCategories();
  const allCategoriesKey = ALL_CATEGORIES_NAV.slug;

  return (
    <>
      {topCategories.map((category) => (
        <div key={category.id}>
          <div className="group flex w-full items-center justify-between p-4 transition-colors">
            <Link
              href={getCategoryHref(category.slug)}
              onClick={onNavigate}
              className="text-base font-normal text-(--maincolor) transition-colors group-hover:text-(--btncolor)"
            >
              {category.name}
            </Link>
            <ChevronDown
              onClick={() => toggleSubmenu(category.slug)}
              className={`size-7 cursor-pointer p-1 transition-transform duration-200 group-hover:text-(--btncolor) ${
                openSubmenu === category.slug ? "rotate-180" : ""
              }`}
            />
          </div>
          {openSubmenu === category.slug && (
            <ul className="border-b border-gray-200/80 bg-[#F3F4F6] px-5 py-3">
              {category.products.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/${TESTING_KITS_SLUG}/${product.slug}`}
                    onClick={onNavigate}
                    className="block border-b border-gray-200/60 py-3 text-[15px] text-(--maincolor) transition-colors last:border-b-0 hover:text-(--btncolor)"
                  >
                    {product.name}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link
                  href={getCategoryHref(category.slug)}
                  onClick={onNavigate}
                  className="text-sm font-medium text-(--btncolor)"
                >
                  View all {category.name.toLowerCase()}
                </Link>
              </li>
            </ul>
          )}
        </div>
      ))}

      <div>
        <div className="group flex w-full items-center justify-between p-4 transition-colors">
          <Link
            href={ALL_CATEGORIES_NAV.href}
            onClick={onNavigate}
            className="text-base font-normal text-(--maincolor) transition-colors group-hover:text-(--btncolor)"
          >
            {ALL_CATEGORIES_NAV.name}
          </Link>
          <ChevronDown
            onClick={() => toggleSubmenu(allCategoriesKey)}
            className={`size-7 cursor-pointer p-1 transition-transform duration-200 group-hover:text-(--btncolor) ${
              openSubmenu === allCategoriesKey ? "rotate-180" : ""
            }`}
          />
        </div>
        {openSubmenu === allCategoriesKey && (
          <BloodTestingMegaMenu variant="mobile" onNavigate={onNavigate} />
        )}
      </div>
    </>
  );
}
