import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatRelativeWeeks } from "@/lib/format";
import type { TeamMember } from "@/lib/one-on-ones/queries";
import { PersonAvatar } from "./person-avatar";

const STALE_THRESHOLD_WEEKS = 3;

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
    <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {members.map((m) => {
        const isStale = (m.weeks_since_last ?? 0) >= STALE_THRESHOLD_WEEKS;

        return (
          <li key={m.id} className="border-b border-border last:border-b-0">
            <Link
              href={`/team/${m.id}`}
              className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/30"
            >
              <PersonAvatar id={m.id} name={m.name} avatarUrl={m.avatar_url} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold leading-tight">
                  {m.name}
                </p>
                <p className="truncate text-[12px] text-muted-foreground">
                  {m.email}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-[12px] ${isStale ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                  {m.last_one_on_one_at
                    ? formatRelativeWeeks(m.last_one_on_one_at)
                    : "Nog geen 1-op-1"}
                </p>
                {isStale && (
                  <p className="text-[11px] text-amber-500">tijd voor een nieuwe?</p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" strokeWidth={1.75} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
