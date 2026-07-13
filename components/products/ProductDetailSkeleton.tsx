import { Skeleton } from "../ui/Skeleton";

export default function ProductDetailSkeleton() {
    return (
        <div className="flex flex-col">
            {/* Banner Skeleton */}
            <div className="flex md:items-center md:flex-row flex-col bg-[#E7E9ED] md:pt-[115px] relative md:before:absolute md:before:top-0 md:before:left-0 md:before:w-1/2 md:before:h-full md:before:bg-(--foreground)">
                <div className="md:container mx-auto h-full">
                    <div className="flex flex-col md:flex-row justify-end w-full h-full">
                        <div className="w-full md:w-1/2 h-full bg-(--foreground) md:bg-transparent">
                            <div className="p-6 lg:py-8 xl:pr-[140px]">
                                {/* Breadcrumb Skeleton */}
                                <div className="flex gap-2 mb-12">
                                    <Skeleton className="h-4 w-12" />
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 w-24" />
                                </div>

                                {/* Main Slider Skeleton */}
                                <div className="relative rounded-xl overflow-hidden shadow-2xl aspect-3/2 bg-gray-300 animate-pulse" />

                                {/* Thumbnail Slider Skeleton */}
                                <div className="w-full mt-5 flex gap-3 overflow-x-auto pb-5">
                                    <Skeleton className="size-20 lg:w-32 lg:h-32 shrink-0 rounded-lg" />
                                    <Skeleton className="size-20 lg:w-32 lg:h-32 shrink-0 rounded-lg" />
                                    <Skeleton className="size-20 lg:w-32 lg:h-32 shrink-0 rounded-lg" />
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 h-full">
                            <div className="flex flex-col items-start justify-center h-full p-6 lg:pt-8 lg:pb-20 xl:pl-[140px]">
                                <div className="space-y-5 w-full">
                                    {/* Title and Description */}
                                    <div className="space-y-3">
                                        <Skeleton className="h-8 lg:h-10 w-3/4" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                    </div>

                                    {/* Price Skeleton */}
                                    <Skeleton className="h-8 w-1/3" />

                                    {/* Badges Skeleton */}
                                    <div className="flex border-y border-[#BFC8C6] py-5 w-full">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className={`flex-1 flex flex-col items-center gap-3 px-2 ${i !== 3 ? 'border-r border-[#BFC8C6]' : ''}`}>
                                                <Skeleton className="size-10 rounded-full" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Highlights Skeleton */}
                                    <div className="space-y-3 pb-8">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <Skeleton className="size-2 rounded-full shrink-0" />
                                                <Skeleton className="h-5 w-2/3" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA Skeleton */}
                                    <Skeleton className="h-14 w-full rounded-md" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Sections Skeleton */}
            {[1, 2].map((section) => (
                <div key={section} className="pt-24 relative">
                    <div className="container">
                        <div className="space-y-4 mb-10">
                            <Skeleton className="h-8 w-1/3" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                        </div>
                        <div className={`flex flex-col lg:flex-row lg:gap-9 gap-7 ${section % 2 === 0 ? 'lg:flex-row-reverse' : ''}`}>
                            <Skeleton className="w-full lg:w-1/2 rounded-xl aspect-[16/9]" />
                            <div className="w-full lg:w-1/2 space-y-6">
                                <Skeleton className="h-7 w-2/3" />
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex gap-4 items-start">
                                            <Skeleton className="size-6 shrink-0 rounded" />
                                            <div className="space-y-2 flex-grow">
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-4/5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Process Cards Skeleton */}
            <div className="py-26 relative">
                <div className="container">
                    <Skeleton className="h-8 w-1/4 mx-auto mb-12" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white/50 border border-gray-100 rounded-md p-13 space-y-6">
                                <Skeleton className="size-16 mx-auto rounded-full" />
                                <Skeleton className="h-px w-full" />
                                <div className="space-y-3">
                                    <Skeleton className="h-6 w-1/2 mx-auto" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6 mx-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQs Skeleton */}
            <div className="pt-20">
                <div className="container">
                    <div className="space-y-4 mb-12">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-1/3" />
                    </div>
                    <div className="flex flex-col lg:flex-row lg:gap-10">
                        {/* Sidebar Tabs Skeleton */}
                        <div className="flex flex-col lg:w-2/5 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-14 w-full rounded-md" />
                            ))}
                        </div>
                        {/* Accordion List Skeleton */}
                        <div className="flex flex-col lg:w-3/5 space-y-4 mt-10 lg:mt-0">
                            {[1, 3, 4, 5].map((i) => (
                                <div key={i} className="border-b border-gray-100 py-4 flex justify-between items-center">
                                    <Skeleton className="h-6 w-2/3" />
                                    <Skeleton className="size-8 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Services Skeleton */}
            <div className="py-20">
                <div className="container">
                    <Skeleton className="h-8 w-1/4 mb-8" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="aspect-square rounded-xl" />
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Newsletter Skeleton */}
            <div className="bg-[#f8f8f8] py-20">
                <div className="container">
                    <div className="xl:w-3/4 mx-auto text-center space-y-10">
                        <Skeleton className="h-10 w-4/5 mx-auto" />
                        <Skeleton className="h-6 w-full mx-auto" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                            <Skeleton className="h-12 w-full rounded-md" />
                            <Skeleton className="h-12 w-full rounded-md" />
                            <div className="col-span-2 flex justify-center">
                                <Skeleton className="h-14 w-48 rounded-md" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
