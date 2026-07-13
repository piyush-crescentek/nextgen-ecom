"use client";

import { motion } from "framer-motion";
import { X, Lock, Loader2 } from "lucide-react";
import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";

interface WalletOtpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (otp: string) => void;
    isSubmitting: boolean;
    email: string;
}

export default function WalletOtpModal({
    isOpen,
    onClose,
    onConfirm,
    isSubmitting,
    email
}: WalletOtpModalProps) {
    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!isOpen) {
            setTimeLeft(60);
            return;
        }
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, timeLeft]);

    useEffect(() => {
        if (isOpen) {
            setOtp(Array(6).fill(""));
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    }, [isOpen]);

    const handleSendOtp = async () => {
        setIsSendingOtp(true);
        try {
            await api.post(API_ENDPOINTS.SEND_WALLET_OTP, { email });
            toast.success("A new verification code has been sent to your email.");
            setOtp(Array(6).fill(""));
            setTimeLeft(60);
            inputRefs.current[0]?.focus();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Failed to resend verification code");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace") {
            if (otp[index] === "" && index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = "";
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            } else {
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            }
        }
    };

    const handleChange = (val: string, index: number) => {
        if (isNaN(Number(val))) return;

        const newOtp = [...otp];
        newOtp[index] = val.slice(-1);
        setOtp(newOtp);

        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pastedData) {
            const newOtp = [...otp];
            for (let i = 0; i < pastedData.length; i++) {
                newOtp[i] = pastedData[i];
            }
            setOtp(newOtp);
            const focusIndex = Math.min(pastedData.length, 5);
            inputRefs.current[focusIndex]?.focus();
        }
    };

    const handleSubmit = () => {
        const otpValue = otp.join("");
        if (otpValue.length !== 6) {
            toast.error("Please enter the 6-digit verification code");
            return;
        }
        onConfirm(otpValue);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl z-10"
            >
                <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Lock className="size-5 text-(--maincolor)" />
                            Verify Wallet Payment
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={isSubmitting}
                    >
                        <X className="size-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center">
                    <div className="text-center mb-6">
                        <p className="text-gray-600 text-sm">
                            We&apos;ve sent a 6-digit confirmation code to your email.<br />
                            Please enter it below to confirm your wallet payment.
                        </p>
                    </div>

                    <div className="flex justify-center gap-2 sm:gap-3 mb-8 w-full">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(e.target.value, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                onPaste={handlePaste}
                                disabled={isSubmitting}
                                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold text-gray-900 border-2 rounded-xl focus:border-(--maincolor) focus:ring-0 transition-all outline-none disabled:bg-gray-50 disabled:text-gray-400"
                            />
                        ))}
                    </div>

                    <div className="w-full space-y-3">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || otp.join("").length !== 6}
                            className="w-full py-4 bg-(--maincolor) text-white font-bold rounded-2xl shadow-xl shadow-(--maincolor)/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                "Verify & Pay"
                            )}
                        </button>
                        
                        <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isSendingOtp || isSubmitting || timeLeft > 0}
                            className={`w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                                timeLeft > 0 
                                    ? "text-gray-400 cursor-not-allowed" 
                                    : "text-gray-500 hover:text-(--maincolor)"
                            }`}
                        >
                            {isSendingOtp ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : null}
                            <span>
                                {timeLeft > 0 
                                    ? `Resend code in 0:${timeLeft.toString().padStart(2, '0')}` 
                                    : "Didn't receive the code? Resend"}
                            </span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
