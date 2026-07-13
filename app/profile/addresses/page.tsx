"use client";

import React from "react";
import { MapPin, Plus, Home, Briefcase, Trash2, Edit3 } from "lucide-react";

export default function AddressesPage() {
    const addresses = [
        {
            type: "Home",
            icon: Home,
            name: "John Doe",
            address: "123 O'Connell Street, Dublin 1",
            city: "Dublin",
            postcode: "D01 A1B2",
            country: "Ireland",
            isDefault: true,
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            type: "Office",
            icon: Briefcase,
            name: "Get Health Care Ltd.",
            address: "45 Business Park, Sandyford",
            city: "Dublin",
            postcode: "D18 X3Y4",
            country: "Ireland",
            isDefault: false,
            color: "text-purple-600",
            bgColor: "bg-purple-50"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 profile-font">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-gray-400 font-bold text-xs uppercase tracking-[0.2em]">
                        Shipping & Billing
                    </div>
                    <h1 className="text-3xl font-black text-gray-900">Saved Addresses</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your delivery locations for kits and prescriptions.</p>
                </div>

                <button className="flex items-center gap-2 px-6 py-3 bg-[var(--maincolor)] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-gray-200">
                    <Plus className="h-4 w-4" />
                    Add New Address
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map((addr, idx) => (
                    <div key={idx} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500 relative group">
                        <div className="flex items-start justify-between mb-6">
                            <div className={`h-12 w-12 rounded-2xl ${addr.bgColor} ${addr.color} flex items-center justify-center`}>
                                <addr.icon size={24} />
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-400 hover:text-[var(--maincolor)] transition-colors">
                                    <Edit3 size={18} />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-gray-900">{addr.type}</h3>
                                {addr.isDefault && (
                                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Default</span>
                                )}
                            </div>
                            <p className="text-sm font-bold text-gray-900 mt-2">{addr.name}</p>
                            <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">
                                {addr.address},<br />
                                {addr.city}, {addr.postcode},<br />
                                {addr.country}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 flex items-start gap-4">
                <div className="bg-gray-200 p-2 rounded-lg mt-0.5">
                    <MapPin size={16} className="text-gray-500" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-gray-900">Delivery Information</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Your default shipping address is used for all medical kit deliveries. You can specify a different billing address during checkout if required.
                    </p>
                </div>
            </div>
        </div>
    );
}
