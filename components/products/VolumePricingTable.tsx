"use client";

import { VolumeTier } from "@/lib/visibility";

interface VolumePricingTableProps {
    tiers: VolumeTier[];
    billing_cycle?: string | null;
    currency?: string;
}

export default function VolumePricingTable({ tiers, billing_cycle, currency = "£" }: VolumePricingTableProps) {
    if (!tiers || tiers.length === 0) return null;

    return (
        <div className="w-full mt-4">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase">Volume Discounts</h4>
                {billing_cycle && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold uppercase">
                        {billing_cycle} Cycle
                    </span>
                )}
            </div>
            <div className="w-full overflow-hidden border border-[#E5E7EB] rounded-xl bg-white shadow-sm">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Quantity</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Discount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tiers.map((tier, idx) => (
                            <tr key={idx} className="border-b last:border-b-0 border-[#E5E7EB] hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                    {tier.max_quantity && tier.max_quantity !== "" && tier.max_quantity !== "unlimited" ? (
                                        `${tier.min_quantity} - ${tier.max_quantity} Units`
                                    ) : (
                                        `${tier.min_quantity}+ Units`
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-(--btncolor) text-right">
                                    {tier.discount_type === 'percentage' || tier.discount_type === '%' ? (
                                        `${tier.discount_value}% OFF`
                                    ) : (
                                        `${currency}${tier.discount_value} OFF`
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="mt-3 text-[11px] text-gray-400 italic">
                * Discounts are applied automatically at checkout based on total quantity.
            </p>
        </div>
    );
}

