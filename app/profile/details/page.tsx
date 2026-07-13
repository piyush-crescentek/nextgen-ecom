"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import { formatIrishPostcode, getIrishPostcodeError } from "@/lib/validation";
import GhcPhoneInput, { isValidPhoneNumber } from "@/components/forms/GhcPhoneInput";
import CustomDatePicker from "@/components/forms/CustomDatePicker";

function getSafePhoneValue(value?: string | null): string {
    if (!value) return "";
    const trimmedValue = value.trim();
    if (!trimmedValue) return "";
    try {
        return isValidPhoneNumber(trimmedValue) ? trimmedValue : "";
    } catch {
        return "";
    }
}

export default function DetailsPage() {
    const { user, updateProfile } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [postcodeError, setPostcodeError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [dobError, setDobError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

    const validateField = (field: string, value: string) => {
        if (!value.trim()) {
            setErrors(prev => ({ ...prev, [field]: "This field is required" }));
            return false;
        }
        setErrors(prev => ({ ...prev, [field]: null }));
        return true;
    };

    const validateDateOfBirth = (value: string) => {
        if (!value) return "Date of birth is required";

        const selectedDate = new Date(value);
        if (Number.isNaN(selectedDate.getTime())) {
            return "Please enter a valid date of birth";
        }

        const today = new Date();
        if (selectedDate > today) {
            return "Date of birth cannot be in the future";
        }

        let age = today.getFullYear() - selectedDate.getFullYear();
        const monthDiff = today.getMonth() - selectedDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate())) {
            age--;
        }

        if (age < 18) return "You must be at least 18 years old";
        if (age > 120) return "Please enter a valid date of birth";
        return null;
    };

    const validatePasswordFields = (password: string, verify: string) => {
        if (!showPassword) return null;
        if (!password) return "Password is required";
        if (password.length < 8) return "Password must be at least 8 characters";
        if (password !== verify) return "Passwords do not match";
        return null;
    };

    const validateAllFields = () => {
        let hasErrors = false;

        ['first_name', 'last_name', 'address', 'city'].forEach(field => {
            if (!validateField(field, formData[field as keyof typeof formData] as string)) {
                hasErrors = true;
            }
        });

        const dobValidationError = validateDateOfBirth(formData.date_of_birth);
        setDobError(dobValidationError);
        if (dobValidationError) hasErrors = true;

        if (!formData.postcode) {
            setPostcodeError("Postcode is required");
            hasErrors = true;
        } else if (formData.country === "Ireland") {
            const postcodeValidationError = getIrishPostcodeError(formData.postcode);
            setPostcodeError(postcodeValidationError);
            if (postcodeValidationError) hasErrors = true;
        } else {
            setPostcodeError(null);
        }

        if (formData.phone && !isValidPhoneNumber(formData.phone)) {
            setPhoneError("Please enter a valid phone number");
            hasErrors = true;
        } else {
            setPhoneError(null);
        }

        const passwordValidationError = validatePasswordFields(formData.password, formData.verify);
        setPasswordError(passwordValidationError);
        if (passwordValidationError) hasErrors = true;

        return !hasErrors;
    };

    const [formData, setFormData] = useState(() => {
        const addr = user?.address;
        const addrObj = (typeof addr === 'object' && addr !== null) ? addr : null;

        return {
            first_name: user?.first_name || user?.name?.split(' ')[0] || "",
            last_name: user?.last_name || user?.name?.split(' ').slice(1).join(' ') || "",
            email: user?.email || "",
            phone: getSafePhoneValue(user?.phone),
            gender: (user?.gender?.toLowerCase() === 'male' ? 'Male' : user?.gender?.toLowerCase() === 'female' ? 'Female' : user?.gender?.toLowerCase() === 'other' ? 'Other' : user?.gender) || "",

            date_of_birth: user?.date_of_birth || "",
            address: (addrObj ? addrObj.address : (typeof addr === 'string' ? addr : "")) || "",
            city: (addrObj ? addrObj.city : user?.city) || "",
            county: (addrObj ? (addrObj.county || addrObj.state) : user?.state) || user?.county || "",
            postcode: (addrObj ? addrObj.postcode : user?.postcode) || "",
            country: (addrObj ? addrObj.country : user?.country) || "Ireland",
            password: "",
            verify: ""
        };
    });

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setHasTriedSubmit(true);
        const isValid = validateAllFields();
        if (!isValid) {
            toast.error("Please fix the validation errors");
            return;
        }

        setLoading(true);
        try {
            // Format postcode before sending
            const shouldSendPasswordChange =
                showPassword && !!formData.password && !!formData.verify;

            const basePayload =
                formData.country === "Ireland" && formData.postcode
                    ? { ...formData, postcode: formatIrishPostcode(formData.postcode) }
                    : { ...formData };

            const dataToSend = shouldSendPasswordChange
                ? {
                    ...basePayload,
                    password_change: {
                        password: formData.password,
                        verify: formData.verify,
                    },
                }
                : basePayload;

            await updateProfile(dataToSend);
            toast.success("Profile updated successfully");
            if (showPassword) {
                setShowPassword(false);
                setFormData(prev => ({ ...prev, password: "", verify: "" }));
            }
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            toast.error(axiosError.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        const addr = user?.address;
        const addrObj = (typeof addr === 'object' && addr !== null) ? addr : null;

        setFormData({
            first_name: user?.first_name || user?.name?.split(' ')[0] || "",
            last_name: user?.last_name || user?.name?.split(' ').slice(1).join(' ') || "",
            email: user?.email || "",
            phone: getSafePhoneValue(user?.phone),
            gender: (user?.gender?.toLowerCase() === 'male' ? 'Male' : user?.gender?.toLowerCase() === 'female' ? 'Female' : user?.gender?.toLowerCase() === 'other' ? 'Other' : user?.gender) || "",
            date_of_birth: user?.date_of_birth || "",
            address: (addrObj ? addrObj.address : (typeof addr === 'string' ? addr : "")) || "",
            city: (addrObj ? addrObj.city : user?.city) || "",
            county: (addrObj ? (addrObj.county || addrObj.state) : user?.state) || user?.county || "",
            postcode: (addrObj ? addrObj.postcode : user?.postcode) || "",
            country: (addrObj ? addrObj.country : user?.country) || "Ireland",
            password: "",
            verify: ""
        });
        setShowPassword(false);
        setPhoneError(null);
        setPostcodeError(null);
        setDobError(null);
        setPasswordError(null);
        setErrors({});
        setHasTriedSubmit(false);
    };

    useEffect(() => {
        if (!hasTriedSubmit) return;
        validateAllFields();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, showPassword]);

    const labelClass = "text-xs font-bold text-[#4B5563] uppercase mb-2 block";
    const inputClass = "appearance-none rounded-md relative block w-full h-12 px-4 py-3 border border-(--maincolor)/30 placeholder-gray-500 text-(--maincolor) focus:outline-none focus:ring-(--maincolor) focus:border-(--maincolor) text-sm";

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                <div>
                    <h1 className="ghc-page-title">Account Details</h1>
                    <p className="ghc-text-body mt-1">Edit your profile details</p>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm text-left relative z-40">
                {/* Header Section like DataTable */}
                <div className="bg-[#F9FAFB] rounded-t-xl px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between flex-wrap gap-4">
                    <h2 className="text-xs font-bold text-[#4B5563] uppercase">Account Information</h2>

                </div>

                <div className="p-8">
                    <form onSubmit={handleUpdate} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                            {/* Personal Info Row */}
                            <div className="space-y-1">
                                <label className={labelClass}>First name</label>
                                <input
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, first_name: e.target.value });
                                        validateField('first_name', e.target.value);
                                    }}
                                    className={`${inputClass} ${errors.first_name ? 'border-red-400 focus:ring-red-400' : ''}`}
                                    placeholder="Enter your first name"
                                />
                                {errors.first_name && <p className="text-red-600 text-[10px] mt-1 font-normal leading-tight">{errors.first_name}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className={labelClass}>Last name</label>
                                <input
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, last_name: e.target.value });
                                        validateField('last_name', e.target.value);
                                    }}
                                    className={`${inputClass} ${errors.last_name ? 'border-red-400 focus:ring-red-400' : ''}`}
                                    placeholder="Enter your last name"
                                />
                                {errors.last_name && <p className="text-red-600 text-[10px] mt-1 font-normal leading-tight">{errors.last_name}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className={labelClass}>Phone</label>
                                <div className={`phone-input-container ${phoneError ? 'phone-input-error' : ''}`}>
                                    <GhcPhoneInput
                                        placeholder="Enter phone number"
                                        value={formData.phone}
                                        onChange={(val) => {
                                            setFormData({ ...formData, phone: val || "" });
                                            if (val && isValidPhoneNumber(val)) {
                                                setPhoneError(null);
                                            } else if (val) {
                                                setPhoneError("Invalid phone number");
                                            } else {
                                                setPhoneError(null);
                                            }
                                        }}
                                    />
                                </div>
                                {phoneError && (
                                    <p className="text-red-600 text-[10px] mt-1 font-normal leading-tight">
                                        {phoneError}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className={labelClass}>Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className={`${inputClass} bg-gray-100 text-gray-900 cursor-not-allowed`}
                                    placeholder="you@email.com"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className={labelClass}>Date of Birth</label>
                                <CustomDatePicker
                                    id="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={(val) => {
                                        setFormData({ ...formData, date_of_birth: val });
                                        setDobError(validateDateOfBirth(val));
                                    }}
                                    placeholder="Select Date"
                                    error={dobError || undefined}
                                    maxDate={new Date().toISOString().split('T')[0]}
                                />
                                {dobError && (
                                    <p className="text-red-600 text-[10px] mt-1 font-normal leading-tight">
                                        {dobError}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className={labelClass}>Gender</label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className={inputClass}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Address Section - Full Width Street */}
                            <div className="md:col-span-2 pt-4 space-y-1">
                                <label className={labelClass}>Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => {
                                        setFormData({ ...formData, address: e.target.value });
                                        validateField('address', e.target.value);
                                    }}
                                    className={`${inputClass} ${errors.address ? 'border-red-400 focus:ring-red-400' : ''}`}
                                    placeholder="Street Address"
                                />
                                {errors.address && <p className="text-red-600 text-[10px] mt-1 font-normal leading-tight">{errors.address}</p>}
                            </div>

                            {/* City Row */}
                            <div className="space-y-1">
                                <label className={labelClass}>City / Town</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => {
                                        setFormData({ ...formData, city: e.target.value });
                                        validateField('city', e.target.value);
                                    }}
                                    className={`${inputClass} ${errors.city ? 'border-red-400 focus:ring-red-400' : ''}`}
                                    placeholder="e.g. Dublin"
                                />
                                {errors.city && <p className="text-red-600 text-[10px] mt-1 font-normal leading-tight">{errors.city}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className={labelClass}>County / State</label>
                                <input
                                    type="text"
                                    value={formData.county}
                                    onChange={(e) => {
                                        setFormData({ ...formData, county: e.target.value });
                                    }}
                                    className={inputClass}
                                    placeholder="e.g. Dublin, Cork, Galway"
                                />
                            </div>

                            {/* Zip and Country Row */}
                            <div className="space-y-1">
                                <label className={labelClass}>Zip Code</label>
                                <input
                                    type="text"
                                    value={formData.postcode}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData({ ...formData, postcode: value });

                                        // Live validation
                                        if (!value) {
                                            setPostcodeError("Postcode is required");
                                        } else if (formData.country === "Ireland") {
                                            setPostcodeError(getIrishPostcodeError(value));
                                        } else {
                                            setPostcodeError(null);
                                        }
                                    }}
                                    onBlur={(e) => {
                                        const value = e.target.value;
                                        if (formData.country === "Ireland" && value) {
                                            setPostcodeError(getIrishPostcodeError(value));
                                        }
                                    }}
                                    className={`${inputClass} ${postcodeError ? 'border-red-400 focus:ring-red-400' : ''}`}
                                    placeholder={formData.country === "Ireland" ? "e.g. D02 AF30, T12 C3D4" : "Zip / Eircom Code"}
                                />
                                {postcodeError && (
                                    <p className="text-red-600 text-[10px] mt-1 font-normal leading-tight">
                                        {postcodeError}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className={labelClass}>Country</label>
                                <select
                                    value={formData.country}
                                    onChange={(e) => {
                                        setFormData({ ...formData, country: e.target.value });
                                        if (e.target.value === "Ireland" && formData.postcode) {
                                            setPostcodeError(getIrishPostcodeError(formData.postcode));
                                        } else {
                                            setPostcodeError(null);
                                        }
                                    }}
                                    className={inputClass}
                                >
                                    <option value="Ireland">Ireland</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                </select>
                            </div>

                            {/* Password Accordion Toggle */}
                            <div className="md:col-span-2 pt-6 mt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="flex items-center gap-2 group cursor-pointer"
                                >
                                    <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                                        <Lock className="w-4 h-4 text-gray-400 group-hover:text-[var(--maincolor)]" />
                                    </div>
                                    <span className="text-[11px] font-bold text-[#4B5563] uppercase font-mainfont group-hover:text-[var(--maincolor)] transition-colors">
                                        Change Password
                                    </span>
                                    {showPassword ? (
                                        <ChevronUp className="w-4 h-4 text-gray-400 transition-transform" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-400 transition-transform" />
                                    )}
                                </button>

                                {/* Accordion Content */}
                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 transition-all duration-300 overflow-hidden ${showPassword ? "max-h-[500px] mt-6 opacity-100" : "max-h-0 mt-0 opacity-0"
                                    }`}>
                                    <div className="space-y-1">
                                        <label className={labelClass}>New Password</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData({ ...formData, password: val });
                                                if (val && formData.verify && val !== formData.verify) {
                                                    setPasswordError("Passwords do not match");
                                                } else if (val && val.length < 8) {
                                                    setPasswordError("Minimum 8 characters");
                                                } else {
                                                    setPasswordError(null);
                                                }
                                            }}
                                            className={`${inputClass} ${passwordError ? 'border-red-400' : ''}`}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelClass}>Verify Password</label>
                                        <input
                                            type="password"
                                            value={formData.verify}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData({ ...formData, verify: val });
                                                if (val && formData.password && val !== formData.password) {
                                                    setPasswordError("Passwords do not match");
                                                } else {
                                                    setPasswordError(null);
                                                }
                                            }}
                                            className={`${inputClass} ${passwordError ? 'border-red-400' : ''}`}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    {passwordError && (
                                        <div className="md:col-span-2">
                                            <p className="text-red-600 text-[10px] mt-1 font-normal">
                                                {passwordError}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex sm:flex-row flex-col items-center gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="text-white text-[11px] font-bold uppercase bg-(--maincolor) rounded-md px-6 py-3 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 w-full sm:w-auto cursor-pointer"
                            >
                                {loading ? "Updating..." : "Save Changes"}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="text-[#4B5563] text-[11px] font-bold uppercase bg-white border border-[#E5E7EB] rounded-md px-6 py-3 transition-all hover:bg-(--blockground) hover:text-(--maincolor) active:scale-95 w-full sm:w-auto cursor-pointer"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
