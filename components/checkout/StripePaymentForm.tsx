"use client";

import React from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import { CreditCard, Calendar, Lock } from 'lucide-react';

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            color: "#1a1a1a",
            fontFamily: '"Inter", sans-serif',
            fontSmoothing: "antialiased",
            fontSize: "16px",
            "::placeholder": {
                color: "#9ca3af",
            },
        },
        invalid: {
            color: "#dc2626",
            iconColor: "#dc2626",
        },
    },
};

interface StripePaymentFormProps {
    saveCard: boolean;
    setSaveCard: (save: boolean) => void;
}

export default function StripePaymentForm({ saveCard, setSaveCard }: StripePaymentFormProps) {
    const fieldClasses = "py-3 px-3 border border-gray-100 rounded-lg focus-within:ring-4 focus-within:ring-(--maincolor)/10 focus-within:border-(--maincolor)/100/50 transition-all bg-gray-50/50 flex items-center gap-3 group";
    const labelClasses = "block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1";

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                    <label className={labelClasses}>Card Number</label>
                    <div className={fieldClasses}>
                        <CreditCard className="size-4 text-gray-400 group-focus-within:text-(--btncolor) transition-colors" />
                        <div className="flex-1">
                            <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className={labelClasses}>Expiry Date</label>
                        <div className={fieldClasses}>
                            <Calendar className="size-4 text-gray-400 group-focus-within:text-(--btncolor) transition-colors" />
                            <div className="flex-1">
                                <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className={labelClasses}>CVC / CVV</label>
                        <div className={fieldClasses}>
                            <Lock className="size-4 text-gray-400 group-focus-within:text-(--btncolor) transition-colors" />
                            <div className="flex-1">
                                <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSaveCard(!saveCard)}
            >
                <div className={`size-5 rounded border-2 flex items-center justify-center transition-all ${saveCard ? 'bg-(--btncolor) border-(--btncolor)' : 'border-gray-300 bg-white'}`}>
                    {saveCard && <Lock className="size-2.5 text-white" />}
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-700">Save card for future payments</span>
                    <span className="text-[10px] text-gray-400">Securely store your card for a faster checkout next time.</span>
                </div>
            </div>

        </div>
    );
}
