import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />

      <header className="space-y-2">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-3 w-96" />
      </header>

      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}
