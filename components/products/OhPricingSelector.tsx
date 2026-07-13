"use client";

import type { OhPrice } from "@/lib/types";
import PricingDiscountBadge from "@/components/products/PricingDiscountBadge";
import {
  formatOhDiscountBadge,
  formatOhPriceLabel,
  getEffectiveOhPrice,
  hasOhPriceDiscount,
} from "@/lib/oh-prices";

interface OhPricingSelectorProps {
  prices: OhPrice[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  currency?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function OhPricingSelector({
  prices,
  selectedIndex,
  onSelect,
  currency = "€",
  error,
  required = false,
  disabled = false,
}: OhPricingSelectorProps) {
  if (!prices.length) return null;

  return (
    <div className="w-full">
      <h3 className="text-(--maincolor) text-xl font-bold mb-4">
        Pricing
        {required && <span className="text-red-500 ml-1">*</span>}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {prices.map((price, index) => {
          const isSelected = selectedIndex === index;
          const showOriginalPrice = hasOhPriceDiscount(price);
          const discountBadge = formatOhDiscountBadge(price, currency);
          return (
            <button
              key={`${price.label}-${price.duration}-${index}`}
              type="button"
              onClick={() => !disabled && onSelect(index)}
              disabled={disabled}
              className={`relative w-full text-left rounded-xl border-2 px-4 py-4 transition-all duration-200 ${
                isSelected
                  ? "border-(--maincolor) bg-[#E7E9ED] shadow-sm"
                  : "border-gray-200 bg-white hover:border-(--maincolor)/40"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {discountBadge && (
                <PricingDiscountBadge label={discountBadge} />
              )}
              <div className="flex items-center justify-between gap-4">
                <p className="text-(--maincolor) text-sm sm:text-base font-bold leading-snug min-w-0">
                  {formatOhPriceLabel(price)}
                </p>
                <div className="text-right shrink-0">
                  {showOriginalPrice && (
                    <p className="text-gray-400 text-xs line-through mb-0.5">
                      {currency}
                      {price.amount}
                    </p>
                  )}
                  <p className="text-(--maincolor) text-lg font-bold">
                    {currency}
                    {getEffectiveOhPrice(price)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-[#c02b0a]/70 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
