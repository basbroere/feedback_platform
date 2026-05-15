import { CheckCircle2, Clock3, Hourglass, Sparkles } from "lucide-react";
import type { DossierStats } from "@/lib/action-items/queries";
import { cn } from "@/lib/utils";

type Tone = "blue" | "emerald" | "violet" | "amber";

const TONE: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
  emerald:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
  violet:
    "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
};

export function StatsCards({ stats }: { stats: DossierStats }) {
  const cards = [
    {
      icon: Sparkles,
      tone: "blue" as Tone,
      label: "Lopend",
      value: stats.openTotal,
      hint:
        stats.openTotal === 0
          ? "Schoon dossier"
          : stats.openTotal === 1
          ? "1 punt op je radar"
          : `${stats.openTotal} punten op je radar`,
    },
    {
      icon: CheckCircle2,
      tone: "emerald" as Tone,
      label: "Afgerond (30 dgn)",
      value: stats.completedLast30Days,
      hint:
        stats.completedLast30Days === 0
          ? "Nog niets afgerond"
          : "Lekker bezig",
    },
    {
      icon: Clock3,
      tone: "violet" as Tone,
      label: "Gem. doorlooptijd",
      value: stats.avgDurationDays ?? "–",
      hint: stats.avgDurationDays != null ? "dagen" : "Nog te weinig data",
    },
    {
      icon: Hourglass,
      tone: "amber" as Tone,
      label: "Open >4 weken",
      value: stats.openOver4Weeks,
      hint:
        stats.openOver4Weeks === 0
          ? "Niets blijft hangen"
          : "Misschien tijd om bij te werken",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className={cn(
              "flex flex-col gap-3 rounded-2xl border border-border bg-card px-5 py-4",
              "shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {c.label}
              </span>
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  TONE[c.tone],
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </div>
            <div className="space-y-0.5">
              <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums">
                {c.value}
              </p>
              <p className="text-[12px] text-muted-foreground">{c.hint}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
