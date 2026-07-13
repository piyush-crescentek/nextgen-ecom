"use client";

import { motion } from "framer-motion";
import { X, CreditCard, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import Image from "next/image";
import StripePaymentForm from "./StripePaymentForm";

interface Card {
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
}

interface PaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentMethod: string;
    setPaymentMethod: (method: string) => void;
    savedCards: Card[];
    selectedCardId: string | null;
    setSelectedCardId: (id: string | null) => void;
    isFetchingCards: boolean;
    saveCard: boolean;
    setSaveCard: (save: boolean) => void;
    isAuthenticated: boolean;
    onConfirm: () => void;
    isSubmitting: boolean;
}

export default function PaymentMethodModal({
    isOpen,
    onClose,
    paymentMethod,
    setPaymentMethod,
    savedCards,
    selectedCardId,
    setSelectedCardId,
    isFetchingCards,
    saveCard,
    setSaveCard,
    isAuthenticated,
    onConfirm,
    isSubmitting
}: PaymentMethodModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative bg-white w-full max-w-lg md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <CreditCard className="size-5 text-(--maincolor)" />
                            Payment Method
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Choose how you'd like to pay</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="size-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    <div className="space-y-6">
                        {/* Provider Selection Row */}
                        <div className="flex items-center gap-2 text-slate-500 justify-center mb-2">
                            <svg className="size-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                            <span className="text-xs font-medium">Secure payment via</span>
                            <Image
                                src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                                alt="Stripe"
                                width={40}
                                height={16}
                                unoptimized
                                className="h-3.5 w-auto translate-y-px opacity-80"
                            />
                        </div>

                        {/* Details Area */}
                        {paymentMethod === 'stripe' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {isAuthenticated && isFetchingCards ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="size-6 animate-spin text-(--maincolor)" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {isAuthenticated && savedCards.length > 0 && (
                                            <div className="space-y-2.5">
                                                <p className="text-[10px] font-bold text-(--maincolor) uppercase mb-2">Your Saved Cards</p>
                                                {savedCards.map((card) => (
                                                    <div
                                                        key={card.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedCardId(card.id);
                                                        }}
                                                        className={`p-3.5 rounded-xl border-2 transition-all flex items-center justify-between ${selectedCardId === card.id
                                                            ? 'border-(--maincolor) bg-white shadow-sm'
                                                            : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-1 px-2 rounded bg-white border border-gray-100">
                                                                <span className="text-[10px] font-black italic text-blue-900 uppercase">{card.brand}</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-800">•••• {card.last4}</p>
                                                                <p className="text-[10px] text-gray-500">Expires {card.exp_month}/{card.exp_year}</p>
                                                            </div>
                                                        </div>
                                                        {selectedCardId === card.id && (
                                                            <div className="size-5 bg-(--maincolor) rounded-full flex items-center justify-center">
                                                                <CheckCircle2 className="size-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCardId(null);
                                                    }}
                                                    className={`w-full p-3 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 text-sm font-bold ${!selectedCardId
                                                        ? 'border-(--maincolor) bg-white text-(--maincolor)'
                                                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <CreditCard className="size-4" />
                                                    Use a new card
                                                </button>
                                            </div>
                                        )}

                                        {(!selectedCardId || (isAuthenticated && savedCards.length === 0) || !isAuthenticated) && (
                                            <div className="bg-white p-4 rounded-xl border border-(--maincolor)/10">
                                                <StripePaymentForm
                                                    saveCard={saveCard}
                                                    setSaveCard={setSaveCard}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t mt-auto">
                    <div className="flex items-center gap-2 text-gray-500 mb-4 px-2">
                        <ShieldCheck className="size-4 text-emerald-600 font-bold" />
                        <span className="text-[11px] font-medium leading-none">Your payment information is encrypted and secure.</span>
                    </div>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-(--maincolor) text-white font-bold rounded-2xl shadow-xl shadow-(--maincolor)/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="size-5 animate-spin" />
                                Pay Now
                            </>
                        ) : (
                            "Pay Now"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
