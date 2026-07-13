"use client";

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import FormAlert from "@/components/common/FormAlert";

export default function LostPassWord() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { wpPasswordChangeRequired, wpEmail, wpMessage, registerWP, forgotPassword, setWpPasswordChangeRequired } = useAuthStore();

  const [isMounted, setIsMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const emailParam = searchParams.get("email");
    const tokenParam = searchParams.get("token");

    // If we have a token, we should be on the reset-password page
    if (tokenParam) {
      router.push(`/reset-password?${searchParams.toString()}`);
      return;
    }

    // If we have an email but the flow is not active, activate it
    if (emailParam && !wpPasswordChangeRequired) {
      setWpPasswordChangeRequired(true, emailParam);
    }
  }, [isMounted, searchParams, wpPasswordChangeRequired, setWpPasswordChangeRequired, router]);


  const handleSubmitForgot = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;

    try {
      const response = await forgotPassword(email);
      const successMsg = response.message || "Password reset link sent to your email.";
      toast.success(successMsg);
      // Optional: redirect to auth or stay here
      router.push("/my-account");
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      const errorMessage = errorData.response?.data?.message || "Failed to send reset link. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value.slice(-1);
    setOtpDigits(newOtpDigits);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtpDigits = [...otpDigits];
    pastedData.split("").forEach((char, index) => {
      newOtpDigits[index] = char;
    });
    setOtpDigits(newOtpDigits);

    // Focus last input or next empty input
    const focusIndex = Math.min(pastedData.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmitReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      const msg = "Passwords do not match";
      setError(msg);
      toast.error(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const otpString = otpDigits.join("");
    if (otpString.length !== 6) {
      const msg = "Please enter the full 6-digit verification code";
      setError(msg);
      toast.error(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      const response = await registerWP({
        email: wpEmail || "",
        password: password,
        confirm_password: confirmPassword,
        otp: otpString
      });
      // Success - store already updates user and token
      setSuccess(response.message || "Password reset successful");
      toast.success(response.message || "Password reset successful");
      setTimeout(() => router.push("/profile"), 2000);
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } };
      const errorMessage = errorData.response?.data?.message || "Failed to reset password. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const labelClasses = "block text-sm font-normal text-gray-500 mb-2";
  const inputClasses = "appearance-none rounded-md relative block w-full h-[50px] px-4 py-3 pr-12 border border-(--maincolor) placeholder-gray-500 text-(--maincolor) focus:outline-none focus:ring-(--maincolor) focus:border-(--maincolor) text-sm";
  const buttonClasses = "btn btn-primary w-full p-3.5 text-base bg-(--btncolor) before:bg-(--btncolor) before:border-(--btncolor)";

  if (!isMounted) {
    return null;
  }

  if (wpPasswordChangeRequired) {
    return (
      <div className="bg-[#F8F9FA] py-12 md:py-24 pt-[150px] md:pt-[130px] md:min-h-screen md:flex flex-col items-center justify-center">
        <div className="container px-4">
          <FormAlert error={error} success={success} info={wpMessage} />

          <div className="flex justify-center mb-10">
            <h1 className="text-(--maincolor) text-2xl md:text-3xl font-bold">Update Password</h1>
          </div>
          <div className="w-full max-w-xl mx-auto">
            <div className="bg-white rounded-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] p-6 sm:p-10">

              <form className="space-y-7" onSubmit={handleSubmitReset} action="javascript:void(0);">
                <div className="space-y-6">
                  {/* Email (Read-only) */}
                  <div>
                    <label className={labelClasses}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={wpEmail || ""}
                      readOnly
                      disabled
                      className="appearance-none rounded-md relative block w-full h-[50px] px-4 py-3 border border-gray-200 bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
                    />
                  </div>

                  {/* OTP field */}
                  <div>
                    <label className={labelClasses}>
                      Verification Code (OTP) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex justify-center gap-2 sm:gap-4 mb-2">
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { otpRefs.current[index] = el }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={handlePaste}
                          className="w-10 h-12 sm:w-14 sm:h-16 text-center text-lg sm:text-2xl font-bold border border-gray-300 rounded-md bg-white text-black focus:border-[var(--maincolor)] focus:ring-1 focus:ring-[var(--maincolor)] outline-none transition-all shadow-sm"
                          required
                        />
                      ))}
                    </div>
                    <p className="text-center text-[12px] text-gray-400 mt-3 font-light">
                      Please enter the 6-digit code sent to your email.
                    </p>
                  </div>


                  <div>
                    <label className={labelClasses}>
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={inputClasses}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--maincolor)] focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className={labelClasses}>
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className={inputClasses}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--maincolor)] focus:outline-none"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      data-hover="UPDATE PASSWORD"
                      disabled={loading}
                      className={buttonClasses}
                    >
                      {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
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

  // Default Forgot Password View
  return (
    <div className="bg-[#F0F0F0] py-12 md:pb-28 md:pt-[115px] md:min-h-screen md:flex flex-col items-center justify-center">
      <div className="container">
        <FormAlert error={error} success={success} />

        <div className="flex justify-center md:mt-10 mb-8 md:mb-14">
          <h1 className="text-[var(--maincolor)] text-3xl font-bold">Forgot Password</h1>
        </div>
        <div className="w-full lg:w-1/2 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 h-fit">

            <form onSubmit={handleSubmitForgot} action="javascript:void(0);">
              <div className="space-y-8">
                <div className="text-gray-600 text-base leading-relaxed font-light">
                  Lost your password? Please enter your username or email address. You will receive a link to create a new password via email.
                </div>
                {/* Username or email */}
                <div>
                  <label htmlFor="email-address" className={labelClasses}>
                    Username or email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={inputClasses}
                    placeholder=""
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    data-hover="RESET PASSWORD"
                    disabled={loading}
                    className={buttonClasses}
                  >
                    {loading ? 'SENDING...' : 'RESET PASSWORD'}
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
