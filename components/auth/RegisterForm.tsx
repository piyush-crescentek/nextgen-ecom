"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface RegisterFormProps {
    email: string;
    onSuccess: () => void;
}

export default function RegisterForm({ email, onSuccess }: RegisterFormProps) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuthStore();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            toast.error("Please fill in all password fields");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        setIsLoading(true);
        try {
            await register({ email, password });
            toast.success("Account created successfully!");
            onSuccess();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-4 bg-(--blockground) border border-(--maincolor)/10 rounded-lg">
                <p className="text-sm text-(--maincolor) font-medium">Create your account</p>
                <p className="text-xs text-(--maincolor)/80 mt-0.5">We could not find an account for this email. Set a password below to register and continue with your consultation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-(--maincolor) text-sm font-semibold block mb-2">
                        Password <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter a password (minimum 8 characters)"
                        className="appearance-none rounded-md relative block w-full h-12 px-4 py-3 border border-(--maincolor) placeholder-gray-500 text-(--maincolor) text-sm focus:outline-none focus:ring-(--maincolor) focus:border-(--maincolor)"
                    />
                </div>
                <div>
                    <label className="text-(--maincolor) text-sm font-semibold block mb-2">
                        Confirm password <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="appearance-none rounded-md relative block w-full h-12 px-4 py-3 border border-(--maincolor) placeholder-gray-500 text-(--maincolor) text-sm focus:outline-none focus:ring-(--maincolor) focus:border-(--maincolor)"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button
                    onClick={handleRegister}
                    disabled={isLoading}
                    className="h-12 px-10 bg-(--maincolor) text-white rounded-md text-base font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
                >
                    {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Register & Continue"}
                </button>
            </div>
        </div>
    );
}
