"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  CircleCheck,
  Eye,
  Lock,
  MessageSquareText,
  Plus,
  Sparkles,
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
} from "@/lib/performance-reviews/actions";
import { updateActionItemStatus } from "@/lib/action-items/actions";
import type {
  DossierActionItem,
  PerformanceReviewFull,
} from "@/lib/performance-reviews/types";
import type { FeedbackWithSource } from "@/lib/feedback/types";
import { FeedbackRow } from "@/components/feedback/feedback-view";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TemplateAnswers } from "./template-answers";

type Status = "open" | "completed" | "expired";

const PREP_KEY = "notes";

export function PerformanceReviewMeetingView({
  review,
  questions,
  newActionItems,
  dossierActionItems,
  dossierFeedback,
  windowStart,
  windowEnd,
}: {
  review: PerformanceReviewFull;
  questions: TemplateQuestion[];
  newActionItems: ActionItem[];
  dossierActionItems: DossierActionItem[];
  dossierFeedback: FeedbackWithSource[];
  windowStart: string;
  windowEnd: string;
}) {
  const router = useRouter();
  const isCompleted = Boolean(review.completed_at);

  const [managerNotes, setManagerNotes] = useState(
    review.manager_preparation?.[PREP_KEY] ?? "",
  );
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
          managerPreparation: { [PREP_KEY]: managerNotes },
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
              Functioneringsgesprek met {review.employee.name}
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

      <Card>
        <CardHeader>
          <CardTitle>Zelfevaluatie van {review.employee.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateAnswers
            questions={questions}
            answers={review.employee_self_evaluation}
            emptyLabel="Nog niets ingevuld door de medewerker."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mijn voorbereiding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="manager-prep" className="text-muted-foreground">
            Alleen voor jou. {review.employee.name} ziet dit niet.
            Observaties, ontwikkelpunten, wat je in dit gesprek wil bespreken.
          </Label>
          <Textarea
            id="manager-prep"
            value={managerNotes}
            onChange={(e) => setManagerNotes(e.target.value)}
            placeholder="Wat valt je op? Wat wil je terugkijken? Waar zie je groei of vraag je je iets af?"
            rows={5}
            disabled={isCompleted}
          />
        </CardContent>
      </Card>

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
          <CardTitle>Gesprekssamenvatting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
          className="rounded-xl border border-border bg-card px-4 py-3"
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
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
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
        "flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3",
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
