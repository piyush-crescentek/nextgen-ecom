"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail } = useAuthStore();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. Token is missing.");
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        setStatus("success");
        setMessage("Your email has been successfully verified!");
      } catch (error: any) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Failed to verify email. The link may be invalid or expired.");
      }
    };

    verify();
  }, [token, verifyEmail]);

  return (
    <div className="bg-[#F0F0F0] py-12 md:pt-[115px] md:min-h-screen md:flex flex-col items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-sm p-8 text-center">
          
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="w-16 h-16 text-[var(--maincolor)] animate-spin mb-6" />
              <h2 className="text-2xl font-bold text-[var(--maincolor)] mb-2">Verifying...</h2>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-10 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--maincolor)] mb-4">Email Verified!</h2>
              <p className="text-gray-600 mb-8">{message}</p>
              
              <Link 
                href="/my-account" 
                className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-normal text-white transition-all duration-200 bg-[var(--btncolor)] rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--btncolor)] overflow-hidden before:content-[attr(data-hover)] before:absolute before:top-0 before:left-0 before:h-full before:w-full before:bg-[#0C203B33] before:rounded-md before:translate-y-full before:transition-all before:duration-700 before:ease-[cubic-bezier(0.77,0,0.175,1)] hover:before:translate-y-0"
              >
                <span className="relative z-[1]">Continue to Login</span>
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-10 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h2>
              <p className="text-gray-600 mb-8">{message}</p>
              
              <Link 
                href="/contact-us" 
                className="text-[var(--maincolor)] underline hover:text-opacity-80"
              >
                Contact Support
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
