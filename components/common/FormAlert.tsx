"use client";

import React from "react";
import { Info, CheckCircle2, AlertCircle } from "lucide-react";

interface FormAlertProps {
    error?: string | null;
    success?: string | null;
    info?: string | null;
    className?: string;
}

export default function FormAlert({ error, success, info, className = "" }: FormAlertProps) {
    if (!error && !success && !info) return null;

    const baseStyles = "flex items-center gap-4 p-4 rounded border animate-in fade-in slide-in-from-top-2 duration-300";

    return (
        <div className={`w-full max-w-2xl mx-auto space-y-3 mb-8 ${className}`}>
            {error && (
                <div className={`${baseStyles} bg-[#FFF5F5] border-[#FED7D7]`}>
                    <AlertCircle className="h-5 w-5 text-[#E53E3E] shrink-0" />
                    <p className="text-[14px] font-medium text-[#C53030] leading-snug">{error}</p>
                </div>
            )}

            {success && (
                <div className={`${baseStyles} bg-[#F0FFF4] border-[#C6F6D5]`}>
                    <CheckCircle2 className="h-5 w-5 text-[#38A169] shrink-0" />
                    <p className="text-[14px] font-medium text-[#2F855A] leading-snug">{success}</p>
                </div>
            )}

            {info && (
                <div className={`${baseStyles} bg-[#EBF8FF] border-[#BEE3F8] border-l-4 border-l-[#3182CE]`}>
                    <Info className="h-5 w-5 text-[#3182CE] shrink-0" />
                    <p className="text-[14px] font-medium text-[#2B6CB0] leading-snug">{info}</p>
                </div>
            )}
        </div>
    );
}
