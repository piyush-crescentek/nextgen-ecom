import { Suspense } from "react";
import Auth from "@/components/my-account/Auth";

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <div className="no-btn-hover">
        <Auth />
      </div>
    </Suspense>
  );
}
