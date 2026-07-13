"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import type { OhPrice, ProductPricingOption } from "@/lib/types";
import {
  formatOhDiscountBadge,
  formatOhPriceLabel,
  getEffectiveOhPrice,
  hasOhPriceDiscount,
} from "@/lib/oh-prices";
import {
  getEffectivePricingAmount,
  getPricingDiscountBadge,
  parsePricingAmount,
} from "@/lib/pricing-options";

interface ProductDetailPricingListProps {
  ohPrices?: OhPrice[];
  pricingOptions?: ProductPricingOption[];
  currency?: string;
  variant?: "detail" | "compact";
  className?: string;
  showInfoButton?: boolean;
}

interface PricingTier {
  key: string;
  label: string;
  effectivePrice: string;
  originalPrice?: string | null;
  discountLabel?: string | null;
}

interface HeadlinePriceValues {
  amounts: string[];
}

const DESKTOP_POPOVER_CLASS =
  "absolute right-0 top-full z-20 mt-1.5 w-max min-w-[11rem] max-w-[15rem] rounded border border-[#BFC8C6]/70 bg-white px-3 py-2.5 shadow-sm";

const MOBILE_POPOVER_CLASS =
  "fixed z-50 rounded border border-[#BFC8C6]/70 bg-white px-3 py-2.5 shadow-sm";

function buildOhTiers(ohPrices: OhPrice[], currency: string): PricingTier[] {
  return ohPrices.map((price, index) => {
    const showOriginal = hasOhPriceDiscount(price);
    return {
      key: `${price.label}-${price.duration}-${index}`,
      label: formatOhPriceLabel(price),
      effectivePrice: getEffectiveOhPrice(price),
      originalPrice: showOriginal ? price.amount : null,
      discountLabel: formatOhDiscountBadge(price, currency),
    };
  });
}

function buildFormTiers(
  pricingOptions: ProductPricingOption[],
  currency: string,
): PricingTier[] {
  return pricingOptions.map((option) => {
    const effectiveAmount = getEffectivePricingAmount(option);
    const originalAmount = parsePricingAmount(option.price);
    const showOriginal =
      originalAmount !== null && originalAmount > effectiveAmount;

    return {
      key: option.key,
      label: option.title,
      effectivePrice: effectiveAmount.toFixed(2),
      originalPrice: showOriginal ? originalAmount!.toFixed(2) : null,
      discountLabel: getPricingDiscountBadge(option, currency),
    };
  });
}

function getHeadlinePriceValues(tiers: PricingTier[]): HeadlinePriceValues | null {
  const amounts = tiers
    .map((tier) => tier.effectivePrice.trim())
    .filter((value) => value.length > 0 && Number.isFinite(parseFloat(value)));

  if (!amounts.length) return null;

  return { amounts };
}

function PricingDetailsPanel({
  tiers,
  currency,
}: {
  tiers: PricingTier[];
  currency: string;
}) {
  return (
    <ul className="space-y-2">
      {tiers.map((tier) => (
        <li
          key={tier.key}
          className="flex items-baseline justify-between gap-3 text-sm leading-tight"
        >
          <span className="min-w-0 text-slate-600">{tier.label}</span>
          <span className="shrink-0 text-right font-medium text-(--maincolor) tabular-nums whitespace-nowrap">
            {tier.originalPrice && (
              <span className="mr-1.5 text-xs font-normal text-slate-400 line-through">
                {currency}
                {tier.originalPrice}
              </span>
            )}
            {currency}
            {tier.effectivePrice}
          </span>
        </li>
      ))}
    </ul>
  );
}

interface MobilePopoverPosition {
  top: number;
  left: number;
  width: number;
}

function getMobilePopoverPosition(
  button: HTMLButtonElement,
): MobilePopoverPosition {
  const rect = button.getBoundingClientRect();
  const width = Math.min(260, window.innerWidth - 32);
  const left = Math.max(
    16,
    Math.min(
      rect.left + rect.width / 2 - width / 2,
      window.innerWidth - width - 16,
    ),
  );

  return { top: rect.bottom + 6, left, width };
}

