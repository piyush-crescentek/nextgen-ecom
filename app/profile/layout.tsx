"use client";

import React, { useEffect } from "react";
import ProfileSidebar from "../../components/profile/ProfileSidebar";
import { useAuthStore, Customer } from "@/store/useAuthStore";
import { usePathname, useRouter } from "next/navigation";

const getPageTitle = (pathname: string, _user: Customer | null) => {
  if (pathname.includes("/profile/orders")) return "Orders & Appointments";
  if (pathname.includes("/profile/wallet")) return "Wallet Management";
  if (pathname.includes("/profile/transactions")) return "Transactions";
  if (pathname.includes("/profile/addresses")) return "Addresses";
  if (pathname.includes("/profile/payment-methods")) return "Payment Methods";
  if (pathname.includes("/profile/details")) return "Account Details";
  if (pathname.includes("/profile/appointments")) return "Appointments";
  return "Dashboard";
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, fetchProfile } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname, user);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Derive modal state from user and pathname - no need for useState
  const showProfileModal = React.useMemo(() => {
    if (!user) return false;

    const isProfileIncomplete = !user.name || user.name.trim() === "";

    // Only show modal if profile is incomplete AND not already on details page
    return isProfileIncomplete && !pathname.includes("/profile/details");
  }, [user, pathname]);

  const handleCompleteProfile = () => {
    router.push("/profile/details");
  };

  return (
    <div className="bg-[#F8FBFA] py-12 md:pt-32 md:min-h-screen md:flex flex-col items-center xl:justify-center">
      {/* Profile Completion Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-3">
              <div className="h-16 w-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="size-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Complete Your Profile
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed px-4">
                Please complete your profile by adding your first name and last
                name before accessing other features.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCompleteProfile}
                className="w-full py-4 bg-[var(--maincolor)] text-white rounded-xl text-sm uppercase tracking-[0.2em] font-bold hover:bg-[var(--maincolor)]/90 transition-all active:scale-[0.98] shadow-lg"
              >
                Complete Profile Now
              </button>
              <p className="text-xs text-gray-400 text-center italic">
                This is required to continue using the platform
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 lg:px-8">
        {/* Modern Header Section */}
        <div className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="text-center lg:text-left">
            <h1 className="text-(--maincolor) text-2xl lg:text-3xl font-bold">
              {title}
            </h1>
            <p className="!text-xs text-gray-500 mt-1.5 uppercase font-bold">
              Profile Management
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar container */}
          <div className="w-full lg:w-[30%] xl:w-1/4">
            <ProfileSidebar />
          </div>

          {/* Content area */}
          <div className="w-full lg:w-[70%] xl:w-3/4">
            <div className="bg-[#e2e8dfbf] backdrop-blur-md rounded-[1.5rem] shadow-lg shadow-gray-200/40 min-h-[600px] border border-white overflow_hidden">
              <div className="p-6 lg:p-8">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
