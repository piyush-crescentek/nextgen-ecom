import { BusinessGroup } from "@/store/useAuthStore";

export interface VolumeTier {
    max_quantity: string | number;
    min_quantity: string | number;
    discount_type: "percentage" | "fixed" | string;
    discount_value: string | number;
}

export interface VolumeDiscount {
    tiers: VolumeTier[];
    billing_cycle?: string | null;
}

export interface VisibilityCheckItem {
    id?: number | string;
    category_id?: number | string;
}

/**
 * Checks if a product or service is visible based on business group rules.
 */
export function isVisible(item: VisibilityCheckItem, businessGroup?: BusinessGroup | null): boolean {
    if (!businessGroup || !businessGroup.rules || !Array.isArray(businessGroup.rules) || businessGroup.rules.length === 0) {
        return true;
    }

    const catalogRules = businessGroup.rules.filter(rule => rule.type === 'catalog');
    if (catalogRules.length === 0) return true;

    const productId = item.id ? (typeof item.id === 'string' ? parseInt(item.id) : Number(item.id)) : null;
    const categoryId = item.category_id ? (typeof item.category_id === 'string' ? parseInt(item.category_id) : Number(item.category_id)) : null;

    // Evaluation logic:
    // 1. If 'all' mode exists -> visible.
    // 2. If 'selective' rule matches -> visible.
    // 3. If 'exclude_others' rule exists:
    //    - If item matches the rule -> visible.
    //    - If item doesn't match and no other rule allows it -> hidden.
    
    const selectiveRules = catalogRules.filter(r => r.visibility?.mode === 'selective');
    const excludeOthersRules = catalogRules.filter(r => r.visibility?.mode === 'exclude_others');
    const allRuleVisible = catalogRules.find(r => r.visibility?.mode === 'all' || r.pricing?.mode === 'all');

    const checkMatch = (rule: { visibility?: any; pricing?: any }) => {
        const visibility = rule.visibility || rule.pricing || {};
        const targetProducts = (visibility.products || visibility.target_products || []) as (number | string)[];
        const targetCategories = (visibility.categories || visibility.target_categories || []) as (number | string)[];
        
        if (productId) {
            return targetProducts.includes(productId) || (targetProducts.length === 0 && categoryId !== null && targetCategories.includes(categoryId));
        } else if (categoryId) {
            return targetCategories.includes(categoryId);
        }
        return false;
    };

    // If an 'all' rule exists (visibility or pricing), it's visible by default
    // unless a specific 'exclude_others' rule with criteria restricts it.
    if (allRuleVisible) {
        const strictBlocker = excludeOthersRules.find(r => {
            const v = r.visibility || {};
            return (v.products && v.products.length > 0) || (v.categories && v.categories.length > 0);
        });
        if (strictBlocker) {
            return checkMatch(strictBlocker);
        }
        return true;
    }

    // Check if any selective rule allows it
    if (selectiveRules.some(checkMatch)) return true;

    // Check if any exclude_others rule exists. 
    if (excludeOthersRules.length > 0) {
        return excludeOthersRules.some(checkMatch);
    }

    // Default: visible if no 'allow-only' rules exist
    return selectiveRules.length === 0;
}

/**
 * Gets the discount percentage for a product/service based on business group rules.
 * Returns the HIGHEST applicable discount percentage.
 */
