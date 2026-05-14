import Link from "next/link";
import { CalendarClock, CircleCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type {
  ActionItem,
  OneOnOneForEmployee,
  TemplateQuestion,
} from "@/lib/one-on-ones/types";
import { cn } from "@/lib/utils";
import { ActionItemList } from "./action-item-list";
import { PersonAvatar } from "./person-avatar";

export function EmployeeSummaryView({
  oneOnOne,
  questions,
  actionItems,
}: {
  oneOnOne: OneOnOneForEmployee;
  questions: TemplateQuestion[];
  actionItems: ActionItem[];
}) {
  const isCompleted = Boolean(oneOnOne.completed_at);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <PersonAvatar
            id={oneOnOne.manager.id}
            name={oneOnOne.manager.name}
            avatarUrl={oneOnOne.manager.avatar_url}
          />
          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-tight">
              {oneOnOne.subject}
            </h1>
            <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              {isCompleted ? (
                <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <CalendarClock className="h-3.5 w-3.5 text-blue-500" />
              )}
              1-op-1 met {oneOnOne.manager.name} · {formatDateTime(oneOnOne.scheduled_at)}
              {isCompleted ? " · afgerond" : " · gepland"}
            </p>
          </div>
        </div>
      </header>

      {!isCompleted ? (
        <Card>
          <CardHeader>
            <CardTitle>Je voorbereiding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Je kan deze 1-op-1 nog voorbereiden zolang die niet is afgerond.
            </p>
            <Link
              href={`/een-op-een/${oneOnOne.id}/voorbereiden`}
              className={cn(buttonVariants({ size: "sm" }), "w-fit")}
            >
              {Object.keys(oneOnOne.employee_preparation).length > 0
                ? "Voorbereiding bijwerken"
                : "Voorbereiden"}
            </Link>
          </CardContent>
        </Card>
      ) : oneOnOne.shared_summary ? (
        <Card>
          <CardHeader>
            <CardTitle>Gedeelde samenvatting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed">
              {oneOnOne.shared_summary}
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

      {Object.keys(oneOnOne.employee_preparation).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Je voorbereiding</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              {questions.map((q) => {
                const answer = oneOnOne.employee_preparation[q.id]?.trim();
                if (!answer) return null;
                return (
                  <div key={q.id}>
                    <dt className="text-[13px] font-medium text-foreground/80">
                      {q.label}
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap text-[14px] text-foreground/90">
                      {answer}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
