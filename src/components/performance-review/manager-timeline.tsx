import Link from "next/link";
import { ArrowRight, CalendarClock, CircleCheck } from "lucide-react";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { formatDate, formatRelativeWeeks } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PerformanceReviewListItem } from "@/lib/performance-reviews/types";

export function PerformanceReviewTimeline({
  upcoming,
  recent,
}: {
  upcoming: PerformanceReviewListItem[];
  recent: PerformanceReviewListItem[];
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-[12.5px] font-medium font-heading text-muted-foreground">
          Opkomend
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Geen lopende functioneringsgesprekken.
            </p>
          </div>
        ) : (
          <ReviewTable items={upcoming} state="upcoming" />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[12.5px] font-medium font-heading text-muted-foreground">
          Afgerond
        </h2>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nog geen afgeronde functioneringsgesprekken.
            </p>
          </div>
        ) : (
          <ReviewTable items={recent} state="completed" />
        )}
      </section>
    </div>
  );
}

function ReviewTable({
  items,
  state,
}: {
  items: PerformanceReviewListItem[];
  state: "upcoming" | "completed";
}) {
  return (
    <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-6 py-3 text-left text-[12.5px] font-medium font-heading text-muted-foreground">
              Persoon
            </th>
            <th className="px-4 py-3 text-left text-[12.5px] font-medium font-heading text-muted-foreground">
              {state === "completed" ? "Afgerond" : "Gestart"}
            </th>
            <th className="hidden md:table-cell px-4 py-3 text-left text-[12.5px] font-medium font-heading text-muted-foreground">
              Onderwerp
            </th>
            <th className="hidden lg:table-cell px-4 py-3 text-left text-[12.5px] font-medium font-heading text-muted-foreground">
              {state === "completed" ? "Samenvatting" : "Status"}
            </th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr
              key={item.id}
              className={cn(
                "group border-b border-border/50 last:border-b-0 transition-colors hover:bg-accent/40",
                i % 2 === 1 && "bg-muted/30",
              )}
            >
              <td className="px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <PersonAvatar
                    id={item.employee.id}
                    name={item.employee.name}
                    avatarUrl={item.employee.avatar_url}
                  />
                  <span className="text-[13.5px] font-semibold whitespace-nowrap">
                    {item.employee.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-[13px] text-muted-foreground whitespace-nowrap">
                {state === "completed" && item.completed_at
                  ? formatRelativeWeeks(item.completed_at)
                  : formatDate(item.cycle_started_at)}
              </td>
              <td className="hidden md:table-cell px-4 py-3.5">
                <span className="text-[13px]">
                  {item.template_name || (
                    <span className="text-muted-foreground/50">
                      Functioneringsgesprek
                    </span>
                  )}
                </span>
              </td>
              <td className="hidden lg:table-cell px-4 py-3.5">
                {state === "completed" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CircleCheck className="h-3 w-3" strokeWidth={2} />
                    Afgerond
                  </span>
                ) : (
                  <CycleProgress item={item} />
                )}
              </td>
              <td className="px-6 py-3.5 text-right">
                <Link
                  href={`/functioneringsgesprek/${item.id}`}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground/50 transition-colors group-hover:text-primary"
                >
                  {state === "upcoming" ? "Openen" : "Bekijken"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CycleProgress({ item }: { item: PerformanceReviewListItem }) {
  const submitted = [
    item.has_employee_input,
    item.has_peer_submitted,
    item.has_manager_submitted,
  ].filter(Boolean).length;

  if (submitted === 3) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CircleCheck className="h-3 w-3" strokeWidth={2} />
        Klaar voor gesprek
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
      <CalendarClock className="h-3 w-3" strokeWidth={1.75} />
      {submitted} van 3 input binnen
    </span>
  );
}
