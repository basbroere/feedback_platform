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
import { DashboardViewSwitcher } from "@/components/dashboard/dashboard-view-switcher";
import { formatDate } from "@/lib/format";

const FOUR_WEEKS_MS = 4 * 7 * 24 * 60 * 60 * 1000;

export default async function DashboardPage() {
  const persona = await requirePersona();
  return <PersonView persona={persona} />;
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
    isManager ? getUpcomingOneOnOnesForManager(persona.id) : Promise.resolve([]),
    getOpenFeedbackRequestsForPeer(persona.id),
    getDossierForEmployee(persona.id),
    isManager ? Promise.resolve([]) : getFeedbackForEmployee(persona.id),
    countFeedbackReceivedSince(persona.id, fourWeeksAgoIso),
    getLatestCompletedOneOnOneForUser(persona.id, persona.role),
    isManager ? getTeamMembers(persona.id) : Promise.resolve([]),
    getUpcomingPerformanceReviewForEmployee(persona.id),
    isManager ? listOpenPerformanceReviewsForManager(persona.id) : Promise.resolve([]),
  ]);

  const subtitle = buildSubtitle({
    openTotal: dossier.stats.openTotal,
    upcomingDate: upcoming?.scheduled_at ?? managerUpcoming[0]?.scheduled_at ?? null,
  });

  return (
    <DashboardViewSwitcher
      data={{
        persona,
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
        subtitle,
      }}
    />
  );
}
