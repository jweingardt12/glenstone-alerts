import { Skeleton } from "@/components/ui/skeleton";

export function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Month Navigation Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      {/* Calendar Grid Skeleton */}
      <div className="border rounded-lg overflow-hidden bg-card">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-muted border-b">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`p-3 flex items-center justify-center ${
                i < 6 ? "border-r" : ""
              }`}
            >
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className={`aspect-square border-b p-4 ${
                (i % 7) < 6 ? "border-r" : ""
              }`}
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