function PricingHeadline({
  currency,
  headlinePrices,
  variant = "detail",
  className = "",
}: {
  currency: string;
  headlinePrices: HeadlinePriceValues;
  variant?: "detail" | "compact";
  className?: string;
}) {
  const headlineClass =
    variant === "compact"
      ? "text-base sm:text-lg font-normal"
      : "text-xl md:text-2xl font-bold";

  return (
    <h6
      className={`text-(--maincolor) ${headlineClass} flex flex-wrap items-center gap-3 shrink-0 ${className}`}
    >
      {headlinePrices.amounts.map((amount, index) => (
        <span key={`${amount}-${index}`} className="inline-flex items-center gap-3">
          {index > 0 && <span>–</span>}
          <span className="amount">
            <bdi>
              <span className="currencySymbol">{currency}</span>
              {amount}
            </bdi>
          </span>
        </span>
      ))}
    </h6>
  );
}

function PricingRangeInfo({
  tiers,
  currency,
  headlinePrices,
  variant = "detail",
  className = "",
}: {
  tiers: PricingTier[];
  currency: string;
  headlinePrices: HeadlinePriceValues;
  variant?: "detail" | "compact";
  className?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobilePosition, setMobilePosition] =
    useState<MobilePopoverPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mobilePopoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updateMobilePosition = () => {
    if (!buttonRef.current) return;
    setMobilePosition(getMobilePopoverPosition(buttonRef.current));
  };

  useEffect(() => {
    if (!mobileOpen) return;

    updateMobilePosition();

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        mobilePopoverRef.current?.contains(target)
      ) {
        return;
      }
      setMobileOpen(false);
    };

    const handleReposition = () => updateMobilePosition();

    document.addEventListener("click", handleOutsideClick);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [mobileOpen]);

  return (
    <h6
      className={`text-(--maincolor) ${
        variant === "compact"
          ? "text-base sm:text-lg font-normal"
          : "text-xl md:text-2xl font-bold"
      } flex flex-wrap items-center gap-3 shrink-0 ${className}`}
    >
      {headlinePrices.amounts.map((amount, index) => (
        <span key={`${amount}-${index}`} className="inline-flex items-center gap-3">
          {index > 0 && <span>–</span>}
          <span className="amount">
            <bdi>
              <span className="currencySymbol">{currency}</span>
              {amount}
            </bdi>
          </span>
        </span>
      ))}

      <div ref={containerRef} className="relative group shrink-0 self-center">
        <button
          ref={buttonRef}
          type="button"
          aria-label="View pricing details"
          aria-expanded={mobileOpen}
          onClick={(event) => {
            event.stopPropagation();
            if (mobileOpen) {
              setMobileOpen(false);
              return;
            }
            updateMobilePosition();
            setMobileOpen(true);
          }}
          className={`inline-flex size-9 items-center justify-center rounded-full text-(--btncolor) transition-colors hover:text-(--btncolor)/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--btncolor)/30 md:size-10 ${mobileOpen ? "" : "pricing-info-blink"}`}
        >
          <Info className="size-5 md:size-6" strokeWidth={2.25} />
        </button>

        {/* Mobile: portaled + fixed so overflow-hidden parents do not clip prices */}
        {mobileOpen &&
          mobilePosition &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              ref={mobilePopoverRef}
              className={`${MOBILE_POPOVER_CLASS} md:hidden`}
              style={{
                top: mobilePosition.top,
                left: mobilePosition.left,
                width: mobilePosition.width,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <PricingDetailsPanel tiers={tiers} currency={currency} />
            </div>,
            document.body,
          )}

        {/* Desktop: hover */}
        <div
          className={`${DESKTOP_POPOVER_CLASS} hidden md:group-hover:block`}
          onClick={(event) => event.stopPropagation()}
        >
          <PricingDetailsPanel tiers={tiers} currency={currency} />
        </div>
      </div>
    </h6>
  );
}

export default function ProductDetailPricingList({
  ohPrices,
  pricingOptions,
  currency = "€",
  variant = "detail",
  className = "",
  showInfoButton = true,
}: ProductDetailPricingListProps) {
  const tiers = ohPrices?.length
    ? buildOhTiers(ohPrices, currency)
    : pricingOptions?.length
      ? buildFormTiers(pricingOptions, currency)
      : [];

  if (!tiers.length) return null;

  const headlinePrices = getHeadlinePriceValues(tiers);
  if (!headlinePrices) return null;

  if (!showInfoButton) {
    return (
      <PricingHeadline
        currency={currency}
        headlinePrices={headlinePrices}
        variant={variant}
        className={className}
      />
    );
  }

  return (
    <PricingRangeInfo
      tiers={tiers}
      currency={currency}
      headlinePrices={headlinePrices}
      variant={variant}
      className={className}
    />
  );
}
