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

  return (
    <div className="space-y-8">
      <FeedbackHeader
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
