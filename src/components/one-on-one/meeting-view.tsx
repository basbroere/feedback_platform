"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, Eye, Plus, X, MessageSquareHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { saveManagerMeeting } from "@/lib/one-on-ones/actions";
import {
  createActionItemForOneOnOne,
  updateActionItemOwner,
  updateActionItemStatus,
} from "@/lib/action-items/actions";
import type {
  ActionItem,
  OneOnOneFull,
  PersonRef,
  TemplateQuestion,
} from "@/lib/one-on-ones/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PersonAvatar } from "./person-avatar";

type Status = "open" | "completed" | "expired";

export function MeetingView({
  oneOnOne,
  questions,
  previousActionItems,
  newActionItems,
}: {
  oneOnOne: OneOnOneFull;
  questions: TemplateQuestion[];
  previousActionItems: ActionItem[];
  newActionItems: ActionItem[];
}) {
  const router = useRouter();
  const [subject, setSubject] = useState(oneOnOne.subject ?? "");
  const [sharedSummary, setSharedSummary] = useState(
    oneOnOne.shared_summary ?? "",
  );
  const [privateNotes, setPrivateNotes] = useState(
    oneOnOne.manager_private_notes ?? "",
  );
  const [feedbackBody, setFeedbackBody] = useState(
    oneOnOne.existing_manager_feedback ?? "",
  );
  const [summaryMode, setSummaryMode] = useState<"shared" | "private">("shared");
  const [previous, setPrevious] = useState<ActionItem[]>(previousActionItems);
  const [created, setCreated] = useState<ActionItem[]>(newActionItems);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const isCompleted = Boolean(oneOnOne.completed_at);
  const ownerOptions: PersonRef[] = [oneOnOne.employee, oneOnOne.manager];

  function setPrevStatus(id: string, status: Status) {
    setPrevious((p) =>
      p.map((it) => (it.id === id ? { ...it, status } : it)),
    );
  }

  function setCreatedStatus(id: string, status: Status) {
    setCreated((p) =>
      p.map((it) => (it.id === id ? { ...it, status } : it)),
    );
  }

  function setCreatedOwner(id: string, owner: PersonRef) {
    setCreated((p) =>
      p.map((it) =>
        it.id === id ? { ...it, owner_id: owner.id, owner } : it,
      ),
    );
  }

  function persist(complete: boolean) {
    setError(null);
    const updates = [
      ...previous
        .filter(
          (it) =>
            it.status !==
            previousActionItems.find((p) => p.id === it.id)?.status,
        )
        .map((it) => ({ id: it.id, status: it.status as Status })),
      ...created
        .filter(
          (it) =>
            it.status !== newActionItems.find((p) => p.id === it.id)?.status,
        )
        .map((it) => ({ id: it.id, status: it.status as Status })),
    ];

    startTransition(async () => {
      try {
        await saveManagerMeeting({
          oneOnOneId: oneOnOne.id,
          subject,
          sharedSummary,
          privateNotes,
          actionItemUpdates: updates,
          newActionItems: [],
          feedbackBody,
          complete,
        });
        setSavedAt(new Date().toISOString());
        if (complete) {
          router.push(`/team/${oneOnOne.employee.id}`);
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
            id={oneOnOne.employee.id}
            name={oneOnOne.employee.name}
            avatarUrl={oneOnOne.employee.avatar_url}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Reguliere 1-op-1"
              aria-label="Onderwerp van dit gesprek"
              maxLength={120}
              disabled={isCompleted}
              className="block w-full max-w-xl border-0 border-b border-transparent bg-transparent px-0 py-0.5 text-[24px] font-semibold leading-tight tracking-tight outline-none placeholder:text-muted-foreground/60 hover:border-border focus:border-ring focus:placeholder:text-muted-foreground/40 disabled:cursor-not-allowed disabled:opacity-100"
            />
            <p className="text-[13px] text-muted-foreground">
              1-op-1 met {oneOnOne.employee.name} · {formatDateTime(oneOnOne.scheduled_at)}
              {isCompleted ? " · afgerond" : " · gepland"}
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Voorbereiding van {oneOnOne.employee.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Geen template gekoppeld.
            </p>
          ) : (
            <dl className="space-y-4">
              {questions.map((q) => {
                const answer = oneOnOne.employee_preparation[q.id]?.trim();
                return (
                  <div key={q.id}>
                    <dt className="text-[13px] font-medium text-foreground/80">
                      {q.label}
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap text-[14px] text-foreground/90">
                      {answer && answer.length > 0 ? (
                        answer
                      ) : (
                        <span className="text-muted-foreground italic">
                          Niets ingevuld.
                        </span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vorige actiepunten</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionItemEditList
            items={previous}
            onStatus={setPrevStatus}
            emptyLabel="Geen openstaande actiepunten uit eerdere 1-op-1's."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nieuwe actiepunten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NewActionItems
            oneOnOneId={oneOnOne.id}
            items={created}
            ownerOptions={ownerOptions}
            defaultOwner={oneOnOne.employee}
            onCreated={(item) => setCreated((p) => [...p, item])}
            onStatus={setCreatedStatus}
            onOwner={setCreatedOwner}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareHeart className="h-4 w-4 text-muted-foreground" />
            Feedback aan {oneOnOne.employee.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="manager-feedback" className="text-muted-foreground">
            Optioneel. {oneOnOne.employee.name} ziet dit terug op de feedback-pagina.
          </Label>
          <Textarea
            id="manager-feedback"
            value={feedbackBody}
            onChange={(e) => setFeedbackBody(e.target.value)}
            placeholder={`Iets dat je ${oneOnOne.employee.name.split(" ")[0]} mee wil geven? Wat zag je goed gaan, waar zie je een kans?`}
            rows={4}
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
              <Label htmlFor="shared">
                Zichtbaar voor {oneOnOne.employee.name}
              </Label>
              <Textarea
                id="shared"
                value={sharedSummary}
                onChange={(e) => setSharedSummary(e.target.value)}
                placeholder="Wat hebben jullie besproken? Houd het kort en samen begrijpelijk."
                rows={5}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="private">
                Alleen voor jou. {oneOnOne.employee.name} ziet dit nooit.
              </Label>
              <Textarea
                id="private"
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                placeholder="Observaties, vragen voor later, dingen die je nog wil uitzoeken."
                rows={5}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => persist(false)} disabled={isPending}>
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

function NewActionItems({
  oneOnOneId,
  items,
  ownerOptions,
  defaultOwner,
  onCreated,
  onStatus,
  onOwner,
}: {
  oneOnOneId: string;
  items: ActionItem[];
  ownerOptions: PersonRef[];
  defaultOwner: PersonRef;
  onCreated: (item: ActionItem) => void;
  onStatus: (id: string, status: Status) => void;
  onOwner: (id: string, owner: PersonRef) => void;
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
            <ActionItemEditRow
              key={it.id}
              item={it}
              onStatus={onStatus}
              onOwner={onOwner}
              ownerOptions={ownerOptions}
            />
          ))}
        </ul>
      ) : null}

      {drafting ? (
        <DraftActionItem
          oneOnOneId={oneOnOneId}
          defaultOwner={defaultOwner}
          onSaved={(item) => {
            onCreated(item);
            setDrafting(false);
          }}
          onCancel={() => setDrafting(false)}
        />
      ) : (
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
  oneOnOneId,
  defaultOwner,
  onSaved,
  onCancel,
}: {
  oneOnOneId: string;
  defaultOwner: PersonRef;
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
        const { id } = await createActionItemForOneOnOne({
          oneOnOneId,
          description: t,
          notes,
        });
        onSaved({
          id,
          owner_id: defaultOwner.id,
          description: t,
          status: "open",
          target_date: null,
          notes,
          source_type: "one_on_one",
          source_id: oneOnOneId,
          created_at: new Date().toISOString(),
          completed_at: null,
          owner: defaultOwner,
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

function ActionItemEditList({
  items,
  onStatus,
  onOwner,
  ownerOptions,
  emptyLabel,
}: {
  items: ActionItem[];
  onStatus: (id: string, status: Status) => void;
  onOwner?: (id: string, owner: PersonRef) => void;
  ownerOptions?: PersonRef[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <ActionItemEditRow
          key={it.id}
          item={it}
          onStatus={onStatus}
          onOwner={onOwner}
          ownerOptions={ownerOptions}
        />
      ))}
    </ul>
  );
}

function ActionItemEditRow({
  item,
  onStatus,
  onOwner,
  ownerOptions,
}: {
  item: ActionItem;
  onStatus: (id: string, status: Status) => void;
  onOwner?: (id: string, owner: PersonRef) => void;
  ownerOptions?: PersonRef[];
}) {
  const completed = item.status === "completed";
  const expired = item.status === "expired";
  const owner =
    ownerOptions?.find((p) => p.id === item.owner_id) ?? item.owner ?? null;
  const canSwitchOwner = Boolean(onOwner && ownerOptions && ownerOptions.length > 1);

  const [isOwnerPending, startOwnerTransition] = useTransition();
  const [ownerError, setOwnerError] = useState<string | null>(null);

  function selectOwner(next: PersonRef) {
    if (!onOwner) return;
    if (next.id === item.owner_id) return;
    onOwner(item.id, next);
    setOwnerError(null);
    startOwnerTransition(async () => {
      try {
        await updateActionItemOwner({ id: item.id, ownerId: next.id });
      } catch (e) {
        setOwnerError(e instanceof Error ? e.message : "Wijzigen mislukt");
      }
    });
  }

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3",
        (completed || expired) && "opacity-70",
      )}
    >
      <StatusCheckbox
        completed={completed}
        onToggle={() => {
          const next: Status = completed ? "open" : "completed";
          onStatus(item.id, next);
          // Fire-and-forget persistence; rollback on failure.
          void updateActionItemStatus({ id: item.id, status: next }).catch(() => {
            onStatus(item.id, completed ? "completed" : "open");
          });
        }}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[14px] leading-snug",
            completed && "line-through text-muted-foreground",
            expired && "text-muted-foreground italic",
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
        {owner ? (
          canSwitchOwner ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="mt-1 inline-flex items-center gap-1.5 rounded-md px-1 -mx-1 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                disabled={isOwnerPending}
              >
                <PersonAvatar
                  id={owner.id}
                  name={owner.name}
                  avatarUrl={owner.avatar_url}
                  size="sm"
                />
                <span>{owner.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {ownerOptions!.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => selectOwner(p)}
                    className="gap-2"
                  >
                    <PersonAvatar
                      id={p.id}
                      name={p.name}
                      avatarUrl={p.avatar_url}
                      size="sm"
                    />
                    <span>{p.name}</span>
                    {p.id === item.owner_id ? (
                      <Check className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <PersonAvatar
                id={owner.id}
                name={owner.name}
                avatarUrl={owner.avatar_url}
                size="sm"
              />
              <span>{owner.name}</span>
            </div>
          )
        ) : null}
        {ownerError ? (
          <p className="mt-1 text-xs text-destructive">{ownerError}</p>
        ) : null}
      </div>
    </li>
  );
}

function StatusCheckbox({
  completed,
  onToggle,
}: {
  completed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={completed ? "Markeer als open" : "Markeer als afgerond"}
      onClick={onToggle}
      className={cn(
        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        completed
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-border bg-background text-transparent hover:border-foreground/30",
      )}
    >
      <Check className="h-3 w-3" strokeWidth={2.5} />
    </button>
  );
}
