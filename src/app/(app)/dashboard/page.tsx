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
import { getHrSnapshot } from "@/lib/hr/queries";
import { OnYourPlate } from "@/components/dashboard/on-your-plate";
import { MetricCards } from "@/components/dashboard/metric-strip";
import { TeamPulse } from "@/components/dashboard/team-pulse";
import { RecentFeedback } from "@/components/dashboard/recent-feedback";
import { HrSummary } from "@/components/dashboard/hr-summary";
import { formatDate, formatRelativeWeeks } from "@/lib/format";

const ROLE_LABEL: Record<Persona["role"], string> = {
  hr: "HR",
  manager: "Manager",
  employee: "Medewerker",
};

const FOUR_WEEKS_MS = 4 * 7 * 24 * 60 * 60 * 1000;

export default async function DashboardPage() {
  const persona = await requirePersona();
  const firstName = persona.name.split(" ")[0];

  return (
    <div className="space-y-10">
      <Header firstName={firstName} persona={persona} />

      {persona.role === "hr" ? (
        <HrView />
      ) : (
        <PersonView persona={persona} />
      )}
    </div>
  );
}

function Header({
  firstName,
  persona,
}: {
  firstName: string;
  persona: Persona;
}) {
  return (
    <header className="space-y-1.5">
      <h1 className="text-[30px] font-semibold leading-tight tracking-tight md:text-[34px]">
        Hi {firstName}
      </h1>
      <p className="text-[15px] text-muted-foreground">
        {ROLE_LABEL[persona.role]}
        {persona.team?.name ? ` · ${persona.team.name}` : ""}
      </p>
    </header>
  );
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
  ]);

  const topOpen = dossier.open.slice(0, 3);

  return (
    <>
      <MetricCards
        metrics={[
          {
            value: dossier.stats.openTotal,
            label: "Open actiepunten",
            hint:
              dossier.stats.openOver4Weeks > 0
                ? `${dossier.stats.openOver4Weeks} hangt al >4 weken`
                : dossier.stats.openTotal === 0
                ? "Schoon dossier"
                : "Alles vers",
          },
          {
            value: feedbackLast4Weeks,
            label: "Feedback laatste 4 weken",
            hint:
              feedbackLast4Weeks === 0
                ? "Nog niks binnen"
                : feedbackLast4Weeks === 1
                ? "1 stem"
                : `${feedbackLast4Weeks} stemmen`,
          },
          {
            value: latestOneOnOne
              ? formatRelativeWeeks(latestOneOnOne.completed_at)
              : "Nog geen",
            label: "Laatste 1-op-1",
            hint: latestOneOnOne
              ? formatDate(latestOneOnOne.completed_at)
              : "Plan er een in",
          },
        ]}
      />

      <OnYourPlate
        upcoming={upcoming}
        managerUpcoming={managerUpcoming}
        feedbackRequests={feedbackRequests}
        openActionItems={topOpen}
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
