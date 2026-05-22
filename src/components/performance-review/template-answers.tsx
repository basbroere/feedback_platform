import type { TemplateQuestion } from "@/lib/one-on-ones/types";
import { RatingDisplay } from "@/components/templates/rating-display";

function formatAnswer(question: TemplateQuestion, raw: string | undefined) {
  const value = raw?.trim();
  if (!value) return null;
  switch (question.kind) {
    case "scale_1_5":
      return `${value} van 5`;
    case "choice_multi":
      return value
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ");
    default:
      return value;
  }
}

export function TemplateAnswers({
  questions,
  answers,
  emptyLabel = "Niets ingevuld.",
}: {
  questions: TemplateQuestion[];
  answers: Record<string, string>;
  emptyLabel?: string;
}) {
  if (questions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Geen template gekoppeld.
      </p>
    );
  }
  const hasAny = questions.some(
    (q) => (answers[q.id] ?? "").trim().length > 0,
  );
  if (!hasAny) {
    return (
      <p className="text-sm text-muted-foreground italic">{emptyLabel}</p>
    );
  }
  return (
    <dl className="space-y-4">
      {questions.map((q) => {
        if (q.kind === "rating_b_1_5") {
          return (
            <div key={q.id}>
              <dt className="text-[13px] font-medium text-foreground/80">
                {q.label}
              </dt>
              <dd className="mt-1">
                <RatingDisplay value={answers[q.id]} />
              </dd>
            </div>
          );
        }
        const formatted = formatAnswer(q, answers[q.id]);
        return (
          <div key={q.id}>
            <dt className="text-[13px] font-medium text-foreground/80">
              {q.label}
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-[14px] text-foreground/90">
              {formatted ?? (
                <span className="text-muted-foreground italic">
                  Niets ingevuld.
                </span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
