import type { Persona } from "@/lib/persona/types";
import type {
  ManagerConversationEvent,
  ManagerNotification,
} from "@/lib/dashboard/manager-queries";
import { UpcomingConversationsTable } from "./upcoming-conversations-table";
import { MonthCalendar } from "./month-calendar";
import { NotificationsCard } from "./notifications-card";

export const TWO_WEEK_WINDOW_DAYS = 14;

export function ManagerDashboard({
  persona,
  subtitle,
  twoWeekEvents,
  monthEvents,
  monthStart,
  notifications,
}: {
  persona: Persona;
  subtitle: string;
  twoWeekEvents: ManagerConversationEvent[];
  monthEvents: ManagerConversationEvent[];
  monthStart: Date;
  notifications: ManagerNotification[];
}) {
  const greeting = greetingFor(new Date());
  const first = firstName(persona.name);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-[28px] font-semibold leading-tight tracking-tight md:text-[30px]">
          {greeting} {first}
        </h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Komende 14 dagen
            </h2>
            <span className="text-[12px] text-muted-foreground">
              {twoWeekEvents.length}{" "}
              {twoWeekEvents.length === 1 ? "gesprek" : "gesprekken"}
            </span>
          </div>
          <UpcomingConversationsTable
            events={twoWeekEvents}
            windowDays={TWO_WEEK_WINDOW_DAYS}
          />
        </div>

        <div className="min-w-0 space-y-3">
          <h2 className="text-[15px] font-semibold tracking-tight">
            Deze maand
          </h2>
          <MonthCalendar events={monthEvents} monthStart={monthStart} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold tracking-tight">
          Wat opvalt
        </h2>
        <NotificationsCard notifications={notifications} />
      </section>
    </div>
  );
}

function firstName(full: string): string {
  return full.split(" ")[0] ?? full;
}

function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 6) return "Vroege vogel";
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}
