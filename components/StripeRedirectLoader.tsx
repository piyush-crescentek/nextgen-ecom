import Image from 'next/image';

interface StripeRedirectLoaderProps {
    message?: string;
}

export default function StripeRedirectLoader({ message = "Redirecting to Stripe Checkout..." }: StripeRedirectLoaderProps) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full mx-4 text-center">
                {/* Stripe Logo */}
                <div className="mb-6 flex justify-center">
                    <Image src="/images/stripe-logo.png" alt="Stripe" width={80} height={40} className="h-8 w-auto object-contain" />
                </div>

                {/* Animated Spinner */}
                <div className="mb-6 flex justify-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                        <div className="w-16 h-16 border-4 border-[#635BFF] border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                    </div>
                </div>

                {/* Message */}
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                    {message}
                </h2>
                <p className="text-gray-500 text-sm md:text-base">
                    Please wait while we securely redirect you to complete your payment.
                </p>

                {/* Security Badge */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Secured by Stripe</span>
                </div>
            </div>
        </div>
    );
}
