"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import FormAlert from "@/components/common/FormAlert";

export default function Auth() {
  const router = useRouter();
  const { login, register, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/profile");
    }
  }, [isAuthenticated, router]);

  const [error, setError] = useState<string | null>(null);

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register State
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirm, setRegisterConfirm] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoginLoading(true);
    try {
      await login({ email: loginEmail, password: loginPassword });
      toast.success("Logged in successfully");
      router.push("/profile");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (registerPassword.length < 8) {
      const msg = "Password must be at least 8 characters long";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (registerPassword !== registerConfirm) {
      const msg = "Passwords do not match";
      setError(msg);
      toast.error(msg);
      return;
    }

    setRegisterLoading(true);
    try {
      await register({ email: registerEmail, password: registerPassword });
      toast.success("Account created successfully");
      router.push("/profile");
    } finally {
      setRegisterLoading(false);
    }
  };

  const inputClasses = "appearance-none rounded-md relative block w-full h-[50px] px-4 py-3 pr-12 border border-(--maincolor) placeholder-gray-500 text-(--maincolor) focus:outline-none focus:ring-(--maincolor) focus:border-(--maincolor) text-sm";
  const labelClasses = "block text-sm font-normal text-gray-500 mb-2";
  const buttonClasses = "btn btn-primary w-full p-3.5 text-base bg-(--btncolor) before:bg-(--btncolor) before:border-(--btncolor)";

  return (
    <div className="bg-[#F0F0F0] py-12 md:pb-28 md:pt-32 md:min-h-screen md:flex flex-col items-center justify-center">
      <div className="container mx-auto px-4">
        <FormAlert error={error} success={null} />
        <div className="flex justify-center md:mt-10 mb-8 md:mb-14">
          <h1 className="text-(--maincolor) text-3xl font-bold">
            My Account
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
          {/* Login Form */}
          <div className="w-full lg:w-1/2 bg-white p-8 rounded-lg shadow-sm h-fit">
            <h2 className="text-(--maincolor) text-2xl font-bold mb-6">Login</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className={labelClasses}>
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`${inputClasses} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--maincolor)] focus:outline-none"
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-(--maincolor) focus:ring-(--maincolor)" />
                  <span>Remember me</span>
                </label>
                <Link
                  href="/lost-password"
                  className="text-(--maincolor) text-sm hover:underline"
                >
                  Lost your password?
                </Link>
              </div>

              <button
                type="submit"
                data-hover="LOG IN"
                disabled={loginLoading}
                className={buttonClasses}
              >
                {loginLoading ? "LOGGING IN..." : "LOG IN"}
              </button>
            </form>
          </div>

          {/* Register Form — individual customers only */}
          <div className="w-full lg:w-1/2 bg-white p-8 rounded-lg shadow-sm h-fit">
            <h2 className="text-(--maincolor) text-2xl font-bold mb-6">Register</h2>
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className={labelClasses}>
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className={`${inputClasses} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--maincolor)] focus:outline-none"
                    aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                  >
                    {showRegisterPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClasses}>
                  Confirm password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  required
                  value={registerConfirm}
                  onChange={(e) => setRegisterConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className={inputClasses}
                />
              </div>

              <div className="text-sm text-gray-500 mt-4 leading-relaxed">
                Your personal data will be used to support your experience throughout this website, to manage access to your account, and for other purposes described in our <Link href="/privacy-policy" className="text-(--maincolor) font-semibold !underline">privacy policy</Link>.
              </div>

              <button
                type="submit"
                data-hover="REGISTER"
                disabled={registerLoading}
                className={buttonClasses}
              >
                {registerLoading ? "REGISTERING..." : "REGISTER"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
