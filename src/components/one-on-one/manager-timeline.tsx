import Link from "next/link";
import { ArrowRight, CalendarClock, CircleCheck } from "lucide-react";
import type { ManagerUpcomingOneOnOne } from "@/lib/one-on-ones/queries";
import { PersonAvatar } from "./person-avatar";
import { formatDate, formatDateTime, formatRelativeWeeks } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ManagerTimeline({
  upcoming,
  recent,
}: {
  upcoming: ManagerUpcomingOneOnOne[];
  recent: ManagerUpcomingOneOnOne[];
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Aankomend
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Geen openstaande 1-op-1&apos;s. Plan er een in via /team.
            </p>
          </div>
        ) : (
          <OneOnOneTable items={upcoming} state="upcoming" />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Recent afgerond
        </h2>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nog geen afgeronde 1-op-1&apos;s.
            </p>
          </div>
        ) : (
          <OneOnOneTable items={recent} state="completed" />
        )}
      </section>
    </div>
  );
}

function OneOnOneTable({
  items,
  state,
}: {
  items: ManagerUpcomingOneOnOne[];
  state: "upcoming" | "completed";
}) {
  return (
    <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
              Persoon
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
              {state === "completed" ? "Afgerond" : "Datum"}
            </th>
            <th className="hidden md:table-cell px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
              Onderwerp
            </th>
            <th className="hidden lg:table-cell px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
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
                  : formatDate(item.scheduled_at)}
              </td>
              <td className="hidden md:table-cell px-4 py-3.5">
                <span className="text-[13px]">
                  {item.subject || <span className="text-muted-foreground/50">—</span>}
                </span>
              </td>
              <td className="hidden lg:table-cell px-4 py-3.5">
                {state === "completed" ? (
                  item.shared_summary ? (
                    <p className="truncate text-[12px] text-muted-foreground max-w-[240px]">
                      {item.shared_summary}
                    </p>
                  ) : (
                    <span className="text-muted-foreground/40 text-[12px]">Geen samenvatting</span>
                  )
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
