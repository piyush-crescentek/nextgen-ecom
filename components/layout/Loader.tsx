"use client";

interface LoaderProps {
    message?: string;
    fullScreen?: boolean;
}

export default function Loader({ message, fullScreen = true }: LoaderProps) {
    return (
        <div
            className={`flex flex-col items-center justify-center bg-[#E7E9ED] ${fullScreen ? "fixed inset-0 z-[9999]" : "w-full py-20"
                }`}
        >
            <div className="flex flex-col items-center gap-4">
                {/* Simple Themed Ring Spinner */}
                <div className="relative size-12">
                    <div className="absolute inset-0 border-4 border-[var(--maincolor)]/10 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-[var(--maincolor)] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                </div>

                {/* Optional simple text message */}
                {message && (
                    <p className="text-[var(--maincolor)] text-sm font-medium">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
