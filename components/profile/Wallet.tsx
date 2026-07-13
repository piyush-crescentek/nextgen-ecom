"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Loader2,
  Info,
  Upload,
  X,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { toast } from "sonner";
import StripeRedirectLoader from "@/components/StripeRedirectLoader";
import DataTable from "@/components/common/DataTable";
import { PERMISSIONS } from "@/lib/permissions";
import {
  useStripe,
  useElements,
  CardNumberElement,
} from "@stripe/react-stripe-js";
import StripePaymentForm from "@/components/checkout/StripePaymentForm";
import { CheckCircle2 } from "lucide-react";
import { isDirectBankTransferAllowed, isPaymentMethodAllowed } from "@/lib/visibility";

interface Transaction {
  amount: string;
  display_amount: string;
  type: string;
  payment_method: string;
  status: string;
  transaction_id: string | null;
  description: string;
  created_at: string;
  is_ticket?: boolean;
  rejection_reason?: string | null;
  admin_notes?: string | null;
  original_amount?: string | null;
  balance_before?: string | null;
  balance_after?: string | null;
  last_balance?: string | null;
}

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface BankTicket {
  id: number;
  ticket_id: string;
  amount: string | null;
  bank_transaction_id: string | null;
  description: string | null;
  status: string;
  created_at: string;
  submitted_at: string | null;
  rejection_reason: string | null;
}

const BANK_INFO = {
  IBAN: "IE12 GHCM 1234 5678 9012 34",
  BIC: "GHCMIE2D",
};
const MIN_TOPUP_AMOUNT = 5;

const getPromotionalExpiryDate = (createdAt: string): Date => {
  const created = new Date(createdAt);
  return new Date(
    created.getFullYear(),
    created.getMonth() + 6,
    created.getDate(),
    created.getHours(),
    created.getMinutes(),
    created.getSeconds(),
  );
};

