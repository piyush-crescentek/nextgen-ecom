"use client";

import React, { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { getStoredStripeCheckoutUrl } from "@/lib/checkoutPayment";
import { useCheckoutPaymentStatus } from "@/hooks/useCheckoutPaymentStatus";
import {
  CheckoutOrderMeta,
  CheckoutStatusCard,
  CheckoutStatusIcon,
  CheckoutStatusLink,
  CheckoutStatusNote,
  CheckoutStatusPrimaryButton,
  CheckoutStatusShell,
  CheckoutStatusSuspenseFallback,
  CheckoutStatusTextLink,
} from "@/components/checkout/CheckoutStatusPage";

function CheckoutCancelledContent() {
  const searchParams = useSearchParams();
  const transactionIdParam = searchParams.get("transaction_id");

  const transactionId =
    transactionIdParam && /^\d+$/.test(transactionIdParam)
      ? transactionIdParam
      : null;

  const { data, loading, pollUntilConfirmed, stopPolling } =
    useCheckoutPaymentStatus(transactionId);

  const storedCheckoutUrl = useMemo(
    () =>
      getStoredStripeCheckoutUrl(
        transactionId ? Number(transactionId) : null,
      ),
    [transactionId],
  );

  useEffect(() => {
    if (!transactionId) return;

    void pollUntilConfirmed({ maxAttempts: 1 });

    return () => stopPolling();
  }, [transactionId, pollUntilConfirmed, stopPolling]);

  const hasTransactionData = Boolean(data?.increment_id || data?.amount_formatted);
  const incrementId = data?.increment_id;

  const bodyMessage = hasTransactionData && incrementId
    ? `Your order #${incrementId} is still awaiting payment. You can complete payment anytime using the link in your email.`
    : "You left checkout before completing payment. No charges were made.";

  if (loading && transactionId) {
    return (
      <CheckoutStatusCard
        icon={
          <Loader2
            className="h-14 w-14 animate-spin text-[#0C203B] sm:h-16 sm:w-16"
            aria-hidden
          />
        }
        title="Payment cancelled"
        subtitle="No payment was taken."
        message="Loading your order details..."
      />
    );
  }

  return (
    <CheckoutStatusCard
      icon={
        <CheckoutStatusIcon>
          <AlertCircle className="h-9 w-9 sm:h-11 sm:w-11" aria-hidden />
        </CheckoutStatusIcon>
      }
      title="Payment cancelled"
      subtitle="No payment was taken."
      message={bodyMessage}
      actions={
        <>
          {storedCheckoutUrl ? (
            <CheckoutStatusPrimaryButton href={storedCheckoutUrl}>
              <RotateCcw size={18} aria-hidden />
              Try again
            </CheckoutStatusPrimaryButton>
          ) : (
            <CheckoutStatusNote>
              Please use the payment link from your email to try again.
            </CheckoutStatusNote>
          )}
          <CheckoutStatusLink
            href="mailto:support@gethealthcare.ie"
            className="text-[#CB2738]"
          >
            Contact support
          </CheckoutStatusLink>
          <CheckoutStatusTextLink href="/" className="text-[#0C203B]">
            Back to home
          </CheckoutStatusTextLink>
        </>
      }
    >
      {hasTransactionData && (
        <CheckoutOrderMeta
          incrementId={data?.increment_id}
          amountFormatted={data?.amount_formatted}
          amountLabel="Amount due"
        />
      )}
    </CheckoutStatusCard>
  );
}

export default function CheckoutCancelledPage() {
  return (
    <CheckoutStatusShell>
      <Suspense fallback={<CheckoutStatusSuspenseFallback />}>
        <CheckoutCancelledContent />
      </Suspense>
    </CheckoutStatusShell>
  );
}
