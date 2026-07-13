import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, KeyRound, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import Cookies from "js-cookie";

interface ForgotPasswordModalProps {
    email: string;
    onClose: () => void;
    onSuccess: () => void;
    /** When true, skip sending the forgot-password OTP (already sent by the login API) */
    skipOtpRequest?: boolean;
    /** Optional message from the server to display at the top of the modal */
    bannerMessage?: string;
}

type Step = "otp" | "reset" | "success";

export default function ForgotPasswordModal({ email, onClose, onSuccess, skipOtpRequest = false, bannerMessage }: ForgotPasswordModalProps) {
    const [step, setStep] = useState<Step>("otp");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0 && !canResend) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(timer);
    }, [countdown, canResend]);

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        if (value.length > 1) {
            value = value[value.length - 1];
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next field
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();
        const digits = pastedData.split('').filter(char => /^\d$/.test(char)).slice(0, 6);

        if (digits.length > 0) {
            const newOtp = [...otp];
            digits.forEach((digit, i) => {
                if (i < 6) newOtp[i] = digit;
            });
            setOtp(newOtp);

            // Focus the last filled input or the next one
            const nextIdx = Math.min(digits.length, 5);
            document.getElementById(`otp-${nextIdx}`)?.focus();
        }
    };

    const handleResendOtp = async () => {
        if (!canResend) return;
        setIsLoading(true);
        try {
            await api.post(API_ENDPOINTS.CHECKOUT_AUTH.FORGOT_PASSWORD, { email });
            toast.success("New verification code sent!");
            setCountdown(60);
            setCanResend(false);
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            toast.error(axiosError.response?.data?.message || "Failed to resend code.");
        } finally {
            setIsLoading(false);
        }
    };

    // If skipOtpRequest is true, allow resend from the start (OTP already sent by login API)
    useEffect(() => {
        if (skipOtpRequest) {
            // OTP was already dispatched by the server; countdown still runs so user can resend if needed
        }
    }, [skipOtpRequest]);

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const verifyOtp = async () => {
        const fullOtp = otp.join("");
        if (fullOtp.length < 6) {
            toast.error("Please enter the full 6-digit OTP");
            return;
        }

        setIsLoading(true);
        try {
            await api.post(API_ENDPOINTS.CHECKOUT_AUTH.VERIFY_OTP, {
                email,
                otp: fullOtp
            });
            toast.success("OTP Verified successfully!");
            setStep("reset");
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            toast.error(axiosError.response?.data?.message || "Invalid OTP. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetPassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post(API_ENDPOINTS.CHECKOUT_AUTH.RESET_PASSWORD, {
                email,
                otp: otp.join(""),
                password: newPassword,
                password_confirmation: confirmPassword
            });

            const data = response.data;

            if (data.token) {
                Cookies.set('auth_token', data.token, { expires: 7 });
                useAuthStore.setState({
                    user: data.customer || data.user,
                    token: data.token,
                    isAuthenticated: true
                });

                // Fetch full profile to ensure all details are available for auto-fill in the form
                const authStore = useAuthStore.getState();
                await authStore.fetchProfile();
            }

            setStep("success");
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            toast.error(axiosError.response?.data?.message || "Failed to reset password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // focus first OTP input on mount
        const timer = setTimeout(() => {
            document.getElementById('otp-0')?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="relative p-5 border-b border-gray-100 flex items-center justify-between bg-(--blockground)/50">
                    <h3 className="text-lg lg:text-xl font-bold text-(--maincolor) flex items-center gap-2">
                        {step === 'otp' && <ShieldCheck className="size-5 shrink-0" />}
                        {step === 'reset' && <KeyRound className="size-5 shrink-0" />}
                        {step === 'success' && <CheckCircle2 className="size-5 shrink-0 text-green-600" />}
                        <span className="truncate">{step === 'otp' ? 'Verify Identity' : step === 'reset' ? 'Reset Password' : 'Success'}</span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {step === 'otp' && (
                            <motion.div
                                key="otp-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center space-y-2">
                                    {bannerMessage && (
                                        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs md:text-sm font-medium">{bannerMessage}</p>
                                    )}
                                    <p className="text-gray-600 text-sm md:text-base">We&apos;ve sent a 6-digit verification code to</p>
                                    <p className="font-semibold text-(--maincolor) break-all text-sm md:text-base">{email}</p>
                                </div>

                                <div className="grid grid-cols-6 gap-2 sm:gap-3 max-w-sm mx-auto">
                                    {otp.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            id={`otp-${idx}`}
                                            type="text"
                                            value={digit}
                                            maxLength={1}
                                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            onPaste={handlePaste}
                                            className="w-full aspect-square text-center text-xl md:text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-(--btncolor) focus:outline-none transition-all selection:bg-(--greenItem) text-(--maincolor) bg-white shadow-sm"
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={verifyOtp}
                                    disabled={isLoading}
                                    className="w-full py-4 bg-(--maincolor) text-white rounded-xl font-bold hover:bg-(--maincolor) transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg"
                                >
                                    {isLoading && <Loader2 className="size-5 animate-spin" />}
                                    Verify Code
                                </button>

                                <div className="text-center">
                                    <button
                                        onClick={handleResendOtp}
                                        disabled={!canResend || isLoading}
                                        className={`text-sm font-semibold transition-all ${canResend ? "text-(--maincolor)/80 hover:underline cursor-pointer" : "text-gray-400 cursor-not-allowed"
                                            }`}
                                    >
                                        {canResend ? "Resend Code" : `Resend in ${countdown}s`}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'reset' && (
                            <motion.div
                                key="reset-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-(--maincolor)">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Min. 8 characters"
                                                className="w-full h-12 px-4 pr-12 border border-gray-200 rounded-xl focus:border-(--btncolor) focus:outline-none transition-all text-(--maincolor) bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-(--btncolor) focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-(--maincolor)">Confirm New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Re-type new password"
                                                className="w-full h-12 px-4 pr-12 border border-gray-200 rounded-xl focus:border-(--btncolor) focus:outline-none transition-all text-(--maincolor) bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-(--btncolor) focus:outline-none"
                                            >
                                                {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={resetPassword}
                                    disabled={isLoading}
                                    className="w-full py-4 bg-(--maincolor) text-white rounded-xl font-bold hover:bg-(--maincolor) transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg"
                                >
                                    {isLoading && <Loader2 className="size-5 animate-spin" />}
                                    Update Password & Login
                                </button>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div
                                key="success-step"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-4 py-8"
                            >
                                <div className="size-16 md:size-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                                    <CheckCircle2 className="size-10" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-gray-900">All Set!</h4>
                                    <p className="text-gray-600 text-sm md:text-base">Your password has been reset and you&apos;ve been logged in. Redirecting you back...</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

