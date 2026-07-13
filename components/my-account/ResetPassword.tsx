"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import FormAlert from "@/components/common/FormAlert";
import { formatIrishPostcode, getIrishPostcodeError } from "@/lib/validation";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, resetPassword } = useAuthStore();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Params
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const isFresh = searchParams.get("is_fresh") === "true";
  const isRegistration = searchParams.get("is_registration") === "true";

  // Registration specific params
  const customerType = searchParams.get("customer_type");
  const company = searchParams.get("company");
  const employerType = searchParams.get("employer_type");
  const phone = searchParams.get("phone");
  const address = searchParams.get("address");
  const city = searchParams.get("city");
  const postcode = searchParams.get("postcode");
  const state = searchParams.get("state");

  useEffect(() => {
    if (!email) {
      router.push("/my-account");
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      const msg = "Passwords do not match";
      setError(msg);
      toast.error(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);

    try {
      if (isRegistration) {
        // Registration Flow
        if (!email || !customerType) {
          throw new Error("Missing registration information");
        }

        const payload: any = {
          email,
          password,
          confirm_password: confirmPassword,
          customer_type: parseInt(customerType),
        };

        if (customerType === "2") {
          if (!employerType) {
            throw new Error("Missing business information");
          }
          if (company) payload.company = company;
          payload.employer_type = parseInt(employerType);
          if (phone) payload.phone = phone;
          if (address) payload.address = address;
          if (city) payload.city = city;
          if (postcode) {
            // Validate Irish postcode for business customers
            const postcodeValidationError = getIrishPostcodeError(postcode);
            if (postcodeValidationError) {
              throw new Error(postcodeValidationError);
            }
            payload.postcode = formatIrishPostcode(postcode);
          }
          if (state) payload.state = state;
        }

        const response = await register(payload);

        if (response.token) {
          const msg = "Registration successful!";
          setSuccess(msg);
          toast.success(msg);
          setTimeout(() => router.push("/profile"), 2000);
        } else {
          const msg = response.message || "Registration successful. Your account is pending approval.";
          setSuccess(msg);
          toast.success(msg);
          setTimeout(() => router.push("/my-account"), 2000);
        }
      } else {
        // Password Reset Flow
        if (!token) {
          throw new Error("Invalid or missing reset token");
        }

        const response = await resetPassword({
          email: email!,
          token,
          password,
          password_confirmation: confirmPassword
        });

        const msg = "Password reset successful! Logging you in...";
        setSuccess(msg);
        toast.success(msg);

        // Redirect to profile since user is now authenticated
        setTimeout(() => router.push("/profile"), 2000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "An error occurred";
      setError(msg);
      toast.error(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const title = (isRegistration || isFresh) ? "Create Password" : "Reset Password";
  const buttonText = isRegistration ? "Create Account" : (isFresh ? "Create Password" : "Reset Password");

  const inputClasses = "appearance-none rounded-md relative block w-full h-[50px] px-4 py-3 pr-12 border border-(--maincolor) placeholder-gray-500 text-(--maincolor) focus:outline-none focus:ring-(--maincolor) focus:border-(--maincolor) text-sm";
  const labelClasses = "block text-sm font-normal text-gray-500 mb-2";
  const buttonClasses = "btn btn-primary w-full p-3.5 text-base bg-(--btncolor) before:bg-(--btncolor) before:border-(--btncolor)";

  return (
    <div className="bg-[#F0F0F0] py-12 md:pb-28 md:pt-[115px] md:min-h-screen md:flex flex-col items-center justify-center">
      <div className="container mx-auto px-4">
        <FormAlert error={error} success={success} />
        <div className="flex justify-center md:mt-10 mb-8 md:mb-14">
          <h1 className="text-[var(--maincolor)] text-3xl font-bold">
            {title}
          </h1>
        </div>

        <div className="w-full lg:w-1/2 mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8">

            <div className="mb-6">
              <p className="text-gray-600 font-light">
                {isRegistration || isFresh
                  ? `Setting up account for ${email}`
                  : "Enter your new password below."}
              </p>
            </div>

            <form onSubmit={handleSubmit} action="javascript:void(0);" className="space-y-6">
              {email && (
                <div>
                  <label className={labelClasses}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="appearance-none rounded-md relative block w-full h-[50px] px-4 py-3 border border-gray-200 bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
                  />
                </div>
              )}
              <div>
                <label className={labelClasses}>
                  New password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClasses} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--maincolor)] focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClasses}>
                  Confirm new password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputClasses} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--maincolor)] focus:outline-none"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                data-hover="RESET PASSWORD"
                disabled={loading}
                className={buttonClasses}
              >
                {loading ? "PROCESSING..." : buttonText.toUpperCase()}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/my-account" className="text-sm text-gray-500 hover:text-[var(--maincolor)] underline underline-offset-2">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