const formatDisplayDate = (value: string | Date): string => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function WalletModule() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, fetchProfile, userPermissions } = useAuthStore();
  const stripe = useStripe();
  const elements = useElements();
  const isWalletAllowed = isPaymentMethodAllowed(
    "Wallet Balance",
    user?.business_group,
  );
  const canManage =
    (userPermissions?.includes(PERMISSIONS.USE_ORG_WALLET) ||
      user?.customer_type === 1 ||
      (user?.customer_type === 2 && user?.employer_type === 3)) &&
    isWalletAllowed;
  const [activeTab, setActiveTab] = useState<"history" | "funds">("history");
  const [method, setMethod] = useState<"stripe" | "bank">("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveCard, setSaveCard] = useState(true);
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);
  const [amount, setAmount] = useState("");
  const [userRef, setUserRef] = useState("");
  const [bankRef, setBankRef] = useState("");
  const [description, setDescription] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isFetchingCards, setIsFetchingCards] = useState(false);
  const hasFetchedCards = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [hasMore, setHasMore] = useState(true);
  const [bankStep, setBankStep] = useState<"details" | "confirmation">(
    "details",
  );
  const [showBankInfo, setShowBankInfo] = useState(true);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<BankTicket | null>(null);
  const [latestNotification, setLatestNotification] =
    useState<BankTicket | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emails, setEmails] = useState<string[]>([""]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.email) {
      setEmails([user.email]);
    }
  }, [user]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const validEmails = emails.filter((email) => email.trim() !== "");
    if (validEmails.length === 0) {
      toast.error("Please provide at least one email address");
      return;
    }

    setIsSendingEmail(true);
    try {
      await api.post(API_ENDPOINTS.SEND_BANK_DETAILS, {
        emails: validEmails,
        iban: BANK_INFO.IBAN,
        bic: BANK_INFO.BIC,
        reference: userRef,
      });

      setIsSendingEmail(false);
      setEmailSuccess(true);
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message || "Failed to send details",
      );
      setIsSendingEmail(false);
    }
  };

  const generateBankID = async () => {
    setIsProcessing(true);
    try {
      const response = await api.post(API_ENDPOINTS.BANK_TRANSFER_TICKETS);
      const ticketId =
        response.data.ticket?.ticket_id || response.data.ticket_id;
      const ticket = response.data.ticket;

      // Set the ticket ID
      if (ticketId) {
        setUserRef(ticketId);
        setCurrentTicketId(ticketId);
      }

      // Set the active ticket object
      if (ticket) {
        setActiveTicket(ticket);
      }
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string; ticket_id?: string } };
      };
      const message = axiosError.response?.data?.message;
      const existingTicketId = axiosError.response?.data?.ticket_id;

      // If the error is about having an active ticket, set the ticket_id from the error response
      if (
        message &&
        message.includes("already have an active ticket") &&
        existingTicketId
      ) {
        setUserRef(existingTicketId);
        setCurrentTicketId(existingTicketId);
        // Don't show error toast, just silently set the ticket ID
        return;
      }

      toast.error(message || "Failed to generate ticket");
    } finally {
      setIsProcessing(false);
    }
  };

  const permsKey = userPermissions?.join(",") || "";

  const fetchTransactions = useCallback(
    async (pageNum = 1) => {
      try {
        if (pageNum === 1) {
          setIsLoadingLogs(true);
        } else {
          setIsFetchingMore(true);
        }

        const hasOrgWalletAccess =
          userPermissions?.includes(PERMISSIONS.VIEW_ORG_WALLET) ||
          user?.customer_type === 1;

        // Use individual try-catch or Promise.allSettled to handle potential 403s gracefully
        const fetchWallet = api
          .get(API_ENDPOINTS.WALLET_TRANSACTIONS, { params: { page: pageNum } })
          .catch((err) => {
            console.warn("Wallet transactions fetch failed:", err);
            return { data: { transactions: [] } };
          });

        const fetchTickets = hasOrgWalletAccess
          ? api
              .get(API_ENDPOINTS.BANK_TRANSFER_TICKETS, {
                params: { per_page: 15, page: pageNum },
              })
              .catch((err) => {
                console.warn("Bank tickets fetch failed:", err);
                return { data: { tickets: [] } };
              })
          : Promise.resolve({ data: { tickets: [] } });

        const [walletRes, ticketsRes] = await Promise.all([
          fetchWallet,
          fetchTickets,
        ]);

        const walletTrx: Transaction[] = walletRes.data.transactions || [];
        const bankTickets: BankTicket[] =
          ticketsRes.data.tickets?.data || ticketsRes.data.tickets || [];

        if (pageNum === 1) {
          setTransactions(walletTrx);
        } else {
          setTransactions((prev) => [...prev, ...walletTrx]);
        }

        // Only process ticket logic if user has access
        if (hasOrgWalletAccess) {
          const blocking = bankTickets.find(
            (t) => t.status === "pending" || t.status === "draft",
          );
          const latest = bankTickets[0];

          const fortyEightHoursAgo = new Date(
            new Date().getTime() - 48 * 60 * 60 * 1000,
          );
          if (
            latest &&
            (latest.status === "approved" || latest.status === "rejected")
          ) {
            const ticketDate = new Date(
              latest.submitted_at || latest.created_at,
            );
            if (ticketDate > fortyEightHoursAgo) {
              setLatestNotification(latest);
            } else {
              setLatestNotification(null);
            }
          } else {
            setLatestNotification(null);
          }

          if (blocking) {
            setActiveTicket(blocking);
            setCurrentTicketId(blocking.ticket_id);
            setUserRef(blocking.ticket_id);
          } else {
            setActiveTicket(null);
            setCurrentTicketId(null);
            setUserRef("");
          }
        }

        setHasMore(walletTrx.length > 0);
      } catch (error) {
        console.error("Critical error in fetchTransactions:", error);
      } finally {
        setIsLoadingLogs(false);
        setIsFetchingMore(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [permsKey, user?.customer_type],
  );

  useEffect(() => {
    setPage(1);
    fetchTransactions(1);
  }, [fetchTransactions]);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    const tab = searchParams.get("tab");
    const methodParam = searchParams.get("method");
    if (!tab && !methodParam) return;
    if (tab === "funds" && !canManage) return;

    let didApply = false;
    if (tab === "funds" && canManage) {
      setActiveTab("funds");
      didApply = true;
    }
    if (
      methodParam === "bank" &&
      isDirectBankTransferAllowed(
        user.business_group,
        user.customer_type,
        user.employer_type,
      )
    ) {
      setMethod("bank");
      setBankStep("details");
      setShowBankInfo(true);
      didApply = true;
    } else if (
      methodParam === "stripe" &&
      isPaymentMethodAllowed("Stripe", user.business_group)
    ) {
      setMethod("stripe");
      didApply = true;
    }

    if (didApply) {
      router.replace("/profile/wallet", { scroll: false });
    }
  }, [searchParams, canManage, user, router]);

  useEffect(() => {
    if (activeTab !== "funds" || !user) return;
    const stripeOk = isPaymentMethodAllowed("Stripe", user.business_group);
    const bankOk = isDirectBankTransferAllowed(
      user.business_group,
      user.customer_type,
      user.employer_type,
    );
    if (!stripeOk && bankOk) {
      setMethod("bank");
    }
  }, [activeTab, user]);

  const fetchSavedCards = async (paymentMethodId?: string | null) => {
    if (!paymentMethodId) return;
    setIsFetchingCards(true);
    try {
      const response = await api.get(API_ENDPOINTS.CARD_DETAILS, {
        params: { payment_method_id: paymentMethodId },
      });
      const data = response.data;
      let cards: SavedCard[] = [];
      if (Array.isArray(data)) cards = data;
      else if (data?.id) cards = [data];
      else if (Array.isArray(data?.data)) cards = data.data;
      setSavedCards(cards);
      if (cards.length > 0) setSelectedCardId(cards[0].id);
    } catch (error: unknown) {
      console.error("Failed to fetch saved cards:", error);
      setSavedCards([]);
    } finally {
      setIsFetchingCards(false);
    }
  };

  useEffect(() => {
    if (!user || hasFetchedCards.current) return;
    hasFetchedCards.current = true;
    fetchSavedCards(user.stripe_payment_method_id);
  }, [user]);

  useEffect(() => {
    if (
      activeTab === "funds" &&
      method === "bank" &&
      !activeTicket &&
      !currentTicketId &&
      !isLoadingLogs
    ) {
      generateBankID();
    }
  }, [activeTab, method, activeTicket, currentTicketId, isLoadingLogs]);

  useEffect(() => {
    if (activeTab !== "history" || !hasMore || isLoadingLogs || isFetchingMore)
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchTransactions(nextPage);
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      observer.disconnect();
    };
  }, [
    activeTab,
    hasMore,
    isLoadingLogs,
    isFetchingMore,
    fetchTransactions,
    page,
  ]);

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!amount || val < MIN_TOPUP_AMOUNT) {
      toast.error(`Minimum €${MIN_TOPUP_AMOUNT} required for wallet top-up`);
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!amount || val < MIN_TOPUP_AMOUNT) {
      toast.error(`Minimum €${MIN_TOPUP_AMOUNT} required for wallet top-up`);
      return;
    }

    setIsProcessing(true);
    try {
      let paymentMethodId = selectedCardId;

      if (method === "stripe" && !selectedCardId) {
        if (!stripe || !elements) {
          toast.error("Stripe has not loaded yet. Please try again.");
          return;
        }

        const cardElement = elements.getElement(CardNumberElement);
        if (!cardElement) {
          toast.error(
            "Credit card details are missing. Please enter your card info.",
          );
          return;
        }

        // Create Payment Method
        const { error: pmError, paymentMethod: stripeMethod } =
          await stripe.createPaymentMethod({
            type: "card",
            card: cardElement,
            billing_details: {
              email: user?.email,
              name: user?.name,
              phone: user?.phone,
            },
          });

        if (pmError) {
          toast.error(pmError.message || "Failed to process card details");
          return;
        }
        paymentMethodId = stripeMethod.id;
      }

      if (method === "stripe") {
        const payload = {
          amount: val,
          payment: {
            method: "stripe",
            payment_method_id: paymentMethodId,
            save_card: saveCard,
          },
          use_elements: true,
        };

        const response = await api.post(
          API_ENDPOINTS.WALLET_ADD_FUNDS_STRIPE,
          payload,
        );

        const { client_secret, success } = response.data;

        if (client_secret && stripe) {
          const { error: confirmError, paymentIntent } =
            await stripe.confirmCardPayment(client_secret);
          if (confirmError) {
            toast.error(
              confirmError.message || "Payment authentication failed",
            );
            return;
          }
          if (paymentIntent?.status === "succeeded") {
            toast.success("Funds added successfully!");
            setAmount("");
            setIsPaymentModalOpen(false);
            await fetchProfile();
            setActiveTab("history");
            await fetchTransactions(1);
          }
        } else if (success) {
          toast.success("Funds added successfully!");
          setAmount("");
          setIsPaymentModalOpen(false);
          await fetchProfile();
          setActiveTab("history");
          await fetchTransactions(1);
        }
      } else {
        if (!currentTicketId) {
          toast.error("Ticket ID missing. Please regenerate ticket.");
          return;
        }

        const submissionPayload = new FormData();
        submissionPayload.append("amount", val.toString());
        submissionPayload.append("bank_transaction_id", bankRef);
        submissionPayload.append("description", description);
        if (attachment) {
          submissionPayload.append("attachment", attachment);
        }

        // Use POST with _method=PUT for multipart PUT requests (standard for Laravel/PHP backends)
        submissionPayload.append("_method", "PUT");

        await api.post(
          `${API_ENDPOINTS.BANK_TRANSFER_TICKETS}/${currentTicketId}`,
          submissionPayload,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );

        await api.post(
          `${API_ENDPOINTS.BANK_TRANSFER_TICKETS}/${currentTicketId}/submit`,
        );

        toast.success("Request submitted successfully!");
        setAmount("");
        setBankRef("");
        setDescription("");
        setAttachment(null);
        setBankStep("details");
        setShowBankInfo(true);

        await fetchTransactions(1);
        fetchProfile();
      }
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Something went wrong");
    } finally {
      setIsRedirectingToStripe(false);
      setIsProcessing(false);
    }
  };

  const quickAmounts = [100, 200, 300, 400];

  return (
    <>
      {isRedirectingToStripe && <StripeRedirectLoader />}
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-end justify-between border-b border-gray-100 pb-6 px-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">
              Available Balance
            </span>
            <h2 className="text-(--maincolor) text-2xl md:text-3xl font-bold">
              €{user?.wallet_balance || "0.00"}
            </h2>
          </div>

          <div className="flex gap-2 bg-gray-50 p-1.5 rounded-full border border-gray-100">
            <button
              onClick={() => setActiveTab("history")}
              className={`text-[10px] font-semibold uppercase px-5 py-2 rounded-full cursor-pointer transition-all duration-300 ${activeTab === "history" ? "bg-(--maincolor) text-white" : "text-gray-400 hover:text-gray-600"}`}
            >
              History
            </button>
            {canManage && (
              <button
                onClick={() => setActiveTab("funds")}
                className={`text-[10px] font-semibold uppercase px-5 py-2 rounded-full cursor-pointer transition-all duration-300 ${activeTab === "funds" ? "bg-(--maincolor) text-white" : "text-gray-400 hover:text-gray-600"}`}
              >
                Add Funds
              </button>
            )}
          </div>
        </div>

        {activeTab === "funds" ? (
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-500">
            <div className="bg-[#F9FAFB] px-8 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex gap-8">
                {isPaymentMethodAllowed("Stripe", user?.business_group) && (
                  <button
                    onClick={() => setMethod("stripe")}
                    className={`text-[11px] font-bold uppercase transition-all relative py-2 cursor-pointer ${method === "stripe" ? "text-(--maincolor)" : "text-gray-400 hover:text-(--maincolor)"}`}
                  >
                    Card Payment
                    {method === "stripe" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-(--maincolor) rounded-full" />
                    )}
                  </button>
                )}
                {isDirectBankTransferAllowed(
                  user?.business_group,
                  user?.customer_type,
                  user?.employer_type,
                ) && (
                    <button
                      onClick={() => {
                        setMethod("bank");
                        setBankStep("details");
                        setShowBankInfo(true);
                        if (!activeTicket && !currentTicketId) {
                          generateBankID();
                        }
                      }}
                      className={`text-[11px] font-bold uppercase transition-all flex items-center gap-2 relative py-2 cursor-pointer ${method === "bank" ? "text-(--maincolor)" : "text-gray-400 hover:text-(--maincolor)"}`}
                    >
                      <span>Bank Transfer</span>
                      {method === "bank" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-(--maincolor) rounded-full" />
                      )}
                      <div className="group/tip relative inline-block normal-case">
                        <Info className="h-4 w-4 text-gray-400 hover:text-(--maincolor) cursor-help transition-colors" />
                        <div className="absolute top-full left-0 mt-4 w-52 sm:w-72 p-5 bg-(--maincolor) text-white text-[11px] font-normal rounded-2xl shadow-2xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-500 z-10 pointer-events-none border border-white/10 -translate-x-40 md:-translate-x-12">
                          <div className="space-y-3">
                            <p className="font-bold border-b border-white/10 pb-2 flex items-center gap-2 text-[12px]">
                              <span className="w-4 h-4 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] border border-white/20 font-bold">
                                i
                              </span>
                              How it Works
                            </p>
                            <ul className="space-y-3">
                              <li className="flex gap-2.5">
                                <span className="text-white/50 font-bold shrink-0">
                                  01.
                                </span>
                                <span className="text-left text-[11px]">
                                  Transfer funds to our IBAN using your Unique
                                  Reference.
                                </span>
                              </li>
                              <li className="flex gap-2.5">
                                <span className="text-white/50 font-bold shrink-0">
                                  02.
                                </span>
                                <span className="text-left text-[11px]">
                                  Click Confirm Payment and enter the exact
                                  amount deposited.
                                </span>
                              </li>
                              <li className="flex gap-2.5">
                                <span className="text-white/50 font-bold shrink-0">
                                  03.
                                </span>
                                <span className="text-left text-[11px]">
                                  Our team verifies and tops up your balance
                                  within 24 business hours.
                                </span>
                              </li>
                            </ul>
                          </div>
                          {/* Tooltip Arrow pointing UP */}
                          <div className="absolute bottom-full left-1/2 sm:left-[52px] -mb-1 border-8 border-transparent border-b-(--maincolor)" />
                        </div>
                      </div>
                    </button>
                  )}
              </div>
            </div>

            <div className="max-w-xl mx-auto p-5">
              {method === "stripe" && (
                <form onSubmit={handleProceedToPayment} className="space-y-10">
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {quickAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAmount(amt.toString())}
                          className={`py-4 px-2 rounded-md text-base font-medium transition-all border cursor-pointer ${amount === amt.toString() ? "bg-(--btncolor) text-white border-(--btncolor) shadow-md" : "bg-white text-gray-500 border-gray-200 hover:border-(--btncolor) hover:text-(--btncolor)"}`}
                        >
                          €{amt}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-2xl font-bold font-mainfont">
                        €
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-[#E5E7EB] rounded-md outline-none text-(--maincolor) text-2xl font-bold focus:bg-white focus:border-(--maincolor) transition-all placeholder:text-gray-300"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="!text-sm text-gray-400 uppercase text-center font-semibold mb-6">
                      Minimum Required: €{MIN_TOPUP_AMOUNT.toFixed(2)}
                    </p>
                  </div>

                  <button
                    disabled={isProcessing}
                    data-hover="Proceed to Payment"
                    className="btn
                      w-full h-14 sm:h-15
                      px-6 lg:px-8 py-2
                      bg-(--maincolor)
                      text-sm md:text-base
                      before:bg-(--maincolor)
                      before:border-(--maincolor)
                      before:px-6 before:lg:px-8
                      font-bold uppercase transition-all active:scale-[0.98] shadow-sm cursor-pointer"
                  >
                    Proceed to Payment
                  </button>
                </form>
              )}

              {method === "bank" &&
                (bankStep === "details" || bankStep === "confirmation") && (
                  <div className="space-y-10 animate-in slide-in-from-top-2">
                    {/* Simplified Bank Details */}
                    <div className="space-y-6">
                      {showBankInfo && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-1 duration-300">
                          <div className="flex flex-col gap-1">
                            <div className="text-gray-400 text-xs font-semibold uppercase block">
                              IBAN Address
                            </div>
                            <p className="!text-lg font-semibold text-(--maincolor)">
                              {BANK_INFO.IBAN}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="text-gray-400 text-xs font-semibold uppercase block">
                              BIC / SWIFT
                            </div>
                            <p className="!text-lg font-semibold text-(--maincolor)">
                              {BANK_INFO.BIC}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="text-gray-400 text-xs font-semibold uppercase block">
                              Transaction Reference
                            </div>
                            <p className="!text-lg font-semibold text-(--maincolor)">
                              {userRef ||
                                (isProcessing ? "Generating..." : "---")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {latestNotification && (
                      <div className="space-y-5 animate-in fade-in duration-500">
                        {latestNotification.status === "approved" ? (
                          <div className="py-4 border-l-4 border-(--maincolor) pl-6 space-y-1 bg-gray-50 rounded-r-xl">
                            <p className="font-bold text-(--maincolor) uppercase">
                              Previous Request Approved
                            </p>
                            <p className="!text-sm text-gray-600 font-medium">
                              Ticket{" "}
                              {latestNotification.ticket_id.startsWith("#")
                                ? latestNotification.ticket_id
                                : `#${latestNotification.ticket_id}`}{" "}
                              was successfully processed.
                            </p>
                          </div>
                        ) : (
                          latestNotification.status === "rejected" && (
                            <div className="py-4 border-l-4 border-gray-300 pl-6 space-y-1 bg-gray-50 rounded-r-xl">
                              <p className="font-bold text-gray-800 uppercase">
                                Previous Request Rejected
                              </p>
                              <p className="!text-sm text-gray-600 italic">
                                Ticket{" "}
                                {latestNotification.ticket_id.startsWith("#")
                                  ? latestNotification.ticket_id
                                  : `#${latestNotification.ticket_id}`}{" "}
                                was rejected.{" "}
                                {latestNotification.rejection_reason &&
                                  `Reason: ${latestNotification.rejection_reason}`}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {activeTicket?.status === "pending" && (
                      <div className="py-4 border-l-4 border-gray-200 pl-6 space-y-2 bg-gray-50/50 rounded-r-xl">
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-gray-600 uppercase">
                            Verification in Progress
                          </p>
                          <CountdownTimer
                            submittedAt={activeTicket.submitted_at}
                          />
                        </div>
                        <p className="!text-sm text-gray-500 leading-relaxed max-w-sm">
                          Your ticket{" "}
                          <span className="font-mono font-bold">
                            {activeTicket.ticket_id.startsWith("#")
                              ? activeTicket.ticket_id
                              : `#${activeTicket.ticket_id}`}
                          </span>{" "}
                          is being verified. Please wait before creating a new
                          request.
                        </p>
                      </div>
                    )}

                    {bankStep === "details" &&
                      (!activeTicket || activeTicket.status === "draft") && (
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              if (currentTicketId) {
                                setIsEmailModalOpen(true);
                                setEmailSuccess(false);
                              } else {
                                toast.error(
                                  "Generating reference... please wait.",
                                );
                              }
                            }}
                            className="flex-1 p-3 h-13 bg-white text-(--maincolor) border-1 border-(--maincolor) rounded-md text-sm uppercase font-bold transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                          >
                            Send Bank Details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBankStep("confirmation");
                              setBankRef(userRef);
                              setShowBankInfo(false);
                            }}
                            className="flex-1 p-3 h-13 bg-(--maincolor) text-white rounded-md text-sm uppercase font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all active:translate-y-0 cursor-pointer"
                          >
                            Confirm Payment
                          </button>
                        </div>
                      )}

                    {bankStep === "confirmation" &&
                      activeTicket?.status !== "pending" && (
                        <form
                          onSubmit={handleSubmit}
                          className="space-y-8 animate-in fade-in duration-500 -mt-6"
                        >
                          <div className="space-y-6">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-[#4B5563] uppercase mb-1 block">
                                Deposit Amount (€)
                              </label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                                  €
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min={MIN_TOPUP_AMOUNT}
                                  value={amount}
                                  onChange={(e) => setAmount(e.target.value)}
                                  className="w-full h-12 pl-8 pr-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-md outline-none text-sm font-normal text-(--maincolor) focus:bg-white focus:border-[var(--maincolor)] transition-all placeholder:text-gray-300"
                                  placeholder="0.00"
                                  required
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-[#4B5563] uppercase mb-1 block">
                                Internal Reference / UTR Number
                              </label>
                              <input
                                type="text"
                                value={bankRef}
                                onChange={(e) => setBankRef(e.target.value)}
                                className="w-full h-12 px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-md outline-none text-sm font-normal text-(--maincolor) focus:bg-white focus:border-[var(--maincolor)] transition-all placeholder:text-gray-300"
                                placeholder="Enter transaction ID"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-[#4B5563] uppercase mb-1 block">
                                Verification Notes (Optional)
                              </label>
                              <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-md outline-none text-sm font-normal text-(--maincolor) focus:bg-white focus:border-(--maincolor) transition-all placeholder:text-gray-300 resize-none font-mainfont resize-y"
                                placeholder="Add any helpful notes for our team..."
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-[#4B5563] uppercase mb-1 block">
                                Transfer Confirmation (Optional)
                              </label>
                              <div
                                onClick={() => fileInputRef.current?.click()}
                                className="group cursor-pointer w-full px-4 py-3 bg-gray-50 border border-[#E5E7EB] border-dashed rounded-md outline-none hover:bg-white hover:border-(--maincolor) transition-all flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center group-hover:bg-[var(--maincolor)]/5 transition-colors">
                                    <Upload className="h-4 w-4 text-gray-400 group-hover:text-[var(--maincolor)]" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span
                                      className={`text-sm font-mainfont font-semibold ${attachment ? "text-[var(--maincolor)]" : "text-gray-500"}`}
                                    >
                                      {attachment
                                        ? attachment.name
                                        : "Attach Transfer Receipt"}
                                    </span>
                                    {!attachment && (
                                      <span className="text-[10px] text-gray-400 font-normal uppercase">
                                        PNG, JPG or PDF
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {attachment && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAttachment(null);
                                    }}
                                    className="p-1.5 hover:bg-red-50 rounded-full text-red-400 hover:text-red-600 transition-colors"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 5 * 1024 * 1024) {
                                      toast.error(
                                        "File size must be less than 5MB",
                                      );
                                      return;
                                    }
                                    setAttachment(file);
                                  }
                                }}
                                accept="image/*,.pdf"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setBankStep("details");
                                setShowBankInfo(true);
                              }}
                              className="flex-1 p-3 h-13 bg-white text-(--maincolor) border-1 border-(--maincolor) rounded-md text-sm uppercase font-bold transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                            >
                              Back
                            </button>
                            <button
                              disabled={isProcessing}
                              className="flex-1 p-3 h-13 bg-(--maincolor) text-white rounded-md text-sm uppercase font-bold transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
                            >
                              {isProcessing
                                ? "Processing..."
                                : "Confirm Payment"}
                            </button>
                          </div>
                        </form>
                      )}
                  </div>
                )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <DataTable
              columns={[
                {
                  header: "Reference",
                  key: "transaction_id",
                  render: (trx: Transaction) => (
                    <div className="flex flex-col gap-1 min-w-[220px]">
                      <span className="text-[11px] font-mono font-bold text-gray-500 uppercase">
                        ID: {trx.transaction_id?.substring(0, 8) || "N/A"}...
                      </span>
                      <span className="text-xs text-gray-500 font-medium normal-case line-clamp-2">
                        {trx.description || "No description"}
                      </span>
                    </div>
                  ),
                },
                {
                  header: "Method",
                  key: "payment_method",
                  render: (trx: Transaction) => (
                    <div className="text-xs text-[var(--maincolor)]/60 uppercase font-bold font-mainfont">
                      {trx.payment_method === "stripe" ? (
                        <Image
                          src="/images/stripe-logo.png"
                          alt="Stripe"
                          width={40}
                          height={20}
                          className="h-4 w-auto object-contain opacity-80"
                        />
                      ) : (
                        <span className="font-bold">
                          {trx.payment_method?.replace("_", " ") || "Payment"}
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  header: "Status",
                  key: "status",
                  render: (trx: Transaction) => (
                    <span
                      className={`text-[10px] uppercase px-2 py-0.5 rounded-md font-bold font-mainfont border ${
                        trx.status?.toLowerCase() === "complete" ||
                        trx.status?.toLowerCase() === "approved"
                          ? "bg-emerald-50/50 text-emerald-600 border-emerald-100"
                          : trx.status?.toLowerCase() === "rejected" ||
                              trx.status?.toLowerCase() === "failed" ||
                              trx.status?.toLowerCase() === "cancelled"
                            ? "bg-red-50/50 text-red-600 border-red-100 italic"
                            : "bg-gray-50 text-gray-400 border-gray-200"
                      }`}
                    >
                      {trx.status}
                    </span>
                  ),
                },
                {
                  header: "Amount",
                  key: "amount",
                  className: "text-right",
                  render: (trx: Transaction) => (
                    <span
                      className={`text-base font-mainfont font-bold ${
                        trx.status === "failed" || trx.status === "cancelled"
                          ? "text-gray-300 line-through"
                          : "text-[var(--maincolor)]"
                      }`}
                    >
                      {trx.display_amount}
                    </span>
                  ),
                },
                {
                  header: "Date & Time",
                  key: "created_at",
                  className: "text-right",
                  render: (trx: Transaction) => (
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900 font-bold whitespace-nowrap">
                        {new Date(trx.created_at).toLocaleDateString("en-IE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium uppercase">
                        {new Date(trx.created_at).toLocaleTimeString("en-IE", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  ),
                },
                {
                  header: "Info",
                  key: "type_info",
                  className: "text-center",
                  render: (trx: Transaction) => {
                    if (trx.type !== "promotional_balance") return "—";
                    const expiryDate = getPromotionalExpiryDate(trx.created_at);
                    return (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.info(
                            `Promotional balance expires on ${formatDisplayDate(expiryDate)}.`,
                          );
                        }}
                        className="inline-flex items-center justify-center p-1.5 rounded-md border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors cursor-pointer"
                        title={`Expires on ${formatDisplayDate(expiryDate)}`}
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    );
                  },
                },
              ]}
              data={transactions}
              loading={isLoadingLogs}
              emptyMessage="No wallet activity records found"
              getRowClassName={(trx: Transaction) =>
                trx.type === "promotional_balance"
                  ? "bg-violet-50/40 hover:!bg-violet-100/40"
                  : ""
              }
              getExpandedRowClassName={(trx: Transaction) =>
                trx.type === "promotional_balance" ? "bg-violet-50/60" : "bg-gray-50/50"
              }
              renderExpandedRow={(trx: Transaction) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-5 bg-white rounded-xl border border-gray-100 animate-in slide-in-from-top-1">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-tight">
                        Description
                      </h3>
                      <p className="text-sm text-gray-600 font-normal leading-relaxed">
                        {trx.description ||
                          "ID: " + (trx.transaction_id || "N/A")}
                      </p>
                    </div>

                    {trx.admin_notes && (
                      <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 space-y-1.5">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                          <Info size={11} />
                          Admin Remarks
                        </span>
                        <p className="text-xs text-gray-500 font-normal uppercase">
                          {trx.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-tight">
                      Balance Audit
                    </h3>
                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 space-y-2.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-gray-400 font-medium">
                          Prior Balance
                        </span>
                        <span className="text-gray-500 font-semibold">
                          €{parseFloat(trx.balance_before || "0").toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-gray-400 font-medium tracking-tight">
                          Transaction
                        </span>
                        <span
                          className={`font-bold ${trx.type === "credit" ? "text-emerald-500" : "text-red-400"}`}
                        >
                          {trx.type === "credit" ? "+" : "-"}€
                          {parseFloat(trx.amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase">
                          Closing Balance
                        </span>
                        <span className="text-base font-bold text-(--maincolor)">
                          €
                          {parseFloat(
                            trx.balance_after || trx.last_balance || "0",
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {trx.rejection_reason && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                        <span className="text-[10px] font-black text-red-600 uppercase block mb-1">
                          Rejection Reason
                        </span>
                        <p className="text-xs text-red-700 font-bold">
                          {trx.rejection_reason}
                        </p>
                      </div>
                    )}

                    {trx.original_amount &&
                      trx.original_amount !== trx.amount && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400 uppercase font-bold text-[9px]">
                            Original Amount:
                          </span>
                          <span className="text-gray-500 line-through">
                            €{trx.original_amount}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}
            />
            {hasMore && (
              <div ref={observerTarget} className="py-8 flex justify-center">
                {isFetchingMore && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-[11px] font-bold uppercase">
                      Loading older records...
                    </span>
                  </div>
                )}
              </div>
            )}
            {!hasMore && transactions.length > 0 && (
              <p className="text-center text-gray-400 text-[10px] uppercase font-bold py-8">
                End of transaction history
              </p>
            )}
          </div>
        )}
      </div>

      {mounted &&
        createPortal(
          <>
            {/* Payment Confirmation Modal */}
            {isPaymentModalOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                <div
                  className="absolute inset-0 bg-(--maincolor)/40 backdrop-blur-md animate-in fade-in duration-300"
                  onClick={() => !isProcessing && setIsPaymentModalOpen(false)}
                />
                <div className="relative w-full max-w-lg bg-white md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10 transition-all">
                  {/* Header */}
                  <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="size-5 text-(--maincolor)" />
                        Payment Method
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Top up your wallet with €{parseFloat(amount).toFixed(2)}
                      </p>
                    </div>
                    {!isProcessing && (
                      <button
                        onClick={() => setIsPaymentModalOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="size-5 text-gray-500" />
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                      {/* Provider Selection Row */}
                      <div className="flex items-center gap-2 text-slate-500 justify-center mb-2">
                        <svg
                          className="size-4 opacity-70"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                          />
                        </svg>
                        <span className="text-xs font-medium">
                          Secure payment via
                        </span>
                        <Image
                          src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                          alt="Stripe"
                          width={40}
                          height={16}
                          unoptimized
                          className="h-3.5 w-auto translate-y-px opacity-80"
                        />
                      </div>

                      <div className="space-y-4">
                        {isFetchingCards ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="size-6 animate-spin text-(--maincolor)" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {savedCards.length > 0 && (
                              <div className="space-y-2.5">
                                <p className="text-[10px] font-bold text-(--maincolor) uppercase mb-2">
                                  Your Saved Cards
                                </p>
                                {savedCards.map((card) => (
                                  <div
                                    key={card.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCardId(card.id);
                                    }}
                                    className={`p-3.5 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                                      selectedCardId === card.id
                                        ? "border-(--maincolor) bg-white shadow-sm"
                                        : "border-gray-50 bg-gray-50/50 hover:border-gray-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="p-1 px-2 rounded bg-white border border-gray-100">
                                        <span className="text-[10px] font-black italic text-blue-900 uppercase">
                                          {card.brand}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-gray-800">
                                          •••• {card.last4}
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                          Expires {card.exp_month}/
                                          {card.exp_year}
                                        </p>
                                      </div>
                                    </div>
                                    {selectedCardId === card.id && (
                                      <div className="size-5 bg-(--maincolor) rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="size-3 text-white" />
                                      </div>
                                    )}
                                  </div>
                                ))}

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCardId(null);
                                  }}
                                  className={`w-full p-3 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 text-sm font-bold cursor-pointer ${
                                    !selectedCardId
                                      ? "border-(--maincolor) bg-white text-(--maincolor)"
                                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                                  }`}
                                >
                                  <CreditCard className="size-4" />
                                  Use a new card
                                </button>
                              </div>
                            )}

                            {!selectedCardId && (
                              <div className="bg-white p-4 rounded-xl border border-(--maincolor)/10">
                                <StripePaymentForm
                                  saveCard={saveCard}
                                  setSaveCard={setSaveCard}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 bg-gray-50 border-t mt-auto">
                    <div className="flex items-center gap-2 text-gray-500 mb-4 px-2">
                      <ShieldCheck className="size-4 text-emerald-600 font-bold" />
                      <span className="text-[11px] font-medium leading-none">
                        Your payment information is encrypted and secure.
                      </span>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={isProcessing}
                      className="w-full py-4 bg-(--maincolor) text-white font-bold rounded-2xl shadow-xl shadow-(--maincolor)/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="size-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Pay Now"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Email Modal */}
            {isEmailModalOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                <div
                  className="absolute inset-0 bg-(--maincolor)/20 backdrop-blur-sm animate-in fade-in duration-300"
                  onClick={() => !isSendingEmail && setIsEmailModalOpen(false)}
                />
                <div className="relative w-full max-w-[380px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 z-10 transition-all origin-center mx-auto">
                  {!emailSuccess ? (
                    <div className="p-7 sm:p-9 space-y-7 text-center">
                      <div className="space-y-2">
                        <h3 className="text-(--maincolor) text-xl sm:text-2xl font-bold tracking-tight">
                          Receive Details
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                          We&apos;ll send the reference{" "}
                          <span className="font-bold text-emerald-600">
                            {userRef}
                          </span>{" "}
                          and IBAN info to:
                        </p>
                      </div>

                      <form onSubmit={handleSendEmail} className="space-y-6">
                        <div className="space-y-4">
                          {emails.map((email, idx) => (
                            <div
                              key={idx}
                              className="relative flex items-center gap-2 group"
                            >
                              <div className="relative flex-1">
                                <input
                                  type="email"
                                  value={email}
                                  onChange={(e) => {
                                    const newEmails = [...emails];
                                    newEmails[idx] = e.target.value;
                                    setEmails(newEmails);
                                  }}
                                  required={idx === 0}
                                  className="w-full h-12 px-4 py-3 bg-gray-50 border border-gray-100 rounded-md outline-none text-base font-medium text-(--maincolor) focus:bg-white focus:border-[var(--maincolor)] transition-all placeholder:text-gray-300"
                                  placeholder={
                                    idx === 0
                                      ? "Primary email"
                                      : `Additional email ${idx + 1}`
                                  }
                                />
                              </div>
                              {emails.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newEmails = emails.filter(
                                      (_, i) => i !== idx,
                                    );
                                    setEmails(newEmails);
                                  }}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                                  title="Remove email"
                                >
                                  <X className="size-4" />
                                </button>
                              )}
                            </div>
                          ))}

                          {emails.length < 3 && (
                            <button
                              type="button"
                              onClick={() => setEmails([...emails, ""])}
                              className="w-full h-12 px-4 py-3 border-1 border-dashed border-gray-400 rounded-md text-xs font-bold text-gray-400 uppercase hover:border-(--maincolor) hover:text-(--maincolor) transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <span className="text-lg">+</span> Add Recipient
                            </button>
                          )}
                        </div>
                        <p className="!text-sm !text-gray-400 font-medium italic ml-1">
                          * You can add up to 3 recipients (max).
                        </p>

                        <div className="flex flex-col gap-3 pt-2">
                          <button
                            type="submit"
                            disabled={isSendingEmail}
                            className="w-full h-13 p-3 bg-(--maincolor) text-white rounded-md text-xs uppercase font-bold hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                          >
                            {isSendingEmail ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              "Send Details Now"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEmailModalOpen(false)}
                            disabled={isSendingEmail}
                            className="w-full p-3 text-xs text-gray-400 uppercase font-bold hover:text-(--maincolor) transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="p-10 sm:p-12 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                        <svg
                          className="w-10 h-10 text-emerald-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-mainfont font-bold text-(--maincolor)">
                          Details Sent!
                        </h3>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">
                          The bank information is on its way. Please check your
                          inbox (and spam folder) within the next few minutes.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsEmailModalOpen(false)}
                        className="w-full py-4 bg-emerald-600 text-white rounded-xl text-xs uppercase font-bold hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all active:scale-[0.95]"
                      >
                        Got it, thanks!
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>,
          document.body,
        )}
    </>
  );
}

function CountdownTimer({ submittedAt }: { submittedAt: string | null }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  useEffect(() => {
    if (!submittedAt) return;
    const target = new Date(submittedAt).getTime() + 24 * 60 * 60 * 1000;
    const updateFunc = () => {
      const distance = target - new Date().getTime();
      if (distance < 0) {
        setTimeLeft("00:00:00");
        return;
      }
      const h = Math.floor(distance / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
      );
    };
    updateFunc();
    const iv = setInterval(updateFunc, 1000);
    return () => clearInterval(iv);
  }, [submittedAt]);
  return (
    <div className="flex items-center gap-1.5 bg-amber-100/50 px-2 py-1 rounded-md">
      <span className="text-[9px] font-bold text-amber-700 uppercase">
        ETA:
      </span>
      <span className="text-[10px] font-mono font-bold text-amber-900">
        {timeLeft || "--:--:--"}
      </span>
    </div>
  );
}
