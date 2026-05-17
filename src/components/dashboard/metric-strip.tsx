export type MetricCard = {
  value: number | string;
  label: string;
  hint?: string;
};

export function MetricCards({ metrics }: { metrics: MetricCard[] }) {
  if (metrics.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-xl border border-border bg-card px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {m.label}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-[22px] font-semibold leading-none tracking-tight tabular-nums">
              {m.value}
            </p>
            {m.hint ? (
              <p className="truncate text-[12px] text-muted-foreground">
                {m.hint}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
