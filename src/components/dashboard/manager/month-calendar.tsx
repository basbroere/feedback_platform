import Link from "next/link";
import type {
  ConversationKind,
  ManagerConversationEvent,
} from "@/lib/dashboard/manager-queries";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

const KIND_DOT: Record<ConversationKind, string> = {
  one_on_one: "bg-blue-500",
  performance_review: "bg-amber-500",
  evaluation: "bg-rose-500",
};

const KIND_LABEL: Record<ConversationKind, string> = {
  one_on_one: "1-op-1",
  performance_review: "Functionering",
  evaluation: "Beoordeling",
};

export function MonthCalendar({
  events,
  monthStart,
}: {
  events: ManagerConversationEvent[];
  monthStart: Date;
}) {
  const eventsByDay = groupEventsByDay(events);
  const cells = buildMonthCells(monthStart);
  const monthLabel = capitalize(
    new Intl.DateTimeFormat("nl-NL", {
      month: "long",
      year: "numeric",
    }).format(monthStart),
  );
  const todayKey = dayKey(new Date());

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[13.5px] font-semibold tracking-tight">
          {monthLabel}
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <LegendDot tone={KIND_DOT.one_on_one} label="1-op-1" />
          <LegendDot tone={KIND_DOT.performance_review} label="Functionering" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[11px] text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-1 py-1 text-center font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const items = eventsByDay.get(cell.key) ?? [];
          const isToday = cell.key === todayKey;
          return (
            <CalendarCell
              key={cell.key}
              dayNumber={cell.day}
              isToday={isToday}
              isCurrentMonth={cell.isCurrentMonth}
              items={items}
            />
          );
        })}
      </div>
    </div>
  );
}

function CalendarCell({
  dayNumber,
  isToday,
  isCurrentMonth,
  items,
}: {
  dayNumber: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  items: ManagerConversationEvent[];
}) {
  const hasItems = items.length > 0;
  const firstHref = items[0]?.href ?? null;
  const title = items.length
    ? items
        .map((e) => `${KIND_LABEL[e.kind]} met ${e.employee.name}`)
        .join(", ")
    : "";

  const content = (
    <div
      className={cn(
        "flex aspect-square flex-col items-center justify-start rounded-lg border border-transparent p-1 transition-colors",
        isToday && "border-primary/40 bg-primary/5",
        hasItems && !isToday && "hover:bg-accent/40",
        !isCurrentMonth && "opacity-40",
      )}
      title={title}
    >
      <span
        className={cn(
          "text-[11px] font-medium leading-tight",
          isToday ? "text-primary" : "text-foreground",
        )}
      >
        {dayNumber}
      </span>
      {items.length > 0 ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-0.5">
          {items.slice(0, 4).map((e, i) => (
            <span
              key={i}
              className={cn("h-1.5 w-1.5 rounded-full", KIND_DOT[e.kind])}
            />
          ))}
          {items.length > 4 ? (
            <span className="text-[9px] leading-none text-muted-foreground">
              +{items.length - 4}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (firstHref && items.length === 1) {
    return <Link href={firstHref}>{content}</Link>;
  }
  return content;
}

function LegendDot({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-1.5 w-1.5 rounded-full", tone)} />
      {label}
    </span>
  );
}

function groupEventsByDay(events: ManagerConversationEvent[]) {
  const map = new Map<string, ManagerConversationEvent[]>();
  for (const event of events) {
    const d = new Date(event.scheduledAt);
    const key = dayKey(d);
    const arr = map.get(key);
    if (arr) arr.push(event);
    else map.set(key, [event]);
  }
  return map;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

type Cell = { key: string; day: number; isCurrentMonth: boolean };

function buildMonthCells(monthStart: Date): Cell[] {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastOfMonth.getDate();
  const jsDow = firstOfMonth.getDay();
  const leadingBlanks = (jsDow + 6) % 7;

  const cells: Cell[] = [];
  for (let i = leadingBlanks; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    cells.push({ key: dayKey(d), day: d.getDate(), isCurrentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    cells.push({ key: dayKey(d), day, isCurrentMonth: true });
  }
  const targetLength = cells.length <= 35 ? 35 : 42;
  let offset = 1;
  while (cells.length < targetLength) {
    const d = new Date(year, month + 1, offset);
    cells.push({ key: dayKey(d), day: d.getDate(), isCurrentMonth: false });
    offset += 1;
  }
  return cells;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
