"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { CreditCard, Trash2, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

export interface PaymentCard {
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
}

export default function PaymentCards({ initialCards }: { initialCards?: PaymentCard[] }) {
    const { user } = useAuthStore();
    const [cards, setCards] = useState<PaymentCard[]>(initialCards || []);
    const [isLoading, setIsLoading] = useState(!initialCards);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

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
            let cardsData: PaymentCard[] = [];

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

    useEffect(() => {
        if (initialCards && initialCards.length > 0) {
            setCards(initialCards);
            setIsLoading(false);
            return;
        }
        fetchCards();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.stripe_payment_method_id, initialCards]);

    const removeCard = async (paymentMethodId: string) => {
        if (!confirm("Are you sure you want to remove this payment method?")) return;

        setIsDeleting(paymentMethodId);
        try {
            const response = await api.delete(`${API_ENDPOINTS.PAYMENT_METHODS}/${paymentMethodId}`);
            if (response.data?.success) {
                toast.success("Payment method removed successfully");
                setCards(prevCards => prevCards.filter(card => card.id !== paymentMethodId));
            } else {
                toast.error(response.data?.message || "Failed to remove payment method");
            }
        } catch (error) {
            console.error("Error removing card:", error);
            toast.error("An error occurred while removing the payment method");
        } finally {
            setIsDeleting(null);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden min-h-[200px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 text-[var(--maincolor)] animate-spin" />
                    <p className="text-xs font-bold text-gray-400 uppercase">Loading Cards...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="bg-[#F9FAFB] px-8 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-[var(--maincolor)]" strokeWidth={3} />
                    <h3 className="text-[11px] font-bold text-[#4B5563] uppercase font-mainfont">Payment Cards</h3>
                </div>

            </div>

            <div className="p-8">
                {cards.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="h-6 w-6 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-500 font-mainfont">No saved payment methods found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                className="relative p-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 hover:border-[var(--maincolor)]/20 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-14 rounded-lg bg-gray-900 flex items-center justify-center text-white text-[10px] font-bold italic uppercase overflow-hidden">
                                            {card.brand}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Ending In</p>
                                            <p className="text-sm font-bold text-gray-900">•••• {card.last4}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeCard(card.id)}
                                        disabled={isDeleting === card.id}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Remove Card"
                                    >
                                        {isDeleting === card.id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Expires</p>
                                        <p className="text-xs font-bold text-gray-700">{card.exp_month.toString().padStart(2, '0')}/{card.exp_year}</p>
                                    </div>
                                    <ShieldCheck size={16} className="text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-gray-50/50 px-8 py-4 border-t border-gray-100 flex items-center justify-center gap-2">
                <ShieldCheck className="h-3.3 w-3.5 text-emerald-500" />
                <span className="text-[13px] font-normal text-gray-500">Secure & Encrypted Billing Information</span>
            </div>
        </div>
    );
}
