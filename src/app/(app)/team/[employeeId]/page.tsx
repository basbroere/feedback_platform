import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronLeft,
  ClipboardCheck,
  MessageSquareText,
} from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import { createClient } from "@/lib/supabase/server";
import {
  getTeamMembers,
  listOneOnOnesForPair,
} from "@/lib/one-on-ones/queries";
import { getDossierForEmployee } from "@/lib/action-items/queries";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { ScheduleDialog } from "@/components/one-on-one/schedule-dialog";
import { listActivePerformanceReviewBundles } from "@/lib/performance-reviews/template";
import { listActiveOneOnOneTemplates } from "@/lib/templates/queries";
import { StartPerformanceReviewDialog } from "@/components/performance-review/start-dialog";
import { listPerformanceReviewsBetween } from "@/lib/performance-reviews/queries";
import { getFeedbackForEmployee } from "@/lib/feedback/queries";
import { MemberHistoryTable } from "@/components/team/member-history-table";
import { MemberFeedbackTable } from "@/components/team/member-feedback-table";
import { MemberActionItemsSection } from "@/components/team/member-action-items-section";
import { UpcomingCard } from "@/components/team/upcoming-card";
import { formatDate, formatDateTime, formatRelativeWeeks } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const persona = await requirePersona();
  if (persona.role === "employee") redirect("/dashboard");

  const members = await getTeamMembers(persona.id);
  const member = members.find((m) => m.id === employeeId);
  if (!member) {
    const supabase = await createClient();
    const { data: lookup } = await supabase
      .from("users")
      .select("id, name, avatar_url")
      .eq("id", employeeId)
      .maybeSingle();
    if (!lookup) notFound();
    redirect("/team");
  }

  const [
    oneOnOnes,
    dossier,
    performanceReviews,
    prTemplates,
    oneOnOneTemplates,
    feedbackItems,
  ] = await Promise.all([
    listOneOnOnesForPair(persona.id, employeeId),
    getDossierForEmployee(employeeId),
    listPerformanceReviewsBetween(persona.id, employeeId),
    listActivePerformanceReviewBundles(),
    listActiveOneOnOneTemplates(),
    getFeedbackForEmployee(employeeId),
  ]);

  const openPerformanceReview = performanceReviews.find(
    (r) => r.status !== "completed" && r.status !== "cancelled",
  );

  const nowIso = nowIsoString();
  const upcomingOneOnOne =
    oneOnOnes
      .filter(
        (it) =>
          !it.completed_at && it.scheduled_at && it.scheduled_at >= nowIso,
      )
      .sort((a, b) =>
        (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""),
      )[0] ?? null;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/team"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Terug naar dossiers
        </Link>
      </div>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <PersonAvatar
            id={member.id}
            name={member.name}
            avatarUrl={member.avatar_url}
            size="lg"
          />
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
              {member.name}
            </h1>
            <p className="text-[13.5px] text-muted-foreground">
              {member.email}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ScheduleDialog
            employeeId={member.id}
            employeeName={member.name}
            templates={oneOnOneTemplates}
            triggerLabel="Nieuwe 1-op-1 inplannen"
            triggerVariant="default"
          />
          {!openPerformanceReview ? (
            <StartPerformanceReviewDialog
              employeeId={member.id}
              employeeName={member.name}
              templates={prTemplates}
              triggerLabel="Functioneringsgesprek starten"
              triggerVariant="outline"
            />
          ) : null}
        </div>
      </header>

      <UpcomingSection
        upcomingOneOnOne={upcomingOneOnOne}
        openPerformanceReview={openPerformanceReview ?? null}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-8">
          <section className="space-y-3">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Gespreksgeschiedenis
            </h2>
            <MemberHistoryTable
              oneOnOnes={oneOnOnes.filter((o) => Boolean(o.completed_at))}
              performanceReviews={performanceReviews.filter(
                (r) => r.status === "completed",
              )}
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Feedback over {firstName(member.name)}
            </h2>
            <MemberFeedbackTable items={feedbackItems} />
          </section>
        </div>

        <aside className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Actiepunten
            </h2>
          </div>
          <MemberActionItemsSection
            open={dossier.open}
            completed={dossier.completed}
          />
        </aside>
      </div>
    </div>
  );
}

function UpcomingSection({
  upcomingOneOnOne,
  openPerformanceReview,
}: {
  upcomingOneOnOne: {
    id: string;
    subject: string;
    scheduled_at: string | null;
    shared_summary: string | null;
  } | null;
  openPerformanceReview: {
    id: string;
    template_name: string | null;
    cycle_started_at: string;
    has_employee_input: boolean;
  } | null;
}) {
  const cards = [upcomingOneOnOne, openPerformanceReview].filter(Boolean);
  const hasAny = cards.length > 0;
  const isSingle = cards.length === 1;

  return (
    <section className="space-y-3">
      <h2 className="text-[12.5px] font-medium font-heading uppercase tracking-wider text-muted-foreground">
        Opkomend
      </h2>
      {hasAny ? (
        <div
          className={cn(
            "grid gap-3",
            isSingle ? "grid-cols-1" : "md:grid-cols-2",
          )}
        >
          {upcomingOneOnOne ? (
            <UpcomingCard
              href={`/een-op-een/${upcomingOneOnOne.id}`}
              icon={MessageSquareText}
              tone="blue"
              title={upcomingOneOnOne.subject || "1-op-1"}
              meta={
                upcomingOneOnOne.scheduled_at
                  ? formatDateTime(upcomingOneOnOne.scheduled_at)
                  : "Datum nog niet gepland"
              }
              caption={`Over ${formatRelativeWeeks(upcomingOneOnOne.scheduled_at)}`}
              cta="Open gesprek"
            />
          ) : null}
          {openPerformanceReview ? (
            <UpcomingCard
              href={`/functioneringsgesprek/${openPerformanceReview.id}`}
              icon={ClipboardCheck}
              tone="amber"
              title={
                openPerformanceReview.template_name ?? "Functioneringsgesprek"
              }
              meta={`Gestart op ${formatDate(openPerformanceReview.cycle_started_at)}`}
              caption={
                openPerformanceReview.has_employee_input
                  ? "Zelfevaluatie ingevuld"
                  : "Zelfevaluatie nog leeg"
              }
              cta="Open cyclus"
            />
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Geen opkomende gesprekken. Plan er eentje in via de knop boven.
          </p>
        </div>
      )}
    </section>
  );
}

function firstName(full: string): string {
  return full.split(" ")[0] ?? full;
}

function nowIsoString(): string {
  return new Date().toISOString();
}
