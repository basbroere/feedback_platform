import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, ChevronDown } from "lucide-react";
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

  const [template, cycleInputs, teams, upwardTemplate] = await Promise.all([
    review.template_id ? getTemplateById(review.template_id) : Promise.resolve(null),
    getCycleInputs(review.id),
    listTeamsWithMembers(),
    getDefaultUpwardFeedbackTemplate(),
  ]);

  const selfAnswers = review.employee_self_evaluation ?? {};
  const selfAnsweredCount = Object.values(selfAnswers).filter(
    (v) => typeof v === "string" && v.trim().length > 0,
  ).length;
  const selfTotal = template?.questions.length ?? 0;

  const upwardAnswers = cycleInputs.upward?.responses ?? {};
  const upwardAnsweredCount = Object.values(upwardAnswers).filter(
    (v) => typeof v === "string" && v.trim().length > 0,
  ).length;

  const hasPeer = cycleInputs.peer !== null;
  const isReady = selfAnsweredCount > 0 && hasPeer;

  return (
    <div className="space-y-8">
      <Link
        href={`/functioneringsgesprek/${id}`}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
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

      {isReady ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-[13px] text-emerald-800 dark:text-emerald-300">
            Je voorbereiding staat klaar. Wijzigen kan nog tot het gesprek
            begint.
          </p>
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

      <CollapsibleSection
        title="Jouw zelfreflectie"
        description="Beantwoord de 360-vragen over jezelf. Vragen zijn suggesties; leeg laten mag."
        status={selfStatus(selfAnsweredCount, selfTotal)}
        defaultOpen
      >
        <PerformanceReviewPreparationForm
          performanceReviewId={review.id}
          template={template}
          initialAnswers={selfAnswers}
          redirectTo={undefined}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={`Feedback aan ${review.manager.name.split(" ")[0]}`}
        description={`Optioneel. Met je naam erbij, en pas zichtbaar voor ${review.manager.name.split(" ")[0]} nadat het gesprek is afgerond.`}
        status={upwardStatus(upwardAnsweredCount)}
        defaultOpen={false}
      >
        <UpwardFeedbackForm
          performanceReviewId={review.id}
          template={upwardTemplate}
          initialAnswers={upwardAnswers}
        />
      </CollapsibleSection>
    </div>
  );
}

function selfStatus(answered: number, total: number): SectionStatus {
  if (answered === 0) return { label: "Nog leeg", tone: "muted" };
  if (total > 0 && answered >= total) return { label: "Klaar", tone: "ready" };
  if (total > 0) return { label: `${answered} van ${total}`, tone: "progress" };
  return { label: `${answered} ingevuld`, tone: "progress" };
}

function upwardStatus(answered: number): SectionStatus {
  if (answered === 0) return { label: "Niet ingevuld", tone: "muted" };
  return { label: `${answered} ingevuld`, tone: "progress" };
}

type SectionStatus = {
  label: string;
  tone: "muted" | "progress" | "ready";
};

function CollapsibleSection({
  title,
  description,
  status,
  defaultOpen,
  children,
}: {
  title: string;
  description: string;
  status: SectionStatus;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const toneClasses =
    status.tone === "ready"
      ? "text-emerald-600 dark:text-emerald-400"
      : status.tone === "progress"
        ? "text-foreground/85"
        : "text-muted-foreground";

  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-border bg-card shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden">
        <div className="space-y-0.5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform -rotate-90 group-open:rotate-0" />
            {title}
          </h2>
          <p className="pl-6 text-[12.5px] text-muted-foreground">
            {description}
          </p>
        </div>
        <span
          className={`shrink-0 text-[12px] font-medium ${toneClasses}`}
        >
          {status.tone === "ready" ? (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {status.label}
            </span>
          ) : (
            status.label
          )}
        </span>
      </summary>
      <div className="border-t border-border px-5 py-5">{children}</div>
    </details>
  );
}
