import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, ChevronLeft, Clock3 } from "lucide-react";
import { listTeamsWithMembers, requirePersona } from "@/lib/persona/server";
import {
  getCycleInputs,
  getPerformanceReviewForEmployee,
} from "@/lib/performance-reviews/queries";
import { getDefaultUpwardFeedbackTemplate } from "@/lib/performance-reviews/template";
import { getTemplateById } from "@/lib/one-on-ones/template";
import { PerformanceReviewPreparationForm } from "@/components/performance-review/preparation-form";
import { CyclePeerPicker } from "@/components/performance-review/cycle-peer-picker";
import { UpwardFeedbackForm } from "@/components/performance-review/upward-feedback-form";
import { FinalizePreparationButton } from "@/components/performance-review/finalize-preparation-button";
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

  const isAlreadyFinalized =
    review.status === "collecting_input" ||
    review.status === "ready_for_meeting" ||
    review.status === "completed";

  const [template, cycleInputs, teams, upwardTemplate] = await Promise.all([
    review.template_id ? getTemplateById(review.template_id) : Promise.resolve(null),
    getCycleInputs(review.id),
    listTeamsWithMembers(),
    getDefaultUpwardFeedbackTemplate(),
  ]);

  const hasEval = Object.values(review.employee_self_evaluation ?? {}).some(
    (v) => typeof v === "string" && v.trim().length > 0,
  );
  const hasPeer = cycleInputs.peer !== null;
  const canFinalize = hasEval && hasPeer;

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

      {isAlreadyFinalized ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-4 dark:border-emerald-800 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-[14px] font-semibold text-emerald-800 dark:text-emerald-300">
              Voorbereiding ingeleverd
            </p>
            <p className="text-[13px] text-emerald-700 dark:text-emerald-400">
              Je voorbereiding is klaar. Je manager en de peer geven nu hun feedback.
            </p>
          </div>
        </div>
      ) : null}

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
          redirectTo={undefined}
        />
      </section>

      <section className="space-y-3">
        <header className="space-y-1">
          <h2 className="text-[15px] font-semibold tracking-tight">
            Feedback aan {review.manager.name.split(" ")[0]}
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Optioneel: geef je manager feedback. Met je naam erbij, en pas
            zichtbaar nadat het gesprek is afgerond. Sla op om je antwoorden
            tussentijds te bewaren.
          </p>
        </header>
        <UpwardFeedbackForm
          performanceReviewId={review.id}
          template={upwardTemplate}
          initialAnswers={cycleInputs.upward?.responses ?? {}}
        />
      </section>

      {!isAlreadyFinalized && (
        <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <h2 className="text-[15px] font-semibold">Voorbereiding afronden</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Zodra je een peer hebt gekozen en minimaal één vraag hebt beantwoord, kun je je voorbereiding inleveren. Daarna kunnen de peer en je manager hun feedback geven.
              </p>
            </div>
          </div>
          <FinalizePreparationButton
            performanceReviewId={review.id}
            canFinalize={canFinalize}
          />
        </section>
      )}
    </div>
  );
}
