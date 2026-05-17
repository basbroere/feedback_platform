import Link from "next/link";
import { ArrowRight, Building2, MessageSquareText, Sparkles, UsersRound } from "lucide-react";
import type { HrSnapshot } from "@/lib/hr/queries";
import { cn } from "@/lib/utils";

export function HrSummary({ snapshot }: { snapshot: HrSnapshot }) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Organisatie deze maand
          </h2>
          <span className="text-[12px] text-muted-foreground">
            Live cijfers uit het platform
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tile
            icon={MessageSquareText}
            tone="blue"
            value={snapshot.oneOnOnesThisMonth}
            label="1-op-1's voltooid"
          />
          <Tile
            icon={Sparkles}
            tone="primary"
            value={snapshot.feedbackThisMonth}
            label="Feedback gegeven"
          />
          <Tile
            icon={Building2}
            tone="violet"
            value={
              snapshot.crossTeamRate != null ? `${snapshot.crossTeamRate}%` : "–"
            }
            label="Cross-team feedback"
          />
          <Tile
            icon={UsersRound}
            tone="emerald"
            value={snapshot.employeeCount}
            label={`Medewerkers in ${snapshot.teamCount} teams`}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-border bg-card/50 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[14px] font-medium leading-tight">
              HR-overzicht groeit nog mee
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Templatebeheer, drilldowns per team en de cross-team analyses
              voor het scriptie-onderzoek komen in een volgende fase.
            </p>
          </div>
          <Link
            href="/team"
            className="inline-flex shrink-0 items-center gap-1 self-center text-[12px] font-medium text-foreground/65 hover:text-primary"
          >
            Bekijk teams
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>
    </div>
  );
}

type Tone = "blue" | "primary" | "violet" | "emerald";

const TONE: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
  primary: "bg-primary/10 text-primary",
  violet:
    "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
  emerald:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
};

function Tile({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: typeof Building2;
  tone: Tone;
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          TONE[tone],
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="space-y-0.5">
        <p className="text-[24px] font-semibold leading-none tracking-tight tabular-nums">
          {value}
        </p>
        <p className="text-[12px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
