"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Lock,
  MessageSquareText,
  Sparkles,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateQuestion } from "@/lib/one-on-ones/types";
import {
  submitManagerCycleFeedback,
} from "@/lib/performance-reviews/actions";
import type {
  CycleInputs,
  PerformanceReviewFull,
} from "@/lib/performance-reviews/types";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { RatingBInput } from "@/components/templates/rating-input";
import { TemplateAnswers } from "./template-answers";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type StatusState = "done" | "waiting" | "empty" | "skipped" | "draft" | "locked";

export function ManagerPreparationView({
  review,
  questions,
  cycleInputs,
}: {
  review: PerformanceReviewFull;
  questions: TemplateQuestion[];
  cycleInputs: CycleInputs;
}) {
  const managerHasSubmitted = cycleInputs.manager?.status === "submitted";
  const hasSelfEval = Object.values(review.employee_self_evaluation).some(
    (v) => typeof v === "string" && v.trim().length > 0,
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start gap-3">
          <PersonAvatar
            id={review.employee.id}
            name={review.employee.name}
            avatarUrl={review.employee.avatar_url}
            size="lg"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-[24px] font-semibold leading-tight tracking-tight">
              360 functioneringsgesprek met {review.employee.name}
            </h1>
            <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 text-emerald-500" />
              Gepland op {review.scheduled_at ? formatDateTime(review.scheduled_at) : formatDate(review.cycle_started_at)}
              {review.template?.name ? ` · ${review.template.name}` : ""}
            </p>
          </div>
        </div>
      </header>

      <PreparationStatusGrid
        employeeName={review.employee.name}
        hasSelfEval={hasSelfEval}
        cycleInputs={cycleInputs}
        managerHasSubmitted={managerHasSubmitted}
      />

      <ManagerCycleFeedbackCard
        performanceReviewId={review.id}
        questions={questions}
        existing={cycleInputs.manager}
      />

      {managerHasSubmitted ? (
        <>
          <EmployeeSelfEvalCard
            employeeName={review.employee.name}
            questions={questions}
            selfEval={review.employee_self_evaluation}
          />
          <PeerFeedbackCard
            questions={questions}
            peer={cycleInputs.peer}
          />
        </>
      ) : (
        <LockedInputsNotice employeeName={review.employee.name} />
      )}
    </div>
  );
}

function PreparationStatusGrid({
  employeeName,
  hasSelfEval,
  cycleInputs,
  managerHasSubmitted,
}: {
  employeeName: string;
  hasSelfEval: boolean;
  cycleInputs: CycleInputs;
  managerHasSubmitted: boolean;
}) {
  const firstName = employeeName.split(" ")[0];
  const peer = cycleInputs.peer;
  const manager = cycleInputs.manager;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <StatusCard
        icon={<UserCircle2 className="h-4 w-4" />}
        title="Zelfreflectie"
        status={hasSelfEval ? "done" : "waiting"}
        line={hasSelfEval ? `${firstName} heeft ingevuld` : `Wacht op ${firstName}`}
      />
      <StatusCard
        icon={<Users className="h-4 w-4" />}
        title="Peer-feedback"
        status={
          managerHasSubmitted
            ? peer
              ? peer.status === "submitted"
                ? "done"
                : peer.status === "declined"
                  ? "skipped"
                  : "waiting"
              : "empty"
            : "locked"
        }
        line={
          managerHasSubmitted
            ? peer
              ? peer.status === "submitted"
                ? `${peer.author.name} heeft gegeven`
                : peer.status === "declined"
                  ? `${peer.author.name} ziet af`
                  : `Wacht op ${peer.author.name}`
              : `${firstName} kiest een collega`
            : "Zichtbaar na jouw inzending"
        }
      />
      <StatusCard
        icon={<MessageSquareText className="h-4 w-4" />}
        title="Jouw feedback"
        status={
          managerHasSubmitted ? "done" : manager ? "draft" : "waiting"
        }
        line={
          managerHasSubmitted
            ? "Verstuurd"
            : manager
              ? "Concept opgeslagen"
              : "Nog niet gegeven"
        }
      />
    </div>
  );
}

function LockedInputsNotice({ employeeName }: { employeeName: string }) {
  const firstName = employeeName.split(" ")[0];
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-5 py-5">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-[14px] font-medium">
          Zelfreflectie en peer-feedback zijn nog verborgen
        </p>
        <p className="text-[13px] text-muted-foreground">
          Stuur jouw eigen feedback eerst in. Daarna zie je wat {firstName} en de peer hebben ingevuld. Zo gaat iedereen onbevooroordeeld te werk.
        </p>
      </div>
    </div>
  );
}

