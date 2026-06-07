import Link from "next/link";
import { ArrowRight, ClipboardCheck, MessageSquareText } from "lucide-react";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { buttonVariants } from "@/components/ui/button";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  ConversationKind,
  ManagerConversationEvent,
} from "@/lib/dashboard/manager-queries";

export function UpcomingConversationsTable({
  events,
  windowDays,
}: {
  events: ManagerConversationEvent[];
  windowDays: number;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">
          Geen gesprekken in de komende {windowDays} dagen. Heerlijk rustig.
        </p>
      </div>
    );
  }

  const grouped = groupByDay(events);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-[12px] font-medium text-muted-foreground">
            <th className="w-24 px-4 py-2.5">Tijd</th>
            <th className="w-32 px-4 py-2.5">Type</th>
            <th className="px-4 py-2.5">Met</th>
            <th className="hidden px-4 py-2.5 md:table-cell">Voorbereiding</th>
            <th className="w-32 px-4 py-2.5 text-right">Actie</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map((group) => (
            <DayGroup key={group.dayKey} group={group} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DayGroup({
  group,
}: {
  group: { dayKey: string; label: string; items: ManagerConversationEvent[] };
}) {
  return (
    <>
      <tr className="border-b border-border/60 bg-muted/20">
        <td
          colSpan={5}
          className="px-4 py-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {group.label}
        </td>
      </tr>
      {group.items.map((event) => (
        <ConversationRow key={`${event.kind}-${event.id}`} event={event} />
      ))}
    </>
  );
}

function ConversationRow({ event }: { event: ManagerConversationEvent }) {
  return (
    <tr className="border-b border-border/60 last:border-b-0 transition-colors hover:bg-accent/30">
      <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground">
        {formatTime(event.scheduledAt)}
      </td>
      <td className="px-4 py-3 align-middle">
        <KindBadge kind={event.kind} />
      </td>
      <td className="px-4 py-3 align-middle">
        <Link
          href={event.href}
          className="inline-flex items-center gap-2 hover:underline"
        >
          <PersonAvatar
            id={event.employee.id}
            name={event.employee.name}
            avatarUrl={event.employee.avatar_url}
            size="sm"
          />
          <span className="font-medium leading-tight">
            {event.employee.name}
          </span>
        </Link>
      </td>
      <td className="hidden px-4 py-3 align-middle md:table-cell">
        <PrepStatus event={event} />
      </td>
      <td className="px-4 py-3 align-middle text-right">
        <Link
          href={event.href}
          className={cn(buttonVariants({ size: "xs", variant: "outline" }))}
        >
          Openen
          <ArrowRight className="h-3 w-3" data-icon="inline-end" />
        </Link>
      </td>
    </tr>
  );
}

function PrepStatus({ event }: { event: ManagerConversationEvent }) {
  if (event.hasEmployeePrep) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-emerald-700 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Klaar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
      Nog leeg
    </span>
  );
}

function KindBadge({ kind }: { kind: ConversationKind }) {
  if (kind === "one_on_one") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
        <MessageSquareText className="h-3 w-3" strokeWidth={1.75} />
        1-op-1
      </span>
    );
  }
  if (kind === "performance_review") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        <ClipboardCheck className="h-3 w-3" strokeWidth={1.75} />
        Functionering
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
      <ClipboardCheck className="h-3 w-3" strokeWidth={1.75} />
      Beoordeling
    </span>
  );
}

function groupByDay(events: ManagerConversationEvent[]) {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const groups: {
    dayKey: string;
    label: string;
    items: ManagerConversationEvent[];
  }[] = [];
  const indexByKey = new Map<string, number>();

  for (const event of events) {
    const d = new Date(event.scheduledAt);
    const key = dayKey(d);
    let idx = indexByKey.get(key);
    if (idx === undefined) {
      const label = labelFor(d, today, tomorrow);
      groups.push({ dayKey: key, label, items: [] });
      idx = groups.length - 1;
      indexByKey.set(key, idx);
    }
    groups[idx].items.push(event);
  }

  return groups;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function labelFor(d: Date, today: Date, tomorrow: Date): string {
  if (dayKey(d) === dayKey(today)) return "Vandaag";
  if (dayKey(d) === dayKey(tomorrow)) return "Morgen";
  return capitalize(
    new Intl.DateTimeFormat("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(d),
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
