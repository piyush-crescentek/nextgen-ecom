export const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />
);

export const SkeletonCircle = ({ size = "size-10", className = "" }) => (
    <div className={`animate-pulse bg-gray-200 rounded-full ${size} ${className}`} />
);
