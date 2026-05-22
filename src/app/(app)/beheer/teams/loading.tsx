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
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-72" />
        <Skeleton className="h-9 w-full" />
      </div>

      <div className="space-y-3 rounded-xl bg-card p-5 shadow-sm">
        <Skeleton className="h-5 w-40" />
        <div className="divide-y divide-border/60">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5 py-3 first:pt-0 last:pb-0">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
