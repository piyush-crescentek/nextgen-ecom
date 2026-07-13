"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    FileDown,
    Filter,
    X,
    ChevronDown,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Receipt,
    Loader2,
    Eye,
} from "lucide-react";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import CustomDatePicker from "@/components/forms/CustomDatePicker";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransactionItem {
    product_id?: number;
    sku?: string;
    name: string;
    price: number;
    qty: number;
    total: number;
    deliver_within?: number;
    turn_around_time?: number;
    variant?: unknown;
    result_approved?: unknown;
    meta_data?: unknown;
    form_pdf_url?: string | null;
}

interface DiscountInfo {
    name: string;
    group_id: number;
    new_price: number;
    percentage: number;
    original_price: number;
    discount_amount: number;
}

interface TransactionRecord {
    id: number;
    order_id: number;
    orderId: string;
    product_type: string;
    customerName: string;
    items: TransactionItem[];
    paymentMethod: string;
    displayAmount: string;
    status: string;
    createdAt: string;
    discount_info?: DiscountInfo;
    note?: string | null;
}

// Interface for the raw API response matches the Laravel pagination structure
interface ApiResponse {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    data: TransactionRecord[];
}

type SortOrder = "asc" | "desc";
type StatusFilter = "" | "paid" | "pending";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatOrderId(id: string | number) {
    if (!id) return "—";
    const str = String(id);
    return str.startsWith("#") ? str : `#${str}`;
}

const STATUS_STYLES: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-600 border-amber-200",
    failed: "bg-red-50 text-red-500 border-red-200",
    refunded: "bg-gray-50 text-gray-400 border-gray-200 italic",
};

