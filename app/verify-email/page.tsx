import VerifyEmail from "@/components/my-account/VerifyEmail";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center pt-[115px]">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--maincolor)]" />
      </div>
    }>
      <VerifyEmail />
    </Suspense>
  );
}
