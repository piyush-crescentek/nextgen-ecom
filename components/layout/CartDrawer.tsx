"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, ShoppingCart, ArrowRight, ShieldCheck } from 'lucide-react';

import { useCartStore } from '@/store/useCartStore';

import { useRouter } from 'next/navigation';



export default function CartDrawer() {
    const { isOpen, closeCart, items, removeItem, totalAmount, totalItems } = useCartStore();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const handle = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(handle);
    }, []);

    if (!mounted) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCart}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 bottom-0 right-0 max-h-full w-full max-w-[450px] overflow-x-hidden bg-white z-[101] shadow-2xl flex flex-col font-mainfont"
                    >
                        {/* Header */}
                        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-lg font-semibold text-(--maincolor)">Your Cart</h3>
                                <div className="flex items-center gap-1.5 leading-none">
                                    <span className="size-1.5 rounded-full bg-btncolor" />
                                    <p className="!text-xs text-gray-500 leading-none m-0">{totalItems()} Items Selected</p>
                                </div>
                            </div>
                            <button
                                onClick={closeCart}
                                className="size-6 flex items-center justify-center border border-transparent hover:border-(--maincolor) rounded-full transition-all duration-300 group active:scale-95 cursor-pointer"
                            >
                                <X className="size-4 text-gray-500 group-hover:text-(--maincolor) transition-colors" />
                            </button>
                        </div>

                        {/* Items List */}
                        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-5 sm:py-8 space-y-6">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                                    <div className="size-20 rounded-2xl bg-(--maincolor) flex items-center justify-center shrink-0 mb-5">
                                        <ShoppingCart size={32} className="text-white" strokeWidth={1.5} />
                                    </div>
                                    <h4 className="text-lg font-bold text-(--maincolor) leading-tight m-0 mb-2">Your cart is empty</h4>
                                    <p className="text-sm text-gray-400 max-w-[220px]">Looks like you haven&apos;t added anything to your cart yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-3 p-3 sm:p-4 rounded-xl bg-white border border-gray-100 group shadow-sm hover:shadow-md transition-all duration-300 min-w-0">
                                            <div className="size-10 rounded-lg bg-blockground flex items-center justify-center overflow-hidden shrink-0 relative group-hover:scale-95 transition-transform">
                                                <ShoppingBag className="text-(--maincolor)/40 size-5 relative z-10" />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between py-1 min-w-0 overflow-hidden">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="flex flex-col gap-0 min-w-0 flex-1 overflow-hidden">
                                                        <h4 className="text-sm sm:text-base font-semibold text-(--maincolor) mb-1 truncate leading-snug">{item.name}</h4>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="size-8 flex items-center justify-center text-gray-400 hover:text-(--btncolor) transition-colors hover:bg-red-50 rounded-lg shrink-0 cursor-pointer"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="flex justify-between items-center mt-2 gap-2">
                                                    <p className="text-(--maincolor) font-bold text-base sm:text-lg shrink-0">€{(item.price * item.quantity).toFixed(2)}</p>
                                                    <div className="flex items-center bg-slate-50 rounded-lg border border-slate-100 px-2 py-1">
                                                        <span className="text-xs font-bold text-(--maincolor)">Qty: {item.quantity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="px-4 sm:px-6 py-4 bg-white border-t border-gray-200 space-y-4 shrink-0">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[13px] font-semibold font-mainfont">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="text-(--maincolor)">€{totalAmount().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[13px] font-semibold font-mainfont">
                                        <span className="text-gray-600">Shipping</span>
                                        <span className="text-emerald-600 text-[10px] font-bold uppercase rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-100">Free</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-3 border-t border-gray-100 font-mainfont">
                                        <span className="text-[13px] font-bold text-(--maincolor) uppercase tracking-wider">Total Amount</span>
                                        <div className="flex flex-col items-end gap-0">
                                            <h5 className="text-2xl font-bold text-(--maincolor)">€{totalAmount().toFixed(2)}</h5>
                                            <p className="!text-[10px] text-gray-500 uppercase mt-0.5 font-bold tracking-widest leading-none">Total EUR</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        closeCart();
                                        router.push('/cart');
                                    }}
                                    data-hover="Proceed to Checkout"
                                    className="btn btn-primary
                                        !inline-flex items-center justify-center gap-3
                                        [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0
                                        w-full h-14
                                        text-lg
                                        px-6 lg:px-8
                                        before:bg-(--btncolor)
                                        before:border-(--btncolor)"
                                >
                                    Proceed to Checkout
                                    <ArrowRight size={20} strokeWidth={2.5} />
                                </button>

                                <div className="flex items-center justify-center gap-2 text-[13px] text-gray-500">
                                    <ShieldCheck size={14} className="text-emerald-500" />
                                    Secure & Encrypted Checkout
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
