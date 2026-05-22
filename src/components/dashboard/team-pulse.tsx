import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TeamMember } from "@/lib/one-on-ones/queries";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { formatRelativeWeeks } from "@/lib/format";

const STALE_THRESHOLD_WEEKS = 3;
const MAX_VISIBLE = 5;

export function TeamPulse({ members }: { members: TeamMember[] }) {
  const stale = members
    .filter((m) => (m.weeks_since_last ?? Number.POSITIVE_INFINITY) >= STALE_THRESHOLD_WEEKS)
    .sort((a, b) => (b.weeks_since_last ?? 0) - (a.weeks_since_last ?? 0))
    .slice(0, MAX_VISIBLE);

  if (stale.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Tijd voor een 1-op-1?
        </h2>
        <Link
          href="/team"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground/65 hover:text-primary"
        >
          Bekijk je team
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <ul className="overflow-hidden rounded-2xl bg-card shadow-sm">
        {stale.map((m) => (
          <li key={m.id} className="border-b border-border last:border-b-0">
            <Link
              href={`/team/${m.id}`}
              className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/40"
            >
              <PersonAvatar
                id={m.id}
                name={m.name}
                avatarUrl={m.avatar_url}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium leading-tight">
                  {m.name}
                </p>
                <p className="truncate text-[12px] text-muted-foreground">
                  Laatste 1-op-1{" "}
                  {m.last_one_on_one_at
                    ? formatRelativeWeeks(m.last_one_on_one_at)
                    : "nog niet geweest"}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-foreground/65 group-hover:text-primary">
                Open
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
