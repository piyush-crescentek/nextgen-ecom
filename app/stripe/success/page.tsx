"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  useCheckoutPaymentStatus,
  type CheckoutPaymentStatus,
} from "@/hooks/useCheckoutPaymentStatus";
import {
  CheckoutOrderMeta,
  CheckoutStatusCard,
  CheckoutStatusIcon,
  CheckoutStatusPrimaryButton,
  CheckoutStatusPrimaryTextLink,
  CheckoutStatusShell,
  CheckoutStatusSuspenseFallback,
  CheckoutStatusTextLink,
} from "@/components/checkout/CheckoutStatusPage";

type PagePhase =
  | "missing_param"
  | "verifying"
  | "success"
  | "awaiting"
  | "failed"
  | "timeout";

function resolvePhase(
  status: CheckoutPaymentStatus | null,
  timedOut: boolean,
): PagePhase {
  if (!status) {
    return timedOut ? "timeout" : "verifying";
  }
  if (status.payment_confirmed) return "success";
  if (status.payment_failed) return "failed";
  if (status.awaiting_async_payment) return "awaiting";
  if (timedOut) return "timeout";
  return "verifying";
}

function StripeCheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const transactionIdParam = searchParams.get("transaction_id");

  const transactionId =
    transactionIdParam && /^\d+$/.test(transactionIdParam)
      ? transactionIdParam
      : null;

  const { data, loading, pollUntilConfirmed, stopPolling } =
    useCheckoutPaymentStatus(transactionId);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!transactionId) return;

    let cancelled = false;
    void pollUntilConfirmed().then((result) => {
      if (!cancelled) {
        setTimedOut(result === "exhausted");
      }
    });

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [transactionId, pollUntilConfirmed, stopPolling]);

  useEffect(() => {
    if (data?.awaiting_async_payment) {
      stopPolling();
    }
  }, [data?.awaiting_async_payment, stopPolling]);

  if (!transactionId) {
    return (
      <CheckoutStatusCard
        icon={
          <CheckoutStatusIcon className="bg-red-50 text-red-600">
            <XCircle className="h-9 w-9 sm:h-11 sm:w-11" aria-hidden />
          </CheckoutStatusIcon>
        }
        title="Invalid payment link"
        message="This page requires a valid transaction reference. Please use the link from your confirmation email or return to the homepage."
        actions={
          <CheckoutStatusPrimaryTextLink href="/">
            Back to home
          </CheckoutStatusPrimaryTextLink>
        }
      />
    );
  }

  const phase = resolvePhase(data, timedOut);
  const incrementId = data?.increment_id;
  const amountFormatted = data?.amount_formatted;
  const orderItems = data?.order?.items ?? [];

  if (phase === "verifying" || loading) {
    return (
      <CheckoutStatusCard
        icon={
          <Loader2
            className="h-14 w-14 animate-spin text-[#0C203B] sm:h-16 sm:w-16"
            aria-hidden
          />
        }
        title="Confirming your payment..."
        message="Please wait while we verify your payment with Stripe."
      />
    );
  }

  if (phase === "success") {
    return (
      <CheckoutStatusCard
        icon={
          <CheckoutStatusIcon className="bg-[#FDE8EA] text-emerald-700">
            <CheckCircle2 className="h-9 w-9 sm:h-11 sm:w-11" aria-hidden />
          </CheckoutStatusIcon>
        }
        title="Payment successful"
        message="Thank you. Your order is confirmed and our medical team will begin processing it. A confirmation email has been sent to you."
        actions={
          <>
            <CheckoutStatusPrimaryTextLink href="/profile/orders">
              View order details
              <ArrowRight size={18} aria-hidden />
            </CheckoutStatusPrimaryTextLink>
            <CheckoutStatusTextLink href="/" className="text-[#0C203B]">
              Back to home
            </CheckoutStatusTextLink>
          </>
        }
      >
        <CheckoutOrderMeta
          incrementId={incrementId}
          amountFormatted={amountFormatted}
        />
        {orderItems.length > 0 && (
          <ul className="mt-4 space-y-2 rounded-xl border border-[#0C203B]/10 bg-white/70 px-4 py-3 text-left text-sm">
            {orderItems.map((item, index) => (
              <li key={`${item.name}-${index}`} className="text-[#0C203B]">
                <p className="font-medium wrap-break-word">{item.name}</p>
                {item.turnaround_time && (
                  <p className="text-[#0C203B]/70">
                    Turnaround: {item.turnaround_time}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CheckoutStatusCard>
    );
  }

  if (phase === "awaiting") {
    return (
      <CheckoutStatusCard
        icon={
          <CheckoutStatusIcon>
            <AlertTriangle className="h-9 w-9 sm:h-11 sm:w-11" aria-hidden />
          </CheckoutStatusIcon>
        }
        title="Payment received — processing"
        message="Your payment method requires additional processing. We will email you once payment is fully confirmed."
      >
        <CheckoutOrderMeta
          incrementId={incrementId}
          amountFormatted={amountFormatted}
        />
      </CheckoutStatusCard>
    );
  }

  if (phase === "failed") {
    return (
      <CheckoutStatusCard
        icon={
          <CheckoutStatusIcon className="bg-red-50 text-red-600">
            <XCircle className="h-9 w-9 sm:h-11 sm:w-11" aria-hidden />
          </CheckoutStatusIcon>
        }
        title="Payment could not be confirmed"
        message="We could not verify your payment. Please contact support or try again using the payment link from your email."
        actions={
          <CheckoutStatusPrimaryButton
            href="mailto:support@gethealthcare.ie"
            className="bg-[#CB2738] hover:bg-[#CB2738]/90"
          >
            Contact support
          </CheckoutStatusPrimaryButton>
        }
      />
    );
  }

  return (
    <CheckoutStatusCard
      icon={
        <CheckoutStatusIcon className="bg-[#FDE8EA] text-[#0C203B]">
          <Clock className="h-9 w-9 sm:h-11 sm:w-11" aria-hidden />
        </CheckoutStatusIcon>
      }
      title="Payment is still processing"
      message="Your payment may still be processing. Please check your email for confirmation in a few minutes."
    >
      <CheckoutOrderMeta
        incrementId={incrementId}
        amountFormatted={amountFormatted}
      />
    </CheckoutStatusCard>
  );
}

function StripeCheckoutSuccessShell() {
  const searchParams = useSearchParams();
  const transactionIdParam = searchParams.get("transaction_id");

  return <StripeCheckoutSuccessContent key={transactionIdParam ?? "none"} />;
}

export default function StripeCheckoutSuccessPage() {
  return (
    <CheckoutStatusShell>
      <Suspense fallback={<CheckoutStatusSuspenseFallback />}>
        <StripeCheckoutSuccessShell />
      </Suspense>
    </CheckoutStatusShell>
  );
}
