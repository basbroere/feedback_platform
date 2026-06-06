"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUp,
  Check,
  CheckCircle2,
  CircleCheck,
  Clock3,
  Eye,
  Lock,
  MessageSquareText,
  Plus,
  Sparkles,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  ActionItem,
  TemplateQuestion,
} from "@/lib/one-on-ones/types";
import {
  createActionItemForPerformanceReview,
  saveManagerPerformanceReviewMeeting,
  submitManagerCycleFeedback,
} from "@/lib/performance-reviews/actions";
import { updateActionItemStatus } from "@/lib/action-items/actions";
import type {
  CycleInputs,
  DossierActionItem,
  PerformanceReviewFull,
} from "@/lib/performance-reviews/types";
import type { FeedbackWithSource } from "@/lib/feedback/types";
import { FeedbackRow } from "@/components/feedback/feedback-view";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { RatingBInput } from "@/components/templates/rating-input";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TemplateAnswers } from "./template-answers";

type Status = "open" | "completed" | "expired";

export function PerformanceReviewMeetingView({
  review,
  questions,
  upwardQuestions,
  cycleInputs,
  newActionItems,
  dossierActionItems,
  dossierFeedback,
  windowStart,
  windowEnd,
}: {
  review: PerformanceReviewFull;
  questions: TemplateQuestion[];
  upwardQuestions: TemplateQuestion[];
  cycleInputs: CycleInputs;
  newActionItems: ActionItem[];
  dossierActionItems: DossierActionItem[];
  dossierFeedback: FeedbackWithSource[];
  windowStart: string;
  windowEnd: string;
}) {
  const router = useRouter();
  const isCompleted = Boolean(review.completed_at);

  const [sharedSummary, setSharedSummary] = useState(
    review.shared_summary ?? "",
  );
  const [privateNotes, setPrivateNotes] = useState(
    review.manager_private_notes ?? "",
  );
  const [summaryMode, setSummaryMode] = useState<"shared" | "private">(
    "shared",
  );
  const [created, setCreated] = useState<ActionItem[]>(newActionItems);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function setCreatedStatus(id: string, status: Status) {
    setCreated((p) =>
      p.map((it) => (it.id === id ? { ...it, status } : it)),
    );
  }

  function persist(complete: boolean) {
    setError(null);
    const updates = created
      .filter(
        (it) =>
          it.status !== newActionItems.find((p) => p.id === it.id)?.status,
      )
      .map((it) => ({ id: it.id, status: it.status as Status }));

    startTransition(async () => {
      try {
        await saveManagerPerformanceReviewMeeting({
          performanceReviewId: review.id,
          sharedSummary,
          privateNotes,
          actionItemUpdates: updates,
          newActionItems: [],
          complete,
        });
        setSavedAt(new Date().toISOString());
        if (complete) {
          router.push(`/team/${review.employee.id}`);
        } else {
          router.refresh();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Opslaan mislukt");
      }
    });
  }

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
              {isCompleted ? (
                <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              )}
              Cyclus gestart op {formatDate(review.cycle_started_at)}
              {review.template?.name ? ` · ${review.template.name}` : ""}
              {isCompleted ? " · afgerond" : ""}
            </p>
          </div>
        </div>
      </header>

      <CycleStatusGrid
        employeeName={review.employee.name}
        hasSelfEval={hasSelfEval}
        cycleInputs={cycleInputs}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle2 className="h-4 w-4 text-blue-500" />
            Zelfreflectie van {review.employee.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateAnswers
            questions={questions}
            answers={review.employee_self_evaluation}
            emptyLabel={`${review.employee.name} heeft nog niks ingevuld.`}
          />
        </CardContent>
      </Card>

      <PeerFeedbackCard
        questions={questions}
        peer={cycleInputs.peer}
      />

      <UpwardFeedbackCard
        questions={upwardQuestions}
        upward={cycleInputs.upward}
        employeeName={review.employee.name}
      />

      <ManagerCycleFeedbackCard
        performanceReviewId={review.id}
        questions={questions}
        existing={cycleInputs.manager}
        disabled={isCompleted}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <CardTitle>Dossier afgelopen half jaar</CardTitle>
            <span className="text-[12px] text-muted-foreground">
              {formatDate(windowStart)} tot {formatDate(windowEnd)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Voltooide actiepunten ({dossierActionItems.length})
            </h3>
            <CompletedActionItemsList items={dossierActionItems} />
          </section>

          <section className="space-y-3">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Ontvangen feedback ({dossierFeedback.length})
            </h3>
            <ReceivedFeedbackBrowser items={dossierFeedback} />
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nieuwe actiepunten</CardTitle>
        </CardHeader>
        <CardContent>
          <NewActionItems
            performanceReviewId={review.id}
            items={created}
            onCreated={(item) => setCreated((p) => [...p, item])}
            onStatus={setCreatedStatus}
            disabled={isCompleted}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gesprekssamenvatting (optioneel)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[12.5px] text-muted-foreground">
            Een korte afsluiting van het gesprek. Voor jezelf, of voor{" "}
            {review.employee.name}.
          </p>
          <SummaryToggle mode={summaryMode} onChange={setSummaryMode} />
          {summaryMode === "shared" ? (
            <div className="space-y-1.5">
              <Label htmlFor="pr-shared">
                Zichtbaar voor {review.employee.name}
              </Label>
              <Textarea
                id="pr-shared"
                value={sharedSummary}
                onChange={(e) => setSharedSummary(e.target.value)}
                placeholder="Wat hebben jullie besproken? Wat zijn de afspraken voor de komende periode?"
                rows={6}
                disabled={isCompleted}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="pr-private">
                Alleen voor jou. {review.employee.name} ziet dit nooit.
              </Label>
              <Textarea
                id="pr-private"
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                placeholder="Observaties, kanttekeningen, dingen die je voor jezelf wil onthouden."
                rows={6}
                disabled={isCompleted}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => persist(false)} disabled={isPending || isCompleted}>
          {isPending ? "Bezig..." : "Opslaan"}
        </Button>
        {!isCompleted ? (
          <Button
            variant="secondary"
            onClick={() => persist(true)}
            disabled={isPending}
          >
            Markeer als afgerond
          </Button>
        ) : null}
        {savedAt ? (
          <span className="text-sm text-muted-foreground">Opgeslagen.</span>
        ) : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </div>
  );
}

function CycleStatusGrid({
  employeeName,
  hasSelfEval,
  cycleInputs,
}: {
  employeeName: string;
  hasSelfEval: boolean;
  cycleInputs: CycleInputs;
}) {
  const firstName = employeeName.split(" ")[0];
  const peer = cycleInputs.peer;
  const manager = cycleInputs.manager;
  const upward = cycleInputs.upward;
  const upwardSubmitted = upward?.status === "submitted";
  const upwardHasContent =
    !!upward &&
    Object.values(upward.responses).some(
      (v) => typeof v === "string" && v.trim().length > 0,
    );

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
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
          peer
            ? peer.status === "submitted"
              ? "done"
              : peer.status === "declined"
                ? "skipped"
                : "waiting"
            : "empty"
        }
        line={
          peer
            ? peer.status === "submitted"
              ? `${peer.author.name} heeft gegeven`
              : peer.status === "declined"
                ? `${peer.author.name} ziet af`
                : `Wacht op ${peer.author.name}`
            : `${firstName} kiest een collega`
        }
      />
      <StatusCard
        icon={<ArrowUp className="h-4 w-4" />}
        title="Upward feedback"
        status={upwardSubmitted ? "done" : upwardHasContent ? "draft" : "empty"}
        line={
          upwardSubmitted
            ? `${firstName} heeft feedback gegeven`
            : upwardHasContent
              ? "Concept, zichtbaar na afronding"
              : "Geen feedback gegeven"
        }
      />
      <StatusCard
        icon={<MessageSquareText className="h-4 w-4" />}
        title="Manager-feedback"
        status={
          manager && manager.status === "submitted"
            ? "done"
            : manager
              ? "draft"
              : "waiting"
        }
        line={
          manager && manager.status === "submitted"
            ? "Verstuurd naar de medewerker"
            : manager
              ? "Concept opgeslagen"
              : "Nog niet gegeven"
        }
      />
    </div>
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
  status: "done" | "waiting" | "empty" | "skipped" | "draft";
  line: string;
}) {
  const palette = {
    done: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
    waiting: "border-amber-200 bg-amber-50/60 text-amber-700",
    empty: "border-border bg-card text-muted-foreground",
    skipped: "border-border bg-card text-muted-foreground",
    draft: "border-blue-200 bg-blue-50/60 text-blue-700",
  }[status];
  const dot = {
    done: <CheckCircle2 className="h-3.5 w-3.5" />,
    waiting: <Clock3 className="h-3.5 w-3.5" />,
    empty: <Clock3 className="h-3.5 w-3.5" />,
    skipped: <X className="h-3.5 w-3.5" />,
    draft: <Sparkles className="h-3.5 w-3.5" />,
  }[status];
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {icon}
          {title}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            palette,
          )}
        >
          {dot}
          {status === "done"
            ? "klaar"
            : status === "waiting"
              ? "wacht"
              : status === "draft"
                ? "concept"
                : status === "skipped"
                  ? "afgezien"
                  : "nog niet"}
        </span>
      </div>
      <p className="mt-2 text-[13.5px] text-foreground/85">{line}</p>
    </div>
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
          {peer
            ? `Peer-feedback van ${peer.author.name}`
            : "Peer-feedback"}
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
            De medewerker kiest zelf één collega voor 360 feedback. Zodra dat
            is gebeurd, zie je hier de status.
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

function UpwardFeedbackCard({
  questions,
  upward,
  employeeName,
}: {
  questions: TemplateQuestion[];
  upward: CycleInputs["upward"];
  employeeName: string;
}) {
  const hasContent =
    !!upward &&
    Object.values(upward.responses).some(
      (v) => typeof v === "string" && v.trim().length > 0,
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUp className="h-4 w-4 text-blue-500" />
          Upward feedback van {employeeName}
        </CardTitle>
        <p className="text-[12.5px] text-muted-foreground">
          Feedback die {employeeName.split(" ")[0]} jou heeft meegegeven als
          onderdeel van de voorbereiding.
        </p>
      </CardHeader>
      <CardContent>
        {!hasContent || !upward ? (
          <p className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
            {employeeName.split(" ")[0]} heeft geen upward feedback gegeven.
          </p>
        ) : questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Upward-template niet beschikbaar.
          </p>
        ) : (
          <TemplateAnswers
            questions={questions}
            answers={upward.responses}
            emptyLabel="Geen vragen ingevuld."
          />
        )}
      </CardContent>
    </Card>
  );
}

