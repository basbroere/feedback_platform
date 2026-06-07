"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TemplateQuestion } from "@/lib/one-on-ones/types";
import {
  PERFORMANCE_REVIEW_SECTION_KEYS,
  PERFORMANCE_REVIEW_SECTION_LABEL,
  type PerformanceReviewBundleSections,
} from "@/lib/templates/types";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  open: "Open",
  scale_1_5: "Schaal 1-5",
  rating_b_1_5: "Bamback-schaal",
  choice_single: "Keuze",
  choice_multi: "Meerkeuze",
};

type Props = {
  name: string;
  questions?: TemplateQuestion[];
  sections?: PerformanceReviewBundleSections | null;
  disabled?: boolean;
  label?: string;
};

export function TemplatePreviewButton({
  name,
  questions,
  sections,
  disabled,
  label = "Bekijk vragen",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "h-8 gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground",
        )}
      >
        <Eye className="h-3.5 w-3.5" />
        {label}
      </button>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold leading-snug">
            {name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {sections ? (
            PERFORMANCE_REVIEW_SECTION_KEYS.map((key) => (
              <SectionBlock
                key={key}
                title={PERFORMANCE_REVIEW_SECTION_LABEL[key]}
                questions={sections[key] ?? []}
              />
            ))
          ) : (
            <QuestionList questions={questions ?? []} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionBlock({
  title,
  questions,
}: {
  title: string;
  questions: TemplateQuestion[];
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
        <span className="ml-2 font-normal normal-case">
          {questions.length} {questions.length === 1 ? "vraag" : "vragen"}
        </span>
      </h3>
      <QuestionList questions={questions} compact />
    </section>
  );
}

function QuestionList({
  questions,
  compact,
}: {
  questions: TemplateQuestion[];
  compact?: boolean;
}) {
  if (questions.length === 0) {
    return (
      <p className="text-[12.5px] text-muted-foreground">
        Nog geen vragen in dit onderdeel.
      </p>
    );
  }
  return (
    <ul className={cn("space-y-2", compact && "space-y-1.5")}>
      {questions.map((q, i) => (
        <li
          key={q.id}
          className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5"
        >
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium leading-snug">{q.label}</p>
              {q.hint ? (
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                  {q.hint}
                </p>
              ) : null}
              <p className="mt-1 text-[11px] text-muted-foreground">
                {KIND_LABEL[q.kind] ?? q.kind}
                {q.required ? " · Verplicht" : ""}
              </p>
              {q.options && q.options.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {q.options.map((opt, oi) => (
                    <li
                      key={oi}
                      className="text-[11px] text-muted-foreground"
                    >
                      {oi + 1}. {opt}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
