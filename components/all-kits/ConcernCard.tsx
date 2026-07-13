"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";

export interface Concern {
    id: string | number;
    href: string;
    icon: LucideIcon;
    title: string;
    description: string;
    variant?: "default" | "gradient";
}

interface ConcernCardProps {
    concern: Concern;
}

const ConcernCard = ({ concern }: ConcernCardProps) => {
    if (concern.variant === "gradient") {
        return (
            <Link
                href={concern.href}
                className="bg-gradient-to-br from-(--maincolor) to-[#1A5F6C] rounded-xl p-5 border border-[#0F4C5C] hover:shadow-lg transition-all group flex items-center justify-center text-center"
            >
                <div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                        <concern.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">{concern.title}</h3>
                    <p className="text-sm text-white/80">{concern.description}</p>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={concern.href}
            className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-lg hover:border-[#0F4C5C]/30 transition-all group"
        >
            <div className="w-12 h-12 bg-(--blockground) rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <concern.icon className="w-6 h-6 text-(--maincolor)" />
            </div>
            <h3 className="font-semibold text-(--maincolor) mb-2 group-hover:text-[#E07A5F] transition-colors">
                {concern.title}
            </h3>
            <p className="text-slate-600">{concern.description}</p>
        </Link>
    );
};

export default ConcernCard;
