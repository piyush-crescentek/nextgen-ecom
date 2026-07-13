"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import type { AxiosError } from "axios";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    ChevronRight,
    Eye,
    EyeOff,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import Cookies from "js-cookie";

import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import CustomDatePicker from "@/components/forms/CustomDatePicker";
import { formatIrishPostcode, getIrishPostcodeError } from "@/lib/validation";

import { getDiscountPercentage } from "@/lib/visibility";

export default function PhysicalCheckoutFormPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-(--btncolor)" size={40} /></div>}>
            <PhysicalCheckoutContent />
        </Suspense>
    );
}

function PhysicalCheckoutContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('sessionId');
    const slug = params?.subcategorySlug as string;

    const { isAuthenticated, user, fetchProfile } = useAuthStore();
    const { items } = useCartStore();

    const [formState, setFormState] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        dob: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        postcode: "",
        deliveryDetails: "",
        useAsBilling: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [emailExists, setEmailExists] = useState<boolean | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [wpBannerMessage, setWpBannerMessage] = useState<string | undefined>(undefined);
    const [isStep1Complete, setIsStep1Complete] = useState(false);


    const emailCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (!sessionId) {
                toast.error("Invalid session. Please proceed from the cart.");
                router.push('/cart');
                return;
            }
            if (items.length === 0) {
                toast.error("Your cart is empty.");
                router.push('/cart');
                return;
            }
            const hasAccess = sessionStorage.getItem(`physical_form_access_${sessionId}`);
            if (!hasAccess) {
                toast.error("Access denied. Please proceed from the cart.");
                router.push('/cart');
                return;
            }
        }
    }, [sessionId, items.length, router]);

    useEffect(() => {
        if (isAuthenticated && user) {
            const addr = typeof user.address === "object" ? user.address : null;
            setFormState(prev => ({
                ...prev,
                email: prev.email || user.email || "",
                fullName: prev.fullName || user.name || (user.first_name ? `${user.first_name} ${user.last_name ?? ""}`.trim() : "") || "",
                dob: prev.dob || user.date_of_birth || "",
                addressLine1: prev.addressLine1 || addr?.address || (typeof user.address === "string" ? user.address : "") || "",
                city: prev.city || addr?.city || user.city || "",
                postcode: prev.postcode || addr?.postcode || user.postcode || "",
            }));
            setEmailExists(true);
            setIsStep1Complete(true);
        }
    }, [isAuthenticated, user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : false;

        const updatedValue = isCheckbox ? checked : value;

        setFormState(prev => ({
            ...prev,
            [name]: updatedValue
        }));

        if (name === 'email') {
            if (emailCheckTimerRef.current) clearTimeout(emailCheckTimerRef.current);
            if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                emailCheckTimerRef.current = setTimeout(() => checkEmail(value), 800);
            } else {
                setEmailExists(null);
            }
        }

        // Real-time validation for postcode
        if (name === 'postcode') {
            const error = getIrishPostcodeError(value);
            setErrors(prev => ({ ...prev, postcode: error || "" }));
        } else if (errors[name]) {
            // Clear other errors when user starts typing if they're not empty
            if (updatedValue) {
                setErrors(prev => {
                    const next = { ...prev };
                    delete next[name];
                    return next;
                });
            }
        }
    };

    const checkEmail = async (email: string) => {
        setIsCheckingEmail(true);
        try {
            const response = await api.post(API_ENDPOINTS.CHECKOUT_AUTH.CHECK_EMAIL, { email });
            const exists = response.data.data?.exists || response.data.exists;
            setEmailExists(exists);
            if (exists === true) {
                toast.success("Welcome back! Please sign in to continue.");
            } else {
                toast.info("Welcome! Please create a password to secure your account and proceed.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formState.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) newErrors.email = "Valid email is required";

        if (!isAuthenticated) {
            if (!formState.password || formState.password.length < 8) newErrors.password = "Password must be at least 8 characters";
            if (emailExists === false) {
                if (formState.password !== formState.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
            }
        }

        if (!formState.fullName) newErrors.fullName = "Full name is required";
        if (!formState.dob) newErrors.dob = "Date of birth is required";
        if (!formState.addressLine1) newErrors.addressLine1 = "Address is required";
        if (!formState.city) newErrors.city = "City is required";

        const pcError = getIrishPostcodeError(formState.postcode);
        if (pcError) newErrors.postcode = pcError;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAuth = async () => {
        setAuthLoading(true);
        try {
            const type = emailExists ? 'login' : 'register';
            const endpoint = type === 'login' ? API_ENDPOINTS.CHECKOUT_AUTH.LOGIN : API_ENDPOINTS.CHECKOUT_AUTH.REGISTER;
            const payload = type === 'login'
                ? { email: formState.email, password: formState.password }
                : {
                    email: formState.email,
                    password: formState.password,
                    password_confirmation: formState.confirmPassword,
                    name: formState.fullName,
                    date_of_birth: formState.dob
                };

            const response = await api.post(endpoint, payload);
            const data = response.data;

            // Handle WP expired-password case on login
            if (emailExists && data.wp_password_needs_to_change) {
                // Server already sent OTP — open the modal directly
                setWpBannerMessage(data.message);
                setShowForgotModal(true);
                toast.info(data.message || "Your password has expired. Please reset it.");
                return false;
            }

            if (data.token) {
                Cookies.set('auth_token', data.token, { expires: 7 });
                useAuthStore.setState({
                    user: data.customer || data.user,
                    token: data.token,
                    isAuthenticated: true
                });

                // Pre-fill fields if available from profile
                const user = data.customer || data.user;
                if (user) {
                    setFormState(prev => ({
                        ...prev,
                        fullName: prev.fullName || user.name || '',
                        dob: prev.dob || user.date_of_birth || '',
                        addressLine1: prev.addressLine1 || user.address_1 || '',
                        addressLine2: prev.addressLine2 || user.address_2 || '',
                        city: prev.city || user.city || '',
                        postcode: prev.postcode || user.postcode || '',
                    }));
                }

                await fetchProfile();
                toast.success(type === 'login' ? "Logged in!" : "Account created!");
                setIsStep1Complete(true);
                return true;
            }
            return false;
        } catch (error: unknown) {
            const axiosError = error as AxiosError<{ message?: string }>;
            const errorMessage = axiosError.response?.data?.message || axiosError.message || "Authentication failed";
            toast.error(errorMessage);
            return false;
        } finally {
            setAuthLoading(false);
        }
    };

    const handleForgotPasswordClick = async () => {
        setIsCheckingEmail(true); // Re-use isCheckingEmail for loading state or add a new one
        try {
            await api.post(API_ENDPOINTS.CHECKOUT_AUTH.FORGOT_PASSWORD, { email: formState.email });
            toast.success("Verification code sent to your email!");
            setShowForgotModal(true);
        } catch (error: unknown) {
            const axiosError = error as AxiosError<{ message?: string }>;
            const errorMessage = axiosError.response?.data?.message || axiosError.message || "Failed to send reset code";
            toast.error(errorMessage);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const { totalAmount } = useCartStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill in all required fields and correct any errors.");
            return;
        }

        if (!isAuthenticated) {
            const success = await handleAuth();
            if (!success) return;
        }

        setIsSubmitting(true);
        try {
            // Map form data to the format expected by useCheckoutStore
            const consultationFields = [
                {
                    key: "delivery_info",
                    title: "Delivery & Personal Information",
                    fields: [
                        { key: 'Full Name', title: 'Full Name', value: formState.fullName },
                        { key: 'DOB', title: 'Date of Birth', value: formState.dob },
                        { key: 'Address', title: 'Address', value: `${formState.addressLine1}${formState.addressLine2 ? ', ' + formState.addressLine2 : ''}, ${formState.city}, ${formState.postcode}` },
                        { key: 'Delivery Notes', title: 'Delivery Notes', value: formState.deliveryDetails || 'N/A' },
                        { key: 'Products', title: 'Products', value: items.map(item => `${item.name} (x${item.quantity})`).join(', ') },
                        { key: 'Price', title: 'Price', value: `€${totalAmount().toFixed(2)}` },
                    ]
                }
            ];

            // Save to store
            useCheckoutStore.getState().setConsultationData(
                consultationFields,
                "Physical Product Delivery",
                "physical_order",
                sessionId || ""
            );

            // If use as billing is true, store it in sessionStorage
            if (formState.useAsBilling) {
                const billingInfo = {
                    first_name: formState.fullName.split(' ')[0] || '',
                    last_name: formState.fullName.split(' ').slice(1).join(' ') || '',
                    street_address: formState.addressLine1,
                    street_address_2: formState.addressLine2,
                    city: formState.city,
                    postcode: formState.postcode,
                };
                sessionStorage.setItem(`billing_info_${sessionId}`, JSON.stringify(billingInfo));
            } else {
                sessionStorage.removeItem(`billing_info_${sessionId}`);
            }

            // Grant checkout access and redirect
            if (typeof window !== 'undefined' && sessionId) {
                sessionStorage.setItem(`checkout_access_${sessionId}`, 'true');
            }

            router.push(`/testing-kits/${slug}/checkout?sessionId=${sessionId}`);

        } catch (err: unknown) {
            const axiosError = err as AxiosError<{ message?: string }>;
            const errorMessage = axiosError.response?.data?.message || axiosError.message || "Something went wrong. Please try again.";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white min-h-screen pt-6 sm:pt-[100px] pb-10 relative lg:before:absolute lg:before:top-0 lg:before:left-0 lg:before:w-1/2 lg:before:h-full lg:before:bg-[#E7E9ED] overflow-x-hidden font-mainfont">
            {showForgotModal && (
                <ForgotPasswordModal
                    email={formState.email}
                    skipOtpRequest={!!wpBannerMessage}
                    bannerMessage={wpBannerMessage}
                    onClose={() => {
                        setShowForgotModal(false);
                        setWpBannerMessage(undefined);
                    }}
                    onSuccess={() => {
                        setShowForgotModal(false);
                        setWpBannerMessage(undefined);
                        setIsStep1Complete(true);
                        toast.success("Password updated and logged in successfully!");
                    }}
                />
            )}

            <div className="w-full md:container mx-auto relative z-40 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-0 h-full">

                    {/* Left Side: Summary & Progress */}
                    <div className="w-full lg:w-1/2 lg:bg-[#E7E9ED]">
                        <div className="lg:pr-16 lg:py-8 h-full flex flex-col">
                            <Link href="/cart" className="inline-flex items-center gap-2 text-slate-500 hover:text-(--btncolor) font-bold text-[10px] sm:text-sm transition-colors mb-4 sm:mb-8 uppercase -ml-1 sm:ml-0">
                                <ArrowLeft size={16} />
                                Back to Cart
                            </Link>

                            <div className="mb-4 sm:mb-6">
                                <h1 className="text-xl lg:text-3xl font-bold text-(--maincolor) mb-1 sm:mb-2">Checkout</h1>
                                <p className="text-slate-500 text-[13px] leading-relaxed max-w-sm">
                                    Complete your order for the following items.
                                </p>
                            </div>

                            {/* Cart Items List */}
                            <div className="space-y-4 mb-8 max-w-sm">
                                {items.map((item) => {
                                    return (
                                        <div key={item.id} className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-slate-200/50 flex gap-4 items-center transition-all hover:bg-white/80">
                                            <div className="size-14 bg-white rounded-lg flex items-center justify-center p-1 relative shrink-0 shadow-sm border border-slate-100">
                                                <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[8px] font-bold text-(--btncolor) uppercase mb-0.5">{item.category}</p>
                                                <h3 className="font-bold text-(--maincolor) text-[13px] line-clamp-1 leading-tight">{item.name}</h3>
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="font-bold text-[13px] text-(--maincolor)">
                                                        €{(item.price * item.quantity).toFixed(2)}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {user?.business_group && items.some(item => getDiscountPercentage({ id: item.id, category_id: (item as any).category_id }, user.business_group) > 0) && (
                                    <div className="bg-(--btncolor)/5 border border-(--btncolor)/10 rounded-lg p-3">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-bold text-(--maincolor) uppercase tracking-wider">Business Benefit Available</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                            As a <span className="text-(--maincolor) font-bold">{user.business_group.name}</span> member, your exclusive discount will be applied automatically at the final payment step.
                                        </p>
                                    </div>
                                )}

                                {items.length > 0 && (
                                    <div className="pt-4 border-t border-slate-200/50 flex justify-between items-center px-1">
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Amount</span>
                                        <span className="text-xl font-bold text-(--maincolor)">€{totalAmount().toFixed(2)}</span>
                                    </div>
                                )}
                            </div>



                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="w-full lg:w-1/2 lg:pl-12 lg:py-6">
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Step Header & Progress Bar */}
                            <div className="mb-2 space-y-2">
                                <h6 className='text-(--maincolor) text-[11px] font-bold uppercase'>Step {isSubmitting ? 3 : (isStep1Complete ? 3 : (formState.email ? 1 : 0.5))} of 3</h6>
                                <div className="bg-black/5 rounded-full w-full h-1.5 overflow-hidden relative">
                                    <div
                                        className='bg-(--btncolor) absolute inset-0 transition-all duration-300'
                                        style={{ width: `${(isSubmitting ? 3 : (isStep1Complete ? 3 : (formState.email ? 1 : 0.5))) / 3 * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Account Section */}
                            <section className="py-2 space-y-2">
                                <div className="">
                                    <h2 className="text-lg font-bold text-(--maincolor)">Account Information</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative group">
                                        <label className="ghc-label">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                name="email"
                                                disabled={isAuthenticated || isSubmitting}
                                                value={formState.email}
                                                onChange={handleInputChange}
                                                className={`ghc-input ${isCheckingEmail ? 'bg-[#f0f7ff]/50' : ''} ${errors.email ? 'border-red-400' : ''}`}
                                                placeholder="e.g. james@example.com"
                                            />
                                            {isCheckingEmail && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="animate-spin text-(--maincolor)" size={20} />
                                                </div>
                                            )}
                                        </div>
                                        {errors.email && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.email}</p>}
                                    </div>

                                    <AnimatePresence>
                                        {!isAuthenticated && emailExists !== null && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden space-y-4"
                                            >
                                                {emailExists === false && !isStep1Complete && (
                                                    <div className="pb-2">
                                                        <p className="text-(--maincolor)/70 text-sm font-medium italic flex items-center gap-2">
                                                            <span className="size-1.5 rounded-full bg-(--btncolor) animate-pulse" />
                                                            Welcome! Create a password to securely access your results and track your order.
                                                        </p>
                                                    </div>
                                                )}

                                                {!isStep1Complete && (
                                                    <div className={emailExists === false ? "grid grid-cols-1 sm:grid-cols-2 gap-5" : "w-full"}>
                                                        <div className="relative group">
                                                            <label className="ghc-label">
                                                                {emailExists ? 'Password' : 'Create Password'} <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type={showPassword ? "text" : "password"}
                                                                    name="password"
                                                                    value={formState.password}
                                                                    onChange={handleInputChange}
                                                                    className={`ghc-input ${errors.password ? 'border-red-400' : ''} !pr-12`}
                                                                    placeholder="Min. 8 characters"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowPassword(!showPassword)}
                                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-(--maincolor) focus:outline-none"
                                                                >
                                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                                </button>
                                                            </div>
                                                            {errors.password && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.password}</p>}
                                                        </div>

                                                        {emailExists === false && (
                                                            <div className="relative group">
                                                                <label className="ghc-label">Confirm Password <span className="text-red-500">*</span></label>
                                                                <input
                                                                    type={showPassword ? "text" : "password"}
                                                                    name="confirmPassword"
                                                                    value={formState.confirmPassword}
                                                                    onChange={handleInputChange}
                                                                    className={`ghc-input ${errors.confirmPassword ? 'border-red-400' : ''}`}
                                                                    placeholder="Re-type password"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {emailExists === true && !isStep1Complete && (
                                                    <div className="flex flex-col gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={handleAuth}
                                                            disabled={authLoading || !formState.password}
                                                            className="w-full h-11 bg-(--btncolor) text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-(--btncolor)/90 transition-all disabled:opacity-50"
                                                        >
                                                            {authLoading ? <Loader2 className="animate-spin" size={18} /> : null}
                                                            Login & Continue
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleForgotPasswordClick}
                                                            className="text-[13px] font-bold text-(--btncolor) hover:underline self-start"
                                                        >
                                                            Forgot your password?
                                                        </button>
                                                    </div>
                                                )}
                                                {emailExists === false && !isStep1Complete && (
                                                    <div className="pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                // Just validate Step 1 fields
                                                                if (!formState.email || formState.password.length < 8 || formState.password !== formState.confirmPassword) {
                                                                    toast.error("Please complete the account information correctly.");
                                                                    return;
                                                                }
                                                                // We don't register yet, just allow proceeding
                                                                // Or we could register here? The user said "Login" specifically.
                                                                // For new users, we'll just validate and set a local "step1Complete" flag or use existing state.
                                                                toast.success("Account info verified! Please provide your details below.");
                                                                // We'll use a local state to signify they can proceed if they are new.
                                                                setIsStep1Complete(true);
                                                            }}
                                                            className="w-full h-11 bg-(--btncolor) text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-(--btncolor)/90 transition-all"
                                                        >
                                                            Continue to Details
                                                        </button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </section>

                            <div className={(!isAuthenticated && (emailExists === true || !isStep1Complete)) ? "opacity-50 pointer-events-none transition-all" : "transition-all"}>
                                <hr className="border-slate-100" />

                                {/* Personal Details */}
                                <section className="py-2 space-y-2">
                                    <div className="">
                                        <h2 className="text-lg font-bold text-(--maincolor)">Personal Details</h2>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="relative group">
                                            <label className="ghc-label">Full Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formState.fullName}
                                                onChange={handleInputChange}
                                                className={`ghc-input ${errors.fullName ? 'border-red-400' : ''}`}
                                                placeholder="e.g. James Wilson"
                                            />
                                            {errors.fullName && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.fullName}</p>}
                                        </div>

                                        <div className="relative group">
                                            <label className="ghc-label">Date of Birth <span className="text-red-500">*</span></label>
                                            <CustomDatePicker
                                                id="dob"
                                                value={formState.dob}
                                                onChange={(val) => setFormState(prev => ({ ...prev, dob: val }))}
                                                placeholder="dd/mm/yyyy"
                                                error={errors.dob}
                                            />
                                            {errors.dob && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.dob}</p>}
                                        </div>
                                    </div>
                                </section>

                                <hr className="border-slate-100" />

                                {/* Delivery Address */}
                                <section className="py-2 space-y-2">
                                    <div className="">
                                        <h2 className="text-lg font-bold text-(--maincolor)">Delivery Address</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <label className="ghc-label">Address Line 1 <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="addressLine1"
                                                value={formState.addressLine1}
                                                onChange={handleInputChange}
                                                className={`ghc-input ${errors.addressLine1 ? 'border-red-400' : ''}`}
                                                placeholder="House number and street name"
                                            />
                                            {errors.addressLine1 && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.addressLine1}</p>}
                                        </div>

                                        <div className="relative group">
                                            <label className="ghc-label">Address Line 2 (Optional)</label>
                                            <input
                                                type="text"
                                                name="addressLine2"
                                                value={formState.addressLine2}
                                                onChange={handleInputChange}
                                                className="ghc-input"
                                                placeholder="Apartment, suite, unit, etc."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="relative group">
                                                <label className="ghc-label">City <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formState.city}
                                                    onChange={handleInputChange}
                                                    className={`ghc-input ${errors.city ? 'border-red-400' : ''}`}
                                                    placeholder="Dublin"
                                                />
                                                {errors.city && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.city}</p>}
                                            </div>
                                            <div className="relative group">
                                                <label className="ghc-label">Postcode <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    name="postcode"
                                                    value={formState.postcode}
                                                    onChange={handleInputChange}
                                                    onBlur={(e) => {
                                                        const formatted = formatIrishPostcode(e.target.value);
                                                        setFormState(prev => ({ ...prev, postcode: formatted }));
                                                    }}
                                                    className={`ghc-input ${errors.postcode ? 'border-red-400' : ''}`}
                                                    placeholder="e.g. D02 AF30"
                                                />
                                                {errors.postcode && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.postcode}</p>}
                                            </div>
                                        </div>

                                        <div className="relative group">
                                            <label className="ghc-label">Delivery Notes (Optional)</label>
                                            <textarea
                                                name="deliveryDetails"
                                                value={formState.deliveryDetails}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className="ghc-input !h-auto resize-y"
                                                placeholder="Any special instructions for the courier..."
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 pt-2">
                                            <input
                                                type="checkbox"
                                                id="useAsBilling"
                                                name="useAsBilling"
                                                checked={formState.useAsBilling}
                                                onChange={handleInputChange}
                                                className="size-4 rounded border-slate-300 text-(--btncolor) focus:ring-(--btncolor)"
                                            />
                                            <label htmlFor="useAsBilling" className="text-sm font-medium text-slate-700 cursor-pointer">
                                                Use this delivery address as billing address
                                            </label>
                                        </div>
                                    </div>
                                </section>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || authLoading}
                                        className="w-full h-12 bg-(--btncolor) text-white font-bold rounded-md flex items-center justify-center gap-2 hover:bg-(--btncolor)/95 transition-all text-base disabled:opacity-70 cursor-pointer"
                                    >
                                        {isSubmitting || authLoading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={24} />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Continue to Payment
                                                <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
