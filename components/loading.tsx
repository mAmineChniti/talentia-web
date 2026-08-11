import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="grid gap-6 p-4 sm:p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => {
          return <Skeleton key={i} className="h-28 rounded-2xl" />;
        })}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
