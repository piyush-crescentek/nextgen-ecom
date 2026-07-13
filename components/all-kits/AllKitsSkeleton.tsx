"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export default function AllKitsSkeleton() {
    return (
        <>
            {/* Banner Skeleton */}
            <div className="flex items-center bg-gray-100 min-h-[400px] md:min-h-[440px] relative overflow-hidden">
                <div className="container">
                    <div className="flex flex-col items-center justify-center h-full md:mt-16 max-w-6xl mx-auto">
                        <div className="space-y-4 md:space-y-6 text-center w-full max-w-3xl">
                            <Skeleton className="h-10 md:h-14 w-3/4 mx-auto bg-gray-300" />
                            <Skeleton className="h-6 w-1/2 mx-auto bg-gray-300" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full bg-gray-300" />
                                <Skeleton className="h-4 w-5/6 mx-auto bg-gray-300" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-12 lg:pt-20 pb-12 lg:pb-20 bg-white">
                <div className="container">
                    <div className="flex flex-col xl:flex-row justify-between gap-8">
                        {/* Sidebar Skeleton */}
                        <aside className="lg:mx-auto w-full xl:w-1/4 shrink-0 h-fit">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <div className="flex items-center justify-between border-b border-gray-200 p-4">
                                    <Skeleton className="h-7 w-20 bg-gray-200" />
                                    <Skeleton className="size-8 rounded-xl bg-gray-200" />
                                </div>
                                <div className="p-4 space-y-6">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="space-y-3">
                                            <Skeleton className="h-6 w-1/2 bg-gray-100" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-full bg-gray-50" />
                                                <Skeleton className="h-4 w-full bg-gray-50" />
                                                <Skeleton className="h-4 w-3/4 bg-gray-50" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* Main Content Skeleton */}
                        <div className="lg:mx-auto w-full xl:w-3/4">
                            <div className="flex items-center justify-between mb-6">
                                <Skeleton className="h-5 w-40 bg-gray-200" />
                            </div>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-gray-50 border border-slate-100 rounded-xl overflow-hidden">
                                        <Skeleton className="h-48 w-full bg-gray-200" />
                                        <div className="p-5 space-y-4">
                                            <Skeleton className="h-6 w-3/4 bg-gray-200" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-full bg-gray-100" />
                                                <Skeleton className="h-4 w-2/3 bg-gray-100" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="size-4 rounded-full bg-gray-100" />
                                                <Skeleton className="h-4 w-1/2 bg-gray-100" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="size-4 rounded-full bg-gray-100" />
                                                <Skeleton className="h-4 w-1/3 bg-gray-100" />
                                            </div>
                                            <Skeleton className="h-8 w-24 bg-gray-200" />
                                            <Skeleton className="h-10 w-full rounded-full bg-gray-200" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
