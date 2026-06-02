import { requirePersona } from "@/lib/persona/server";
import { listTeamsWithMembers } from "@/lib/persona/server";
import { getFeedbackForEmployee } from "@/lib/feedback/queries";
import { listActivePeerFeedbackTemplates } from "@/lib/templates/queries";
import { FeedbackView } from "@/components/feedback/feedback-view";
import { FeedbackHeader } from "@/components/feedback/feedback-header";
import { RequestPeerDialog } from "@/components/feedback/request-peer-dialog";

export default async function FeedbackPage() {
  const persona = await requirePersona();
  const [feedback, templates, teams] = await Promise.all([
    getFeedbackForEmployee(persona.id),
    listActivePeerFeedbackTemplates(),
    listTeamsWithMembers(),
  ]);

  const crossTeamCount = feedback.filter((f) => f.is_cross_team).length;
  const latestDate = feedback[0]?.submitted_at ?? feedback[0]?.created_at ?? null;

  return (
    <div className="space-y-8">
      <FeedbackHeader
        totalReceived={feedback.length}
        crossTeamCount={crossTeamCount}
        latestDate={latestDate}
        action={
          <RequestPeerDialog
            teams={teams}
            templates={templates}
            currentUserId={persona.id}
          />
        }
      />

      <section>
        <FeedbackView items={feedback} />
      </section>
    </div>
  );
}
