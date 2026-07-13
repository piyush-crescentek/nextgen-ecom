"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, TestTube, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Kit } from "./KitCard";
import { useCartStore } from "@/store/useCartStore";
import { useRouter } from "next/navigation";

interface QuickViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    kit: Kit | null;
}

export default function QuickViewModal({ isOpen, onClose, kit }: QuickViewModalProps) {
    const { addItem } = useCartStore();
    const router = useRouter();

    if (!isOpen || !kit) return null;

    // Helper function to format API values
    const formatValue = (value: string | null | undefined): string => {
        if (!value) return "";
        return value
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const displayResults = formatValue(kit.turnaround_time || kit.results_delivery || kit.results);
    const displayTestType = formatValue(kit.test_type);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
                    onClick={onClose}
                />

                {/* Modal Box */}
                <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="relative bg-white w-full max-w-xl md:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl z-10"
                >
                    {/* Minimal Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-20 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col">
                        {/* Image Area */}
                        <div className="relative aspect-[16/10] w-full bg-slate-50 border-b border-slate-100">
                            <Image
                                src={kit.image}
                                alt={kit.title}
                                fill
                                className="object-contain p-8"
                            />
                            {kit.badge && (
                                <div className="absolute top-4 left-4 bg-(--btncolor) text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase">
                                    {kit.badge.text}
                                </div>
                            )}
                        </div>

                        {/* Minimal Details */}
                        <div className="p-6 md:p-8 space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold text-(--maincolor) mb-2">{kit.title}</h2>
                                <p className="text-slate-600 text-sm leading-relaxed">{kit.description}</p>
                            </div>

                            <div className="space-y-2 py-4 border-y border-slate-50">
                                {displayTestType && (
                                    <div className="flex items-center gap-2">
                                        <TestTube className="w-4 h-4 text-(--maincolor)" />
                                        <span className="text-sm text-slate-700">
                                            <span className="font-medium">Type:</span> {displayTestType}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-(--maincolor)" />
                                    <span className="text-sm text-slate-700">
                                        <span className="font-medium">Results:</span> {displayResults}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-50">
                                <span className="text-3xl font-bold text-(--maincolor)">{kit.price}</span>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Link
                                        href={kit.href || "#"}
                                        onClick={onClose}
                                        className="flex-1 sm:flex-none flex items-center justify-center h-12 px-6 bg-white border border-(--maincolor) text-(--maincolor) font-bold rounded-xl text-sm transition-all hover:bg-slate-50 active:scale-95 shadow-sm whitespace-nowrap"
                                    >
                                        Details
                                    </Link>
                                    <button
                                        onClick={() => {
                                            addItem({
                                                id: kit.id,
                                                name: kit.title,
                                                price: kit.raw_price || 0,
                                                image: kit.image,
                                                quantity: 1,
                                                slug: kit.slug || "",
                                                category: kit.category_name || "Testing Kit"
                                            });
                                            onClose();
                                            router.push('/cart');
                                        }}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-12 px-8 bg-(--btncolor) text-white font-bold rounded-xl text-sm transition-all hover:opacity-90 active:scale-95 shadow-md group whitespace-nowrap"
                                    >
                                        <ShoppingCart size={18} />
                                        Order Kit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
