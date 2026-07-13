import { Skeleton } from "../ui/Skeleton";

export const DoctorSectionSkeleton = () => (
    <section className="w-full bg-white py-12 lg:py-20">
        <div className="container">
            <div className="space-y-4 mb-10">
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-6 w-2/3" />
            </div>
            <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="max-w-lg lg:w-1/3 w-full">
                    <Skeleton className="min-h-[616px] w-full rounded-xl" />
                </div>
                <div className="w-full lg:w-2/3">
                    <div className="flex flex-col gap-5 pb-6">
                        <Skeleton className="h-9 w-1/2" />
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-5/6" />
                            <Skeleton className="h-5 w-4/5" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-5">
                        <Skeleton className="h-9 w-1/2" />
                        <div className="flex flex-col sm:grid grid-flow-col grid-rows-2 gap-5">
                            <Skeleton className="row-span-3 h-[300px] w-full rounded-xl" />
                            <Skeleton className="col-span-2 row-span-1 h-[140px] w-full rounded-xl" />
                            <Skeleton className="col-span-2 row-span-1 h-[140px] w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

export const PopularTreatmentsSkeleton = () => (
    <div className="bg-(--maincolor) py-20 overflow-x-hidden">
        <div className="container">
            <div className="block mb-9">
                <Skeleton className="h-6 w-32 mb-2 bg-white/20" />
                <Skeleton className="h-9 w-2/3 bg-white/20" />
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-6 mb-5">
                    <div className="flex gap-6">
                        <Skeleton className="h-12 w-40 bg-white/20 rounded-md" />
                        <Skeleton className="h-12 w-40 bg-white/20 rounded-md" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-[600px] w-full rounded-xl bg-white/10" />
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export const FaqSectionSkeleton = () => (
    <section className="w-full bg-[#E7E9ED] py-12 lg:py-20">
        <div className="container">
            <div className="flex flex-col mb-12">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-9 w-1/2" />
            </div>
            <div className="flex flex-col lg:flex-row lg:gap-10">
                <div className="flex flex-col lg:w-2/5 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-md" />
                    ))}
                </div>
                <div className="flex flex-col lg:w-3/5 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </div>
        </div>
    </section>
);
