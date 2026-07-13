"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Loader2,
  Stethoscope,
  Eye,
  Download,
} from "lucide-react";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import CustomDatePicker from "@/components/forms/CustomDatePicker";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItemProductCategory {
  id: number;
  name: string;
  slug: string;
}

interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  product_type: string;
  product_slug?: string;
  product_category?: OrderItemProductCategory;
  appointment?: {
    id: number;
    doctor_name: string;
    clinic_name: string;
    scheduled_at: string;
    duration: number;
    status: string;
  };
  scheduled_at?: string;
  doctor_name?: string;
  clinic_name?: string;
}

interface ShippingInfo {
  status: string;
  tracking_number: string | null;
  dispatch_date: string | null;
  delivery_date: string | null;
}

interface AddressInfo {
  address: string;
  city: string;
  postcode: string;
  country: string;
}

interface DiscountInfo {
  name: string;
  group_id: number;
  new_price: number;
  percentage: number;
  original_price: number;
  discount_amount: number;
}

interface OrderRecord {
  id: number;
  order_id: string;
  order_type: "digital" | "physical" | "mixed";
  title: string;
  payment_status: string;
  order_status: string;
  payment_method: string;
  amount: number;
  display_amount: string;
  currency: string;
  item_count: number;
  items: OrderItem[];
  shipping: ShippingInfo | null;
  address: AddressInfo | null;
  discount_info: DiscountInfo | null;
  note?: string | null;
  assigned_to?: string | number | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  data: OrderRecord[];
}

type SortOrder = "asc" | "desc";
type SortBy = "created_at" | "updated_at" | "amount" | "status";
type OrderTypeFilter = "" | "digital" | "physical" | "mixed" | "appointment";

function getCertificateLinks(data: unknown): {
  previewUrl?: string;
  downloadUrl?: string;
} {
  if (!data || typeof data !== "object") return {};
  const record = data as Record<string, unknown>;
  const previewUrl =
    typeof record.preview_url === "string" ? record.preview_url : undefined;
  const downloadUrl =
    typeof record.download_url === "string" ? record.download_url : undefined;
  return { previewUrl, downloadUrl };
}

