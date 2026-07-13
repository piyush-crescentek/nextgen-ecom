"use client";

import React, { useEffect, useState } from 'react';
import { ShoppingBag, ArrowRight, Trash2, ShieldCheck, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { TESTING_KITS_SLUG } from "@/lib/constants";
import { getDiscountPercentage } from '@/lib/visibility';
import { toast } from 'sonner';

const CartPage = () => {
    const { items, removeItem, totalAmount } = useCartStore();
    const { user } = useAuthStore();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const handle = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(handle);
    }, []);

    if (!mounted) return null;

    const cartTotal = totalAmount();

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 bg-white">
                <ShoppingBag size={48} className="text-(--maincolor) opacity-20 mb-4" />
                <h2 className="text-2xl font-bold text-(--maincolor) mb-2">Your cart is empty</h2>
                <p className="text-slate-500 mb-8">It looks like you haven&apos;t added anything yet.</p>
                <Link
                    href={`/${TESTING_KITS_SLUG}/categories`}
                    className="btn btn-primary h-12 bg-(--btncolor) text-white font-bold rounded px-8 flex items-center justify-center gap-2"
                >
                    Return to Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-[#f9fafb] min-h-screen pt-6 sm:pt-10 md:pt-40 pb-10 md:pb-16 font-mainfont">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 border-b border-slate-200 pb-4 md:pb-6 gap-2 sm:gap-4">
                    <h1 className="text-xl md:text-3xl font-bold text-(--maincolor)">Shopping Cart</h1>
                    <Link
                        href={`/${TESTING_KITS_SLUG}/categories`}
                        className="text-[10px] sm:text-sm font-bold text-slate-400 hover:text-(--btncolor) flex items-center gap-1.5 transition-colors uppercase w-fit -ml-1 sm:ml-0"
                    >
                        <ArrowLeft size={16} />
                        Continue Shopping
                    </Link>
                </div>

                <div className="grid lg:grid-cols-12 gap-10">
                    {/* Items List */}
                    <div className="lg:col-span-8 space-y-4">
                        {items.map((item) => (
                            <div
                                key={item.slug || item.id}
                                className="bg-white p-2 sm:p-6 border border-slate-100 transition-all relative flex items-center gap-2 sm:gap-6 hover:shadow-md"
                            >
                                <div className="size-14 sm:size-32 bg-slate-50 border border-slate-50 rounded shrink-0 flex items-center justify-center p-0.5 sm:p-2">
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col min-w-0 self-stretch justify-center pr-1">
                                    <div className="flex justify-between items-start mb-0.5 sm:mb-2">
                                        <div className="min-w-0">
                                            <h3 className="text-xs sm:text-lg font-bold text-(--maincolor) truncate pr-4 sm:pr-0 leading-tight">{item.name}</h3>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeItem(item.id);
                                            }}
                                            className="p-1 text-slate-300 hover:text-red-500 transition-colors absolute top-1 right-1 sm:static"
                                            title="Remove"
                                        >
                                            <Trash2 size={14} className="sm:size-[18px]" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mt-0.5">
                                        <div className="flex items-center bg-slate-50 rounded border border-slate-100 px-2 py-1">
                                            <span className="text-[10px] sm:text-sm font-bold text-(--maincolor)">
                                                Qty: {item.quantity}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm sm:text-xl font-bold text-(--maincolor)">€{(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 sm:p-8 sticky top-32 lg:top-40 transition-all font-mainfont">
                            <h3 className="text-lg font-bold text-(--maincolor) mb-6 flex items-center gap-2">
                                Order Summary
                                <span className="size-1.5 rounded-full bg-(--btncolor)" />
                            </h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-gray-600 text-[13px] font-semibold font-mainfont">
                                    <span>Subtotal</span>
                                    <span className="text-(--maincolor)">€{cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 text-[13px] font-semibold font-mainfont">
                                    <span>Shipping</span>
                                    <span className="text-emerald-600 uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">Free</span>
                                </div>
                                <div className="flex justify-between text-gray-400 text-[11px] font-normal italic font-mainfont">
                                    <span>Includes €{(cartTotal * 0.23).toFixed(2)} ROI VAT (23%)</span>
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[13px] font-bold text-(--maincolor) uppercase tracking-wider font-mainfont">Subtotal</span>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-(--maincolor) leading-none tracking-tight font-mainfont">€{cartTotal.toFixed(2)}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold mt-1.5 tracking-widest font-mainfont">Amount Before Benefits</p>
                                    </div>
                                </div>

                                {user?.business_group && items.some(item => getDiscountPercentage({ id: item.id, category_id: (item as any).category_id }, user.business_group) > 0) && (
                                    <div className="bg-(--maincolor)/5 border border-(--maincolor)/10 rounded-lg p-3 mt-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[11px] font-bold text-(--maincolor) uppercase tracking-wider">Business Benefit Available</span>
                                        </div>
                                        <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                                            As a member of <span className="text-(--maincolor) font-bold">{user.business_group.name}</span>, an exclusive discount will be applied to your eligible items during the final checkout stage.
                                        </p>
                                    </div>
                                )}

                                {user?.volume_discount && (
                                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mt-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="size-2 rounded-full bg-orange-500 animate-pulse" />
                                            <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">Volume Discount Status</span>
                                        </div>
                                        <p className="text-[12px] text-orange-700 leading-relaxed font-medium">
                                            Tier {user.volume_discount.current_tier?.min_quantity ?? "-"}-{user.volume_discount.current_tier?.max_quantity ?? "-"} (
                                            {user.volume_discount.current_discount?.percentage ?? user.volume_discount.current_tier?.discount_value ?? 0}% off),{" "}
                                            purchased this {user.volume_discount.billing_cycle || "current"} cycle: {user.volume_discount.total_purchased_quantity ?? 0}.
                                            Final discount is auto-calculated on backend at checkout.
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        if (items.length > 0) {
                                            const firstItem = items[0];
                                            if (!firstItem.slug) {
                                                toast.error("Invalid product data. Please remove and re-add items your cart.");
                                                return;
                                            }
                                            const sessionId = crypto.randomUUID();
                                            sessionStorage.setItem(`physical_form_access_${sessionId}`, 'true');
                                            // Using the first item's slug for the route parameter [subcategorySlug]
                                            router.push(`/testing-kits/${firstItem.slug}/physical-checkout-form?sessionId=${sessionId}`);
                                        }
                                    }}
                                    className="w-full h-12 bg-(--btncolor) hover:bg-(--btncolor)/95 text-white font-bold rounded-md flex items-center justify-center gap-3 transition-all uppercase text-base group shadow-sm active:scale-[0.98] font-mainfont"
                                >
                                    Proceed to Checkout
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            <p className="text-center text-[11px] text-slate-400 mt-6 leading-relaxed px-4">
                                Secure checkout processed by <span className="font-semibold text-slate-500">Stripe</span>. View our <Link href="#" className="underline font-medium hover:text-(--maincolor)">Terms</Link>
                            </p>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between px-2">
                                <div className="flex items-center gap-2 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                                    <ShieldCheck size={14} className="text-emerald-500/80" />
                                    SSL encrypted
                                </div>
                                <div className="opacity-30 grayscale hover:opacity-60 hover:grayscale-0 transition-all duration-500">
                                    <Image src="/images/stripe-logo.png" alt="Stripe" width={60} height={18} className="h-auto" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
