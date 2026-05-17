import { Hourglass } from "lucide-react";

export function ActionItemsHeader({
  openTotal,
  completedLast30Days,
  openOver4Weeks,
}: {
  openTotal: number;
  completedLast30Days: number;
  openOver4Weeks: number;
}) {
  return (
    <div className="space-y-4">
      <header className="space-y-1.5">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight md:text-[32px]">
          Actiepunten
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Volg wat je je hebt voorgenomen. Vink af wat klaar is, kom terug op wat blijft hangen.
        </p>
      </header>

      <MetricStrip
        openTotal={openTotal}
        completedLast30Days={completedLast30Days}
      />

      {openOver4Weeks > 0 ? <StaleNudge count={openOver4Weeks} /> : null}
    </div>
  );
}

function MetricStrip({
  openTotal,
  completedLast30Days,
}: {
  openTotal: number;
  completedLast30Days: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
      <Metric value={openTotal} label="lopend" />
      <span aria-hidden className="text-muted-foreground/40">
        ·
      </span>
      <Metric
        value={completedLast30Days}
        label="afgerond afgelopen 30 dagen"
      />
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[16px] font-semibold text-foreground tabular-nums">
        {value}
      </span>
      <span>{label}</span>
    </span>
  );
}

function StaleNudge({ count }: { count: number }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-[13px] text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200">
        <Hourglass className="h-3.5 w-3.5" strokeWidth={1.75} />
      </span>
      <p className="leading-snug">
        <span className="font-semibold">
          {count} actiepunt{count === 1 ? "" : "en"}
        </span>{" "}
        staat al langer dan 4 weken open. Een goed moment om bij te werken, of
        af te ronden als het toch niet meer past?
      </p>
    </div>
  );
}
