"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getFilteredMenuItems } from "@/lib/permissions";
import { toast } from "sonner";

import { LogOut, User as UserIcon, Mail } from "lucide-react";

export default function ProfileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, userPermissions, user } = useAuthStore();

  const menuItems = getFilteredMenuItems(userPermissions || [], user?.customer_type, user?.employer_type, user?.business_group);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/my-account");
    } catch {
      toast.error("Logout failed, but local session cleared.");
      router.push("/my-account");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* User Summary Card */}
      <div className="bg-[#e2e8dfbf] backdrop-blur-md rounded-[1.25rem] p-4 shadow-md shadow-gray-200/20 border border-white flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-(--greenItem) flex items-center justify-center text-[var(--maincolor)] border border-(--maincolor)/5">
          <UserIcon size={20} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm truncate">
            {user?.name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Member"}
          </h3>
          <div className="flex items-center gap-1 text-gray-500 text-[13px] mt-0.5 font-normal">
            <Mail size={12} strokeWidth={1.5} />
            <span className="truncate">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Navigation Card */}
      <nav className="bg-[#e2e8dfbf] backdrop-blur-md rounded-[1.25rem] shadow-md shadow-gray-200/20 border border-white overflow-hidden p-2">
        <div className="flex flex-col gap-0.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group ${isActive
                  ? "bg-(--maincolor) text-white shadow-md shadow-(--maincolor)/10"
                  : "text-gray-600 hover:bg-white/50 hover:text-(--maincolor)"
                  }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? "bg-white/10" : "bg-white/40 group-hover:bg-white"}`}>
                  <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                </div>
                <span className={`text-[15px] ${isActive ? 'font-medium' : 'font-normal'}`}>{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-1 pt-1 border-t border-white/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-(--btncolor) hover:bg-red-50/50 transition-all duration-200 cursor-pointer group"
            >
              <div className="p-1.5 rounded-lg bg-red-50/50 group-hover:bg-red-100/50">
                <LogOut size={16} strokeWidth={1.5} />
              </div>
              <span className="font-normal text-[15px]">Log out</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
