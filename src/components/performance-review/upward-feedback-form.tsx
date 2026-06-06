"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveUpwardFeedback } from "@/lib/performance-reviews/actions";
import type { TemplateQuestion } from "@/lib/one-on-ones/types";
import type { UpwardFeedbackTemplate } from "@/lib/performance-reviews/types";
import { RatingBInput } from "@/components/templates/rating-input";

export function UpwardFeedbackForm({
  performanceReviewId,
  template,
  initialAnswers,
}: {
  performanceReviewId: string;
  template: UpwardFeedbackTemplate | null;
  initialAnswers: Record<string, string>;
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
    setSaved(false);
  }

  function submit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveUpwardFeedback({
          performanceReviewId,
          responses: answers,
        });
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Opslaan mislukt");
      }
    });
  }

  if (!template) {
    return (
      <p className="text-sm text-muted-foreground">
        Geen upward-feedback template gevonden. Vraag HR of de template
        ingeladen is.
      </p>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={isPending} variant="secondary">
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
  const id = `up-${question.id}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {question.label}
        <span className="ml-1 text-[12px] text-muted-foreground">
          (optioneel)
        </span>
      </Label>
      {question.hint ? (
        <p className="text-[12.5px] text-muted-foreground">{question.hint}</p>
      ) : null}
      {question.kind === "rating_b_1_5" ? (
        <RatingBInput id={id} value={value} onChange={onChange} />
      ) : (
        <Textarea
          id={id}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Wat zou je willen meegeven?"
        />
      )}
    </div>
  );
}
