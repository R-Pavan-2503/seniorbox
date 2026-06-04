export const SkeletonGrid = ({ count = 12 }: { count?: number }) => (
  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="aspect-[2/3] animate-pulse rounded-md bg-zinc-800" />
    ))}
  </div>
);