export function getDiscountPercentage(item: VisibilityCheckItem, businessGroup?: BusinessGroup | null): number {
    if (!businessGroup || !businessGroup.rules || !Array.isArray(businessGroup.rules)) {
        return 0;
    }

    const catalogRules = businessGroup.rules.filter(rule => rule.type === 'catalog');
    const productId = item.id ? (typeof item.id === 'string' ? parseInt(item.id) : Number(item.id)) : null;
    const categoryId = item.category_id ? (typeof item.category_id === 'string' ? parseInt(item.category_id) : Number(item.category_id)) : null;

    let maxDiscount = 0;

    for (const rule of catalogRules) {
        if (!rule.pricing) continue;
        const { mode, benefit_type, benefit_value, target_products, target_categories } = rule.pricing;
        
        let applies = false;
        if (mode === 'all') {
            applies = true;
        } else if (mode === 'selective' || mode === 'volume' || mode === 'exclude_others' || rule.visibility?.mode === 'exclude_others') {
            const products = Array.isArray(target_products) ? target_products : [];
            const categories = Array.isArray(target_categories) ? target_categories : [];

            if (productId) {
                applies = products.includes(productId) || (products.length === 0 && categoryId !== null && categories.includes(categoryId));
            } else if (categoryId) {
                applies = categories.includes(categoryId);
            }
        }

        if (applies && benefit_type === 'percentage') {
            if (mode === 'volume') continue; // Volume pricing handled via tiers
            const val = parseFloat(benefit_value as string) || 0;
            
            // Priority: exclude_others rules override everything else
            if (mode === 'exclude_others' || rule.visibility?.mode === 'exclude_others') {
                return val;
            }
            
            if (val > maxDiscount) maxDiscount = val;
        }
    }

    return maxDiscount;
}

/**
 * Checks if a product has a pricing rule with 'exclude_others' mode.
 */
