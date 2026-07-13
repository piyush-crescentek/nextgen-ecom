"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { SavedCard } from "@/types/checkout";

interface ConsultationData {
    key: string;
    title: string;
    value: string | null;
}

interface CartItem {
    id: string | number;
    name: string;
    slug: string;
    price: number;
    quantity: number;
}

interface OrderSummaryProps {
    productName?: string;
    isPhysicalProduct: boolean;
    consultationData: ConsultationData[] | Record<string, any> | null;
    consultationLabel: string;
    totalAmount: number;
    finalTotalAmount: number;
    cartItems: CartItem[];
    walletBalance: number;
    isBalanceEnough: boolean;
    canShowWallet: boolean;
    useWallet: boolean;
    isSubmitting: boolean;
    savedCards: SavedCard[];
    appointment?: {
        user_id: number;
        scheduled_at: string;
        duration: number;
        clinic_id: number;
        doctor_name?: string;
    };
    onWalletToggle: (checked: boolean) => void;
    onRemoveCartItem: (id: string | number) => void;
    onPlaceOrder: () => void;
    isStripeAllowed?: boolean;
    /** Pay-as-you-go org (employer_type 3): hint to top up wallet via bank transfer */
    showPayAsYouGoWalletHint?: boolean;
    hasVolumeDiscount?: boolean;
    volumeDiscount?: {
        total_purchased_quantity?: number;
        billing_cycle?: string;
        cycle_start?: string;
        current_discount?: {
            category?: string;
            percentage?: number;
        };
        current_tier?: {
            min_quantity?: string | number;
            max_quantity?: string | number;
            discount_type?: string;
            discount_value?: string | number;
        };
    } | null;
}

function parseAppointmentField(value: string) {
    const doctorMatch = value.match(/Doctor:\s*([^,]+)/);
    const dateMatch = value.match(/Date:\s*([^,]+)/);
    const timeMatch = value.match(/Time:\s*([^,]+)/);
    const apptDate = dateMatch?.[1]?.trim() || '';
    let formattedDate = apptDate;
    if (apptDate && !isNaN(new Date(apptDate).getTime())) {
        try {
            formattedDate = new Date(apptDate).toLocaleDateString('en-GB', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
            });
        } catch {
            // keep raw value
        }
    }
    return {
        doctor: doctorMatch?.[1]?.trim() || '',
        rawDate: apptDate,
        date: formattedDate,
        time: timeMatch?.[1]?.trim() || '',
    };
}

function formatTime12h(timeStr: string) {
    if (!timeStr) return '';
    // Handle cases where AM/PM might already be present
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) return timeStr;

    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;

    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].substring(0, 2);
    if (isNaN(hours)) return timeStr;

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
}

