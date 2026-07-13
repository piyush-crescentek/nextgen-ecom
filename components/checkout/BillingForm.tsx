"use client";

import React from "react";
import { CheckoutFormData } from "@/types/checkout";
import { formatIrishPostcode } from "@/lib/validation";
import GhcPhoneInput from "@/components/forms/GhcPhoneInput";

interface BillingFormProps {
    formData: CheckoutFormData;
    errors: Record<string, string>;
    isAuthenticated: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onPhoneChange: (value: string) => void;
    onPostcodeBlur: (formatted: string) => void;
}

const inputClasses = "ghc-input";
const labelClasses = "ghc-label";

export default function BillingForm({
    formData,
    errors,
    isAuthenticated,
    onChange,
    onPhoneChange,
    onPostcodeBlur,
}: BillingFormProps) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-(--maincolor) mb-8 pb-4 border-b font-mainfont">Billing details</h2>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className={labelClasses}>First name <span className="text-red-500">*</span></label>
                        <input name="first_name" value={formData.first_name} onChange={onChange} placeholder="First name" className={`${inputClasses} ${errors.first_name ? 'border-red-400' : ''}`} />
                        {errors.first_name && <p className="text-red-500 text-[10px] mt-1">{errors.first_name}</p>}
                    </div>
                    <div>
                        <label className={labelClasses}>Last name <span className="text-red-500">*</span></label>
                        <input name="last_name" value={formData.last_name} onChange={onChange} placeholder="Last name" className={`${inputClasses} ${errors.last_name ? 'border-red-400' : ''}`} />
                        {errors.last_name && <p className="text-red-500 text-[10px] mt-1">{errors.last_name}</p>}
                    </div>
                </div>



                <div>
                    <label className={labelClasses}>Address Line 1 <span className="text-red-500">*</span></label>
                    <input name="street_address" value={formData.street_address} onChange={onChange} placeholder="House number and street name" className={`${inputClasses} ${errors.street_address ? 'border-red-400' : ''}`} />
                    {errors.street_address && <p className="text-red-500 text-[10px] mt-1">{errors.street_address}</p>}
                </div>

                <div>
                    <label className={labelClasses}>Address Line 2 (Optional)</label>
                    <input name="street_address_2" value={formData.street_address_2} onChange={onChange} placeholder="Apartment, suite, unit, etc." className={inputClasses} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className={labelClasses}>Town / City <span className="text-red-500">*</span></label>
                        <input name="city" value={formData.city} onChange={onChange} placeholder="e.g. Dublin" className={`${inputClasses} ${errors.city ? 'border-red-400' : ''}`} />
                        {errors.city && <p className="text-red-500 text-[10px] mt-1">{errors.city}</p>}
                    </div>
                    <div>
                        <label className={labelClasses}>Postcode <span className="text-red-500">*</span></label>
                        <input
                            name="postcode"
                            value={formData.postcode}
                            onChange={(e) => {
                                onChange(e);
                            }}
                            onBlur={(e) => {
                                const formatted = formatIrishPostcode(e.target.value);
                                onPostcodeBlur(formatted);
                            }}
                            placeholder="e.g. D02 AF30"
                            className={`${inputClasses} ${errors.postcode ? 'border-red-400' : ''}`}
                        />
                        {errors.postcode && <p className="text-red-500 text-[10px] mt-1">{errors.postcode}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className={labelClasses}>Phone <span className="text-red-500">*</span></label>
                        <div className={`phone-input-container ${errors.phone ? 'phone-input-error' : ''}`}>
                            <GhcPhoneInput
                                placeholder="e.g. 0857654321"
                                value={formData.phone}
                                onChange={(val) => onPhoneChange(val || "")}
                            />
                        </div>
                        {errors.phone && <p className="text-red-500 text-[10px] mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                        <label className={labelClasses}>Email address <span className="text-red-500">*</span></label>
                        <input name="email" value={formData.email} onChange={onChange} disabled={isAuthenticated} placeholder="e.g. email@example.com" className={`${inputClasses} ${errors.email ? 'border-red-400' : ''}`} />
                        {errors.email && <p className="text-red-500 text-[10px] mt-1">{errors.email}</p>}
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mt-12 mb-6 pb-4 border-b font-mainfont">Additional information</h2>
            <div>
                <label className={labelClasses}>Order notes (optional)</label>
                <textarea
                    name="order_notes"
                    value={formData.order_notes}
                    onChange={onChange}
                    placeholder="Notes about your order, e.g. special notes for delivery."
                    className="w-full min-h-[120px] p-4 border border-gray-200 rounded-md focus:border-(--maincolor) focus:outline-none transition-all text-sm resize-none"
                />
            </div>
        </div>
    );
}
