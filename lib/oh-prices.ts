import type { OhPrice } from "@/lib/types";

export const OH_PRICING_ERROR_KEY = "oh_pricing";

export interface OhSelectedPricePayload {
  index: number;
  label: string;
  duration: string | null;
  price: number;
  currency: string;
  amount: string;
  discounted_amount: string | null;
  discount_type: string | null;
  discount_value: string | null;
}

function parsePositiveNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = parseFloat(String(value).trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function hasOhPriceDiscount(item: OhPrice): boolean {
  if (!item.discount_type?.trim() || !item.discounted_amount?.trim()) {
    return false;
  }

  const original = parsePositiveNumber(item.amount);
  const discounted = parsePositiveNumber(item.discounted_amount);

  if (original !== null && discounted !== null) {
    return discounted < original;
  }

  const discountValue = parsePositiveNumber(item.discount_value);
  return discountValue !== null;
}

/** Effective price: discounted when a discount is set, otherwise list amount. */
export function getEffectiveOhPrice(item: OhPrice): string {
  return hasOhPriceDiscount(item)
    ? item.discounted_amount!.trim()
    : item.amount.trim();
}

/** Badge text for discounted tiers, e.g. "16% OFF" or "€4 OFF". */
export function formatOhDiscountBadge(
  item: OhPrice,
  currency = "€",
): string | null {
  if (!hasOhPriceDiscount(item)) return null;

  const discountType = item.discount_type?.trim().toLowerCase() ?? "";
  const discountValue = item.discount_value?.trim();

  if (discountValue && (discountType === "percentage" || discountType === "%")) {
    return `${discountValue}% OFF`;
  }

  if (discountValue) {
    return `${currency}${discountValue} OFF`;
  }

  const original = parsePositiveNumber(item.amount);
  const discounted = parsePositiveNumber(item.discounted_amount);
  if (original !== null && discounted !== null) {
    const pct = Math.round(((original - discounted) / original) * 100);
    if (pct > 0) return `${pct}% OFF`;
  }

  return null;
}

export function getOhPriceAmounts(ohPrices: OhPrice[]): string[] {
  return ohPrices.map(getEffectiveOhPrice);
}

export function isOccupationalHealthCategory(
  categorySlug: string | null | undefined,
): boolean {
  return categorySlug === "occupational-health";
}

function normalizeDurationUnit(unit: string): string {
  const normalized = unit.trim().toLowerCase();
  if (
    normalized === "min" ||
    normalized === "mins" ||
    normalized === "minute" ||
    normalized === "minutes"
  ) {
    return "min";
  }
  if (
    normalized === "hr" ||
    normalized === "hrs" ||
    normalized === "hour" ||
    normalized === "hours"
  ) {
    return "hrs";
  }
  return unit.trim();
}

export function formatOhPriceDurationText(price: OhPrice): string | null {
  const duration = price.duration?.trim();
  const unit = price.duration_unit?.trim();
  if (!duration || !unit) return null;
  return `${duration} ${normalizeDurationUnit(unit)}`;
}

export function formatOhPriceLabel(price: OhPrice): string {
  const durationText = formatOhPriceDurationText(price);
  return durationText
    ? `${price.label} (${durationText})`
    : price.label;
}

export function buildOhSelectedPricePayload(
  price: OhPrice,
  index: number,
  currency = "€",
): OhSelectedPricePayload {
  const effectivePrice = parseFloat(getEffectiveOhPrice(price));
  return {
    index,
    label: formatOhPriceLabel(price),
    duration: formatOhPriceDurationText(price),
    price: Number.isFinite(effectivePrice) ? effectivePrice : 0,
    currency,
    amount: price.amount,
    discounted_amount: price.discounted_amount ?? null,
    discount_type: price.discount_type ?? null,
    discount_value: price.discount_value ?? null,
  };
}

export function getOhPriceSessionKey(sessionId: string): string {
  return `oh_selected_price_${sessionId}`;
}

export function saveOhSelectedPriceToSession(
  sessionId: string,
  payload: OhSelectedPricePayload,
): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    getOhPriceSessionKey(sessionId),
    JSON.stringify(payload),
  );
}

export function loadOhSelectedPriceFromSession(
  sessionId: string,
): OhSelectedPricePayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(getOhPriceSessionKey(sessionId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OhSelectedPricePayload;
    if (typeof parsed.index !== "number" || typeof parsed.price !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function extractOhPricingFromConsultation(
  consultationData: unknown,
): { label: string; price: number; duration: string | null } | null {
  const cData = consultationData as Record<string, unknown> | null;
  const selected = cData?.oh_selected_price as
    | OhSelectedPricePayload
    | undefined;
  if (!selected || typeof selected.price !== "number") return null;
  return {
    label: selected.label,
    price: selected.price,
    duration: selected.duration ?? null,
  };
}
