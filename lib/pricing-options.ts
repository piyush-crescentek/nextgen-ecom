import { isOccupationalHealthCategory } from "@/lib/oh-prices";
import type {
  OhPrice,
  Product,
  ProductPricingField,
  ProductPricingOption,
} from "@/lib/types";

export interface TieredPricingSource {
  category_slug: string;
  oh_prices?: OhPrice[];
  forms_pricing?: ProductPricingField | null;
}

export interface ResolvedTieredPricing {
  ohPrices?: OhPrice[];
  pricingOptions?: ProductPricingOption[];
  hasTieredPricing: boolean;
}

export function resolveTieredPricing(
  source: TieredPricingSource,
): ResolvedTieredPricing {
  const showOhPrices =
    isOccupationalHealthCategory(source.category_slug) &&
    (source.oh_prices?.length ?? 0) > 0;

  if (showOhPrices) {
    return { ohPrices: source.oh_prices, hasTieredPricing: true };
  }

  const pricingOptions = source.forms_pricing?.pricingOptions?.length
    ? source.forms_pricing.pricingOptions
    : [];

  return {
    pricingOptions: pricingOptions.length ? pricingOptions : undefined,
    hasTieredPricing: pricingOptions.length > 0,
  };
}

export function parsePricingAmount(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? parseFloat(value)
        : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

/** Effective amount: use finalAmount from API when present, otherwise price. */
export function getEffectivePricingAmount(option: ProductPricingOption): number {
  const finalAmount = parsePricingAmount(option.finalAmount);
  if (finalAmount !== null && finalAmount >= 0) {
    return finalAmount;
  }
  return parsePricingAmount(option.price) ?? 0;
}

export function getPricingOptionDisplayAmounts(
  options: ProductPricingOption[],
): string[] {
  return options.map((option) =>
    getEffectivePricingAmount(option).toFixed(2),
  );
}

export function getProductPricingOptions(product: Product): ProductPricingOption[] {
  if (product.forms_pricing?.pricingOptions?.length) {
    return product.forms_pricing.pricingOptions;
  }
  const legacy = product as Product & {
    pricing?: ProductPricingField | null;
    pricing_options?: ProductPricingOption[];
  };
  if (legacy.pricing?.pricingOptions?.length) {
    return legacy.pricing.pricingOptions;
  }
  return legacy.pricing_options ?? [];
}

export function hasProductPricingOptions(product: Product): boolean {
  return getProductPricingOptions(product).length > 0;
}

export function hasPricingDiscount(option: ProductPricingOption): boolean {
  return getPricingDiscountBadge(option) !== null;
}

export function getPricingDiscountBadge(
  option: ProductPricingOption,
  currency = "€",
): string | null {
  const base = parsePricingAmount(option.price);
  if (base === null || base <= 0) return null;

  const finalAmount = parsePricingAmount(option.finalAmount);
  const hasRealPriceDrop =
    finalAmount !== null && finalAmount >= 0 && finalAmount < base;
  if (!hasRealPriceDrop) return null;

  const discountType = String(option.discountType ?? "").toLowerCase();
  const discountValue = parsePricingAmount(option.discountValue);

  if (
    discountValue !== null &&
    discountValue > 0 &&
    (discountType === "percentage" || discountType === "%")
  ) {
    return `${discountValue}% OFF`;
  }

  if (discountValue !== null && discountValue > 0) {
    return `${currency}${discountValue.toFixed(2)} OFF`;
  }

  const pct = Math.round(((base - finalAmount!) / base) * 100);
  return pct > 0 ? `${pct}% OFF` : null;
}
