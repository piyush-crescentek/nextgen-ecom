"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Wallet, ShoppingBag, Calendar, ArrowUpRight, ShieldCheck, Building2 } from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";
import { isPaymentMethodAllowed } from "@/lib/visibility";
import PaymentCards, { PaymentCard } from "@/components/profile/PaymentCards";

interface Statistics {
    wallet_balance: string;
    total_orders: number;
    appointments: number;
    payment_methods?: PaymentCard[];
}

export default function DashboardPage() {
    const router = useRouter();
    const { logout, user, resendVerification, userRoles, userPermissions } = useAuthStore();
    const [sending, setSending] = React.useState(false);
    const [statsData, setStatsData] = React.useState<Statistics | null>(null);
    const [loadingStats, setLoadingStats] = React.useState(true);

    React.useEffect(() => {
        // Static mock statistics — no API call is made.
        setStatsData({
            wallet_balance: user?.wallet_balance || "0.00",
            total_orders: 0,
            appointments: 0,
            payment_methods: [],
        });
        setLoadingStats(false);
    }, [user?.wallet_balance]);

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

    const handleResend = async () => {
        setSending(true);
        try {
            await resendVerification();
            toast.success("Verification email sent! Please check your inbox.");
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            toast.error(axiosError.response?.data?.message || "Failed to send verification email");
        } finally {
            setSending(false);
        }
    };

    const stats = [
        { 
            label: "Wallet Balance", 
            value: loadingStats ? "..." : `€${statsData?.wallet_balance || user?.wallet_balance || "0.00"}`, 
            icon: Wallet, 
            color: "text-emerald-600", 
            bgColor: "bg-emerald-50", 
            permission: 'wallet',
            path: "/profile/wallet"
        },
        { 
            label: "Total Orders", 
            value: loadingStats ? "..." : (statsData?.total_orders ?? user?.orders_count ?? "0"), 
            icon: ShoppingBag, 
            color: "text-blue-600", 
            bgColor: "bg-blue-50",
            path: "/profile/orders"
        },
        { 
            label: "Appointments", 
            value: loadingStats ? "..." : (statsData?.appointments ?? "0"), 
            icon: Calendar, 
            color: "text-purple-600", 
            bgColor: "bg-purple-50",
            path: "/profile/orders"
        },
    ].filter(stat => {
        if (stat.permission === 'wallet') {
            const isWalletAllowed = isPaymentMethodAllowed('Wallet Balance', user?.business_group);
            const hasWalletPermission = (userPermissions?.includes(PERMISSIONS.VIEW_ORG_WALLET) ||
                userPermissions?.includes(PERMISSIONS.VIEW_STAFF_WALLET) ||
                userPermissions?.includes(PERMISSIONS.TOPUP_STAFF_WALLET) ||
                userPermissions?.includes(PERMISSIONS.USE_STAFF_WALLET) ||
                user?.customer_type === 1 ||
                (user?.customer_type === 2 && user?.employer_type === 3)) && isWalletAllowed;
            return hasWalletPermission;
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Verification Alert */}
            {user && !user.email_verified_at && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <ShieldCheck className="h-6 w-6 text-amber-700" />
                        </div>
                        <div>
                            <h4 className="text-amber-900 font-bold text-sm uppercase">Action Required</h4>
                            <p className="text-amber-700 text-sm mt-1">Your email address is not verified. Please verify to unlock all features.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleResend}
                        disabled={sending}
                        className="px-8 py-2.5 bg-amber-600 text-white text-[11px] font-bold uppercase rounded-lg hover:bg-amber-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {sending ? "Sending..." : "Resend Link"}
                    </button>
                </div>
            )}

            {/* Greeting Header */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden text-left">
                <div className="bg-[#F9FAFB] px-8 py-4 border-b border-[#E5E7EB]">
                    <h2 className="text-xs font-bold text-[#4B5563] uppercase">Welcome Overview</h2>
                </div>
                <div className="p-8 relative">
                    <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                        <div className="">
                            <h1 className="text-2xl font-medium text-gray-900 mb-2 flex flex-wrap items-center gap-3">
                                Good Day, <span className="text-(--maincolor) font-bold">{user?.name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Member"}</span>!
                                {userRoles && userRoles.length > 0 && (
                                    <span className="text-[9px] font-bold text-(--maincolor) uppercase px-2.5 py-1 bg-(--maincolor)/5 rounded-md border border-(--maincolor)/10">
                                        {userRoles[0]}
                                    </span>
                                )}
                            </h1>
                            <p className="text-slate-600 max-w-xl">
                                Manage your medical records, track orders, and schedule appointments through your secure health portal.
                            </p>
                        </div>
                        <div className="shrink-0 flex sm:flex-row flex-col items-center gap-3">
                            <button onClick={() => router.push('/profile/details')} className="px-6 py-3 bg-(--maincolor) text-white rounded-md text-[11px] font-bold uppercase hover:opacity-90 transition-all flex items-center gap-2 w-full sm:w-auto cursor-pointer">
                                Update Profile <ArrowUpRight size={14} strokeWidth={3} />
                            </button>
                            <button onClick={handleLogout} className="px-6 py-3 bg-gray-100 text-gray-700 border border-[#E5E7EB] rounded-md text-[11px] font-bold uppercase hover:bg-(--blockground) hover:text-(--maincolor) transition-all w-full sm:w-auto cursor-pointer">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Corporate Identity */}
            {user?.organization && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center shrink-0">
                                <Building2 className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Organization</span>
                                <h3 className="text-sm font-bold text-gray-900 mt-1 truncate">{user.organization.name}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div 
                        key={i} 
                        onClick={() => router.push(stat.path)}
                        className="bg-white p-6 rounded-xl border border-transparent shadow-sm hover:border-(--maincolor)/30 transition-all group text-left cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-10 w-10 rounded-lg bg-(--blockground) flex items-center justify-center text-gray-400 group-hover:text-(--maincolor) group-hover:bg-(--maincolor)/5 transition-all">
                                <stat.icon size={18} />
                            </div>
                        </div>
                        <div className="text-sm text-gray-400 uppercase font-normal mb-1.5">{stat.label}</div>
                        <h6 className="text-3xl font-bold text-(--maincolor)">{stat.value}</h6>
                    </div>
                ))}
            </div>

            {/* Payment Methods */}
            {!loadingStats && isPaymentMethodAllowed('Stripe', user?.business_group) && (
                <PaymentCards initialCards={statsData?.payment_methods} />
            )}

        </div>
    );
}
