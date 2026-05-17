import Link from "next/link";
import { CalendarClock, CircleCheck } from "lucide-react";
import type { ManagerUpcomingOneOnOne } from "@/lib/one-on-ones/queries";
import { PersonAvatar } from "./person-avatar";
import { formatDateTime, formatRelativeWeeks } from "@/lib/format";

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
          <TimelineList items={upcoming} state="upcoming" />
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
          <TimelineList items={recent} state="completed" />
        )}
      </section>
    </div>
  );
}

function TimelineList({
  items,
  state,
}: {
  items: ManagerUpcomingOneOnOne[];
  state: "upcoming" | "completed";
}) {
  return (
    <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {items.map((item, idx) => (
        <li
          key={item.id}
          className={
            idx < items.length - 1 ? "border-b border-border" : undefined
          }
        >
          <Link
            href={`/een-op-een/${item.id}`}
            className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/40"
          >
            <PersonAvatar
              id={item.employee.id}
              name={item.employee.name}
              avatarUrl={item.employee.avatar_url}
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="truncate text-[14px] font-medium leading-tight">
                {item.employee.name}
              </p>
              <p className="flex items-center gap-1.5 truncate text-[12px] text-muted-foreground">
                {state === "completed" ? (
                  <CircleCheck className="h-3 w-3 shrink-0 text-emerald-500" />
                ) : (
                  <CalendarClock className="h-3 w-3 shrink-0 text-blue-500" />
                )}
                {state === "completed" && item.completed_at
                  ? `Afgerond ${formatRelativeWeeks(item.completed_at)}`
                  : formatDateTime(item.scheduled_at)}
                {item.subject ? ` · ${item.subject}` : ""}
              </p>
              {state === "completed" && item.shared_summary ? (
                <p className="truncate text-[12px] text-muted-foreground/85">
                  {item.shared_summary.slice(0, 110)}
                  {item.shared_summary.length > 110 ? "..." : ""}
                </p>
              ) : null}
            </div>
            <span className="text-[12px] font-medium text-foreground/65">
              Openen
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
