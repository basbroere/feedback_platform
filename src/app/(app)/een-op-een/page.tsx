import Link from "next/link";
import { ArrowRight, CalendarClock, MessageSquareText } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import {
  getManagerForEmployee,
  getRecentCompletedOneOnOnesForManager,
  getTeamMembers,
  getUpcomingOneOnOneForEmployee,
  getUpcomingOneOnOnesForManager,
  listOneOnOnesForPair,
} from "@/lib/one-on-ones/queries";
import { HistoryTable } from "@/components/one-on-one/history-table";
import { ManagerTimeline } from "@/components/one-on-one/manager-timeline";
import { ScheduleDialog } from "@/components/one-on-one/schedule-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

export default async function EenOpEenIndex() {
  const persona = await requirePersona();

  if (persona.role === "manager") {
    const [upcoming, recent, teamMembers] = await Promise.all([
      getUpcomingOneOnOnesForManager(persona.id, 50),
      getRecentCompletedOneOnOnesForManager(persona.id, 20),
      getTeamMembers(persona.id),
    ]);

    const selectableMembers = teamMembers.map((m) => ({
      id: m.id,
      name: m.name,
      avatar_url: m.avatar_url,
    }));

    return (
      <div className="space-y-8">
        <PageTitle
          icon={MessageSquareText}
          tone="blue"
          title="1-op-1's"
          subtitle={
            upcoming.length === 0 && recent.length === 0
              ? "Plan jullie eerste 1-op-1 in."
              : `${upcoming.length} gepland · ${recent.length} recent afgerond`
          }
          action={
            selectableMembers.length > 0 ? (
              <ScheduleDialog
                teamMembers={selectableMembers}
                triggerLabel="Nieuwe 1-op-1"
                triggerVariant="default"
              />
            ) : null
          }
        />

        <ManagerTimeline upcoming={upcoming} recent={recent} />
      </div>
    );
  }

  const manager = await getManagerForEmployee(persona.id);

  if (!manager) {
    return (
      <div className="space-y-6">
        <PageTitle icon={MessageSquareText} tone="blue" title="1-op-1's" />
        <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nog geen vaste manager. Zodra dat geregeld is verschijnen jullie
            1-op-1&apos;s hier.
          </p>
        </div>
      </div>
    );
  }

  const upcoming = await getUpcomingOneOnOneForEmployee(persona.id);
  const items = await listOneOnOnesForPair(manager.id, persona.id);
  const completed = items.filter((it) => it.completed_at);

  return (
    <div className="space-y-8">
      <PageTitle
        icon={MessageSquareText}
        tone="blue"
        title="1-op-1's"
        subtitle={`Met ${manager.name}`}
      />

      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Opkomend
        </h2>
        {upcoming ? (
          <Card>
            <CardHeader>
              <CardTitle>{upcoming.subject}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5 text-blue-500" />
                  {formatDateTime(upcoming.scheduled_at)}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  Voorbereiden mag in 2 minuten.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/een-op-een/${upcoming.id}/voorbereiden`}
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  Voorbereiden
                  <ArrowRight className="h-3.5 w-3.5" data-icon="inline-end" />
                </Link>
                <Link
                  href={`/een-op-een/${upcoming.id}`}
                  className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                >
                  Bekijk gesprek
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nog geen volgend gesprek gepland.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Recent
        </h2>
        <HistoryTable
          items={completed}
          emptyLabel="Nog geen afgeronde 1-op-1's."
        />
      </section>
    </div>
  );
}
