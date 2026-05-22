import {
  CalendarPlus,
  CheckSquare,
  ClipboardCheck,
  MessageCircle,
  MessageSquareText,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import type { Persona } from "@/lib/persona/types";
import {
  getLatestCompletedOneOnOneForUser,
  getTeamMembers,
  getUpcomingOneOnOneForEmployee,
  getUpcomingOneOnOnesForManager,
} from "@/lib/one-on-ones/queries";
import {
  countFeedbackReceivedSince,
  getFeedbackForEmployee,
  getOpenFeedbackRequestsForPeer,
} from "@/lib/feedback/queries";
import { getDossierForEmployee } from "@/lib/action-items/queries";
import {
  getUpcomingPerformanceReviewForEmployee,
  listOpenPerformanceReviewsForManager,
} from "@/lib/performance-reviews/queries";
import { getHrSnapshot } from "@/lib/hr/queries";
import { DashboardGreeting } from "@/components/dashboard/greeting";
import { OnYourPlate } from "@/components/dashboard/on-your-plate";
import { MetricCards } from "@/components/dashboard/metric-strip";
import { QuickActions, type QuickAction } from "@/components/dashboard/quick-actions";
import { TeamPulse } from "@/components/dashboard/team-pulse";
import { RecentFeedback } from "@/components/dashboard/recent-feedback";
import { HrSummary } from "@/components/dashboard/hr-summary";
import { formatDate, formatRelativeWeeks } from "@/lib/format";

const FOUR_WEEKS_MS = 4 * 7 * 24 * 60 * 60 * 1000;

export default async function DashboardPage() {
  const persona = await requirePersona();

  return (
    <div className="space-y-10">
      {persona.role === "hr" ? (
        <>
          <DashboardGreeting persona={persona} subtitle="HR-overzicht" />
          <HrView />
        </>
      ) : (
        <PersonView persona={persona} />
      )}
    </div>
  );
}

function buildSubtitle({
  openTotal,
  upcomingDate,
}: {
  openTotal: number;
  upcomingDate: string | null;
}): string {
  if (openTotal === 0 && !upcomingDate) return "Niks open, heerlijk rustig.";
  if (openTotal === 0 && upcomingDate)
    return `Volgende 1-op-1 ${formatDate(upcomingDate)}.`;
  const items =
    openTotal === 1 ? "1 actiepunt open" : `${openTotal} actiepunten open`;
  if (upcomingDate)
    return `${items} · volgende 1-op-1 ${formatDate(upcomingDate)}.`;
  return `${items}.`;
}

function buildQuickActions(persona: Persona): QuickAction[] {
  const base: QuickAction[] = [
    {
      href: "/een-op-een",
      icon: MessageSquareText,
      tone: "blue",
      title: "1-op-1",
      subtitle: "Bekijk of bereid voor",
    },
    {
      href: "/actiepunten",
      icon: CheckSquare,
      tone: "emerald",
      title: "Actiepunten",
      subtitle: "Wat hangt er nog?",
    },
    {
      href: "/feedback",
      icon: MessageCircle,
      tone: "primary",
      title: "Feedback",
      subtitle: "Wat anderen je teruggeven",
    },
  ];
  if (persona.role === "manager") {
    base.push(
      {
        href: "/team",
        icon: UsersRound,
        tone: "violet",
        title: "Mijn team",
        subtitle: "Plan 1-op-1's per teamlid",
      },
      {
        href: "/functioneringsgesprek",
        icon: ClipboardCheck,
        tone: "amber",
        title: "Functionering",
        subtitle: "Lopende cycli",
      },
    );
  } else {
    base.push({
      href: "/functioneringsgesprek",
      icon: ClipboardCheck,
      tone: "amber",
      title: "Functionering",
      subtitle: "Halfjaarlijks gesprek",
    });
  }
  return base;
}

async function PersonView({ persona }: { persona: Persona }) {
  const isManager = persona.role === "manager";
  const fourWeeksAgoIso = new Date(Date.now() - FOUR_WEEKS_MS).toISOString();
  const [
    upcoming,
    managerUpcoming,
    feedbackRequests,
    dossier,
    feedback,
    feedbackLast4Weeks,
    latestOneOnOne,
    teamMembers,
    ownOpenPerformanceReview,
    managerOpenPerformanceReviews,
  ] = await Promise.all([
    getUpcomingOneOnOneForEmployee(persona.id),
    isManager
      ? getUpcomingOneOnOnesForManager(persona.id)
      : Promise.resolve([]),
    getOpenFeedbackRequestsForPeer(persona.id),
    getDossierForEmployee(persona.id),
    isManager ? Promise.resolve([]) : getFeedbackForEmployee(persona.id),
    countFeedbackReceivedSince(persona.id, fourWeeksAgoIso),
    getLatestCompletedOneOnOneForUser(persona.id, persona.role),
    isManager ? getTeamMembers(persona.id) : Promise.resolve([]),
    getUpcomingPerformanceReviewForEmployee(persona.id),
    isManager
      ? listOpenPerformanceReviewsForManager(persona.id)
      : Promise.resolve([]),
  ]);

  const topOpen = dossier.open.slice(0, 3);
  const subtitle = buildSubtitle({
    openTotal: dossier.stats.openTotal,
    upcomingDate:
      upcoming?.scheduled_at ?? managerUpcoming[0]?.scheduled_at ?? null,
  });

  return (
    <>
      <DashboardGreeting persona={persona} subtitle={subtitle} />

      <MetricCards
        metrics={[
          {
            value: dossier.stats.openTotal,
            label: "Open actiepunten",
            hint:
              dossier.stats.openOver4Weeks > 0
                ? `${dossier.stats.openOver4Weeks} >4 weken`
                : dossier.stats.openTotal === 0
                ? "Schoon"
                : "Alles vers",
            icon: CheckSquare,
            tone: dossier.stats.openOver4Weeks > 0 ? "amber" : "emerald",
          },
          {
            value: feedbackLast4Weeks,
            label: "Feedback (4 wk)",
            hint:
              feedbackLast4Weeks === 0
                ? "Niets binnen"
                : feedbackLast4Weeks === 1
                ? "1 stem"
                : `${feedbackLast4Weeks} stemmen`,
            icon: Sparkles,
            tone: "primary",
          },
          {
            value: latestOneOnOne
              ? formatRelativeWeeks(latestOneOnOne.completed_at)
              : "Geen",
            label: "Laatste 1-op-1",
            hint: latestOneOnOne ? formatDate(latestOneOnOne.completed_at) : "Plan er een",
            icon: CalendarPlus,
            tone: "blue",
          },
        ]}
      />

      <QuickActions actions={buildQuickActions(persona)} />

      <OnYourPlate
        upcoming={upcoming}
        managerUpcoming={managerUpcoming}
        feedbackRequests={feedbackRequests}
        openActionItems={topOpen}
        ownOpenPerformanceReview={ownOpenPerformanceReview}
        managerOpenPerformanceReviews={managerOpenPerformanceReviews}
      />

      {persona.role === "manager" ? <TeamPulse members={teamMembers} /> : null}
      {persona.role === "employee" ? <RecentFeedback items={feedback} /> : null}
    </>
  );
}

async function HrView() {
  const snapshot = await getHrSnapshot();
  return <HrSummary snapshot={snapshot} />;
}
