"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

// Icon components reusability


// Reusable PasswordInput component
const PasswordInput = ({
  id,
  label,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
  error
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
  error?: string;
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-normal text-gray-500 mb-2">
      {label} <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none rounded-md relative block w-full h-[50px] px-4 py-3 pr-12 border ${error ? "border-red-500" : "border-[var(--maincolor)]"
          } placeholder-gray-500 text-[var(--maincolor)] focus:outline-none focus:ring-[var(--maincolor)] focus:border-[var(--maincolor)] focus:z-10 text-sm`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--maincolor)] focus:outline-none"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
    {error && (
      <p id={`${id}-error`} className="mt-1 text-sm text-red-500">
        {error}
      </p>
    )}
  </div>
);

export default function CreatePass() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [repassword, setRePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [errors, setErrors] = useState({ password: "", repassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return "";
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: "" }));
    }
  };

  const handleRePasswordChange = (value: string) => {
    setRePassword(value);
    if (errors.repassword) {
      setErrors(prev => ({ ...prev, repassword: "" }));
    }
  };

  const handleSubmit = () => {
    const passwordError = validatePassword(password);
    const repasswordError = password !== repassword ? "Passwords do not match" : "";

    if (passwordError || repasswordError) {
      setErrors({
        password: passwordError,
        repassword: repasswordError
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      router.push("/profile");
    }, 500);
  };

  return (
    <div className="bg-[#F0F0F0] py-12 md:pb-28 pt-[115px]">
      <div className="container mx-auto px-4">
        <div className="flex justify-center mt-10 mb-14">
          <h1 className="text-[var(--maincolor)] text-3xl font-bold">Create Password</h1>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch gap-7">
          <div className="w-full lg:w-1/2 mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8">
              <div className="my-4">
                <div className="space-y-8">
                  <p className="text-gray-600 text-base font-light">
                    Enter a new password below.
                  </p>

                  <div className="space-y-4">
                    <PasswordInput
                      id="newPassword"
                      label="New password"
                      value={password}
                      onChange={handlePasswordChange}
                      showPassword={showPassword}
                      onToggleVisibility={() => setShowPassword(!showPassword)}
                      error={errors.password}
                    />

                    <PasswordInput
                      id="rePassword"
                      label="Re-enter new password"
                      value={repassword}
                      onChange={handleRePasswordChange}
                      showPassword={showRePassword}
                      onToggleVisibility={() => setShowRePassword(!showRePassword)}
                      error={errors.repassword}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !password || !repassword}
                      className="group relative w-full max-w-[136px] flex items-center justify-center p-3.5 border border-transparent text-base font-normal rounded-sm text-white bg-[var(--btncolor)] focus:outline-none focus:ring-0 cursor-pointer focus:ring-[var(--btncolor)] disabled:opacity-50 disabled:cursor-not-allowed disabled:before:hidden transition-opacity overflow-hidden before:content-[attr(data-hover)] before:absolute before:top-0 before:left-0 before:h-full before:w-full before:bg-[#0C203B33] before:rounded-md before:translate-y-full before:transition-all before:duration-700 before:ease-[cubic-bezier(0.77,0,0.175,1)] hover:before:translate-y-0"
                    >
                      <span className="relative z-[1]">{isSubmitting ? "Saving..." : "Save"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}