export default function OrderSummary({
    productName,
    isPhysicalProduct,
    consultationData,
    consultationLabel,
    totalAmount,
    finalTotalAmount,
    cartItems,
    walletBalance,
    isBalanceEnough,
    canShowWallet,
    useWallet,
    isSubmitting,
    savedCards,
    appointment,
    onWalletToggle,
    onRemoveCartItem,
    onPlaceOrder,
    isStripeAllowed,
    showPayAsYouGoWalletHint,
    hasVolumeDiscount,
    volumeDiscount,
}: OrderSummaryProps) {
    const cData = consultationData as any;
    let data = Array.isArray(consultationData)
        ? consultationData
        : cData?.vue_form_data || cData?.all_fields || [];

    // If the data is in the new nested format (array of sections with fields),
    // flatten it for the summary view components that expect a flat list of fields.
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
        if ('fields' in data[0] && Array.isArray(data[0].fields)) {
            data = data.flatMap((section: any) => section.fields || []);
        }
    }

    // Safety check: ensure 'data' is always an array before calling .find
    if (!Array.isArray(data)) {
        data = [];
    }

    const subtotalBeforeDiscounts = totalAmount + cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const volumeDiscountPercent = Number(
        volumeDiscount?.current_discount?.percentage ?? volumeDiscount?.current_tier?.discount_value ?? 0
    ) || 0;
    const estimatedVolumeDiscount = (subtotalBeforeDiscounts * volumeDiscountPercent) / 100;
    const previewTotalAmount = Math.max(finalTotalAmount - estimatedVolumeDiscount, 0);

    const apptField = !isPhysicalProduct
        ? data.find((f: any) =>
            f.value?.includes('Doctor:') && f.value?.includes('Date:') && f.value?.includes('Time:')
        )
        : undefined;
    const appt = apptField ? parseAppointmentField(apptField.value) : null;

    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 sticky top-[150px] shadow-sm">
            <h2 className="text-lg font-bold text-(--maincolor) mb-6 font-mainfont">Your Order</h2>

            <div className="space-y-4 mb-6">
                <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase border-b border-slate-50 pb-2">
                    <span>Product</span>
                    <span>Subtotal</span>
                </div>

                {!isPhysicalProduct && (
                    <div className="flex justify-between items-start gap-4 text-sm pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                        <div className="flex-1">
                            <p className="font-medium text-slate-900">
                                {productName}
                                {apptField && (
                                    <span className="text-[10px] bg-(--blockground) text-(--btncolor) px-1.5 py-0.5 rounded ml-1">Appointment</span>
                                )}
                            </p>
                            {consultationLabel && <p className="text-slate-400 text-xs mt-0.5">{consultationLabel}</p>}
                            {appt && (
                                <div className="mt-2 bg-[#E7E9ED] border border-(--maincolor)/10 rounded-lg p-2.5 space-y-1">
                                    {(appointment?.doctor_name || appt.doctor) && (
                                        <div className="flex items-center gap-1.5">
                                            <svg className="size-3 text-(--maincolor) shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                            </svg>
                                            <span className="text-[11px] font-semibold text-(--maincolor)">{appointment?.doctor_name || appt.doctor}</span>
                                        </div>
                                    )}
                                    {(appointment?.scheduled_at?.split(' ')[0] || appt.date) && (
                                        <div className="flex items-center gap-1.5">
                                            <svg className="size-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                            </svg>
                                            <span className="text-[11px] text-slate-600">
                                                {(() => {
                                                    const dateStr = appointment?.scheduled_at?.split(' ')[0] || appt.rawDate;
                                                    if (!dateStr) return '';
                                                    try {
                                                        return new Date(dateStr).toLocaleDateString('en-GB', {
                                                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                                                        });
                                                    } catch {
                                                        return dateStr;
                                                    }
                                                })()}
                                            </span>
                                        </div>
                                    )}
                                    {(appointment?.scheduled_at?.split(' ')[1] || appt.time) && (
                                        <div className="flex items-center gap-1.5">
                                            <svg className="size-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                            </svg>
                                            <span className="text-[11px] text-slate-600">
                                                {formatTime12h(appointment?.scheduled_at?.split(' ')[1] || appt.time)}
                                                {appointment?.duration && <span className="ml-2 py-0.5 px-1 bg-slate-100 text-[10px] rounded text-slate-500 font-medium">({appointment.duration} mins)</span>}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-(--maincolor) whitespace-nowrap">€{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                )}

                {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start gap-4 text-sm pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-900">{item.name}</p>
                                <button
                                    onClick={() => onRemoveCartItem(item.id)}
                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                    title="Remove from order"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            <p className="text-slate-400 text-xs mt-0.5">Quantity: {item.quantity}</p>
                        </div>
                        <span className="font-bold text-(--maincolor) whitespace-nowrap">€{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}

                <div className="pt-4 mt-2 border-t border-slate-100 space-y-2">
                    {volumeDiscount && volumeDiscountPercent > 0 && (
                        <div className="flex justify-between items-center text-emerald-600 text-[13px] font-bold">
                            <div className="flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Volume Discount ({volumeDiscountPercent}%)</span>
                            </div>
                            <span>-€{estimatedVolumeDiscount.toFixed(2)}</span>
                        </div>
                    )}
                    {volumeDiscount && volumeDiscountPercent > 0 && (
                        <div className="text-[10px] text-slate-500 -mt-1">
                            Estimated preview. Final discount is auto-calculated at order processing.
                        </div>
                    )}
                    {finalTotalAmount < (totalAmount + cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)) && (
                        <div className="flex justify-between items-center text-emerald-600 text-[13px] font-bold">
                            <div className="flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Business Group Benefit Applied</span>
                            </div>
                            <span>-€{((totalAmount + cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)) - finalTotalAmount).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-lg">
                        <span className="font-bold text-slate-900">Total</span>
                        <div className="text-right leading-tight">
                            <span className="font-bold text-(--maincolor)">€{previewTotalAmount.toFixed(2)}</span>
                            {finalTotalAmount < (totalAmount + cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)) && (
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight mt-1">Member Price</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {canShowWallet && (
                <div className={`rounded-xl transition-all mb-6 border ${useWallet ? 'bg-(--maincolor)/5 border-(--maincolor)/20' : 'bg-white border-slate-100'}`}>
                    <label className={`block p-4 ${isBalanceEnough ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={useWallet}
                                disabled={!isBalanceEnough}
                                onChange={(e) => onWalletToggle(e.target.checked)}
                                className="size-4 rounded border-slate-300 text-(--maincolor) focus:ring-(--maincolor)"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-900">Wallet Balance</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isBalanceEnough ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {isBalanceEnough ? 'Available' : 'Insufficient'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs mt-1">
                                    <span className="text-slate-500 font-medium whitespace-nowrap">Balance: €{walletBalance.toFixed(2)}</span>
                                    {!isBalanceEnough && (
                                        <span className="text-red-500 font-bold ml-2 text-[10px]">Need €{Math.abs(walletBalance - previewTotalAmount).toFixed(2)} more</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </label>
                </div>
            )}

            <div className="space-y-4">
                {!useWallet && (
                    <div className="flex items-center gap-2 mb-4 text-slate-500 justify-center">
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
                )}

                {showPayAsYouGoWalletHint && (
                    <p className="text-[11px] text-slate-600 text-center leading-relaxed mb-3 px-0.5">
                        No credit/debit card? Top up your organisation wallet by bank transfer and use the balance to pay at checkout.{" "}
                        <Link
                            href="/profile/wallet?tab=funds&method=bank"
                            className="text-(--maincolor) font-semibold underline underline-offset-2 hover:opacity-90 whitespace-nowrap"
                        >
                            Click here
                        </Link>
                    </p>
                )}

                <button
                    onClick={onPlaceOrder}
                    disabled={isSubmitting || (!useWallet && isStripeAllowed === false)}
                    className={`w-full py-4 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${useWallet ? 'bg-(--maincolor)' : 'bg-(--btncolor)'} ${(isSubmitting || (!useWallet && isStripeAllowed === false)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isSubmitting ? (
                        <Loader2 className="size-5 animate-spin" />
                    ) : (
                        <>
                            {useWallet ? 'Pay with Wallet' : 'Place Order'}
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white/10 rounded">Secure</span>
                        </>
                    )}
                </button>
                {!useWallet && isStripeAllowed === false && (
                    <p className="text-[10px] text-red-500 text-center font-bold uppercase mt-2">
                        Stripe payment is not allowed for your account.
                    </p>
                )}

            </div>
        </div>
    );
}
