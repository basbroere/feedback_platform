import type { LucideIcon } from "lucide-react";
import { TONE_BG, type Tone } from "@/lib/ui/tone";
import { cn } from "@/lib/utils";

export type MetricCard = {
  value: number | string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  tone: Tone;
};

export function MetricCards({ metrics }: { metrics: MetricCard[] }) {
  if (metrics.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.label}
            className="flex items-center gap-4 rounded-2xl bg-card px-5 py-4 shadow-sm"
          >
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                TONE_BG[m.tone],
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[24px] font-semibold leading-none tracking-tight tabular-nums">
                {m.value}
              </p>
              <p className="mt-1 truncate text-[12.5px] text-muted-foreground">
                <span className="font-medium text-foreground/75">
                  {m.label}
                </span>
                {m.hint ? (
                  <>
                    <span className="mx-1 text-muted-foreground/50">·</span>
                    <span>{m.hint}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