function ManagerCycleFeedbackCard({
  performanceReviewId,
  questions,
  existing,
  disabled,
}: {
  performanceReviewId: string;
  questions: TemplateQuestion[];
  existing: CycleInputs["manager"];
  disabled: boolean;
}) {
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
          Beantwoord dezelfde 360-vragen vanuit jouw perspectief als manager.
          Bij &ldquo;Versturen&rdquo; ziet de medewerker je antwoorden.
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
                {q.hint ? (
                  <p className="text-[12px] text-muted-foreground">{q.hint}</p>
                ) : null}
                {q.kind === "rating_b_1_5" ? (
                  <RatingBInput
                    id={`mgr-${q.id}`}
                    value={responses[q.id] ?? ""}
                    onChange={(v) => update(q.id, v)}
                    disabled={disabled || isPending}
                  />
                ) : (
                  <Textarea
                    id={`mgr-${q.id}`}
                    rows={3}
                    value={responses[q.id] ?? ""}
                    onChange={(e) => update(q.id, e.target.value)}
                    placeholder="Wat zou je hier delen?"
                    disabled={disabled || isPending}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {!submitted ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => save(false)}
              disabled={disabled || isPending}
              variant="ghost"
            >
              Concept opslaan
            </Button>
            <Button
              onClick={() => save(true)}
              disabled={disabled || isPending}
            >
              {isPending ? "Bezig..." : "Versturen"}
            </Button>
            {savedAt ? (
              <span className="text-sm text-muted-foreground">Opgeslagen.</span>
            ) : null}
            {error ? <span className="text-sm text-destructive">{error}</span> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SummaryToggle({
  mode,
  onChange,
}: {
  mode: "shared" | "private";
  onChange: (next: "shared" | "private") => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Wissel tussen gedeelde samenvatting en privé"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1"
    >
      {(
        [
          { key: "shared", label: "Gedeeld", icon: Eye },
          { key: "private", label: "Privé", icon: Lock },
        ] as const
      ).map(({ key, label, icon: Icon }) => {
        const active = mode === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
              active
                ? "bg-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function CompletedActionItemsList({ items }: { items: DossierActionItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
        Geen voltooide actiepunten in deze periode.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li
          key={it.id}
          className="rounded-xl bg-card px-4 py-3 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-emerald-500 bg-emerald-500 text-white"
            >
              <Check className="h-3 w-3" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] leading-snug">{it.description}</p>
              {it.notes ? (
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-snug text-muted-foreground">
                  {it.notes}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                {it.source_href ? (
                  <Link
                    href={it.source_href}
                    className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/75 transition-colors hover:bg-muted/80"
                  >
                    <MessageSquareText className="h-3 w-3" strokeWidth={1.75} />
                    {it.source_label}
                    {it.source_date ? ` · ${formatDate(it.source_date)}` : ""}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/75">
                    {it.source_label}
                  </span>
                )}
                {it.completed_at ? (
                  <span>Afgerond op {formatDate(it.completed_at)}</span>
                ) : null}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ReceivedFeedbackBrowser({ items }: { items: FeedbackWithSource[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
        Geen ontvangen feedback in deze periode.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((f) => (
        <FeedbackRow key={f.id} item={f} />
      ))}
    </ul>
  );
}

function NewActionItems({
  performanceReviewId,
  items,
  onCreated,
  onStatus,
  disabled,
}: {
  performanceReviewId: string;
  items: ActionItem[];
  onCreated: (item: ActionItem) => void;
  onStatus: (id: string, status: Status) => void;
  disabled: boolean;
}) {
  const [drafting, setDrafting] = useState(false);

  return (
    <div className="space-y-2">
      {items.length === 0 && !drafting ? (
        <p className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
          Nog geen actiepunten uit dit gesprek.
        </p>
      ) : null}

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((it) => (
            <ActionItemRow key={it.id} item={it} onStatus={onStatus} />
          ))}
        </ul>
      ) : null}

      {drafting ? (
        <DraftActionItem
          performanceReviewId={performanceReviewId}
          onSaved={(item) => {
            onCreated(item);
            setDrafting(false);
          }}
          onCancel={() => setDrafting(false)}
        />
      ) : disabled ? null : (
        <button
          type="button"
          onClick={() => setDrafting(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card/40 px-4 py-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <Plus className="h-3.5 w-3.5" />
          Actiepunt toevoegen
        </button>
      )}
    </div>
  );
}

function DraftActionItem({
  performanceReviewId,
  onSaved,
  onCancel,
}: {
  performanceReviewId: string;
  onSaved: (item: ActionItem) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const t = title.trim();
    if (!t) return;
    const notes = description.trim() ? description.trim() : null;
    setError(null);
    startTransition(async () => {
      try {
        const { id } = await createActionItemForPerformanceReview({
          performanceReviewId,
          description: t,
          notes,
        });
        onSaved({
          id,
          owner_id: "",
          description: t,
          status: "open",
          target_date: null,
          notes,
          source_type: "performance_review",
          source_id: performanceReviewId,
          created_at: new Date().toISOString(),
          completed_at: null,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Toevoegen mislukt");
      }
    });
  }

  return (
    <div className="flex items-start gap-3 rounded-xl bg-card px-4 py-3 shadow-sm">
      <span
        aria-hidden
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-background"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <Input
          autoFocus
          placeholder="Titel van het actiepunt"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
          disabled={isPending}
          className="h-8 text-[14px]"
          aria-label="Titel"
        />
        <Textarea
          placeholder="Beschrijving (optioneel)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
          rows={2}
          className="text-[13px]"
          aria-label="Beschrijving"
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          onClick={submit}
          disabled={isPending || title.trim().length === 0}
          aria-label="Actiepunt opslaan"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
          aria-label="Annuleren"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function ActionItemRow({
  item,
  onStatus,
}: {
  item: ActionItem;
  onStatus: (id: string, status: Status) => void;
}) {
  const completed = item.status === "completed";
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl bg-card px-4 py-3 shadow-sm",
        completed && "opacity-70",
      )}
    >
      <button
        type="button"
        aria-label={completed ? "Markeer als open" : "Markeer als afgerond"}
        onClick={() => {
          const next: Status = completed ? "open" : "completed";
          onStatus(item.id, next);
          void updateActionItemStatus({ id: item.id, status: next }).catch(
            () => {
              onStatus(item.id, completed ? "completed" : "open");
            },
          );
        }}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
          completed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-border bg-background text-transparent hover:border-foreground/30",
        )}
      >
        <Check className="h-3 w-3" strokeWidth={2.5} />
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[14px] leading-snug",
            completed && "line-through text-muted-foreground",
          )}
        >
          {item.description}
        </p>
        {item.notes ? (
          <p
            className={cn(
              "mt-1 whitespace-pre-wrap text-[13px] leading-snug text-muted-foreground",
              completed && "line-through",
            )}
          >
            {item.notes}
          </p>
        ) : null}
      </div>
    </li>
  );
}
