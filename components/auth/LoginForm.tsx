"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface LoginFormProps {
    email: string;
    onSuccess: () => void;
    onForgotPassword: () => void;
}

export default function LoginForm({ email, onSuccess, onForgotPassword }: LoginFormProps) {
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuthStore();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            toast.error("Please enter your password");
            return;
        }

        setIsLoading(true);
        try {
            await login({ email, password });
            toast.success("Logged in successfully!");
            onSuccess();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
                <label className="text-(--maincolor) text-sm font-semibold block mb-2">
                    Password <span className="text-red-500">*</span>
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="appearance-none rounded-md relative block w-full h-12 px-4 py-3 border border-(--maincolor) placeholder-gray-500 text-(--maincolor) text-sm focus:outline-none focus:ring-(--maincolor) focus:border-(--maincolor)"
                />
            </div>

            <div className="flex items-center justify-between pt-4">
                <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-(--maincolor) text-[15px] font-normal transition-colors"
                >
                    Forgot Password?
                </button>
                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="h-12 px-10 bg-(--btncolor) text-white rounded-md text-base font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
                >
                    {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Login"}
                </button>
            </div>
        </div>
    );
}
