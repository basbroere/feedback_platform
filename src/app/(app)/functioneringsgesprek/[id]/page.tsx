import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import {
  getActiveActionItemsForPerformanceReview,
  getDossierFeedback,
  getPerformanceReviewDossier,
  getPerformanceReviewForEmployee,
  getPerformanceReviewForManager,
} from "@/lib/performance-reviews/queries";
import { getTemplateById } from "@/lib/one-on-ones/template";
import { PerformanceReviewMeetingView } from "@/components/performance-review/meeting-view";
import { PerformanceReviewEmployeeSummaryView } from "@/components/performance-review/employee-summary-view";

export default async function PerformanceReviewDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const persona = await requirePersona();

  const managerView = await getPerformanceReviewForManager(id, persona.id);
  if (managerView) {
    const template = managerView.template_id
      ? await getTemplateById(managerView.template_id)
      : null;
    const questions =
      managerView.template?.questions ?? template?.questions ?? [];

    const [newItems, dossier, feedback] = await Promise.all([
      getActiveActionItemsForPerformanceReview(managerView.id),
      getPerformanceReviewDossier(managerView.id),
      getDossierFeedback(managerView.id),
    ]);

    return (
      <div className="space-y-6">
        <Link
          href={`/team/${managerView.employee.id}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Terug
        </Link>
        <PerformanceReviewMeetingView
          review={managerView}
          questions={questions}
          newActionItems={newItems}
          dossierActionItems={dossier?.completedActionItems ?? []}
          dossierFeedback={feedback}
          windowStart={dossier?.windowStart ?? managerView.cycle_started_at}
          windowEnd={dossier?.windowEnd ?? new Date().toISOString()}
        />
      </div>
    );
  }

  const employeeView = await getPerformanceReviewForEmployee(id, persona.id);
  if (!employeeView) notFound();

  const template = employeeView.template_id
    ? await getTemplateById(employeeView.template_id)
    : null;
  const questions =
    employeeView.template?.questions ?? template?.questions ?? [];

  const actionItems = await getActiveActionItemsForPerformanceReview(
    employeeView.id,
  );

  return (
    <div className="space-y-6">
      <Link
        href="/functioneringsgesprek"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Terug
      </Link>
      <PerformanceReviewEmployeeSummaryView
        review={employeeView}
        questions={questions}
        actionItems={actionItems}
      />
    </div>
  );
}
