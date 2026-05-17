import Link from "next/link";
import { ArrowRight, CalendarClock, CircleCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type {
  ActionItem,
  TemplateQuestion,
} from "@/lib/one-on-ones/types";
import type { PerformanceReviewForEmployee } from "@/lib/performance-reviews/types";
import { ActionItemList } from "@/components/one-on-one/action-item-list";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { cn } from "@/lib/utils";
import { TemplateAnswers } from "./template-answers";

export function PerformanceReviewEmployeeSummaryView({
  review,
  questions,
  actionItems,
}: {
  review: PerformanceReviewForEmployee;
  questions: TemplateQuestion[];
  actionItems: ActionItem[];
}) {
  const isCompleted = Boolean(review.completed_at);
  const hasSelfEval = Object.values(review.employee_self_evaluation).some(
    (v) => typeof v === "string" && v.trim().length > 0,
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <PersonAvatar
            id={review.manager.id}
            name={review.manager.name}
            avatarUrl={review.manager.avatar_url}
            size="lg"
          />
          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-tight">
              Functioneringsgesprek met {review.manager.name}
            </h1>
            <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              {isCompleted ? (
                <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <CalendarClock className="h-3.5 w-3.5 text-blue-500" />
              )}
              Cyclus gestart op {formatDate(review.cycle_started_at)}
              {review.template?.name ? ` · ${review.template.name}` : ""}
              {isCompleted ? " · afgerond" : " · in voorbereiding"}
            </p>
          </div>
        </div>
      </header>

      {!isCompleted ? (
        <Card>
          <CardHeader>
            <CardTitle>Je zelfevaluatie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Vragen zijn suggesties. Vul aan waar je iets te delen hebt.
              Voorbereiden mag in een paar minuten.
            </p>
            <Link
              href={`/functioneringsgesprek/${review.id}/voorbereiden`}
              className={cn(buttonVariants({ size: "sm" }), "w-fit")}
            >
              {hasSelfEval ? "Zelfevaluatie bijwerken" : "Zelfevaluatie invullen"}
              <ArrowRight className="h-3.5 w-3.5" data-icon="inline-end" />
            </Link>
          </CardContent>
        </Card>
      ) : review.shared_summary ? (
        <Card>
          <CardHeader>
            <CardTitle>Gedeelde samenvatting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed">
              {review.shared_summary}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Actiepunten</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionItemList
            items={actionItems}
            emptyLabel="Geen actiepunten uit dit gesprek."
            readOnly={false}
          />
        </CardContent>
      </Card>

      {hasSelfEval ? (
        <Card>
          <CardHeader>
            <CardTitle>Je zelfevaluatie</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateAnswers
              questions={questions}
              answers={review.employee_self_evaluation}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
