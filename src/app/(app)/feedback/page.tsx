import { listTeamsWithMembers, requirePersona } from "@/lib/persona/server";
import {
  getFeedbackForEmployee,
  getOwnOpenRequestSummary,
  listPeerFeedbackTemplates,
} from "@/lib/feedback/queries";
import { FeedbackView } from "@/components/feedback/feedback-view";
import { FeedbackHeader } from "@/components/feedback/feedback-header";

export default async function FeedbackPage() {
  const persona = await requirePersona();
  const [feedback, templates, teams, ownRequests] = await Promise.all([
    getFeedbackForEmployee(persona.id),
    listPeerFeedbackTemplates(),
    listTeamsWithMembers(),
    getOwnOpenRequestSummary(persona.id),
  ]);

  const crossTeamCount = feedback.filter((f) => f.is_cross_team).length;

  return (
    <div className="space-y-8">
      <FeedbackHeader
        totalReceived={feedback.length}
        crossTeamCount={crossTeamCount}
      />

      <section>
        <FeedbackView
          items={feedback}
          templates={templates}
          teams={teams}
          ownRequests={ownRequests}
          currentUserId={persona.id}
          currentTeamId={persona.team_id}
        />
      </section>
    </div>
  );
}
