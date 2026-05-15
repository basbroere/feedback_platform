import Link from "next/link";
import { CalendarClock, Clock } from "lucide-react";
import { formatDate, formatRelativeWeeks } from "@/lib/format";
import type { TeamMember } from "@/lib/one-on-ones/queries";
import { PersonAvatar } from "./person-avatar";

export function TeamList({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Je hebt nog geen teamleden in dit team.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {members.map((m) => {
        const isStale = (m.weeks_since_last ?? 0) >= 3;
        const lastLabel = m.last_one_on_one_at
          ? formatRelativeWeeks(m.last_one_on_one_at)
          : "Nog geen 1-op-1 gehad";
        const upcomingLabel = m.upcoming_one_on_one_at
          ? formatDate(m.upcoming_one_on_one_at)
          : null;

        return (
          <li key={m.id}>
            <Link
              href={`/team/${m.id}`}
              className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-foreground/15 hover:bg-accent/30"
            >
              <div className="flex items-center gap-3">
                <PersonAvatar
                  id={m.id}
                  name={m.name}
                  avatarUrl={m.avatar_url}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold tracking-tight group-hover:underline">
                    {m.name}
                  </p>
                  <p className="truncate text-[12.5px] text-muted-foreground">
                    {m.email}
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-border/60 pt-3 text-[13px]">
                <div className="flex items-start gap-2">
                  <Clock
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0">
                    <p className="text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">
                      Laatste 1-op-1
                    </p>
                    <p className="truncate text-foreground/90">
                      {lastLabel}
                      {isStale ? (
                        <span className="ml-1.5 text-muted-foreground">
                          · tijd voor een nieuwe?
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CalendarClock
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0">
                    <p className="text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">
                      Volgende 1-op-1
                    </p>
                    <p className="truncate text-foreground/90">
                      {upcomingLabel ?? (
                        <span className="text-muted-foreground">
                          Nog niet gepland
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