function normalizeCertificateEndpoint(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    const endpoint = `${parsed.pathname}${parsed.search}`.replace(/^\/+/, "");
    const withoutApiPrefix = endpoint.replace(/^api\//, "");
    if (withoutApiPrefix.startsWith("frontend/orders/")) {
      return withoutApiPrefix;
    }
    return withoutApiPrefix.replace(/^orders\//, "frontend/orders/");
  } catch {
    const endpoint = rawUrl.replace(/^\/+/, "");
    const withoutApiPrefix = endpoint.replace(/^api\//, "");
    if (withoutApiPrefix.startsWith("frontend/orders/")) {
      return withoutApiPrefix;
    }
    return withoutApiPrefix.replace(/^orders\//, "frontend/orders/");
  }
}

function inferFileNameFromHeaders(
  contentDisposition: string | undefined,
  fallback = "certificate.pdf",
): string {
  if (!contentDisposition) return fallback;
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).replace(/["']/g, "");
    } catch {
      return utf8Match[1].replace(/["']/g, "");
    }
  }
  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (plainMatch?.[1]) return plainMatch[1];
  return fallback;
}

async function openCertificateUrlWithAuth(
  rawUrl: string,
  mode: "preview" | "download",
): Promise<void> {
  const endpoint = normalizeCertificateEndpoint(rawUrl);
  if (!endpoint) throw new Error("Certificate URL is missing.");

  const response = await api.get(endpoint, { responseType: "blob" });
  const blob = response.data as Blob;
  const objectUrl = window.URL.createObjectURL(blob);
  const filename = inferFileNameFromHeaders(
    response.headers?.["content-disposition"] as string | undefined,
  );

  if (mode === "download") {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename || "certificate.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    window.open(objectUrl, "_blank", "noopener,noreferrer");
  }

  setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatScheduledAt(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Dublin",
  }).format(date);
}

function getAppointmentInfo(item: OrderItem) {
  return {
    scheduledAt: item.appointment?.scheduled_at || item.scheduled_at || "",
    doctorName: item.appointment?.doctor_name || item.doctor_name || "",
  };
}

function isTreatmentsCategoryItem(item: OrderItem): boolean {
  const cat = item.product_category;
  if (!cat) return false;
  const slug = (cat.slug ?? "").toLowerCase();
  const name = (cat.name ?? "").toLowerCase();
  return slug === "treatments" || name === "treatments";
}

/** Orders where every line is Treatments (e.g. acne) have no certificate PDF to fetch — hide certificate / download UI. */
function orderIsTreatmentsCategoryOnly(items: OrderItem[] | undefined): boolean {
  if (!items?.length) return false;
  return items.every(isTreatmentsCategoryItem);
}

function canShowOrderCertificateActions(
  orderStatusKey: string,
  items: OrderItem[] | undefined,
): boolean {
  const isComplete =
    orderStatusKey === "complete" || orderStatusKey === "completed";
  return isComplete && !orderIsTreatmentsCategoryOnly(items);
}

function formatOrderId(id: string | number) {
  if (!id) return "—";
  const str = String(id);
  return str.startsWith("#") ? str : `#${str}`;
}

function getOrderStatusLabel(order: OrderRecord): string {
  const rawStatus = (order.order_status ?? "").trim();
  const normalizedStatus = rawStatus.toLowerCase();
  const hasAssignee = order.assigned_to !== null && order.assigned_to !== undefined;

  if (normalizedStatus === "complete" || normalizedStatus === "completed")
    return "Order Completed";
  if (normalizedStatus === "cancelled" || normalizedStatus === "canceled")
    return "Order Cancelled";
  if (hasAssignee) return "In Doctor Queue";
  if (normalizedStatus === "awaiting customer response") return "Query Raised";
  if (normalizedStatus === "awaiting admin response") return "In Doctor Queue";
  if (normalizedStatus === "pending") return "Order Received";

  return rawStatus || "—";
}

function getOrderStatusStyle(order: OrderRecord): string {
  const normalizedStatus = (order.order_status ?? "").trim().toLowerCase();
  const hasAssignee = order.assigned_to !== null && order.assigned_to !== undefined;

  if (normalizedStatus === "complete" || normalizedStatus === "completed")
    return "bg-green-50 text-green-700 border-green-200";
  if (normalizedStatus === "cancelled" || normalizedStatus === "canceled")
    return "bg-red-50 text-red-700 border-red-200";
  if (hasAssignee) return "bg-blue-50 text-blue-700 border-blue-200";
  if (normalizedStatus === "pending")
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (normalizedStatus === "awaiting customer response")
    return "bg-orange-50 text-orange-700 border-orange-200";
  if (normalizedStatus === "awaiting admin response")
    return "bg-blue-50 text-blue-700 border-blue-200";

  return (
    ORDER_STATUS_STYLES[normalizedStatus] ??
    "bg-gray-50 text-gray-500 border-gray-100"
  );
}

function getOrderStatusMeaning(order: OrderRecord): string {
  const normalizedStatus = (order.order_status ?? "").trim().toLowerCase();
  const hasAssignee = order.assigned_to !== null && order.assigned_to !== undefined;

  if (normalizedStatus === "complete" || normalizedStatus === "completed") {
    return "Your application has been reviewed and the service outcome has been completed.";
  }
  if (normalizedStatus === "cancelled" || normalizedStatus === "canceled") {
    return "Order has been cancelled and will not be processed.";
  }
  if (hasAssignee || normalizedStatus === "awaiting admin response") {
    return "Your application has been assigned to a doctor and is awaiting medical review.";
  }
  if (normalizedStatus === "awaiting customer response") {
    return "We have emailed you for further information about your application; please check your email and reply.";
  }
  if (normalizedStatus === "pending") {
    return "Your application has been received and is being checked by our clinical admin team.";
  }
  return "Current order status from system.";
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  processing: "bg-blue-50 text-blue-600 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-500 border-red-200",
  shipped: "bg-purple-50 text-purple-600 border-purple-200",
  delivered: "bg-(--blockground) text-(--btncolor) border-(--maincolor)/20",
  complete: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const ORDER_STATUS_BADGE_TEXT_CLASS =
  "text-xs font-medium px-2.5 py-1 rounded-md border w-fit leading-none whitespace-nowrap";
const ORDER_STATUS_LEGEND_ITEMS = [
  {
    label: "Order Received",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    meaning:
      "Your application has been received and is being checked by our clinical admin team.",
  },
  {
    label: "Query Raised",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    meaning:
      "We have emailed you for further information about your application; please check your email and reply.",
  },
  {
    label: "In Doctor Queue",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    meaning:
      "Your application has been assigned to a doctor and is awaiting medical review.",
  },
  {
    label: "Order Completed",
    className: "bg-green-50 text-green-700 border-green-200",
    meaning:
      "Your application has been reviewed and the service outcome has been completed.",
  },
  {
    label: "Order Cancelled",
    className: "bg-red-50 text-red-700 border-red-200",
    meaning: "Order has been cancelled and will not be processed.",
  },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCards() {
  return (
    <div className="space-y-3 md:hidden">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3 animate-pulse"
        >
          <div className="flex justify-between">
            <div className="h-4 bg-gray-100 rounded w-24" />
            <div className="h-4 bg-gray-100 rounded w-16" />
          </div>
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="flex justify-between pt-1 border-t border-gray-50">
            <div className="flex gap-2">
              <div className="h-4 bg-gray-100 rounded w-14" />
              <div className="h-4 bg-gray-100 rounded w-12" />
            </div>
            <div className="h-4 bg-gray-100 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-12 bg-gray-50 border-b border-gray-100" />
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-6 py-4 border-b border-gray-50"
        >
          <div className="h-4 bg-gray-100 rounded w-24" />
          <div className="h-4 bg-gray-100 rounded flex-1" />
          <div className="h-4 bg-gray-100 rounded w-14" />
          <div className="h-4 bg-gray-100 rounded w-16" />
          <div className="h-4 bg-gray-100 rounded w-28" />
          <div className="h-4 bg-gray-100 rounded w-10" />
        </div>
      ))}
    </div>
  );
}

// ─── Detailed View ────────────────────────────────────────────────────────────

function OrderDetailView({
  order,
  onBack,
}: {
  order: OrderRecord;
  onBack: () => void;
}) {
  const orderKey = order.order_status?.toLowerCase() ?? "";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4">
        <button
          onClick={onBack}
          className="w-fit flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-full text-xs font-bold text-gray-500 hover:text-(--maincolor) hover:border-(--maincolor) transition-all shadow-sm cursor-pointer"
        >
          <ChevronLeft className="size-3.5" />
          Back to History
        </button>

        <div className="flex flex-wrap items-end justify-between gap-4 border-b_border-gray-100_pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-(--maincolor)">
                Order Details
              </h1>
              <span
                title={getOrderStatusMeaning(order)}
                aria-label={`${getOrderStatusLabel(order)}: ${getOrderStatusMeaning(order)}`}
                className={`${ORDER_STATUS_BADGE_TEXT_CLASS} ${getOrderStatusStyle(order)}`}
              >
                {getOrderStatusLabel(order)}
              </span>
            </div>
            {/* <p className="ghc-text-body mt-1">Order {formatOrderId(order.order_id)} • {formatDate(order.created_at)}</p> */}
            <p className="ghc-text-body mt-1">
              Order {formatOrderId(order.order_id)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm p-5 space-y-4">
        {order.note && (
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5">
            <p className="text-[11px] font-bold text-amber-700 uppercase mb-1">
              Order Note
            </p>
            <p className="text-sm text-amber-800">{order.note}</p>
          </div>
        )}
        <h2 className="text-base font-bold text-gray-800">Ordered Items</h2>
        <div className="flex flex-col gap-4">
          {/* ── Items ── */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="divide-y divide-gray-50">
              {order.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 space-y-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5">
                      <p className="text-base font-medium text-(--maincolor)">
                        {item.product_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-500 font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                          Qty {item.quantity}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">
                          {item.product_type}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-(--maincolor)">
                        {order.currency === "EUR" ? "€" : order.currency}
                        {(
                          item.total || item.quantity * item.unit_price
                        ).toFixed(2)}
                      </p>
                      <p className="!text-sm text-gray-500 mt-0.5">
                        {order.currency === "EUR" ? "€" : order.currency}
                        {(item.unit_price || 0).toFixed(2)} / unit
                      </p>
                    </div>
                  </div>

                  {getAppointmentInfo(item).scheduledAt && (
                    <div className="flex flex-col gap-1 bg-(--maincolor)/5 p-3 rounded-xl border border-(--maincolor)/10 ml-0">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-(--maincolor) uppercase tracking-wide">
                        <Stethoscope className="size-3.5" />
                        Consultation with Dr.{" "}
                        {getAppointmentInfo(item).doctorName || "—"}
                      </div>
                      <p className="text-[11px] text-gray-500 font-bold pl-5">
                        {formatScheduledAt(
                          getAppointmentInfo(item).scheduledAt,
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── Summary Section ── */}
            <div className="bg-gray-50/50 p-6 border-t border-gray-100 space-y-3">
              {order.discount_info && (
                <>
                  <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase">
                    <span>Subtotal</span>
                    <span className="line-through">
                      {order.currency === "EUR" ? "€" : order.currency}
                      {order.discount_info.original_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-emerald-600 font-bold uppercase">
                    <div className="flex items-center gap-2">
                      <span>Savings</span>
                      <span className="text-[10px] bg-emerald-100/50 px-1.5 py-0.5 rounded leading-none shrink-0 font-bold">
                        {order.discount_info.percentage}%
                      </span>
                    </div>
                    <span>
                      -{order.currency === "EUR" ? "€" : order.currency}
                      {order.discount_info.discount_amount.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="space-y-0.5">
                  <span className="text-base font-bold text-gray-700">
                    Amount Paid
                  </span>
                  {order.discount_info && (
                    <p className="!text-[10px] text-gray-400 font-bold uppercase">
                      {order.discount_info.name}
                    </p>
                  )}
                </div>
                <p className="!text-2xl md:text-3xl font-bold text-(--maincolor) whitespace-nowrap shrink-0 ml-4">
                  {order.display_amount}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl border border-gray-100 p-6 sm:divide-y md:divide-y-0 md:divide-x divide-[#e2e8dfbf]">
            {/* ── Payment Info ── */}
            <div className="space-y-4 pb-6 md:pt-0 md:pb-0 md:pr-6">
              <div className="space-y-4">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-base font-medium text-gray-400">
                    Payment Method
                  </span>
                  <span className="text-sm font-bold text-(--maincolor) capitalize">
                    {order.payment_method || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-base font-medium text-gray-400">
                    Processed
                  </span>
                  <span className="text-sm font-bold text-(--maincolor) text-right">
                    {formatDate(order.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Delivery Info ── */}
            {(order.address ||
              order.order_type === "physical" ||
              order.order_type === "mixed") && (
              <div className="space-y-4 pt-6 md:pt-0 md:pb-0 md:pl-6">
                <h4 className="text-base font-medium text-gray-400 border-b border-gray-50 pb-3">
                  Delivery
                </h4>
                {order.address ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="!text-sm font-bold text-gray-800">
                        {order.address.address}
                      </p>
                      <p className="!text-xs text-gray-500 font-medium">
                        {order.address.city}, {order.address.postcode}
                      </p>
                      <p className="!text-xs text-gray-500 font-medium">
                        {order.address.country}
                      </p>
                    </div>
                    {order.shipping?.status && (
                      <div className="pt-3 border-t border-gray-50">
                        <p className="!text-[10px] text-gray-400 font-bold uppercase mb-1.5">
                          Shipping Status
                        </p>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border leading-none ${ORDER_STATUS_STYLES[order.shipping.status?.toLowerCase()] ?? "bg-gray-50 text-gray-400 border-gray-100"}`}
                        >
                          {order.shipping.status}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic font-medium">
                    Pending delivery details...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function OrderCard({
  row,
  onView,
}: {
  row: OrderRecord;
  onView: (r: OrderRecord) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = React.useState(false);
  const [certificateData, setCertificateData] = React.useState<unknown>(null);
  const [isCertificateLoading, setIsCertificateLoading] = React.useState(false);
  const [isCertificateAssetLoading, setIsCertificateAssetLoading] =
    React.useState(false);
  const [certificateError, setCertificateError] = React.useState<string | null>(
    null,
  );
  const orderKey = row.order_status?.toLowerCase() ?? "";
  const canShowCertificateResult = canShowOrderCertificateActions(
    orderKey,
    row.items,
  );
  const displayedItems = isExpanded ? row.items : row.items?.slice(0, 1);
  const appointmentItems =
    row.items?.filter((item) => !!getAppointmentInfo(item).scheduledAt) ?? [];
  const handleToggleCertificate = async () => {
    if (!canShowCertificateResult) return;
    const nextOpen = !isCertificateOpen;
    setIsCertificateOpen(nextOpen);
    if (!nextOpen || certificateData || isCertificateLoading) return;

    setIsCertificateLoading(true);
    setCertificateError(null);
    try {
      const response = await api.get(
        `${API_ENDPOINTS.CERTIFICATE_ORDER}/${row.order_id}`,
      );
      setCertificateData(response.data);
    } catch (error) {
      console.error("Failed to fetch certificate order details:", error);
      setCertificateError("Unable to load certificate JSON.");
    } finally {
      setIsCertificateLoading(false);
    }
  };
  const certificateLinks = getCertificateLinks(certificateData);
  const hasCertificateLinks =
    !!certificateLinks.previewUrl || !!certificateLinks.downloadUrl;

  return (
    <div
      onClick={() => {
        onView(row);
      }}
      className={`rounded-xl border p-4 space-y-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer ${
        row.note
          ? "bg-amber-50/30 border-amber-200"
          : "bg-white border-gray-100"
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-50 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500">
            {formatOrderId(row.order_id)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {row.discount_info && (
            <span className="text-[10px] text-emerald-600 font-bold uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
              {row.discount_info.percentage}% OFF
            </span>
          )}
          <span className="text-sm font-bold text-(--maincolor)">
            {row.display_amount}
          </span>
        </div>
      </div>

      {row.note && (
        <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-2 font-medium">
          {row.note}
        </div>
      )}

      <div className="space-y-1.5">
        {displayedItems?.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-3 text-sm"
          >
            <span className="text-gray-700 font-bold truncate flex-1">
              {item.product_name}
            </span>
            <span className="text-gray-400 text-xs font-bold whitespace-nowrap">
              ×{item.quantity}
            </span>
          </div>
        ))}
        {(row.items?.length ?? 0) > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-xs font-bold text-(--maincolor) hover:underline"
          >
            {isExpanded
              ? "Show less"
              : `+ ${row.items.length - 1} more items...`}
          </button>
        )}
      </div>

      {appointmentItems.length > 0 && (
        <div className="space-y-1.5 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/60">
          {appointmentItems.map((item, idx) => {
            const info = getAppointmentInfo(item);
            return (
              <div
                key={`mobile-appt-${idx}`}
                className="text-[11px] text-blue-700"
              >
                <div className="font-bold">
                  {info.doctorName ? `Dr. ${info.doctorName}` : "Appointment"}
                </div>
                <div className="text-blue-600/80 font-medium">
                  {formatScheduledAt(info.scheduledAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-50">
        <span
          title={getOrderStatusMeaning(row)}
          aria-label={`${getOrderStatusLabel(row)}: ${getOrderStatusMeaning(row)}`}
          className={`${ORDER_STATUS_BADGE_TEXT_CLASS} ${getOrderStatusStyle(row)}`}
        >
          {getOrderStatusLabel(row)}
        </span>
        <span className="text-xs text-gray-400 font-bold">
          {formatDate(row.created_at)}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onView(row);
        }}
        className="w-full py-2 bg-(--maincolor)/5 border border-(--maincolor)/10 rounded-lg text-xs font-bold text-(--maincolor) hover:bg-(--maincolor)/10 transition-colors"
      >
        View details
      </button>
      {canShowCertificateResult && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            void handleToggleCertificate();
          }}
          className="w-full py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <Download className="size-3.5" />
          Result
        </button>
      )}
      {canShowCertificateResult && isCertificateOpen && (isCertificateLoading || certificateError || hasCertificateLinks) && (
        <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3">
          <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">
            Certificate Result
          </p>
          {isCertificateLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="size-3.5 animate-spin" />
              Loading...
            </div>
          ) : certificateError ? (
            <p className="text-xs text-red-500">{certificateError}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {certificateLinks.previewUrl && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsCertificateAssetLoading(true);
                    try {
                      await openCertificateUrlWithAuth(
                        certificateLinks.previewUrl as string,
                        "preview",
                      );
                    } catch (error) {
                      console.error("Failed to preview certificate:", error);
                      setCertificateError("Unable to preview certificate.");
                    } finally {
                      setIsCertificateAssetLoading(false);
                    }
                  }}
                  disabled={isCertificateAssetLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-(--maincolor)/20 bg-(--maincolor)/5 text-xs font-bold text-(--maincolor) hover:bg-(--maincolor)/10 transition-colors"
                >
                  <Eye className="size-3.5" />
                  Preview
                </button>
              )}
              {certificateLinks.downloadUrl && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsCertificateAssetLoading(true);
                    try {
                      await openCertificateUrlWithAuth(
                        certificateLinks.downloadUrl as string,
                        "download",
                      );
                    } catch (error) {
                      console.error("Failed to download certificate:", error);
                      setCertificateError("Unable to download certificate.");
                    } finally {
                      setIsCertificateAssetLoading(false);
                    }
                  }}
                  disabled={isCertificateAssetLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <Download className="size-3.5" />
                  Download
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Desktop Table Row ─────────────────────────────────────────────────────────

const OrderTableRow = ({
  row,
  onView,
}: {
  row: OrderRecord;
  onView: (r: OrderRecord) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [certificateData, setCertificateData] = useState<unknown>(null);
  const [isCertificateLoading, setIsCertificateLoading] = useState(false);
  const [isCertificateAssetLoading, setIsCertificateAssetLoading] =
    useState(false);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const orderKey = row.order_status?.toLowerCase() ?? "";
  const canShowCertificateResult = canShowOrderCertificateActions(
    orderKey,
    row.items,
  );
  const appointmentItems =
    row.items?.filter((item) => !!getAppointmentInfo(item).scheduledAt) ?? [];
  const handleToggleCertificate = async () => {
    if (!canShowCertificateResult) return;
    const nextOpen = !isCertificateOpen;
    setIsCertificateOpen(nextOpen);
    if (!nextOpen || certificateData || isCertificateLoading) return;

    setIsCertificateLoading(true);
    setCertificateError(null);
    try {
      const response = await api.get(
        `${API_ENDPOINTS.CERTIFICATE_ORDER}/${row.order_id}`,
      );
      setCertificateData(response.data);
    } catch (error) {
      console.error("Failed to fetch certificate order details:", error);
      setCertificateError("Unable to load certificate JSON.");
    } finally {
      setIsCertificateLoading(false);
    }
  };
  const certificateLinks = getCertificateLinks(certificateData);
  const hasCertificateLinks =
    !!certificateLinks.previewUrl || !!certificateLinks.downloadUrl;

  return (
    <>
      <tr
        onClick={() => {
          onView(row);
        }}
        className={`transition-colors cursor-pointer group ${
          row.note
            ? "bg-amber-50/25 hover:bg-amber-50/50"
            : "hover:bg-gray-50/70"
        }`}
      >
        <td className="px-5 py-5 whitespace-nowrap">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 uppercase font-bold">
                {formatOrderId(row.order_id)}
              </span>
            </div>
            {row.note && (
              <span className="text-[11px] text-amber-700 font-medium line-clamp-1">
                {row.note}
              </span>
            )}
          </div>
        </td>
        <td className="px-5 py-5 text-gray-600 max-w-[280px]">
          <div className="flex flex-col gap-1">
            <div
              className={`${expanded ? "" : "line-clamp-2"} transition-all duration-300 text-sm font-medium text-(--maincolor)`}
            >
              {row.items?.map((i) => i.product_name).join(", ") || "—"}
            </div>
            {appointmentItems.map((item, idx) => {
              const info = getAppointmentInfo(item);
              return (
                <div
                  key={`appt-${idx}`}
                  className="flex flex-col gap-0.5 bg-blue-50/50 p-2 rounded-lg border border-blue-100/50 w-fit"
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700">
                    <Stethoscope className="size-3" />
                    {info.doctorName ? `Dr. ${info.doctorName}` : "Appointment"}
                  </div>
                  <div className="text-[10px] text-blue-600/70 font-medium pl-4.5">
                    {formatScheduledAt(info.scheduledAt)}
                  </div>
                </div>
              );
            })}
            {row.items && row.items.length > 2 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="text-xs font-bold text-(--maincolor) hover:underline w-fit mt-1"
              >
                {expanded
                  ? "Show less"
                  : `Show ${row.items.length - 2} more items...`}
              </button>
            )}
          </div>
        </td>
        <td className="px-5 py-5 text-base font-bold text-(--maincolor) whitespace-nowrap">
          <div className="flex flex-col">
            <span>{row.display_amount}</span>
            {row.discount_info && (
              <span className="text-xs text-emerald-600 font-bold uppercase mt-1 flex items-center gap-1.5">
                <span className="bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  {row.discount_info.percentage}% Off
                </span>
                <span className="text-[10px] opacity-70">
                  ({row.discount_info.name})
                </span>
              </span>
            )}
          </div>
        </td>
        <td className="px-5 py-5">
          <span
            title={getOrderStatusMeaning(row)}
            aria-label={`${getOrderStatusLabel(row)}: ${getOrderStatusMeaning(row)}`}
            className={`${ORDER_STATUS_BADGE_TEXT_CLASS} ${getOrderStatusStyle(row)}`}
          >
            {getOrderStatusLabel(row)}
          </span>
        </td>
        <td className="px-5 py-5 text-sm text-gray-900 font-medium whitespace-nowrap">
          {formatDate(row.created_at)}
        </td>
        <td className="px-5 py-5 text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(row);
              }}
              className="p-2 text-gray-400 hover:text-(--maincolor) transition-all bg-gray-50 rounded-md border border-gray-100 hover:border-(--maincolor)/50 hover:shadow-sm group/btn h-9 cursor-pointer"
              title="View Order"
            >
              <Eye className="size-4" />
            </button>
            {canShowCertificateResult && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleToggleCertificate();
                }}
                className="p-2 text-gray-400 hover:text-emerald-700 transition-all bg-gray-50 rounded-md border border-gray-100 hover:border-emerald-300 hover:shadow-sm h-9 cursor-pointer"
                title="Certificate Result"
              >
                <Download className="size-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
      {canShowCertificateResult &&
        isCertificateOpen &&
        (isCertificateLoading || certificateError || hasCertificateLinks) && (
        <tr className="bg-gray-50/70">
          <td colSpan={6} className="px-5 py-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-bold uppercase text-gray-500 mb-2">
                Certificate Result
              </p>
              {isCertificateLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="size-4 animate-spin" />
                  Loading...
                </div>
              ) : certificateError ? (
                <p className="text-sm text-red-500">{certificateError}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {certificateLinks.previewUrl && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setIsCertificateAssetLoading(true);
                        try {
                          await openCertificateUrlWithAuth(
                            certificateLinks.previewUrl as string,
                            "preview",
                          );
                        } catch (error) {
                          console.error("Failed to preview certificate:", error);
                          setCertificateError("Unable to preview certificate.");
                        } finally {
                          setIsCertificateAssetLoading(false);
                        }
                      }}
                      disabled={isCertificateAssetLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-(--maincolor)/20 bg-(--maincolor)/5 text-xs font-bold text-(--maincolor) hover:bg-(--maincolor)/10 transition-colors"
                    >
                      <Eye className="size-3.5" />
                      Preview
                    </button>
                  )}
                  {certificateLinks.downloadUrl && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setIsCertificateAssetLoading(true);
                        try {
                          await openCertificateUrlWithAuth(
                            certificateLinks.downloadUrl as string,
                            "download",
                          );
                        } catch (error) {
                          console.error("Failed to download certificate:", error);
                          setCertificateError("Unable to download certificate.");
                        } finally {
                          setIsCertificateAssetLoading(false);
                        }
                      }}
                      disabled={isCertificateAssetLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      <Download className="size-3.5" />
                      Download
                    </button>
                  )}
                </div>
              )}
            </div>
          </td>
        </tr>
        )}
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

function OrdersPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [data, setData] = useState<OrderRecord[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const perPage = 15;

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilter>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showFilters, setShowFilters] = useState(false);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [orderTypeFilter, fromDate, toDate, sortBy, sortOrder]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (debouncedSearch) params.q = debouncedSearch;
      if (orderTypeFilter) params.order_type = orderTypeFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await api.get<ApiResponse>(API_ENDPOINTS.ORDER_HISTORY, {
        params,
      });
      const body = res.data;
      setData(body.data ?? []);
      setCurrentPage(body.current_page);
      setTotalPages(body.last_page);
      setTotalEntries(body.total);
    } catch (err) {
      console.error("Failed to fetch order history:", err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    perPage,
    debouncedSearch,
    orderTypeFilter,
    fromDate,
    toDate,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const clearFilters = () => {
    setOrderTypeFilter("");
    setFromDate("");
    setToDate("");
    setSearchQuery("");
    setSortBy("created_at");
    setSortOrder("desc");
  };

  const hasActiveFilters = !!(
    orderTypeFilter ||
    fromDate ||
    toDate ||
    debouncedSearch
  );
  const activeFilterCount = [
    orderTypeFilter,
    fromDate,
    toDate,
    debouncedSearch,
  ].filter(Boolean).length;

  const pageWindow = (() => {
    const delta = 1;
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);
    const pages: number[] = [];
    for (let i = left; i <= right; i++) pages.push(i);
    return pages;
  })();

  const startEntry = totalEntries === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endEntry = Math.min(currentPage * perPage, totalEntries);

  if (selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="ghc-page-title">Orders &amp; Appointments</h1>
          {!isLoading && (
            <p className="ghc-text-body mt-1">
              {totalEntries > 0
                ? `${totalEntries} order${totalEntries !== 1 ? "s" : ""}`
                : "No orders yet"}
            </p>
          )}
        </div>

        <button
          onClick={() => setSortOrder((p) => (p === "desc" ? "asc" : "desc"))}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-3 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-500 uppercase hover:border-(--maincolor) hover:text-(--maincolor) transition-all shrink-0 cursor-pointer"
        >
          <ArrowUpDown className="size-3.5" />
          {sortOrder === "desc" ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {/* ── Search + Filter Bar ───────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="group relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-(--maincolor) transition-colors" />
          <input
            type="text"
            placeholder="Search by order ID or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-1 border-[#E5E7EB] rounded-full pl-9 pr-4 py-3 text-sm text-(--maincolor) placeholder:text-gray-300 focus:outline-none focus:border-(--maincolor) focus:ring-0 focus:ring-(--maincolor) transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setSortOrder((p) => (p === "desc" ? "asc" : "desc"))}
          className="sm:hidden shrink-0 flex items-center justify-center size-10 bg-white border border-gray-200 rounded-full text-gray-500 hover:border-(--maincolor) hover:text-(--maincolor) transition-all"
        >
          <ArrowUpDown className="size-4" />
        </button>

        <button
          onClick={() => setShowFilters((p) => !p)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-3 border rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
            hasActiveFilters
              ? "bg-(--maincolor) border-(--maincolor) text-white"
              : "bg-white border-gray-200 text-gray-500 hover:border-(--maincolor) hover:text-(--maincolor)"
          }`}
        >
          <Filter className="size-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center size-4 bg-white/30 rounded-full text-[9px] text-white font-bold">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={`size-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="shrink-0 flex items-center gap-1 px-3 py-2.5 bg-red-50 border border-red-100 rounded-full text-xs font-bold text-red-500 uppercase hover:bg-red-100 transition-all"
          >
            <X className="size-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* ── Filter Panel ─────────────────────────────────────────── */}
      {showFilters && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-3 gap-3 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">
              Order Type
            </label>
            <select
              value={orderTypeFilter}
              onChange={(e) =>
                setOrderTypeFilter(e.target.value as OrderTypeFilter)
              }
              className="h-9 px-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-(--maincolor) bg-white text-gray-700"
            >
              <option value="">All</option>
              <option value="digital">Certificate</option>
              <option value="appointment">Appointment</option>
              {/* <option value="physical">HealthKit</option> */}
              {/* <option value="mixed">Mixed</option> */}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">
              From
            </label>
            <CustomDatePicker
              id="fromDate"
              value={fromDate}
              onChange={(val) => setFromDate(val)}
              className="flex items-center justify-between h-9 px-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-(--maincolor) bg-white text-gray-700 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">
              To
            </label>
            <CustomDatePicker
              id="toDate"
              value={toDate}
              minDate={fromDate || undefined}
              onChange={(val) => setToDate(val)}
              className="flex items-center justify-between h-9 px-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-(--maincolor) bg-white text-gray-700 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────── */}
      {isLoading ? (
        <>
          <SkeletonCards />
          <SkeletonTable />
        </>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm text-center px-4">
          <div className="size-14 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="size-7 text-gray-300" />
          </div>
          <p className="text-sm font-bold text-gray-400">
            {hasActiveFilters
              ? "No orders match your filters"
              : "No orders yet"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs font-bold text-(--maincolor) hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile: Card list */}
          <div className="md:hidden space-y-3">
            {data.map((row, index) => (
              <OrderCard
                key={String(row.id ?? row.order_id ?? `${row.created_at}-${index}`)}
                row={row}
                onView={setSelectedOrder}
              />
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      "Order ID",
                      "Products / Service",
                      "Amount",
                      "Status",
                      "Date",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`px-6 py-4 text-left text-[11px] font-bold text-[#4B5563] uppercase ${i === 5 ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.map((row, index) => (
                    <OrderTableRow
                      key={String(row.id ?? row.order_id ?? `${row.created_at}-${index}`)}
                      row={row}
                      onView={setSelectedOrder}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Pagination ───────────────────────────────────────────── */}
      {!isLoading && totalEntries > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <p className="!text-sm text-[#6B7280] order-2 sm:order-1 flex items-center gap-1.5">
            Showing{" "}
            <span className="font-bold text-(--maincolor)">
              {startEntry}–{endEntry}
            </span>{" "}
            of{" "}
            <span className="font-bold text-(--maincolor)">{totalEntries}</span>{" "}
            orders
          </p>

          {totalPages > 1 && (
            <nav className="flex items-center gap-1 order-1 sm:order-2">
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="size-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {pageWindow[0] > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="min-w-[36px] h-9 flex items-center justify-center rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    1
                  </button>
                  {pageWindow[0] > 2 && (
                    <span className="px-1 text-gray-300 text-xs">···</span>
                  )}
                </>
              )}

              {pageWindow.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[36px] h-9 flex items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                    currentPage === page
                      ? "bg-(--maincolor) text-white border-(--maincolor) shadow-sm"
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              {pageWindow[pageWindow.length - 1] < totalPages && (
                <>
                  {pageWindow[pageWindow.length - 1] < totalPages - 1 && (
                    <span className="px-1 text-gray-300 text-xs">···</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="min-w-[36px] h-9 flex items-center justify-center rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="size-3.5" />
              </button>
            </nav>
          )}
        </div>
      )}

      {!isLoading && totalEntries > 0 && (
        <div className="bg-white/70 border border-gray-100 rounded-xl px-4 py-3">
          <p className="ghc-text-body text-(--maincolor) font-medium mb-2">
            Status Meaning
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ORDER_STATUS_LEGEND_ITEMS.map((item) => (
              <div
                key={item.label}
                className="group relative rounded-lg border border-gray-100 bg-white/90 p-2.5 hover:shadow-sm transition-shadow"
              >
                <span
                  title={item.meaning}
                  className={`${ORDER_STATUS_BADGE_TEXT_CLASS} ${item.className}`}
                >
                  {item.label}
                </span>
                <p className="mt-1 text-[11px] text-gray-600 leading-relaxed sm:hidden">
                  {item.meaning}
                </p>
                <div className="hidden sm:block pointer-events-none absolute left-2 top-full mt-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="max-w-[260px] rounded-md bg-gray-900 text-white text-[11px] leading-relaxed px-2.5 py-2 shadow-lg">
                    {item.meaning}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && data.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-(--maincolor)" />
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="size-8 animate-spin text-(--maincolor) opacity-20" />
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}
