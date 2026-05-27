"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveEmployeeSelfEvaluation } from "@/lib/performance-reviews/actions";
import type {
  PerformanceReviewTemplate,
} from "@/lib/performance-reviews/types";
import type { TemplateQuestion } from "@/lib/one-on-ones/types";
import { RatingBInput } from "@/components/templates/rating-input";
import { cn } from "@/lib/utils";

export function PerformanceReviewPreparationForm({
  performanceReviewId,
  template,
  initialAnswers,
  redirectTo,
}: {
  performanceReviewId: string;
  template: PerformanceReviewTemplate | null;
  initialAnswers: Record<string, string>;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(
    initialAnswers ?? {},
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function setAnswer(qid: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  function submit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveEmployeeSelfEvaluation({
          performanceReviewId,
          answers,
        });
        setSaved(true);
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Opslaan mislukt");
      }
    });
  }

  return (
    <div className="space-y-6">
      {template ? (
        <div className="space-y-6">
          {template.questions.map((q) => (
            <QuestionInput
              key={q.id}
              question={q}
              value={answers[q.id] ?? ""}
              onChange={(v) => setAnswer(q.id, v)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Geen template gekoppeld aan dit functioneringsgesprek.
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={isPending}>
          {isPending ? "Bezig..." : "Opslaan"}
        </Button>
        {saved ? (
          <span className="text-sm text-muted-foreground">Opgeslagen.</span>
        ) : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: TemplateQuestion;
  value: string;
  onChange: (next: string) => void;
}) {
  const id = `q-${question.id}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {question.label}
        {question.required ? (
          <span className="ml-1 text-[12px] text-muted-foreground">
            (suggestie)
          </span>
        ) : null}
      </Label>
      {question.hint ? (
        <p className="text-[12.5px] text-muted-foreground">{question.hint}</p>
      ) : null}
      {renderControl(question, id, value, onChange)}
    </div>
  );
}

function renderControl(
  question: TemplateQuestion,
  id: string,
  value: string,
  onChange: (next: string) => void,
) {
  switch (question.kind) {
    case "scale_1_5":
      return <ScaleInput id={id} value={value} onChange={onChange} />;
    case "rating_b_1_5":
      return <RatingBInput id={id} value={value} onChange={onChange} />;
    case "choice_single":
      return (
        <ChoiceSingleInput
          id={id}
          value={value}
          options={question.options ?? []}
          onChange={onChange}
        />
      );
    case "choice_multi":
      return (
        <ChoiceMultiInput
          id={id}
          value={value}
          options={question.options ?? []}
          onChange={onChange}
        />
      );
    case "open":
    default:
      return (
        <Textarea
          id={id}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Wat wil je hierover delen?"
        />
      );
  }
}

function ScaleInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div
      id={id}
      role="radiogroup"
      className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const selected = value === String(n);
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? "" : String(n))}
            className={cn(
              "h-9 w-9 rounded-lg text-[14px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
              selected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

function ChoiceSingleInput({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: string;
  options: string[];
  onChange: (next: string) => void;
}) {
  return (
    <div id={id} role="radiogroup" className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? "" : opt)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground/75 hover:bg-accent",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ChoiceMultiInput({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: string;
  options: string[];
  onChange: (next: string) => void;
}) {
  const selected = value
    ? value.split("|").map((s) => s.trim()).filter(Boolean)
    : [];
  function toggle(opt: string) {
    const next = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];
    onChange(next.join("|"));
  }
  return (
    <div id={id} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(opt)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
              on
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground/75 hover:bg-accent",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