function EmployeeSelfEvalCard({
  employeeName,
  questions,
  selfEval,
}: {
  employeeName: string;
  questions: TemplateQuestion[];
  selfEval: Record<string, string>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle2 className="h-4 w-4 text-blue-500" />
          Zelfreflectie van {employeeName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TemplateAnswers
          questions={questions}
          answers={selfEval}
          emptyLabel={`${employeeName} heeft nog niks ingevuld.`}
        />
      </CardContent>
    </Card>
  );
}

function PeerFeedbackCard({
  questions,
  peer,
}: {
  questions: TemplateQuestion[];
  peer: CycleInputs["peer"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          {peer ? `Peer-feedback van ${peer.author.name}` : "Peer-feedback"}
          {peer?.is_cross_team ? (
            <span className="ml-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              cross-team
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!peer ? (
          <p className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
            De medewerker kiest zelf één collega. Zodra dat is gedaan, zie je hier de status.
          </p>
        ) : peer.status === "submitted" ? (
          <TemplateAnswers
            questions={questions}
            answers={peer.responses}
            emptyLabel="Geen vragen ingevuld."
          />
        ) : peer.status === "declined" ? (
          <p className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
            {peer.author.name} heeft afgezien van feedback in deze cyclus.
          </p>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
            We wachten nog op {peer.author.name}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ManagerCycleFeedbackCard({
  performanceReviewId,
  questions,
  existing,
}: {
  performanceReviewId: string;
  questions: TemplateQuestion[];
  existing: CycleInputs["manager"];
}) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, string>>(
    existing?.responses ?? {},
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const submitted = existing?.status === "submitted";

  function update(qid: string, value: string) {
    setResponses((prev) => ({ ...prev, [qid]: value }));
  }

  function save(submit: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await submitManagerCycleFeedback({
          performanceReviewId,
          responses,
          submit,
        });
        setSavedAt(new Date().toISOString());
        if (submit) {
          router.refresh();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Opslaan mislukt");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-blue-500" />
          Jouw 360-feedback
        </CardTitle>
        <p className="text-[12.5px] text-muted-foreground">
          {submitted
            ? "Je hebt jouw feedback al verstuurd."
            : "Beantwoord dezelfde 360-vragen vanuit jouw perspectief als manager. Zichtbaar voor de medewerker zodra je verstuurt."}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Geen template gekoppeld aan dit gesprek.
          </p>
        ) : submitted ? (
          <TemplateAnswers
            questions={questions}
            answers={existing?.responses ?? {}}
          />
        ) : (
          <div className="space-y-5">
            {questions.map((q) => (
              <div key={q.id} className="space-y-1.5">
                <Label htmlFor={`mgr-${q.id}`}>
                  {q.label}
                  {q.required ? (
                    <span className="ml-1 text-muted-foreground">*</span>
                  ) : null}
                </Label>
                {q.kind === "rating_b_1_5" ? (
                  <RatingBInput
                    id={`mgr-${q.id}`}
                    value={responses[q.id] ?? ""}
                    onChange={(v) => update(q.id, v)}
                    disabled={isPending}
                  />
                ) : (
                  <Textarea
                    id={`mgr-${q.id}`}
                    rows={3}
                    value={responses[q.id] ?? ""}
                    onChange={(e) => update(q.id, e.target.value)}
                    placeholder="Wat zou je hier delen?"
                    disabled={isPending}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {!submitted && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => save(false)}
              disabled={isPending}
              variant="ghost"
            >
              Concept opslaan
            </Button>
            <Button onClick={() => save(true)} disabled={isPending}>
              {isPending ? "Bezig..." : "Versturen"}
            </Button>
            {savedAt && (
              <span className="text-sm text-muted-foreground">Opgeslagen.</span>
            )}
            {error && (
              <span className="text-sm text-destructive">{error}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusCard({
  icon,
  title,
  status,
  line,
}: {
  icon: React.ReactNode;
  title: string;
  status: StatusState;
  line: string;
}) {
  const palette: Record<StatusState, string> = {
    done: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
    waiting: "border-amber-200 bg-amber-50/60 text-amber-700",
    empty: "border-border bg-card text-muted-foreground",
    skipped: "border-border bg-card text-muted-foreground",
    draft: "border-blue-200 bg-blue-50/60 text-blue-700",
    locked: "border-border bg-muted/30 text-muted-foreground",
  };
  const dot: Record<StatusState, React.ReactNode> = {
    done: <CheckCircle2 className="h-3.5 w-3.5" />,
    waiting: <Clock3 className="h-3.5 w-3.5" />,
    empty: <Clock3 className="h-3.5 w-3.5" />,
    skipped: <X className="h-3.5 w-3.5" />,
    draft: <Sparkles className="h-3.5 w-3.5" />,
    locked: <Lock className="h-3.5 w-3.5" />,
  };
  const label: Record<StatusState, string> = {
    done: "klaar",
    waiting: "wacht",
    empty: "nog niet",
    skipped: "afgezien",
    draft: "concept",
    locked: "verborgen",
  };
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {icon}
          {title}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            palette[status],
          )}
        >
          {dot[status]}
          {label[status]}
        </span>
      </div>
      <p className="mt-2 text-[13.5px] text-foreground/85">{line}</p>
    </div>
  );
}
