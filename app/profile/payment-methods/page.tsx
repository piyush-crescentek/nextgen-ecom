"use client";

import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { CreditCard, Lock, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import React from "react";
import { useAuthStore } from "@/store/useAuthStore";

export default function PaymentMethodsPage() {
    const { user } = useAuthStore();
    const [cards, setCards] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

    const fetchCards = async () => {
        // No payment method on file — skip the API call, show empty state immediately
        if (!user?.stripe_payment_method_id) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.get(API_ENDPOINTS.CARD_DETAILS, {
                params: { payment_method_id: user.stripe_payment_method_id }
            });
            const data = response.data;
            let cardsData = [];

            if (Array.isArray(data)) {
                cardsData = data;
            } else if (data && typeof data === 'object' && data.id) {
                cardsData = [data];
            } else if (data?.data && Array.isArray(data.data)) {
                cardsData = data.data;
            } else if (data?.success && Array.isArray(data.data)) {
                cardsData = data.data;
            }

            setCards(cardsData);
        } catch (error: unknown) {
            const axiosError = error as { response?: { status?: number } };
            const status = axiosError?.response?.status;
            // 400 = invalid/missing payment_method_id, 422 = no payment method found
            // Both mean the user has no valid saved card — treat as empty state, not an error
            if (status !== 400 && status !== 422) {
                console.error("Failed to fetch cards", error);
            }
            setCards([]);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchCards();
    }, [user?.stripe_payment_method_id]);

    const removeCard = async (paymentMethodId: string) => {
        if (!confirm("Are you sure you want to remove this payment method?")) return;

        setIsDeleting(paymentMethodId);
        try {
            const response = await api.delete(`${API_ENDPOINTS.PAYMENT_METHODS}/${paymentMethodId}`);
            if (response.data?.success) {
                setCards(cards.filter(card => card.id !== paymentMethodId));
            }
        } catch (error) {
            console.error("Error removing card:", error);
        } finally {
            setIsDeleting(null);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500 font-bold uppercase animate-pulse">Loading Secure Payment Methods...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 profile-font">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-[var(--maincolor)] font-bold text-xs uppercase">
                        <Lock className="h-4 w-4" />
                        Secure Billing
                    </div>
                    <h1 className="text-3xl font-black text-gray-900">Payment Methods</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your saved cards and billing preferences securely</p>
                </div>

                <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-gray-200">
                    <Plus className="h-4 w-4" />
                    Add Payment Method
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cards.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <CreditCard className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">No saved cards found</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2">Add a payment method during your next checkout to save it for future use.</p>
                    </div>
                ) : (
                    cards.map((card, idx) => (
                        <div key={idx} className={`relative p-8 rounded-3xl text-white shadow-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-500 ${idx % 2 === 0 ? 'bg-blue-600' : 'bg-slate-800'}`}>
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="flex justify-between items-start mb-12">
                                    <div className="text-2xl font-black italic capitalize">{card.brand}</div>
                                    <button
                                        onClick={() => removeCard(card.id)}
                                        disabled={isDeleting === card.id}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        {isDeleting === card.id ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={20} />
                                        )}
                                    </button>
                                </div>

                                <div className="text-xl font-medium tracking-[0.2em] mb-8">
                                    •••• •••• •••• {card.last4}
                                </div>

                                <div className="flex justify-between items-end mt-auto">
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] font-bold text-white/50 uppercase">Expires</p>
                                        <p className="text-sm font-bold">{card.exp_month}/{card.exp_year}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Abstract Decor */}
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        </div>
                    ))
                )}
            </div>

            <div className="bg-gray-50/50 px-8 py-6 border border-gray-100 rounded-3xl flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-[10px] font-black text-gray-400 uppercase">PCI-DSS Compliant & Secured Encryption</span>
            </div>
        </div>
    );
}
