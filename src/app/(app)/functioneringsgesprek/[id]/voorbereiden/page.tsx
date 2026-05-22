import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { listTeamsWithMembers, requirePersona } from "@/lib/persona/server";
import {
  getCycleInputs,
  getPerformanceReviewForEmployee,
} from "@/lib/performance-reviews/queries";
import { getTemplateById } from "@/lib/one-on-ones/template";
import { PerformanceReviewPreparationForm } from "@/components/performance-review/preparation-form";
import { CyclePeerPicker } from "@/components/performance-review/cycle-peer-picker";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { formatDate } from "@/lib/format";

export default async function VoorbereidenPerformanceReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const persona = await requirePersona();

  const review = await getPerformanceReviewForEmployee(id, persona.id);
  if (!review) notFound();
  if (review.completed_at) redirect(`/functioneringsgesprek/${id}`);

  const [template, cycleInputs, teams] = await Promise.all([
    review.template_id ? getTemplateById(review.template_id) : Promise.resolve(null),
    getCycleInputs(review.id),
    listTeamsWithMembers(),
  ]);

  return (
    <div className="space-y-8">
      <Link
        href={`/functioneringsgesprek/${id}`}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Terug
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <PersonAvatar
          id={review.manager.id}
          name={review.manager.name}
          avatarUrl={review.manager.avatar_url}
          size="lg"
        />
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
            Voorbereiden: 360 functioneringsgesprek
          </h1>
          <p className="text-[14px] text-muted-foreground">
            Met {review.manager.name} · cyclus gestart op{" "}
            {formatDate(review.cycle_started_at)}
          </p>
        </div>
      </header>

      <CyclePeerPicker
        performanceReviewId={review.id}
        employeeId={review.employee_id}
        managerId={review.manager_id}
        currentTeamId={persona.team_id ?? null}
        teams={teams}
        peer={cycleInputs.peer}
      />

      <section className="space-y-3">
        <header className="space-y-1">
          <h2 className="text-[15px] font-semibold tracking-tight">
            Jouw zelfreflectie
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Beantwoord dezelfde 360-vragen over jezelf. Vragen zijn suggesties;
            leeg laten mag.
          </p>
        </header>
        <PerformanceReviewPreparationForm
          performanceReviewId={review.id}
          template={template}
          initialAnswers={review.employee_self_evaluation ?? {}}
          redirectTo={`/functioneringsgesprek/${id}`}
        />
      </section>
    </div>
  );
}
