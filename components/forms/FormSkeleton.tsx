import { Skeleton } from "../ui/Skeleton";

export default function FormSkeleton() {
    return (
        <div className="bg-white pt-[115px] pb-20 relative lg:before:absolute lg:before:top-0 lg:before:left-0 lg:before:w-1/2 lg:before:h-full lg:before:bg-[#E7E9ED]">
            <div className="w-full md:container mx-auto">
                {/* Form Title Skeleton */}
                <div className="py-8 text-center flex justify-center">
                    <Skeleton className="h-10 w-64 rounded-md" />
                </div>

                <div className="flex flex-col lg:flex-row justify-end w-full">
                    {/* Left Side - Step Navigation Skeleton */}
                    <div className="w-full lg:w-1/2 lg:bg-[#E7E9ED] md:bg-transparent">
                        <div className="p-6 lg:py-8 xl:pr-24">
                            <div className="flex flex-row lg:flex-col justify-center lg:justify-start relative space-y-0 lg:space-y-8">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-center lg:items-start flex-col lg:flex-row flex-1 lg:flex-auto gap-2 lg:gap-6 relative">
                                        <Skeleton className="w-8 h-8 rounded-full z-10" />
                                        <div className="pt-1">
                                            <Skeleton className="h-4 w-24 rounded" />
                                        </div>
                                    </div>
                                ))}
                                {/* Vertical line connector for desktop */}
                                <div className="hidden lg:block absolute left-4 top-4 h-[calc(100%-1rem)] w-px bg-gray-200 -z-0" />
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Form Content Skeleton */}
                    <div className="w-full lg:w-1/2">
                        <div className="p-6 xl:pl-24">
                            <div className="space-y-8">
                                {/* Step Info & Progress Bar */}
                                <div className="w-full space-y-4">
                                    <Skeleton className="h-6 w-48 rounded" />
                                    <div className="bg-black/5 rounded-md w-full h-2.5 overflow-hidden">
                                        <Skeleton className="h-full w-2/5 rounded-none" />
                                    </div>
                                </div>

                                {/* Form Fields Skeleton */}
                                <div className="space-y-8">
                                    {/* Name Group Placeholder */}
                                    <div className="bg-[#E7E9ED] border border-gray-100 rounded-md p-4 space-y-4">
                                        <Skeleton className="h-4 w-32 rounded" />
                                        <div className="flex gap-5">
                                            <Skeleton className="h-12 flex-1 rounded-md" />
                                            <Skeleton className="h-12 flex-1 rounded-md" />
                                        </div>
                                        <Skeleton className="h-3 w-48 rounded" />
                                    </div>

                                    {/* Single Inputs */}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24 rounded" />
                                            <Skeleton className="h-12 w-full rounded-md" />
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32 rounded" />
                                            <Skeleton className="h-12 w-full rounded-md" />
                                        </div>
                                    </div>

                                    {/* Radio/Checkbox Group Placeholder */}
                                    <div className="bg-[#E7E9ED] border border-gray-100 rounded-md p-4 space-y-6">
                                        <Skeleton className="h-4 w-48 rounded" />
                                        <div className="flex flex-wrap gap-4">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <Skeleton className="size-5 rounded-full" />
                                                    <Skeleton className="h-4 w-16 rounded" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Textarea Placeholder */}
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-28 rounded" />
                                        <Skeleton className="h-32 w-full rounded-md" />
                                    </div>
                                </div>

                                {/* Buttons Skeleton */}
                                <div className="flex items-center justify-between gap-4 mt-10">
                                    <Skeleton className="h-12 w-1/3 rounded-md" />
                                    <Skeleton className="h-12 w-1/3 rounded-md shadow-sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
