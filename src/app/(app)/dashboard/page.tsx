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
  listScheduledPerformanceReviewsForManager,
} from "@/lib/performance-reviews/queries";
import {
  getManagerConversationsBetween,
  getManagerNotifications,
} from "@/lib/dashboard/manager-queries";
import { DashboardViewSwitcher } from "@/components/dashboard/dashboard-view-switcher";
import { TWO_WEEK_WINDOW_DAYS } from "@/components/dashboard/manager/manager-dashboard";
import { formatDate } from "@/lib/format";

const FOUR_WEEKS_MS = 4 * 7 * 24 * 60 * 60 * 1000;

export default async function DashboardPage() {
  const persona = await requirePersona();
  if (persona.role === "manager") {
    return <ManagerView persona={persona} />;
  }
  return <EmployeeView persona={persona} />;
}

function buildEmployeeSubtitle({
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

function buildManagerSubtitle({
  eventCount,
  notificationCount,
}: {
  eventCount: number;
  notificationCount: number;
}): string {
  if (eventCount === 0 && notificationCount === 0) {
    return "Geen geplande gesprekken, niks dat opvalt.";
  }
  const parts: string[] = [];
  if (eventCount > 0) {
    parts.push(
      eventCount === 1
        ? "1 gesprek de komende 2 weken"
        : `${eventCount} gesprekken de komende 2 weken`,
    );
  }
  if (notificationCount > 0) {
    parts.push(
      notificationCount === 1
        ? "1 signaal om te bekijken"
        : `${notificationCount} signalen om te bekijken`,
    );
  }
  return `${parts.join(" · ")}.`;
}

async function ManagerView({ persona }: { persona: Persona }) {
  const now = new Date();
  const startIso = now.toISOString();
  const twoWeekEnd = new Date(
    now.getTime() + TWO_WEEK_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [twoWeekEvents, monthEvents, notifications] = await Promise.all([
    getManagerConversationsBetween(
      persona.id,
      startIso,
      twoWeekEnd.toISOString(),
    ),
    getManagerConversationsBetween(
      persona.id,
      monthStart.toISOString(),
      monthEnd.toISOString(),
    ),
    getManagerNotifications(persona.id),
  ]);

  const subtitle = buildManagerSubtitle({
    eventCount: twoWeekEvents.length,
    notificationCount: notifications.length,
  });

  return (
    <DashboardViewSwitcher
      variant="manager"
      data={{
        persona,
        subtitle,
        twoWeekEvents,
        monthEvents,
        monthStart,
        notifications,
      }}
    />
  );
}

async function EmployeeView({ persona }: { persona: Persona }) {
  const fourWeeksAgoIso = new Date(
    new Date().getTime() - FOUR_WEEKS_MS,
  ).toISOString();
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
    scheduledPerformanceReviews,
  ] = await Promise.all([
    getUpcomingOneOnOneForEmployee(persona.id),
    getUpcomingOneOnOnesForManager(persona.id),
    getOpenFeedbackRequestsForPeer(persona.id),
    getDossierForEmployee(persona.id),
    getFeedbackForEmployee(persona.id),
    countFeedbackReceivedSince(persona.id, fourWeeksAgoIso),
    getLatestCompletedOneOnOneForUser(persona.id, persona.role),
    getTeamMembers(persona.id),
    getUpcomingPerformanceReviewForEmployee(persona.id),
    listOpenPerformanceReviewsForManager(persona.id),
    listScheduledPerformanceReviewsForManager(persona.id),
  ]);

  const subtitle = buildEmployeeSubtitle({
    openTotal: dossier.stats.openTotal,
    upcomingDate:
      upcoming?.scheduled_at ?? managerUpcoming[0]?.scheduled_at ?? null,
  });

  return (
    <DashboardViewSwitcher
      variant="employee"
      data={{
        persona,
        subtitle,
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
        scheduledPerformanceReviews,
      }}
    />
  );
}
