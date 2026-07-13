"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { getDiscountPercentage, getVolumeTiers } from "@/lib/visibility";

interface BusinessGroupBadgeProps {
    product: { id?: string | number; category_id?: string | number };
    className?: string;
}

/**
 * A simple, clean discount badge for business group members.
 * Only shown when a flat discount applies — hidden if volume pricing tiers are active.
 */
export default function BusinessGroupBadge({ product, className = "" }: BusinessGroupBadgeProps) {
    const { user } = useAuthStore();
    
    // Business Group benefits only show for customer type 2
    if (user?.customer_type !== 2) return null;

    const discount = getDiscountPercentage(product, user?.business_group);
    const volumeTiers = getVolumeTiers(product, user?.business_group);

    // Don't show flat discount badge when volume pricing is active
    if (discount <= 0 || volumeTiers) return null;

    return (
        <div className={`inline-flex items-center rounded-md bg-(--btncolor) text-white px-2 py-0.5 text-[10px] font-bold shadow-sm whitespace-nowrap ${className}`}>
            {discount}% OFF
        </div>
    );
}
