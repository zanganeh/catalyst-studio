import { Skeleton } from '@/components/ui/skeleton';

export function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-[200px]">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}