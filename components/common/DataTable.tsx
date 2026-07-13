"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronDown } from "lucide-react";

export interface Column<T> {
    header: string;
    key: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
    className?: string;
}

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalEntries: number;
    pageSize: number;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    pagination?: PaginationProps;
    emptyMessage?: string;
    onSort?: (key: string) => void;
    renderExpandedRow?: (item: T) => React.ReactNode;
    getRowClassName?: (item: T, rowIdx: number) => string;
    getExpandedRowClassName?: (item: T, rowIdx: number) => string;
}

export default function DataTable<T>({
    columns,
    data,
    loading,
    pagination,
    emptyMessage = "No records found",
    onSort,
    renderExpandedRow,
    getRowClassName,
    getExpandedRowClassName,
}: DataTableProps<T>) {
    const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set());

    const toggleRow = (idx: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(idx)) {
            newExpanded.delete(idx);
        } else {
            newExpanded.add(idx);
        }
        setExpandedRows(newExpanded);
    };
    const startEntry = pagination
        ? (pagination.currentPage - 1) * pagination.pageSize + 1
        : 1;
    const endEntry = pagination
        ? Math.min(pagination.currentPage * pagination.pageSize, pagination.totalEntries)
        : data.length;

    return (
        <div className="w-full font-mainfont">
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                                {columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        className={`px-6 py-4 ${col.className?.includes("text-right") ? "text-right" : col.className?.includes("text-center") ? "text-center" : "text-left"} text-[11px] font-bold text-[#4B5563] uppercase ${col.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                                            } ${col.className || ""}`}
                                        onClick={() => col.sortable && onSort?.(col.key)}
                                    >
                                        <div className={`flex items-center gap-2 ${col.className?.includes("text-right") ? "justify-end" : col.className?.includes("text-center") ? "justify-center" : ""}`}>
                                            {col.header}
                                            {col.sortable && (
                                                <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--maincolor)" />
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length > 0 ? (
                                data.map((item, rowIdx) => (
                                    <React.Fragment key={rowIdx}>
                                        <tr
                                            className={`hover:bg-[#F9FAFB] transition-colors ${renderExpandedRow ? "cursor-pointer" : ""} ${getRowClassName?.(item, rowIdx) || ""}`}
                                            onClick={() => renderExpandedRow && toggleRow(rowIdx)}
                                        >
                                            {columns.map((col, colIdx) => (
                                                <td
                                                    key={colIdx}
                                                    className={`px-6 py-4 text-sm text-[#111827] ${colIdx === 0 ? "font-bold" : "font-normal"
                                                        } ${col.className?.includes("text-right") ? "text-right" : col.className?.includes("text-center") ? "text-center" : "text-left"} ${col.className || ""}`}
                                                >
                                                    <div className={`flex items-center gap-3 ${col.className?.includes("text-right") ? "justify-end" : col.className?.includes("text-center") ? "justify-center" : ""}`}>
                                                        {colIdx === 0 && renderExpandedRow && (
                                                            <div className={`transition-transform duration-200 ${expandedRows.has(rowIdx) ? "rotate-180" : ""}`}>
                                                                <ChevronDown className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                        )}
                                                        {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                        {renderExpandedRow && expandedRows.has(rowIdx) && (
                                            <tr className={getExpandedRowClassName?.(item, rowIdx) || "bg-gray-50/50"}>
                                                <td colSpan={columns.length} className="px-6 py-0">
                                                    <div className="py-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
                                                        {renderExpandedRow(item)}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-6 py-12 text-center text-sm text-gray-500"
                                    >
                                        {emptyMessage}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {(pagination || data.length > 0) && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                    <div className="text-sm text-[#6B7280]">
                        Showing {startEntry} to {endEntry} of {pagination?.totalEntries || data.length} entries
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <nav className="flex items-center gap-1">
                            <button
                                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                className="p-2 border border-[#E5E7EB] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4 text-gray-600" />
                            </button>

                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => pagination.onPageChange(page)}
                                    className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg border text-sm font-medium transition-all ${pagination.currentPage === page
                                        ? "bg-(--maincolor) text-white border-(--maincolor) shadow-sm"
                                        : "bg-white text-gray-600 border-[#E5E7EB] hover:bg-gray-50"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="p-2 border border-[#E5E7EB] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                            </button>
                        </nav>
                    )}
                </div>
            )}

        </div>
    );
}
