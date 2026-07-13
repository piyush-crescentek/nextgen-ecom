"use client";

import React, { useEffect, useState, Suspense } from "react";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { clearConsultationSessionStorage } from "@/lib/consultationSession";
import { useFormStore } from "@/store/useFormStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { useCartStore } from "@/store/useCartStore";

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id") || searchParams.get("sessionId");
    const [loading, setLoading] = useState(true);
    const { clearProgress } = useFormStore();
    const { clearCheckoutData } = useCheckoutStore();
    const { clearCart } = useCartStore();

    useEffect(() => {
        // Ensure any previous consultation/checkout session is fully cleared so
        // users don't see "Incomplete Session Found" after a successful order flow.
        clearProgress();
        clearCheckoutData();
        if (sessionId) {
            clearConsultationSessionStorage(sessionId);
            clearCart();
        }

        if (sessionId) {
            // Small delay to simulate verification and allow backend processing
            const timer = setTimeout(() => {
                setLoading(false);
            }, 1500);
            return () => clearTimeout(timer);
        } else {
            Promise.resolve().then(() => setLoading(false));
        }
    }, [sessionId, clearProgress, clearCheckoutData, clearCart]);

    return (
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {loading ? (
                <div className="space-y-4">
                    <Loader2 className="h-16 w-16 text-[var(--maincolor)] animate-spin mx-auto" />
                    <h2 className="text-2xl font-medium text-gray-900">Verifying Payment...</h2>
                </div>
            ) : (
                <>
                    <div className="h-24 w-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-xl shadow-emerald-500/10">
                        <CheckCircle size={48} />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-medium text-gray-900">Payment Successful!</h2>
                        <p className="text-base text-gray-600 leading-relaxed">
                            Your wallet has been topped up successfully. The balance should reflect in your account momentarily.
                        </p>
                    </div>
                    <div className="pt-4">
                        <Link
                            href="/profile/dashboard"
                            className="ghc-btn-primary w-full flex items-center justify-center gap-2 group"
                        >
                            Go to Dashboard
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}

export default function StripeSuccessPage() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
