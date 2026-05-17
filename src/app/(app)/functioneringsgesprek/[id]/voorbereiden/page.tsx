import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import { getPerformanceReviewForEmployee } from "@/lib/performance-reviews/queries";
import { getTemplateById } from "@/lib/one-on-ones/template";
import { PerformanceReviewPreparationForm } from "@/components/performance-review/preparation-form";
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

  const template = review.template_id
    ? await getTemplateById(review.template_id)
    : null;

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
            Zelfevaluatie
          </h1>
          <p className="text-[14px] text-muted-foreground">
            Functioneringsgesprek met {review.manager.name} · cyclus gestart op{" "}
            {formatDate(review.cycle_started_at)}
          </p>
        </div>
      </header>

      <PerformanceReviewPreparationForm
        performanceReviewId={review.id}
        template={template}
        initialAnswers={review.employee_self_evaluation ?? {}}
        redirectTo={`/functioneringsgesprek/${id}`}
      />
    </div>
  );
}
