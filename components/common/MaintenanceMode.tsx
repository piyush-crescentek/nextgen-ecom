"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { MaintenanceWindow } from "@/lib/visibility";

interface MaintenanceModeProps {
  window: MaintenanceWindow;
  durationMs: number;
}

interface CountdownParts {
  hours: string;
  minutes: string;
  seconds: string;
}

function formatCountdown(remainingMs: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

const COUNTDOWN_PLACEHOLDER: CountdownParts = {
  hours: "00",
  minutes: "00",
  seconds: "00",
};

function CountdownUnit({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex size-20 sm:size-24 items-center justify-center rounded-2xl bg-white/10 text-3xl sm:text-4xl font-bold tabular-nums backdrop-blur-sm border border-white/20">
        {value}
      </div>
      <span className="text-xs sm:text-sm uppercase tracking-widest text-white/70">{label}</span>
    </div>
  );
}

export default function MaintenanceMode({
  window: maintenanceWindow,
  durationMs,
}: MaintenanceModeProps) {
  const [countdown, setCountdown] = useState<CountdownParts>(COUNTDOWN_PLACEHOLDER);

  useEffect(() => {
    const endAt = Date.now() + durationMs;

    const tick = () => {
      const next = Math.max(0, endAt - Date.now());
      setCountdown(formatCountdown(next));
    };

    tick();
    const interval = globalThis.setInterval(tick, 1000);
    return () => globalThis.clearInterval(interval);
  }, [durationMs]);

  const title = maintenanceWindow.title?.trim() || "We'll Be Back Soon";
  const message =
    maintenanceWindow.message?.trim() ||
    "Our site is temporarily unavailable while we perform scheduled maintenance.";

  return (
    <div className="fixed inset-0 z-[99999] flex min-h-screen items-center justify-center bg-(--maincolor) px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-(--btncolor)/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl text-center">
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/logo.svg"
            alt="NexGen Healthcare"
            width={180}
            height={54}
            className="h-auto w-[150px] sm:w-[180px] brightness-0 invert"
            priority
          />
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium">
          <span className="size-2 animate-pulse rounded-full bg-(--btncolor)" />
          Maintenance in progress
        </div>

        <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">{title}</h1>
        <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
          {message}
        </p>

        <div className="mb-6">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-white/60">
            Estimated time remaining
          </p>
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            <CountdownUnit label="Hours" value={countdown.hours} />
            <span className="pb-6 text-3xl font-bold text-white/40">:</span>
            <CountdownUnit label="Minutes" value={countdown.minutes} />
            <span className="pb-6 text-3xl font-bold text-white/40">:</span>
            <CountdownUnit label="Seconds" value={countdown.seconds} />
          </div>
        </div>

        <p className="text-sm text-white/50">
          Need urgent help? Email{" "}
          <a
            href="mailto:info@gethealthcare.ie"
            className="font-medium text-(--btncolor) underline-offset-2 hover:underline"
          >
            info@gethealthcare.ie
          </a>
        </p>
      </div>
    </div>
  );
}