export const handleDownloadInvoice = async (transaction: TransactionRecord) => {
    const { toast } = await import("sonner");
    const toastId = `invoice-${transaction.id}`;

    try {
        toast.loading(`Preparing invoice for ${transaction.orderId}...`, { id: toastId });

        const response = await api.get(`${API_ENDPOINTS.ORDER_HISTORY}/${transaction.order_id}/invoice`, {
            responseType: 'blob', // Expect a file wrapper implicitly
        });

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice-${formatOrderId(transaction.orderId).replace('#', '')}.pdf`;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);

        toast.success("Invoice downloaded successfully", { id: toastId });
    } catch (error) {
        console.error("Failed to download invoice:", error);
        toast.error("Failed to download invoice.", { id: toastId });
    }
};

// ─── Transaction Detail View ────────────────────────────────────────────────────

function TransactionDetailView({ transaction, onBack }: { transaction: TransactionRecord; onBack: () => void; }) {
    const router = useRouter();
    const statusKey = transaction.status?.toLowerCase() ?? "";

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

                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 pb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold text-(--maincolor)">
                                Transaction Details
                            </h1>
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border w-fit leading-none ${STATUS_STYLES[statusKey] ?? "bg-gray-50 text-gray-400 border-gray-100"}`}>
                                {transaction.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="ghc-text-body">Order </p>
                            <button
                                onClick={() => router.push(`/profile/orders?q=${transaction.orderId}`)}
                                className="text-sm font-bold text-(--maincolor) hover:underline cursor-pointer"
                            >
                                {formatOrderId(transaction.orderId)}
                            </button>
                            <p className="ghc-text-body">• {formatDate(transaction.createdAt)}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => handleDownloadInvoice(transaction)}
                        className="flex items-center gap-2 px-4 py-3 bg-(--maincolor) text-white rounded-full text-xs font-bold hover:opacity-90 transition-opacity shadow-md cursor-pointer"
                    >
                        <FileDown className="size-4" />
                        Download Invoice
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm p-5 space-y-4">
                {transaction.note && (
                    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5">
                        <p className="text-[11px] font-bold text-amber-700 uppercase mb-1">
                            Order Note
                        </p>
                        <p className="text-sm text-amber-800">{transaction.note}</p>
                    </div>
                )}
                <h2 className="text-sm font-bold text-gray-800">Ordered Items</h2>
                <div className="flex flex-col gap-4">
                    {/* ── Items ── */}
                    <div className="bg-white rounded-2xl border border-gray-100">
                        <div className="divide-y divide-gray-50">
                            {transaction.items?.map((item, idx) => (
                                <div key={idx} className="p-5 space-y-4 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1.5">
                                            <p className="text-base font-medium text-(--maincolor)">{item.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] text-gray-500 font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Qty {item.qty}</span>
                                                {item.sku && <span className="text-[10px] text-gray-400 font-bold uppercase">SKU: {item.sku}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-base font-bold text-(--maincolor)">€{(item.total || (item.qty * item.price)).toFixed(2)}</p>
                                            <p className="!text-sm text-gray-500 mt-0.5">€{(item.price || 0).toFixed(2)} / unit</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── Summary Section ── */}
                        <div className="bg-gray-50/50 p-6 border-t border-gray-100 space-y-3">
                            {transaction.discount_info && (
                                <>
                                    <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase">
                                        <span>Subtotal</span>
                                        <span className="line-through">€{transaction.discount_info.original_price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-emerald-600 font-bold uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Savings</span>
                                            <span className="text-[10px] bg-emerald-100/50 px-1.5 py-0.5 rounded leading-none shrink-0 font-bold">
                                                {transaction.discount_info.percentage}%
                                            </span>
                                        </div>
                                        <span>-€{transaction.discount_info.discount_amount.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <div className="space-y-0.5">
                                    <span className="text-base font-bold text-gray-700">Total Amount Paid</span>
                                    {transaction.discount_info && (
                                        <p className="!text-[10px] text-gray-400 font-bold uppercase">{transaction.discount_info.name}</p>
                                    )}
                                </div>
                                <p className="!text-2xl md:text-3xl font-bold text-(--maincolor) whitespace-nowrap shrink-0 ml-4">{transaction.displayAmount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl border border-gray-100 p-6 sm:divide-y md:divide-y-0 md:divide-x divide-[#e2e8dfbf]">
                        {/* ── Payment Info ── */}
                        <div className="space-y-4 pb-6 md:pt-0 md:pb-0 md:pr-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-baseline gap-2">
                                    <span className="text-base font-medium text-gray-400">Payment Method</span>
                                    <span className="text-sm font-bold text-(--maincolor) capitalize">{transaction.paymentMethod || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-baseline gap-2">
                                    <span className="text-base font-medium text-gray-400">Processed</span>
                                    <span className="text-sm font-bold text-(--maincolor) text-right">{formatDate(transaction.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function TransactionCard({ row, onView }: { row: TransactionRecord; onView: (r: TransactionRecord) => void; }) {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = React.useState(false);
    const statusKey = row.status?.toLowerCase() ?? "";
    const displayedItems = isExpanded ? row.items : row.items?.slice(0, 1);
    const hasMoreItems = (row.items?.length ?? 0) > 1;

    return (
        <div
            onClick={() => onView(row)}
            className={`rounded-xl border p-4 space-y-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer ${
                row.note
                    ? "bg-amber-50/30 border-amber-200"
                    : "bg-white border-gray-100"
            }`}
        >
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/profile/orders?q=${row.orderId}`);
                    }}
                    className="text-xs font-bold text-gray-500 hover:text-(--maincolor) hover:underline cursor-pointer"
                >
                    {formatOrderId(row.orderId)}
                </button>
                <div className="flex items-center gap-1.5">
                    {row.discount_info && (
                        <span className="text-[10px] text-emerald-600 font-bold uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                            {row.discount_info.percentage}% OFF
                        </span>
                    )}
                    <span className="text-sm font-bold text-(--maincolor)">{row.displayAmount}</span>
                </div>
            </div>

            {row.note && (
                <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-2 font-medium">
                    {row.note}
                </div>
            )}

            <div className="space-y-1.5">
                {displayedItems?.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-3 text-sm">
                        <span className="text-gray-700 font-bold truncate flex-1">{item.name}</span>
                        <span className="text-gray-400 text-xs font-bold whitespace-nowrap">×{item.qty}</span>
                    </div>
                ))}
                {hasMoreItems && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="text-xs font-bold text-(--maincolor) hover:underline"
                    >
                        {isExpanded ? "Show less" : `+ ${row.items.length - 1} more items...`}
                    </button>
                )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-50">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${STATUS_STYLES[statusKey] ?? "bg-gray-50 text-gray-400 border-gray-100"}`}>
                    {row.status}
                </span>
                <span className="text-xs text-gray-400 font-bold">{formatDate(row.createdAt)}</span>
            </div>

            <div className="flex gap-2 pt-1">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onView(row);
                    }}
                    className="flex-1 py-2 bg-(--maincolor)/5 border border-(--maincolor)/10 rounded-lg text-xs font-bold text-(--maincolor) hover:bg-(--maincolor)/10 transition-colors"
                >
                    View details
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadInvoice(row);
                    }}
                    className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                >
                    <FileDown className="size-4" />
                </button>
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCards() {
    return (
        <div className="space-y-3 md:hidden">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3 animate-pulse">
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
                <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
                    <div className="h-4 bg-gray-100 rounded w-20" />
                    <div className="h-4 bg-gray-100 rounded flex-1" />
                    <div className="h-4 bg-gray-100 rounded w-16" />
                    <div className="h-4 bg-gray-100 rounded w-14" />
                    <div className="h-4 bg-gray-100 rounded w-28" />
                </div>
            ))}
        </div>
    );
}

const TransactionTableRow = ({ row, onView }: { row: TransactionRecord; onView: (r: TransactionRecord) => void; }) => {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const statusKey = row.status?.toLowerCase() ?? "";

    return (
        <tr
            onClick={() => onView(row)}
            className={`transition-colors cursor-pointer group ${
                row.note
                    ? "bg-amber-50/25 hover:bg-amber-50/50"
                    : "hover:bg-gray-50/70"
            }`}
        >
            <td className="px-5 py-5 whitespace-nowrap">
                <div className="flex flex-col gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/profile/orders?q=${row.orderId}`);
                        }}
                        className="text-sm text-gray-400 uppercase font-bold hover:text-(--maincolor) hover:underline cursor-pointer w-fit"
                    >
                        {formatOrderId(row.orderId)}
                    </button>
                    {row.note && (
                        <span className="text-[11px] text-amber-700 font-medium line-clamp-1">
                            {row.note}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-5 py-5 text-gray-600 max-w-[280px]">
                <div className="flex flex-col gap-1">
                    <div className={`${isExpanded ? "" : "line-clamp-2"} transition-all duration-300 text-sm font-medium text-(--maincolor)`}>
                        {row.items?.map(i => i.name).join(", ") || "—"}
                    </div>
                    {row.items && row.items.length > 2 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            className="text-xs font-bold text-(--maincolor) hover:underline w-fit mt-1"
                        >
                            {isExpanded ? "Show less" : `Show ${row.items.length - 2} more items...`}
                        </button>
                    )}
                </div>
            </td>
            <td className="px-5 py-5 text-base font-bold text-(--maincolor) whitespace-nowrap">
                <div className="flex flex-col">
                    <span>{row.displayAmount}</span>
                    {row.discount_info && (
                        <span className="text-xs text-emerald-600 font-bold uppercase mt-1 flex items-center gap-1.5">
                            <span className="bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                {row.discount_info.percentage}% Off
                            </span>
                            <span className="text-[10px] opacity-70">({row.discount_info.name})</span>
                        </span>
                    )}
                </div>
            </td>
            <td className="px-5 py-5">
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border ${STATUS_STYLES[statusKey] ?? "bg-gray-50 text-gray-400 border-gray-100"}`}>
                    {row.status}
                </span>
            </td>
            <td className="px-5 py-5 text-sm text-gray-900 font-medium whitespace-nowrap">
                {formatDate(row.createdAt)}
            </td>
            <td className="px-5 py-5 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadInvoice(row);
                        }}
                        className="p-2 text-gray-400 hover:text-(--maincolor) transition-all bg-gray-50 rounded-md border border-gray-100 hover:border-(--maincolor)/50 hover:shadow-sm group/btn h-9 cursor-pointer"
                        title="Download Invoice"
                    >
                        <FileDown className="size-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onView(row);
                        }}
                        className="p-2 text-gray-400 hover:text-(--maincolor) transition-all bg-gray-50 rounded-md border border-gray-100 hover:border-(--maincolor)/50 hover:shadow-sm group/btn h-9 cursor-pointer"
                        title="View Transaction"
                    >
                        <Eye className="size-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Transactions() {
    const [data, setData] = useState<TransactionRecord[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const perPage = 15;

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [showFilters, setShowFilters] = useState(false);

    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Debounce search
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 400);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [searchQuery]);

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1); }, [statusFilter, fromDate, toDate, sortOrder]);

    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, string | number> = {
                page: currentPage,
                per_page: perPage,
                sort_by: "orderId",
                sort_order: sortOrder,
            };
            if (debouncedSearch) params.q = debouncedSearch;
            if (statusFilter) params.status = statusFilter;
            if (fromDate) params.from = fromDate;
            if (toDate) params.to = toDate;

            const res = await api.get<ApiResponse>(API_ENDPOINTS.PRODUCT_TRANSACTIONS, { params });
            const body = res.data;
            setData(body.data ?? []);
            setCurrentPage(body.current_page);
            setTotalPages(body.last_page);
            setTotalEntries(body.total);
        } catch (err) {
            console.error("Failed to fetch transactions:", err);
            setData([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, perPage, debouncedSearch, statusFilter, fromDate, toDate, sortOrder]);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    const clearFilters = () => {
        setStatusFilter("");
        setFromDate("");
        setToDate("");
        setSearchQuery("");
        setSortOrder("desc");
    };

    const hasActiveFilters = !!(statusFilter || fromDate || toDate || debouncedSearch);

    const activeFilterCount = [statusFilter, fromDate, toDate, debouncedSearch].filter(Boolean).length;

    // Pagination page window
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

    if (selectedTransaction) {
        return <TransactionDetailView transaction={selectedTransaction} onBack={() => setSelectedTransaction(null)} />;
    }

    return (
        <div className="space-y-6">

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="ghc-page-title">Transaction History</h1>
                    {!isLoading && (
                        <p className="ghc-text-body mt-1">
                            {totalEntries > 0
                                ? `${totalEntries} transaction${totalEntries !== 1 ? "s" : ""}`
                                : "No transactions yet"}
                        </p>
                    )}
                </div>

                {/* Sort toggle — desktop only */}
                <button
                    onClick={() => setSortOrder(p => p === "desc" ? "asc" : "desc")}
                    className="hidden sm:flex items-center gap-1.5 px-3.5 py-3 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-500 uppercase hover:border-(--maincolor) hover:text-(--maincolor) transition-all shrink-0 cursor-pointer"
                >
                    <ArrowUpDown className="size-3.5" />
                    {sortOrder === "desc" ? "Newest first" : "Oldest first"}
                </button>
            </div>

            {/* ── Search + Filter Bar ───────────────────────────────────────── */}
            <div className="flex items-center gap-2">
                {/* Search */}
                <div className="group relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-(--maincolor) transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by order ID..."
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

                {/* Sort — mobile only */}
                <button
                    onClick={() => setSortOrder(p => p === "desc" ? "asc" : "desc")}
                    className="sm:hidden shrink-0 flex items-center justify-center size-10 bg-white border border-gray-200 rounded-full text-gray-500 hover:border-(--maincolor) hover:text-(--maincolor) transition-all"
                    title={sortOrder === "desc" ? "Newest first" : "Oldest first"}
                >
                    <ArrowUpDown className="size-4" />
                </button>

                {/* Filter button */}
                <button
                    onClick={() => setShowFilters(p => !p)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-3 border rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${hasActiveFilters
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
                    <ChevronDown className={`size-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                </button>

                {/* Clear all */}
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

            {/* ── Filter Panel ──────────────────────────────────────────────── */}
            {showFilters && (
                <div className="bg-white border border-gray-100 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 shadow-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="h-9 px-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-(--maincolor) bg-white text-gray-700"
                        >
                            <option value="">All</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">From</label>
                        <CustomDatePicker
                            id="fromDate"
                            value={fromDate}
                            onChange={(val) => setFromDate(val)}
                            className="flex items-center justify-between h-9 px-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-(--maincolor) bg-white text-gray-700 cursor-pointer"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">To</label>
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

            {/* ── Content ───────────────────────────────────────────────────── */}

            {isLoading ? (
                <>
                    <SkeletonCards />
                    <SkeletonTable />
                </>
            ) : data.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm text-center px-4">
                    <div className="size-14 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Receipt className="size-7 text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-400">
                        {hasActiveFilters ? "No transactions match your filters" : "No transactions yet"}
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
                    {/* ── Mobile: Card list ────────────────────────────────── */}
                    <div className="md:hidden space-y-3">
                        {data.map((row) => (
                            <TransactionCard key={row.id} row={row} onView={setSelectedTransaction} />
                        ))}
                    </div>

                    {/* ── Desktop: Table ───────────────────────────────────── */}
                    <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        {["Order ID", "Product / Service", "Amount", "Status", "Date", ""].map((h, i) => (
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
                                    {data.map((row) => (
                                        <TransactionTableRow key={row.id} row={row} onView={setSelectedTransaction} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ── Pagination ────────────────────────────────────────────────── */}
            {!isLoading && totalEntries > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    {/* Entry count */}
                    <p className="!text-sm text-[#6B7280] order-2 sm:order-1 flex items-center gap-1.5">
                        Showing <span className="font-bold text-(--maincolor)">{startEntry}–{endEntry}</span> of{" "}
                        <span className="font-bold text-(--maincolor)">{totalEntries}</span> transactions
                    </p>

                    {/* Page controls */}
                    {totalPages > 1 && (
                        <nav className="flex items-center gap-1 order-1 sm:order-2">
                            {/* Prev */}
                            <button
                                onClick={() => setCurrentPage(p => p - 1)}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                <ChevronLeft className="size-3.5" />
                                <span className="hidden sm:inline">Prev</span>
                            </button>

                            {/* First page */}
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

                            {/* Page window */}
                            {pageWindow.map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`min-w-[36px] h-9 flex items-center justify-center rounded-lg border text-xs font-bold transition-all ${currentPage === page
                                        ? "bg-(--maincolor) text-white border-(--maincolor) shadow-sm"
                                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            {/* Last page */}
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

                            {/* Next */}
                            <button
                                onClick={() => setCurrentPage(p => p + 1)}
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

            {/* Loading spinner for page changes (not initial load) */}
            {isLoading && data.length > 0 && (
                <div className="flex justify-center py-4">
                    <Loader2 className="size-5 animate-spin text-(--maincolor)" />
                </div>
            )}
        </div>
    );
}
