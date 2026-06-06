import Link from "next/link";
import { ArrowRight, CircleCheck, CalendarClock } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/format";
import type { OneOnOneListItem } from "@/lib/one-on-ones/types";
import { cn } from "@/lib/utils";

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
    <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-6 py-3 text-left text-[12.5px] font-medium font-heading text-muted-foreground">
              Datum
            </th>
            <th className="px-4 py-3 text-left text-[12.5px] font-medium font-heading text-muted-foreground">
              Onderwerp
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-left text-[12.5px] font-medium font-heading text-muted-foreground">
              Status
            </th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const completed = Boolean(item.completed_at);
            return (
              <tr
                key={item.id}
                className={cn(
                  "group border-b border-border/50 last:border-b-0 transition-colors hover:bg-accent/40",
                  i % 2 === 1 && "bg-muted/30",
                )}
              >
                <td className="px-6 py-3.5 text-[13px] text-muted-foreground whitespace-nowrap">
                  {formatDate(item.scheduled_at)}
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[13.5px] font-medium">
                    {item.subject || "1-op-1"}
                  </span>
                  {item.shared_summary ? (
                    <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground max-w-[320px]">
                      {item.shared_summary}
                    </p>
                  ) : null}
                </td>
                <td className="hidden sm:table-cell px-4 py-3.5">
                  {completed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CircleCheck className="h-3 w-3" strokeWidth={2} />
                      Afgerond
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      <CalendarClock className="h-3 w-3" strokeWidth={1.75} />
                      Gepland
                    </span>
                  )}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <Link
                    href={`/een-op-een/${item.id}`}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground/50 transition-colors group-hover:text-primary"
                  >
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
