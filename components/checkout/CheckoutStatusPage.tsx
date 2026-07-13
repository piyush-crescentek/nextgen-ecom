import React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function CheckoutStatusShell({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-linear-to-b from-[#FDE8EA] to-[#FDE8EA] px-4 pb-20 pt-6 sm:px-6 sm:pb-24 sm:pt-8 md:pb-28 md:pt-[115px]"
    >
      <div className="mx-auto w-full max-w-[560px] md:flex md:min-h-[calc(100vh-11.5rem)] md:items-center md:justify-center">
        {children}
      </div>
      {fallback}
    </div>
  );
}

export function CheckoutStatusSuspenseFallback() {
  return (
    <div className="flex w-full justify-center py-8 md:py-16">
      <Loader2 className="h-10 w-10 animate-spin text-[#0C203B]" aria-hidden />
    </div>
  );
}

export function CheckoutOrderMeta({
  incrementId,
  amountFormatted,
  amountLabel = "Amount",
}: {
  incrementId?: string;
  amountFormatted?: string;
  amountLabel?: string;
}) {
  if (!incrementId && !amountFormatted) return null;

  return (
    <dl className="mt-5 space-y-3 rounded-xl border border-[#0C203B]/10 bg-[#FDE8EA]/60 px-4 py-3 text-left text-sm sm:mt-6">
      {incrementId && (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <dt className="shrink-0 text-[#0C203B]/70">Order reference</dt>
          <dd className="font-semibold break-all text-[#0C203B] sm:text-right">
            {incrementId}
          </dd>
        </div>
      )}
      {amountFormatted && (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <dt className="shrink-0 text-[#0C203B]/70">{amountLabel}</dt>
          <dd className="font-semibold text-[#0C203B] sm:text-right">
            {amountFormatted}
          </dd>
        </div>
      )}
    </dl>
  );
}

export function CheckoutStatusCard({
  icon,
  title,
  subtitle,
  message,
  actions,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  message: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="w-full rounded-xl border border-[#0C203B]/10 bg-white p-5 text-center shadow-lg shadow-[#0C203B]/5 sm:rounded-2xl sm:p-8">
      <div className="space-y-4 sm:space-y-5">
        <div className="flex justify-center">{icon}</div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold leading-tight text-[#0C203B] sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm font-medium text-[#0C203B]/90 sm:text-base">
              {subtitle}
            </p>
          )}
          <p className="text-sm leading-relaxed text-[#0C203B]/80 sm:text-base">
            {message}
          </p>
        </div>
        {children}
        {actions && (
          <div className="flex flex-col gap-3 pt-1 sm:pt-2">{actions}</div>
        )}
      </div>
    </div>
  );
}

export function CheckoutStatusIcon({
  children,
  className = "bg-amber-50 text-amber-600",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-16 w-16 items-center justify-center rounded-full sm:h-20 sm:w-20 ${className}`}
    >
      {children}
    </div>
  );
}

export function CheckoutStatusPrimaryButton({
  children,
  className = "",
  ...props
}: React.ComponentProps<"a">) {
  return (
    <a
      className={`ghc-btn-primary inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 py-3 text-base sm:min-h-10 sm:py-2.5 sm:text-sm ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}

export function CheckoutStatusLink({
  children,
  className = "",
  ...props
}: React.ComponentProps<"a">) {
  return (
    <a
      className={`inline-flex min-h-11 items-center justify-center py-2 text-sm font-medium underline-offset-4 hover:underline sm:min-h-0 ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}

export function CheckoutStatusTextLink({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={`inline-flex min-h-11 items-center justify-center py-2 text-sm font-medium underline-offset-4 hover:underline sm:min-h-0 ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export function CheckoutStatusPrimaryTextLink({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={`ghc-btn-primary inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 py-3 text-base no-underline hover:no-underline sm:min-h-10 sm:py-2.5 sm:text-sm ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export function CheckoutStatusNote({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="rounded-xl border border-[#0C203B]/10 bg-[#FDE8EA]/60 px-4 py-3 text-left text-sm leading-relaxed text-[#0C203B]/80 sm:text-center">
      {children}
    </p>
  );
}