export function hasExclusiveDiscount(item: VisibilityCheckItem, businessGroup?: BusinessGroup | null): boolean {
    if (!businessGroup || !businessGroup.rules || !Array.isArray(businessGroup.rules)) {
        return false;
    }

    const catalogRules = businessGroup.rules.filter(rule => rule.type === 'catalog');
    const productId = item.id ? (typeof item.id === 'string' ? parseInt(item.id) : Number(item.id)) : null;
    const categoryId = item.category_id ? (typeof item.category_id === 'string' ? parseInt(item.category_id) : Number(item.category_id)) : null;

    for (const rule of catalogRules) {
        if (rule.pricing?.mode === 'exclude_others' || rule.visibility?.mode === 'exclude_others') {
            const { target_products, target_categories } = rule.pricing || rule.visibility || {};
            const products = Array.isArray(target_products) ? target_products : [];
            const categories = Array.isArray(target_categories) ? target_categories : [];

            if (productId) {
                if (products.includes(productId) || (products.length === 0 && categoryId !== null && categories.includes(categoryId))) {
                    return true;
                }
            } else if (categoryId && categories.includes(categoryId)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Retrieves volume pricing tiers and billing cycle for a product if applicable.
 */
export function getVolumeTiers(item: VisibilityCheckItem, businessGroup?: BusinessGroup | null): VolumeDiscount | null {
    if (!businessGroup || !businessGroup.rules || !Array.isArray(businessGroup.rules)) {
        return null;
    }

    const catalogRules = businessGroup.rules.filter(rule => rule.type === 'catalog');
    const productId = item.id ? (typeof item.id === 'string' ? parseInt(item.id) : Number(item.id)) : null;
    const categoryId = item.category_id ? (typeof item.category_id === 'string' ? parseInt(item.category_id) : Number(item.category_id)) : null;

    for (const rule of catalogRules) {
        if (rule.pricing?.mode === 'volume' && Array.isArray(rule.pricing.volume_tiers) && rule.pricing.volume_tiers.length > 0) {
            const products = Array.isArray(rule.pricing.target_products) ? rule.pricing.target_products : [];
            const categories = Array.isArray(rule.pricing.target_categories) ? rule.pricing.target_categories : [];

            let applies = false;
            if (products.length > 0) {
                applies = productId !== null && products.includes(productId);
            } else if (categories.length > 0) {
                applies = categoryId !== null && categories.includes(categoryId);
            } else {
                // If both products and categories are empty for a 'volume' rule, it applies to all items
                applies = true;
            }

            if (applies) {
                return {
                    tiers: rule.pricing.volume_tiers,
                    billing_cycle: rule.pricing.billing_cycle || null
                };
            }
        }
    }

    return null;
}

/**
 * Calculates the discounted price based on a discount percentage.
 */
export function calculateDiscountedPrice(originalPrice: number | string, discountPercentage: number): number {
    const price = typeof originalPrice === 'string' ? parseFloat(originalPrice.replace(/[^0-9.]/g, '')) : originalPrice;
    if (isNaN(price)) return 0;
    if (discountPercentage <= 0) return price;
    
    const discountAmount = (price * discountPercentage) / 100;
    return price - discountAmount;
}

/**
 * Returns a message to display when an item is restricted.
 */
export function getRestrictionMessage(): string {
    return "This product or service is not available under your current business group plan.";
}

/**
 * Checks if a payment method is allowed based on business group rules.
 */
export function isPaymentMethodAllowed(methodName: string, businessGroup?: BusinessGroup | null): boolean {
    if (!businessGroup || !businessGroup.rules || !Array.isArray(businessGroup.rules)) {
        return true;
    }

    const paymentRule = businessGroup.rules.find(rule => rule.type === 'payment');
    if (!paymentRule || !Array.isArray(paymentRule.allowed_methods)) {
        return true;
    }

    const normalizedMethod = methodName.toLowerCase().trim();

    // Normalize aliases: 'tiered volume pricing' and 'volume pricing' both match 'volume'
    const aliases: Record<string, string[]> = {
        'volume': ['tiered volume pricing', 'volume pricing', 'volume'],
        'wallet balance': ['wallet balance', 'wallet'],
        'direct bank transfer': ['direct bank transfer', 'bank transfer'],
        'stripe': ['stripe', 'card', 'credit card'],
    };

    return paymentRule.allowed_methods.some((m: string) => {
        const normalizedM = m.toLowerCase().trim();
        if (normalizedM === normalizedMethod) return true;
        if (normalizedM.includes(normalizedMethod) || normalizedMethod.includes(normalizedM)) return true;

        // Check alias groups: if the incoming methodName and allowed method share the same alias group
        for (const group of Object.values(aliases)) {
            if (group.includes(normalizedM) && group.includes(normalizedMethod)) return true;
        }
        return false;
    });
}

/**
 * Bank transfer top-up in wallet (same rules as UI: not for customer_type 1).
 * Pay-as-you-go organisations (business customer_type 2, employer_type 3) may use bank transfer even when the business group payment rule would otherwise hide it.
 */
export function isDirectBankTransferAllowed(
    businessGroup?: BusinessGroup | null,
    customerType?: number,
    employerType?: number,
): boolean {
    if (customerType === 1) return false;
    if (isPaymentMethodAllowed("Direct Bank Transfer", businessGroup)) return true;
    if (customerType === 2 && employerType === 3) return true;
    return false;
}

// ---------------------------------------------------------------------------
// Global maintenance mode
// ---------------------------------------------------------------------------

export interface MaintenanceWindow {
    /** Unique label for this maintenance slot */
    id: string;
    /** Set true to show maintenance on every page */
    enabled: boolean;
    /** Countdown duration — how long maintenance stays on */
    durationHours: number;
    /** Optional extra minutes on top of durationHours */
    durationMinutes?: number;
    title?: string;
    message?: string;
}

/**
 * Add or edit entries here for site-wide maintenance.
 * Set enabled: true and duration — every URL shows the maintenance screen.
 */
export const GLOBAL_MAINTENANCE_WINDOWS: MaintenanceWindow[] = [
    {
        id: "scheduled-maintenance",
        enabled: false,
        durationHours: 1,
        durationMinutes: 30,
        title: "Scheduled Maintenance",
        message:
            "We're upgrading our systems to serve you better. The site will be back online shortly. Thank you for your patience.",
    },
];

export function getMaintenanceWindowDurationMs(window: MaintenanceWindow): number {
    const hours = window.durationHours ?? 0;
    const minutes = window.durationMinutes ?? 0;
    return (hours * 60 + minutes) * 60 * 1000;
}

export function isMaintenanceWindowActive(window: MaintenanceWindow): boolean {
    return window.enabled;
}

export function getActiveMaintenanceWindow(): MaintenanceWindow | null {
    return GLOBAL_MAINTENANCE_WINDOWS.find((window) => isMaintenanceWindowActive(window)) ?? null;
}

export function isMaintenanceModeActive(): boolean {
    return getActiveMaintenanceWindow() !== null;
}

