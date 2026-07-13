"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { ShieldAlert, Loader2 } from "lucide-react";

interface PermissionGuardProps {
    children: React.ReactNode;
    permission?: string;
    redirectTo?: string;
    showError?: boolean;
}

export default function PermissionGuard({
    children,
    permission,
    redirectTo = "/profile/dashboard",
    showError = true,
}: PermissionGuardProps) {
    const router = useRouter();
    const { user, userPermissions, isAuthenticated } = useAuthStore();

    // Compute authorization status during render
    const hasPermission = !permission || userPermissions?.includes(permission) || user?.customer_type === 1;
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        // Only trigger redirect if fully authenticated but missing specific permission
        if (isAuthenticated && !hasPermission && !isRedirecting) {
            const timer = setTimeout(() => {
                setIsRedirecting(true);
                if (showError) {
                    toast.error("You do not have permission to access neighbor page.");
                }
                router.push(redirectTo);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, hasPermission, isRedirecting, redirectTo, router, showError]);

    // Show loading while store is hydrating or if redirecting
    if ((!isAuthenticated && !user) || isRedirecting) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--maincolor)]" />
            </div>
        );
    }

    if (!hasPermission) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                    You don&apos;t have the required permissions to view this section.
                    If you believe this is an error, please contact your administrator.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
