import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import {
  getActiveActionItemsForPerformanceReview,
  getCycleInputs,
  getDossierFeedback,
  getPerformanceReviewDossier,
  getPerformanceReviewForEmployee,
  getPerformanceReviewForManager,
} from "@/lib/performance-reviews/queries";
import {
  EMPTY_BUNDLE_SECTIONS,
  getPerformanceReviewBundleById,
} from "@/lib/performance-reviews/template";
import { PerformanceReviewMeetingView } from "@/components/performance-review/meeting-view";
import { PerformanceReviewEmployeeSummaryView } from "@/components/performance-review/employee-summary-view";
import { ManagerPreparationView } from "@/components/performance-review/manager-preparation-view";
import { PerformanceReviewScheduledView } from "@/components/performance-review/scheduled-view";

export default async function PerformanceReviewDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const persona = await requirePersona();

  const managerView = await getPerformanceReviewForManager(id, persona.id);
  if (managerView) {
    const bundle = managerView.template_id
      ? await getPerformanceReviewBundleById(managerView.template_id)
      : null;
    const sections = bundle?.sections ?? EMPTY_BUNDLE_SECTIONS;

    const status = managerView.status;

    if (status === "completed") {
      const [newItems, dossier, feedback, cycleInputs] = await Promise.all([
        getActiveActionItemsForPerformanceReview(managerView.id),
        getPerformanceReviewDossier(managerView.id),
        getDossierFeedback(managerView.id),
        getCycleInputs(managerView.id),
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
            selfQuestions={sections.self_reflection}
            peerQuestions={sections.peer_360}
            managerQuestions={sections.manager_prep}
            upwardQuestions={sections.upward}
            cycleInputs={cycleInputs}
            newActionItems={newItems}
            dossierActionItems={dossier?.completedActionItems ?? []}
            dossierFeedback={feedback}
            windowStart={dossier?.windowStart ?? managerView.cycle_started_at}
            windowEnd={dossier?.windowEnd ?? new Date().toISOString()}
          />
        </div>
      );
    }

    // ready_for_meeting: alle feedback binnen, gesprek staat ingepland
    if (status === "ready_for_meeting") {
      const [newItems, dossier, feedback, cycleInputs] = await Promise.all([
        getActiveActionItemsForPerformanceReview(managerView.id),
        getPerformanceReviewDossier(managerView.id),
        getDossierFeedback(managerView.id),
        getCycleInputs(managerView.id),
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
          <PerformanceReviewScheduledView
            review={managerView}
            selfQuestions={sections.self_reflection}
            peerQuestions={sections.peer_360}
            managerQuestions={sections.manager_prep}
            cycleInputs={cycleInputs}
            newActionItems={newItems}
            dossierActionItems={dossier?.completedActionItems ?? []}
            dossierFeedback={feedback}
            windowStart={dossier?.windowStart ?? managerView.cycle_started_at}
            windowEnd={dossier?.windowEnd ?? new Date().toISOString()}
          />
        </div>
      );
    }

    // draft | collecting_input | scheduled: voorbereiding/input-fase
    const cycleInputs = await getCycleInputs(managerView.id, {
      hideUntilManagerSubmits: true,
    });
    return (
      <div className="space-y-6">
        <Link
          href={`/team/${managerView.employee.id}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Terug
        </Link>
        <ManagerPreparationView
          review={managerView}
          selfQuestions={sections.self_reflection}
          peerQuestions={sections.peer_360}
          managerQuestions={sections.manager_prep}
          cycleInputs={cycleInputs}
        />
      </div>
    );
  }

  const employeeView = await getPerformanceReviewForEmployee(id, persona.id);
  if (!employeeView) notFound();

  const bundle = employeeView.template_id
    ? await getPerformanceReviewBundleById(employeeView.template_id)
    : null;
  const sections = bundle?.sections ?? EMPTY_BUNDLE_SECTIONS;

  const [actionItems, cycleInputs, dossier, feedback] = await Promise.all([
    getActiveActionItemsForPerformanceReview(employeeView.id),
    getCycleInputs(employeeView.id),
    getPerformanceReviewDossier(employeeView.id),
    getDossierFeedback(employeeView.id),
  ]);

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
        selfQuestions={sections.self_reflection}
        peerQuestions={sections.peer_360}
        managerQuestions={sections.manager_prep}
        actionItems={actionItems}
        cycleInputs={cycleInputs}
        dossierActionItems={dossier?.completedActionItems ?? []}
        dossierFeedback={feedback}
        windowStart={dossier?.windowStart ?? employeeView.cycle_started_at}
        windowEnd={dossier?.windowEnd ?? new Date().toISOString()}
      />
    </div>
  );
}
