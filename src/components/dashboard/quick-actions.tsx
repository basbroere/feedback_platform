import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { TONE_BG, type Tone } from "@/lib/ui/tone";
import { cn } from "@/lib/utils";

export type QuickAction = {
  href: string;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  subtitle?: string;
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  if (actions.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Snelkoppelingen
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href + a.title}
              href={a.href}
              className="group relative flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-md"
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  TONE_BG[a.tone],
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold leading-tight">
                  {a.title}
                </p>
                {a.subtitle ? (
                  <p className="truncate text-[12px] text-muted-foreground">
                    {a.subtitle}
                  </p>
                ) : null}
              </div>
              <ArrowUpRight
                className="h-4 w-4 text-foreground/35 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground/70"
                strokeWidth={2}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
