"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Lock,
  Eye,
  Plus,
  X,
  MessageSquareHeart,
  CalendarClock,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteOneOnOne,
  rescheduleOneOnOne,
  saveManagerMeeting,
} from "@/lib/one-on-ones/actions";
import {
  createActionItemForOneOnOne,
  deleteActionItem,
  updateActionItemDetails,
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

  function updateCreatedDetails(
    id: string,
    patch: { description?: string; notes?: string | null },
  ) {
    setCreated((p) =>
      p.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );
  }

  function removeCreated(id: string) {
    setCreated((p) => p.filter((it) => it.id !== id));
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
            <div className="group/title relative max-w-xl">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Reguliere 1-op-1"
                aria-label="Onderwerp van dit gesprek"
                maxLength={120}
                disabled={isCompleted}
                className="block w-full border-0 border-b border-dashed border-border bg-transparent px-0 py-0.5 pr-7 text-[24px] font-semibold leading-tight tracking-tight outline-none placeholder:text-muted-foreground/60 hover:border-foreground/40 focus:border-solid focus:border-ring focus:placeholder:text-muted-foreground/40 disabled:cursor-not-allowed disabled:border-transparent disabled:opacity-100"
              />
              {!isCompleted ? (
                <Pencil
                  aria-hidden
                  className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-hover/title:text-muted-foreground group-focus-within/title:text-ring"
                />
              ) : null}
            </div>
            <p className="text-[13px] text-muted-foreground">
              1-op-1 met {oneOnOne.employee.name} · {formatDateTime(oneOnOne.scheduled_at)}
              {isCompleted ? " · afgerond" : " · gepland"}
            </p>
          </div>
          <MeetingActionsMenu
            oneOnOneId={oneOnOne.id}
            employeeId={oneOnOne.employee.id}
            scheduledAt={oneOnOne.scheduled_at}
            isCompleted={isCompleted}
          />
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
            onEdit={updateCreatedDetails}
            onDelete={removeCreated}
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
  onEdit,
  onDelete,
}: {
  oneOnOneId: string;
  items: ActionItem[];
  ownerOptions: PersonRef[];
  defaultOwner: PersonRef;
  onCreated: (item: ActionItem) => void;
  onStatus: (id: string, status: Status) => void;
  onOwner: (id: string, owner: PersonRef) => void;
  onEdit: (
    id: string,
    patch: { description?: string; notes?: string | null },
  ) => void;
  onDelete: (id: string) => void;
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
              onEdit={onEdit}
              onDelete={onDelete}
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
  onEdit,
  onDelete,
}: {
  item: ActionItem;
  onStatus: (id: string, status: Status) => void;
  onOwner?: (id: string, owner: PersonRef) => void;
  ownerOptions?: PersonRef[];
  onEdit?: (
    id: string,
    patch: { description?: string; notes?: string | null },
  ) => void;
  onDelete?: (id: string) => void;
}) {
  const completed = item.status === "completed";
  const expired = item.status === "expired";
  const owner =
    ownerOptions?.find((p) => p.id === item.owner_id) ?? item.owner ?? null;
  const canSwitchOwner = Boolean(onOwner && ownerOptions && ownerOptions.length > 1);
  const canManage = Boolean(onEdit && onDelete);

  const [isOwnerPending, startOwnerTransition] = useTransition();
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDeletePending, startDeleteTransition] = useTransition();

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

  function submitDelete() {
    if (!onDelete) return;
    setActionError(null);
    startDeleteTransition(async () => {
      try {
        await deleteActionItem(item.id);
        onDelete(item.id);
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Verwijderen mislukt");
      }
    });
  }

  if (editing && canManage) {
    return (
      <EditActionItemRow
        item={item}
        onCancel={() => {
          setEditing(false);
          setActionError(null);
        }}
        onSaved={(patch) => {
          onEdit!(item.id, patch);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <>
      <li
        className={cn(
          "group flex items-start gap-3 rounded-xl bg-card px-4 py-3 shadow-sm",
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
          {actionError ? (
            <p className="mt-1 text-xs text-destructive">{actionError}</p>
          ) : null}
        </div>
        {canManage ? (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Actiepunt bewerken"
              title="Bewerken"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="Actiepunt verwijderen"
              title="Verwijderen"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </li>

      {canManage ? (
        <Dialog
          open={confirmDelete}
          onOpenChange={(next) => {
            if (!isDeletePending) setConfirmDelete(next);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actiepunt verwijderen?</DialogTitle>
              <DialogDescription>
                Het actiepunt verdwijnt uit dit gesprek en uit de actiepunten
                van {owner?.name ?? "de eigenaar"}.
              </DialogDescription>
            </DialogHeader>
            {actionError ? (
              <p className="text-sm text-destructive">{actionError}</p>
            ) : null}
            <DialogFooter className="flex flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeletePending}
              >
                Annuleer
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={submitDelete}
                disabled={isDeletePending}
              >
                {isDeletePending ? "Verwijderen..." : "Ja, verwijderen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

function EditActionItemRow({
  item,
  onCancel,
  onSaved,
}: {
  item: ActionItem;
  onCancel: () => void;
  onSaved: (patch: { description: string; notes: string | null }) => void;
}) {
  const [title, setTitle] = useState(item.description);
  const [description, setDescription] = useState(item.notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const t = title.trim();
    if (!t) return;
    const notes = description.trim() ? description.trim() : null;
    setError(null);
    startTransition(async () => {
      try {
        await updateActionItemDetails({
          id: item.id,
          description: t,
          notes,
        });
        onSaved({ description: t, notes });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Opslaan mislukt");
      }
    });
  }

  return (
    <li className="flex items-start gap-3 rounded-xl bg-card px-4 py-3 shadow-sm">
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
          aria-label="Wijziging opslaan"
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
    </li>
  );
}

function MeetingActionsMenu({
  oneOnOneId,
  employeeId,
  scheduledAt,
  isCompleted,
}: {
  oneOnOneId: string;
  employeeId: string;
  scheduledAt: string | null;
  isCompleted: boolean;
}) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        {!isCompleted ? (
          <button
            type="button"
            onClick={() => setRescheduleOpen(true)}
            aria-label="Gesprek verplaatsen"
            title="Verplaatsen"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <CalendarClock className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          aria-label="Gesprek verwijderen"
          title="Verwijderen"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        oneOnOneId={oneOnOneId}
        scheduledAt={scheduledAt}
      />
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        oneOnOneId={oneOnOneId}
        employeeId={employeeId}
      />
    </>
  );
}

function toDateTimeLocalValue(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function RescheduleDialog({
  open,
  onOpenChange,
  oneOnOneId,
  scheduledAt,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  oneOnOneId: string;
  scheduledAt: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(toDateTimeLocalValue(scheduledAt));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!value) {
      setError("Kies een datum en tijd.");
      return;
    }
    const iso = new Date(value).toISOString();
    startTransition(async () => {
      try {
        await rescheduleOneOnOne({ oneOnOneId, scheduledAt: iso });
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Verplaatsen mislukt");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
        if (next) setValue(toDateTimeLocalValue(scheduledAt));
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gesprek verplaatsen</DialogTitle>
          <DialogDescription>
            Kies een nieuw moment. De voorbereiding blijft bewaard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="reschedule_at">Datum en tijd</Label>
          <Input
            id="reschedule_at"
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isPending}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter className="flex flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuleer
          </Button>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? "Verplaatsen..." : "Verplaatsen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  open,
  onOpenChange,
  oneOnOneId,
  employeeId,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  oneOnOneId: string;
  employeeId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteOneOnOne(oneOnOneId);
        onOpenChange(false);
        router.push(`/team/${employeeId}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Verwijderen mislukt");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gesprek verwijderen?</DialogTitle>
          <DialogDescription>
            De voorbereiding, samenvatting, privé-notities en actiepunten uit
            dit gesprek worden ook verwijderd. Dit kan niet ongedaan worden
            gemaakt.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter className="flex flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuleer
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={submit}
            disabled={isPending}
          >
            {isPending ? "Verwijderen..." : "Ja, verwijderen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
