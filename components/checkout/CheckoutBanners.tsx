"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";

interface CheckoutBannersProps {
    isAuthenticated: boolean;
    onLoginClick: () => void;
}

export default function CheckoutBanners({ isAuthenticated, onLoginClick }: CheckoutBannersProps) {
    return (
        <AnimatePresence>
            {!isAuthenticated && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#EBF5FF] border border-blue-100 p-4 rounded-md flex items-center gap-3"
                >
                    <ShoppingCart className="size-5 text-blue-600" />
                    <p className="text-sm text-blue-800">
                        Returning customer?{" "}
                        <button onClick={onLoginClick} className="font-bold hover:underline">
                            Click here to login
                        </button>
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
