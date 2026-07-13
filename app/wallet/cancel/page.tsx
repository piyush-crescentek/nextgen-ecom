"use client";

import React, { useEffect, Suspense } from "react";
import { XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";

function CancelContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        if (sessionId) {
            api.post(API_ENDPOINTS.WALLET_STRIPE_CANCEL, { session_id: sessionId })
                .catch(err => console.error("Failed to notify cancellation:", err));
        }
    }, [sessionId]);

    return (
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="h-24 w-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-xl shadow-red-500/10">
                <XCircle size={48} />
            </div>
            <div className="space-y-3">
                <h2 className="text-3xl font-medium text-gray-900">Payment Cancelled</h2>
                <p className="text-base text-gray-600 leading-relaxed">
                    Your transaction was not completed. No funds were debited from your account.
                </p>
            </div>
            <div className="pt-4">
                <Link
                    href="/profile/wallet"
                    className="ghc-btn-secondary w-full flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={18} />
                    Back to Wallet
                </Link>
            </div>
        </div>
    );
}

export default function StripeCancelPage() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
                <CancelContent />
            </Suspense>
        </div>
    );
}
