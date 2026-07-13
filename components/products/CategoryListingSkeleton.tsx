"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export default function CategoryListingSkeleton({ categorySlug }: { categorySlug?: string }) {
    return (
        <>
            {/* Banner Skeleton */}
            <div className="flex md:items-center md:flex-row flex-col bg-[#E7E9ED] md:h-[550px] relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-end w-full md:h-full">
                    <div className="md:w-1/2 w-full h-[300px] sm:h-[400px] md:h-full relative">
                        <Skeleton className="w-full h-full bg-gray-300" />
                    </div>
                </div>
                <div className="relative md:absolute top-0 left-0 w-full md:h-full">
                    <div className="container md:h-full">
                        <div className="md:w-1/2 md:h-full">
                            <div className="flex flex-col items-start justify-center md:h-full py-8 md:pr-9">
                                <div className="space-y-4 w-full">
                                    <Skeleton className="h-12 md:h-16 w-3/4 bg-gray-300" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-6 w-full bg-gray-300" />
                                        <Skeleton className="h-6 w-5/6 bg-gray-300" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-12 lg:py-20">
                <div className="container">
                    <div className="flex flex-col items-center mb-8 lg:mb-14">

                        {/* Conditional Tabs Skeleton for Treatments */}
                        {categorySlug === 'treatments' && (
                            <div className="flex flex-col items-center mb-16 lg:mb-20 w-full">
                                <Skeleton className="h-10 w-2/3 max-w-lg mb-12 bg-gray-200" />
                                <div className="flex flex-wrap justify-center gap-6 mb-12">
                                    <Skeleton className="h-[68px] w-[220px] rounded-xl bg-gray-200" />
                                    <Skeleton className="h-[68px] w-[240px] rounded-xl bg-gray-200" />
                                </div>
                                <div className="space-y-3 w-full max-w-4xl">
                                    <Skeleton className="h-4 w-full bg-gray-200" />
                                    <Skeleton className="h-4 w-11/12 bg-gray-200" />
                                    <Skeleton className="h-4 w-full bg-gray-200" />
                                </div>
                            </div>
                        )}

                        {/* Product Grid Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7 mt-8 w-full">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="flex flex-col min-h-[454px] bg-[#E7E9ED] rounded-lg overflow-hidden border border-gray-100">
                                    <Skeleton className="w-full h-[290px] bg-gray-200" />
                                    <div className="p-6 space-y-4">
                                        <Skeleton className="h-8 w-3/4 bg-gray-200" />
                                        <Skeleton className="h-6 w-1/4 bg-gray-200" />
                                        <div className="pt-2">
                                            <Skeleton className="h-4 w-1/3 bg-gray-200" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
