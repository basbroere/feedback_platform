import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import { getFeedbackRequestDetailForPeer } from "@/lib/feedback/queries";
import { RespondForm } from "@/components/feedback/respond-form";

export default async function FeedbackVerzoekPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const persona = await requirePersona();

  const detail = await getFeedbackRequestDetailForPeer(id, persona.id);
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Terug naar dashboard
      </Link>

      <header className="space-y-1.5">
        <h1 className="text-[24px] font-semibold leading-tight tracking-tight md:text-[28px]">
          Feedback voor {detail.requester.name}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          {detail.requester.name} heeft je gevraagd om feedback. Je naam is
          straks zichtbaar bij wat je hier schrijft.
        </p>
      </header>

      <RespondForm
        feedbackId={detail.feedback.id}
        requester={detail.requester}
        prompt={detail.prompt}
        template={detail.template}
        initialResponses={detail.feedback.responses ?? {}}
        status={detail.feedback.status}
      />
    </div>
  );
}
