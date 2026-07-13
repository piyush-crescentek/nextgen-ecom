import { Skeleton } from "../ui/Skeleton";

export default function CheckoutSkeleton() {
    return (
        <div className="bg-white pt-24 pb-20 px-4 md:px-0">
            <div className="max-w-7xl mx-auto">
                {/* Page Title */}
                <div className="mb-8">
                    <Skeleton className="h-10 w-64 rounded-md" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column - Billing details */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Notification Banners */}
                        <div className="space-y-4">
                            <Skeleton className="h-14 w-full rounded-md" />
                            <Skeleton className="h-14 w-full rounded-md" />
                        </div>

                        {/* Billing Form */}
                        <div className="bg-white border border-gray-100 rounded-xl p-6 md:p-8 shadow-sm">
                            <Skeleton className="h-8 w-40 rounded mb-8" />

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24 rounded" />
                                        <Skeleton className="h-12 w-full rounded-md" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24 rounded" />
                                        <Skeleton className="h-12 w-full rounded-md" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-40 rounded" />
                                    <Skeleton className="h-12 w-full rounded-md" />
                                </div>

                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32 rounded" />
                                    <Skeleton className="h-12 w-full rounded-md" />
                                </div>

                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-48 rounded" />
                                    <div className="space-y-3">
                                        <Skeleton className="h-12 w-full rounded-md" />
                                        <Skeleton className="h-12 w-full rounded-md" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24 rounded" />
                                        <Skeleton className="h-12 w-full rounded-md" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24 rounded" />
                                        <Skeleton className="h-12 w-full rounded-md" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-5">
                        <div className="bg-[#E7E9ED] border border-(--maincolor)/10 rounded-2xl p-6 md:p-8">
                            <Skeleton className="h-8 w-32 rounded mb-6" />

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between pb-2 border-b border-(--maincolor)/10">
                                    <Skeleton className="h-4 w-20 rounded" />
                                    <Skeleton className="h-4 w-20 rounded" />
                                </div>
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-40 rounded" />
                                    <Skeleton className="h-4 w-16 rounded" />
                                </div>
                                <div className="flex justify-between pt-4 border-t border-(--maincolor)/10">
                                    <Skeleton className="h-6 w-16 rounded" />
                                    <Skeleton className="h-6 w-20 rounded" />
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div className="space-y-4">
                                <Skeleton className="h-24 w-full rounded-xl" />
                            </div>

                            <div className="mt-8 space-y-4">
                                <Skeleton className="h-12 w-full rounded" />
                                <Skeleton className="h-14 w-full rounded-md" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
