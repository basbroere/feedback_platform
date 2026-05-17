export function FeedbackHeader({
  totalReceived,
  crossTeamCount,
}: {
  totalReceived: number;
  crossTeamCount: number;
}) {
  return (
    <div className="space-y-4">
      <header className="space-y-1.5">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight md:text-[32px]">
          Feedback
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Wat collega&apos;s en je manager je teruggeven, op één plek.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
        <Metric value={totalReceived} label="ontvangen" />
        <span aria-hidden className="text-muted-foreground/40">
          ·
        </span>
        <Metric value={crossTeamCount} label="van buiten je team" />
      </div>
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
