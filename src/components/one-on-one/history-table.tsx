import Link from "next/link";
import { ChevronRight, CalendarClock, CircleCheck } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import type { OneOnOneListItem } from "@/lib/one-on-ones/types";

export function HistoryTable({
  items,
  emptyLabel = "Nog geen 1-op-1's vastgelegd.",
}: {
  items: OneOnOneListItem[];
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
      {items.map((item) => {
        const completed = Boolean(item.completed_at);
        const Icon = completed ? CircleCheck : CalendarClock;
        return (
          <li key={item.id}>
            <Link
              href={`/een-op-een/${item.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-accent/40"
            >
              <span
                className={
                  completed
                    ? "flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                }
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium tracking-tight">
                  {item.subject}
                </p>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  {formatDateTime(item.scheduled_at) || "Nog geen datum"}
                  {` · ${completed ? "Afgerond" : "Gepland"}`}
                  {item.shared_summary
                    ? ` · ${item.shared_summary.slice(0, 90)}${item.shared_summary.length > 90 ? "..." : ""}`
                    : ""}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
