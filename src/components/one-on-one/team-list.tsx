import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatRelativeWeeks } from "@/lib/format";
import type { TeamMember } from "@/lib/one-on-ones/queries";
import { ScheduleDialog } from "./schedule-dialog";
import { PersonAvatar } from "./person-avatar";
import { cn } from "@/lib/utils";

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
    <ul className="space-y-2">
      {members.map((m) => {
        const lastLabel = m.last_one_on_one_at
          ? formatRelativeWeeks(m.last_one_on_one_at)
          : "Nog geen 1-op-1 gehad";
        const isStale = (m.weeks_since_last ?? 0) >= 3;
        return (
          <li
            key={m.id}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-foreground/15"
          >
            <PersonAvatar id={m.id} name={m.name} avatarUrl={m.avatar_url} />
            <div className="min-w-0 flex-1">
              <Link
                href={`/team/${m.id}`}
                className="block truncate text-[15px] font-semibold tracking-tight hover:underline"
              >
                {m.name}
              </Link>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Laatste 1-op-1: {lastLabel}
                {isStale ? (
                  <span className="ml-2 text-foreground/70">
                    · tijd voor een nieuwe?
                  </span>
                ) : null}
              </p>
            </div>
            <ScheduleDialog
              employeeId={m.id}
              employeeName={m.name}
              triggerLabel="Nieuwe 1-op-1"
            />
            <Link
              href={`/team/${m.id}`}
              aria-label="Open historie"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
