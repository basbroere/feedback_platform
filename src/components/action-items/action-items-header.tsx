import { CheckSquare, Hourglass } from "lucide-react";
import { PageTitle } from "@/components/ui/page-title";

export function ActionItemsHeader({
  openTotal,
  completedLast30Days,
  openOver4Weeks,
}: {
  openTotal: number;
  completedLast30Days: number;
  openOver4Weeks: number;
}) {
  const subtitle =
    openTotal === 0
      ? "Lekker, niks open."
      : completedLast30Days > 0
      ? `${openTotal} lopend · ${completedLast30Days} afgerond afgelopen 30 dagen`
      : `${openTotal} lopend`;

  return (
    <div className="space-y-4">
      <PageTitle
        icon={CheckSquare}
        tone="emerald"
        title="Actiepunten"
        subtitle={subtitle}
      />
      {openOver4Weeks > 0 ? <StaleNudge count={openOver4Weeks} /> : null}
    </div>
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
        staat al langer dan 4 weken open. Bijwerken of afronden?
      </p>
    </div>
  );
}
