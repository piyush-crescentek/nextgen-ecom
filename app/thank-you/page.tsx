"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { toast } from "sonner";
import { useFormStore } from "@/store/useFormStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { useCartStore } from "@/store/useCartStore";
import { clearConsultationSessionStorage } from "@/lib/consultationSession";

interface OrderDetails {
    id: number;
    increment_id: string;
    status: string;
    grand_total: number;
    grand_total_formatted: string;
    payment_method: string;
    customer: {
        name: string;
        email: string;
        phone: string;
    };
    shipping_address: {
        address: string;
        city: string;
        state: string;
        postcode: string;
        country: string;
        full_address: string;
    };
    items: Array<{
        product_id: number;
        sku: string;
        name: string;
        price: number;
        qty: number;
        total: number;
    }>;
    payment_details: {
        transaction_id: number | string;
        stripe_payment_intent: string;
        currency: string;
    };
    created_at: string;
}

function ThankYouContent() {
    const searchParams = useSearchParams();

    // Support new multi-ID params (mixed orders) AND legacy single orderId param
    const orderType = searchParams.get("orderType");
    const digitalOrderId = searchParams.get("digitalOrderId");
    const physicalOrderId = searchParams.get("physicalOrderId");
    const legacyOrderId = searchParams.get("orderId");

    // Pick the best available ID: prefer digital for mixed, fall back to physical, then legacy
    const resolvedOrderId = digitalOrderId || physicalOrderId || legacyOrderId;

    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const lastTrackedOrderId = React.useRef<string | null>(null);

    const sessionId = searchParams.get("sessionId");

    useEffect(() => {
        if (!sessionId) return;

        useFormStore.getState().clearProgress(sessionId);
        useCheckoutStore.getState().clearCheckoutData(sessionId);
        clearConsultationSessionStorage(sessionId);

        const orderType = (searchParams.get("orderType") || "").toLowerCase();
        if (orderType === "physical" || orderType === "mixed") {
            useCartStore.getState().clearCart();
        }
    }, [searchParams, sessionId]);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!resolvedOrderId) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await api.get(API_ENDPOINTS.ORDER_DETAILS(resolvedOrderId), {
                    params: { order_type: orderType }
                });
                const orderData = response.data.data || response.data;
                if (orderData && (orderData.id || orderData.increment_id)) {
                    setOrder(orderData);
                }
            } catch (error) {
                console.error("Failed to fetch order details:", error);
                toast.error("Could not load order details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderDetails();
    }, [resolvedOrderId, orderType]);

    useEffect(() => {
        if (!order) {
            console.warn("[thank-you][purchase] Skipped: order not available yet");
            return;
        }

        const transactionId = String(order.increment_id || order.id || "");
        if (!transactionId) {
            console.warn("[thank-you][purchase] Skipped: missing transaction id", { order });
            return;
        }
        if (lastTrackedOrderId.current === transactionId) {
            console.warn("[thank-you][purchase] Skipped: already tracked", { transactionId });
            return;
        }

        const win = window as Window & { dataLayer?: Array<Record<string, unknown>> };
        win.dataLayer = win.dataLayer || [];
        const purchasePayload = {
            event: "purchase",
            ecommerce: {
                transaction_id: transactionId,
                value: Number(order.grand_total || 0),
                currency: order.payment_details?.currency || "EUR",
                tax: 0,
                shipping: 0,
                items: (order.items || []).map((i) => ({
                    item_id: i.sku,
                    item_name: i.name,
                    price: Number(i.price || 0),
                    quantity: Number(i.qty || 0),
                })),
            },
        };

        console.warn("[thank-you][purchase] Reset ecommerce object");
        win.dataLayer.push({ ecommerce: null });
        win.dataLayer.push(purchasePayload);
        console.warn("[thank-you][purchase] Event pushed", {
            transactionId,
            payload: purchasePayload,
            dataLayerLength: win.dataLayer.length,
        });

        lastTrackedOrderId.current = transactionId;
    }, [order]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--maincolor)" />
            </div>
        );
    }

    const isMixed = orderType === "mixed";

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Thank you for your order!</h1>
                <p className="text-slate-500">
                    Your order{" "}
                    {order?.increment_id && (
                        <span className="font-semibold text-slate-900">
                            {order.increment_id.startsWith('#') ? order.increment_id : `#${order.increment_id}`}
                        </span>
                    )}{" "}
                    has been placed successfully.
                    {order?.customer?.email && (
                        <> We&apos;ve sent a confirmation email to{" "}
                            <span className="text-slate-900 font-medium">{order.customer.email}</span>.
                        </>
                    )}
                </p>

                {/* Show both order IDs for mixed orders */}
                {isMixed && (digitalOrderId || physicalOrderId) && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center text-xs">
                        {digitalOrderId && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-full">
                                Digital Order ID: {digitalOrderId.startsWith('#') ? digitalOrderId : `#${digitalOrderId}`}
                            </span>
                        )}
                        {physicalOrderId && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-full">
                                Physical Order ID: {physicalOrderId.startsWith('#') ? physicalOrderId : `#${physicalOrderId}`}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Order Summary */}
            {order && (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-8">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                        <h2 className="font-bold text-slate-900">Order Summary</h2>
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-blue-50 text-blue-600 rounded">
                            {order.status}
                        </span>
                    </div>

                    <div className="px-6 divide-y divide-slate-100">
                        {order.items?.map((item, index) => (
                            <div key={index} className="py-4 flex justify-between items-center">
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900">{item.name}</p>
                                    <p className="text-xs text-slate-500">Qty: {item.qty} × €{Number(item.price).toFixed(2)}</p>
                                </div>
                                <p className="font-bold text-slate-900">€{Number(item.total).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-50 px-6 py-4 flex justify-between items-center">
                        <span className="text-lg font-bold text-slate-900">Total</span>
                        <span className="text-2xl font-bold text-(--maincolor)">
                            {order.grand_total_formatted || `€${Number(order.grand_total || 0).toFixed(2)}`}
                        </span>
                    </div>
                </div>
            )}

            {/* Grid for Address & Payment */}
            {order && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    {order.shipping_address && (
                        <div>
                            <h3 className="font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Delivery Address</h3>
                            <div className="text-sm text-slate-600 space-y-1">
                                <p className="font-bold text-slate-900">{order.customer?.name}</p>
                                <p>{order.shipping_address.address}</p>
                                <p>{order.shipping_address.city}{order.shipping_address.state ? `, ${order.shipping_address.state}` : ''} {order.shipping_address.postcode}</p>
                                <p>{order.shipping_address.country}</p>
                                {order.customer?.phone && <p className="pt-2 text-slate-400">{order.customer.phone}</p>}
                            </div>
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Payment Information</h3>
                        <div className="text-sm text-slate-600 space-y-3">
                            {order.payment_method && (
                                <div className="flex justify-between">
                                    <span>Payment Method:</span>
                                    <span className="font-medium text-slate-900 capitalize">{order.payment_method}</span>
                                </div>
                            )}
                            {order.payment_details?.transaction_id && (
                                <div className="flex justify-between">
                                    <span>Transaction ID:</span>
                                    <span className="font-mono text-xs">{order.payment_details.transaction_id}</span>
                                </div>
                            )}
                            {order.created_at && (
                                <div className="flex justify-between">
                                    <span>Date:</span>
                                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* No order data fallback */}
            {!order && !isLoading && (
                <div className="bg-white border border-slate-200 rounded-lg px-6 py-10 text-center mb-8">
                    <p className="text-slate-500 text-sm">Order details are being processed. Check your email for confirmation.</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Link
                    href="/profile/orders"
                    className="flex-1 flex items-center justify-center gap-2 bg-(--maincolor) text-white font-bold py-4 rounded-lg hover:opacity-90 transition-all"
                >
                    View Order Details <ChevronRight size={18} />
                </Link>
            </div>

            <div className="mt-12 text-center">
                <Link href="/" className="text-sm text-(--maincolor) font-bold hover:underline">
                    Continue Shopping
                </Link>
            </div>
        </div>
    );
}

export default function ThankYouPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--maincolor)" />
            </div>
        }>
            <div className="min-h-screen bg-slate-50/30 pt-20">
                <ThankYouContent />
            </div>
        </Suspense>
    );
}
