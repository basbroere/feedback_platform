import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-96" />
      </header>

      <div className="space-y-3 rounded-xl bg-card p-5 shadow-sm">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-72" />
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="space-y-3 rounded-xl bg-card p-5 shadow-sm">
        <Skeleton className="h-5 w-40" />
        <div className="divide-y divide-border/60">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
