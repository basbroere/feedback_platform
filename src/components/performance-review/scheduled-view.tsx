"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUp,
  CalendarClock,
  Check,
  MessageSquareText,
  Plus,
  Sparkles,
  UserCircle2,
  Users,
  Eye,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionItem, TemplateQuestion } from "@/lib/one-on-ones/types";
import {
  createActionItemForPerformanceReview,
  saveManagerPerformanceReviewMeeting,
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
import { TemplateAnswers } from "./template-answers";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Status = "open" | "completed" | "expired";

export function PerformanceReviewScheduledView({
  review,
  questions,
  cycleInputs,
  newActionItems,
  dossierActionItems,
  dossierFeedback,
  windowStart,
  windowEnd,
}: {
  review: PerformanceReviewFull;
  questions: TemplateQuestion[];
  cycleInputs: CycleInputs;
  newActionItems: ActionItem[];
  dossierActionItems: DossierActionItem[];
  dossierFeedback: FeedbackWithSource[];
  windowStart: string;
  windowEnd: string;
}) {
  const router = useRouter();
  const [sharedSummary, setSharedSummary] = useState(review.shared_summary ?? "");
  const [privateNotes, setPrivateNotes] = useState(review.manager_private_notes ?? "");
  const [summaryMode, setSummaryMode] = useState<"shared" | "private">("shared");
  const [created, setCreated] = useState<ActionItem[]>(newActionItems);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function setCreatedStatus(id: string, status: Status) {
    setCreated((p) => p.map((it) => (it.id === id ? { ...it, status } : it)));
  }

  function persist(complete: boolean) {
    setError(null);
    const updates = created
      .filter(
        (it) => it.status !== newActionItems.find((p) => p.id === it.id)?.status,
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
              Ingepland op {formatDateTime(review.scheduled_at ?? "")}
              {review.template?.name ? ` · ${review.template.name}` : ""}
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-3 text-[13px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
        <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
        Gesprek ingepland voor {formatDateTime(review.scheduled_at ?? "")}. Alle input staat hieronder klaar.
      </div>

      {/* 4-kolommen feedbackoverzicht */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FeedbackColumn
          icon={<UserCircle2 className="h-4 w-4 text-blue-500" />}
          title={`Zelfreflectie ${review.employee.name.split(" ")[0]}`}
        >
          <TemplateAnswers
            questions={questions}
            answers={review.employee_self_evaluation}
            emptyLabel={`${review.employee.name} heeft niks ingevuld.`}
          />
        </FeedbackColumn>

        <FeedbackColumn
          icon={<Users className="h-4 w-4 text-violet-500" />}
          title={
            cycleInputs.peer
              ? `Peer: ${cycleInputs.peer.author.name}`
              : "Peer-feedback"
          }
          badge={cycleInputs.peer?.is_cross_team ? "cross-team" : undefined}
        >
          {!cycleInputs.peer ? (
            <Empty>Geen peer gekoppeld.</Empty>
          ) : cycleInputs.peer.status === "submitted" ? (
            <TemplateAnswers
              questions={questions}
              answers={cycleInputs.peer.responses}
              emptyLabel="Geen vragen ingevuld."
            />
          ) : (
            <Empty>
              {cycleInputs.peer.author.name} heeft nog niet gereageerd.
            </Empty>
          )}
        </FeedbackColumn>

        <FeedbackColumn
          icon={<ArrowUp className="h-4 w-4 text-emerald-500" />}
          title="Upward feedback"
        >
          {cycleInputs.upward &&
          Object.values(cycleInputs.upward.responses).some(
            (v) => typeof v === "string" && v.trim().length > 0,
          ) ? (
            <Empty>
              {review.employee.name.split(" ")[0]} heeft feedback meegegeven.
              Zichtbaar nadat je het gesprek afrondt.
            </Empty>
          ) : (
            <Empty>Geen upward feedback gegeven.</Empty>
          )}
        </FeedbackColumn>

        <FeedbackColumn
          icon={<MessageSquareText className="h-4 w-4 text-amber-500" />}
          title="Jouw feedback"
        >
          {cycleInputs.manager?.status === "submitted" ? (
            <TemplateAnswers
              questions={questions}
              answers={cycleInputs.manager.responses}
              emptyLabel="Geen vragen ingevuld."
            />
          ) : (
            <Empty>Je hebt nog geen feedback verstuurd.</Empty>
          )}
        </FeedbackColumn>
      </div>

      {/* Dossier */}
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

      {/* Actiepunten */}
      <Card>
        <CardHeader>
          <CardTitle>Actiepunten uit dit gesprek</CardTitle>
        </CardHeader>
        <CardContent>
          <NewActionItems
            performanceReviewId={review.id}
            items={created}
            onCreated={(item) => setCreated((p) => [...p, item])}
            onStatus={setCreatedStatus}
            disabled={false}
          />
        </CardContent>
      </Card>

      {/* Samenvatting */}
      <Card>
        <CardHeader>
          <CardTitle>Gesprekssamenvatting (optioneel)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SummaryToggle mode={summaryMode} onChange={setSummaryMode} />
          {summaryMode === "shared" ? (
            <div className="space-y-1.5">
              <Label htmlFor="sched-shared">
                Zichtbaar voor {review.employee.name}
              </Label>
              <Textarea
                id="sched-shared"
                value={sharedSummary}
                onChange={(e) => setSharedSummary(e.target.value)}
                placeholder="Wat hebben jullie besproken? Wat zijn de afspraken voor de komende periode?"
                rows={6}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="sched-private">
                Alleen voor jou. {review.employee.name} ziet dit nooit.
              </Label>
              <Textarea
                id="sched-private"
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                placeholder="Observaties, kanttekeningen, dingen die je voor jezelf wil onthouden."
                rows={6}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => persist(true)} disabled={isPending}>
          {isPending ? "Bezig..." : "Gesprek afronden"}
        </Button>
        {savedAt && (
          <span className="text-sm text-muted-foreground">Opgeslagen.</span>
        )}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </div>
  );
}

function FeedbackColumn({
  icon,
  title,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[13.5px] font-semibold leading-tight">{title}</span>
        {badge && (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            {badge}
          </span>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
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
        <li key={it.id} className="rounded-xl bg-card px-4 py-3 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-emerald-500 bg-emerald-500 text-white">
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

function ActionItemRow({
  item,
  onStatus,
}: {
  item: ActionItem;
  onStatus: (id: string, status: Status) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next: Status = item.status === "completed" ? "open" : "completed";
    startTransition(async () => {
      await updateActionItemStatus({ id: item.id, status: next });
      onStatus(item.id, next);
    });
  }

  return (
    <li className="flex items-start gap-3 rounded-xl bg-card px-4 py-3 shadow-sm">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
          item.status === "completed"
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-border bg-card hover:border-emerald-400",
        )}
      >
        {item.status === "completed" ? (
          <Check className="h-3 w-3" strokeWidth={2.5} />
        ) : null}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[14px] leading-snug",
            item.status === "completed" && "text-muted-foreground line-through",
          )}
        >
          {item.description}
        </p>
        {item.notes ? (
          <p className="mt-0.5 text-[12px] text-muted-foreground">{item.notes}</p>
        ) : null}
      </div>
    </li>
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
        setError(e instanceof Error ? e.message : "Aanmaken mislukt");
      }
    });
  }

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-primary/30 bg-card/60 px-4 py-3">
      <div className="space-y-1.5">
        <Label htmlFor="new-ai-title">Actiepunt</Label>
        <input
          id="new-ai-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Beschrijf het actiepunt"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
          autoFocus
        />
      </div>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Toelichting (optioneel)"
        rows={2}
        disabled={isPending}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={isPending || !title.trim()}>
          Toevoegen
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
          Annuleren
        </Button>
      </div>
    </div>
  );
}
