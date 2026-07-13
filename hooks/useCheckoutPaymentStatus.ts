"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";

const POLL_INTERVAL_MS = 2000;
const DEFAULT_MAX_POLL_ATTEMPTS = 15;

export interface CheckoutPaymentStatusOrderItem {
  name: string;
  turnaround_time?: string | null;
}

export interface CheckoutPaymentStatusOrder {
  id?: number;
  items?: CheckoutPaymentStatusOrderItem[];
}

export interface CheckoutPaymentStatus {
  payment_confirmed: boolean;
  payment_failed: boolean;
  awaiting_async_payment: boolean;
  increment_id?: string;
  amount_formatted?: string;
  order_id?: number;
  order?: CheckoutPaymentStatusOrder;
}

export type PollUntilConfirmedResult =
  | "confirmed"
  | "failed"
  | "exhausted"
  | "stopped";

export interface PollUntilConfirmedOptions {
  maxAttempts?: number;
}

function isValidTransactionId(transactionId: string | null): transactionId is string {
  return Boolean(transactionId && /^\d+$/.test(transactionId));
}

function parsePaymentStatusPayload(payload: unknown): CheckoutPaymentStatus | null {
  if (!payload || typeof payload !== "object") return null;
  return payload as CheckoutPaymentStatus;
}

export function useCheckoutPaymentStatus(transactionId: string | null) {
  const [data, setData] = useState<CheckoutPaymentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingActiveRef = useRef(false);

  const stopPolling = useCallback(() => {
    pollingActiveRef.current = false;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const fetchPaymentStatus = useCallback(async (): Promise<CheckoutPaymentStatus | null> => {
    if (!isValidTransactionId(transactionId)) return null;

    try {
      const response = await api.get(
        API_ENDPOINTS.CHECKOUT_PAYMENT_STATUS(transactionId),
      );
      return parsePaymentStatusPayload(response.data?.data ?? response.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return null;
      }
      throw err;
    }
  }, [transactionId]);

  const pollUntilConfirmed = useCallback(
    async (
      options?: PollUntilConfirmedOptions,
    ): Promise<PollUntilConfirmedResult> => {
      if (!isValidTransactionId(transactionId)) {
        return "stopped";
      }

      const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_POLL_ATTEMPTS;

      stopPolling();
      pollingActiveRef.current = true;
      setLoading(true);
      setError(null);

      let attempts = 0;

      const runAttempt = async (): Promise<PollUntilConfirmedResult> => {
        if (!pollingActiveRef.current) {
          setLoading(false);
          return "stopped";
        }

        attempts += 1;

        try {
          const result = await fetchPaymentStatus();
          if (!pollingActiveRef.current) {
            setLoading(false);
            return "stopped";
          }

          if (result) {
            setData(result);
          }

          if (result?.payment_confirmed) {
            stopPolling();
            setLoading(false);
            return "confirmed";
          }

          if (result?.payment_failed) {
            stopPolling();
            setLoading(false);
            return "failed";
          }
        } catch (err) {
          if (!pollingActiveRef.current) {
            setLoading(false);
            return "stopped";
          }

          setError(
            err instanceof Error
              ? err
              : new Error("Failed to load payment status"),
          );
          stopPolling();
          setLoading(false);
          return "stopped";
        }

        if (attempts >= maxAttempts) {
          stopPolling();
          setLoading(false);
          return "exhausted";
        }

        return new Promise((resolve) => {
          pollTimerRef.current = setTimeout(() => {
            void runAttempt().then(resolve);
          }, POLL_INTERVAL_MS);
        });
      };

      return runAttempt();
    },
    [transactionId, fetchPaymentStatus, stopPolling],
  );

  useEffect(() => {
    if (!isValidTransactionId(transactionId)) {
      setData(null);
      setError(null);
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return {
    data,
    loading,
    error,
    pollUntilConfirmed,
    stopPolling,
  };
}
