import React from "react";
import Link from "next/link";

interface BlogPaginationProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
}

function pageHref(baseUrl: string, page: number): string {
    if (page <= 1) return baseUrl;
    const sep = baseUrl.endsWith("/") ? "" : "/";
    return `${baseUrl}${sep}page/${page}`;
}

function getPageNumbers(current: number, total: number): (number | "…")[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | "…")[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) pages.push("…");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push("…");
    pages.push(total);
    return pages;
}

export default function BlogPagination({
    currentPage,
    totalPages,
    baseUrl,
}: BlogPaginationProps) {
    if (totalPages <= 1) return null;

    const pages = getPageNumbers(currentPage, totalPages);
    const prevPage = currentPage > 1 ? currentPage - 1 : null;
    const nextPage = currentPage < totalPages ? currentPage + 1 : null;

    const baseLink =
        "min-w-[40px] text-center px-3 py-2 text-sm font-bold rounded-md transition-colors";
    const inactive =
        "text-(--maincolor) border border-(--maincolor)/15 hover:bg-(--maincolor) hover:text-white";
    const disabled =
        "text-(--textcolor)/30 border border-(--textcolor)/10 cursor-default";
    const active = "bg-(--maincolor) text-white border border-(--maincolor)";

    return (
        <nav
            aria-label="Pagination"
            className="mt-16 flex items-center justify-center gap-2 flex-wrap"
        >
            {prevPage !== null ? (
                <Link
                    href={pageHref(baseUrl, prevPage)}
                    className={`${baseLink} ${inactive} px-4`}
                    rel="prev"
                >
                    &lsaquo; Prev
                </Link>
            ) : (
                <span className={`${baseLink} ${disabled} px-4`}>
                    &lsaquo; Prev
                </span>
            )}

            {pages.map((p, idx) =>
                p === "…" ? (
                    <span
                        key={`ellipsis-${idx}`}
                        className="px-3 py-2 text-sm text-(--textcolor)/50"
                    >
                        …
                    </span>
                ) : p === currentPage ? (
                    <span
                        key={p}
                        aria-current="page"
                        className={`${baseLink} ${active}`}
                    >
                        {p}
                    </span>
                ) : (
                    <Link
                        key={p}
                        href={pageHref(baseUrl, p)}
                        className={`${baseLink} ${inactive}`}
                    >
                        {p}
                    </Link>
                ),
            )}

            {nextPage !== null ? (
                <Link
                    href={pageHref(baseUrl, nextPage)}
                    className={`${baseLink} ${inactive} px-4`}
                    rel="next"
                >
                    Next &rsaquo;
                </Link>
            ) : (
                <span className={`${baseLink} ${disabled} px-4`}>
                    Next &rsaquo;
                </span>
            )}
        </nav>
    );
}
