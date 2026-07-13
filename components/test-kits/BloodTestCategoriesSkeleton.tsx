"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export default function BloodTestCategoriesSkeleton() {
    return (
        <div className="bg-white">
            {/* Hero Section Skeleton */}
            <section className="relative min-h-[600px] lg:min-h-[750px] flex items-center overflow-hidden py-12 md:pt-[115px] md:pb-16 bg-gray-50">
                <div className="container relative z-30">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <Skeleton className="h-12 md:h-16 w-3/4 bg-gray-200" />
                                <Skeleton className="h-12 md:h-16 w-1/2 bg-gray-200" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-full bg-gray-200" />
                                <Skeleton className="h-6 w-5/6 bg-gray-200" />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Skeleton className="h-14 w-40 rounded-full bg-gray-300" />
                                <Skeleton className="h-14 w-40 rounded-full bg-gray-200" />
                            </div>
                        </div>
                        <div className="relative">
                            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100">
                                <div className="flex justify-between mb-10">
                                    <div className="space-y-2">
                                        <Skeleton className="h-10 w-24 bg-gray-200" />
                                        <Skeleton className="h-4 w-32 bg-gray-100" />
                                    </div>
                                    <Skeleton className="size-16 rounded-2xl bg-gray-200" />
                                </div>
                                <div className="space-y-6">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex gap-5">
                                            <Skeleton className="size-12 rounded-md shrink-0 bg-gray-100" />
                                            <div className="space-y-2 w-full">
                                                <Skeleton className="h-5 w-1/3 bg-gray-200" />
                                                <Skeleton className="h-4 w-3/4 bg-gray-100" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Skeleton */}
            <section className="py-12 md:py-16 bg-gray-50 border-y border-gray-100">
                <div className="container">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center space-y-4">
                                <Skeleton className="size-19 rounded-full bg-gray-200" />
                                <Skeleton className="h-6 w-32 bg-gray-200" />
                                <Skeleton className="h-4 w-48 bg-gray-100" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories Skeleton */}
            <section className="py-12 lg:py-20">
                <div className="container">
                    <div className="text-center mb-12 space-y-4">
                        <Skeleton className="h-10 w-64 mx-auto bg-gray-200" />
                        <Skeleton className="h-6 w-96 mx-auto bg-gray-100" />
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(9)].map((_, i) => (
                            <div key={i} className="border border-slate-200 rounded-2xl p-6 space-y-4">
                                <Skeleton className="size-14 rounded-xl bg-gray-100" />
                                <Skeleton className="h-6 w-1/2 bg-gray-200" />
                                <Skeleton className="h-16 w-full bg-gray-50" />
                                <Skeleton className="h-4 w-24 bg-gray-100" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
