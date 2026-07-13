"use client";

import React, { Suspense } from "react";
import WalletModule from "@/components/profile/Wallet";
import { Elements } from "@stripe/react-stripe-js";
import getStripe from "@/lib/stripe";
import { isPaymentMethodAllowed } from "@/lib/visibility";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const stripePromise = getStripe();

export default function WalletPage() {
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (user && !isPaymentMethodAllowed('Wallet Balance', user.business_group)) {
            router.push('/profile/dashboard');
        }
    }, [user, router]);

    if(user && !isPaymentMethodAllowed('Wallet Balance', user.business_group)) {
        return null; // Prevents flashing while redirecting
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Elements stripe={stripePromise}>
                <WalletModule />
            </Elements>
        </Suspense>
    );
}

