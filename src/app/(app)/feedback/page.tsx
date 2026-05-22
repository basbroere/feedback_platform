import { requirePersona } from "@/lib/persona/server";
import { getFeedbackForEmployee } from "@/lib/feedback/queries";
import { FeedbackView } from "@/components/feedback/feedback-view";
import { FeedbackHeader } from "@/components/feedback/feedback-header";

export default async function FeedbackPage() {
  const persona = await requirePersona();
  const feedback = await getFeedbackForEmployee(persona.id);

  const crossTeamCount = feedback.filter((f) => f.is_cross_team).length;
  const latestDate = feedback[0]?.submitted_at ?? feedback[0]?.created_at ?? null;

  return (
    <div className="space-y-8">
      <FeedbackHeader
        totalReceived={feedback.length}
        crossTeamCount={crossTeamCount}
        latestDate={latestDate}
      />

      <section>
        <FeedbackView items={feedback} />
      </section>
    </div>
  );
}
