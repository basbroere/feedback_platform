"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowUpDown,
  Calendar,
  CalendarCheck2,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquareText,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  StickyNote,
  Target,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  createPersonalActionItem,
  deleteActionItem,
  updateActionItemDetails,
  updateActionItemStatus,
} from "@/lib/action-items/actions";
import type { DossierItem } from "@/lib/action-items/queries";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatRelativeWeeks } from "@/lib/format";
import { cn } from "@/lib/utils";

type TabKey = "open" | "completed" | "all";
type SortKey =
  | "description"
  | "source"
  | "status"
  | "target_date"
  | "created_at";
type SortDir = "asc" | "desc";

export function ActionItemsView({
  open,
  completed,
}: {
  open: DossierItem[];
  completed: DossierItem[];
}) {
  const [tab, setTab] = useState<TabKey>("open");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<DossierItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const all = useMemo(() => [...open, ...completed], [open, completed]);

  const base = tab === "open" ? open : tab === "completed" ? completed : all;

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? base.filter(
          (it) =>
            it.description.toLowerCase().includes(q) ||
            (it.source?.label?.toLowerCase().includes(q) ?? false) ||
            (it.source?.with?.name?.toLowerCase().includes(q) ?? false),
        )
      : base;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "description") {
        cmp = a.description.localeCompare(b.description, "nl");
      } else if (sortKey === "source") {
        const la = sourceLabel(a);
        const lb = sourceLabel(b);
        cmp = la.localeCompare(lb, "nl");
      } else if (sortKey === "status") {
        const order = { open: 0, expired: 1, completed: 2 };
        cmp =
          (order[a.status as keyof typeof order] ?? 0) -
          (order[b.status as keyof typeof order] ?? 0);
      } else if (sortKey === "target_date") {
        const ta = a.target_date ? new Date(a.target_date).getTime() : Infinity;
        const tb = b.target_date ? new Date(b.target_date).getTime() : Infinity;
        cmp = ta - tb;
      } else {
        cmp =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [base, query, sortKey, sortDir]);

  const counts = {
    open: open.length,
    completed: completed.length,
    all: all.length,
  };

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedTabs value={tab} onChange={setTab} counts={counts} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek in beschrijving, gesprek, naam"
              className="pl-9"
            />
          </div>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="shrink-0"
          >
            <Plus className="h-3.5 w-3.5" data-icon="inline-start" />
            Nieuw actiepunt
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            tab={tab}
            hasQuery={!!query.trim()}
            onCreate={() => setCreateOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="w-10 px-4 py-3" />
                  <SortHeader
                    label="Beschrijving"
                    sortKey="description"
                    active={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="min-w-[200px]"
                  />
                  <SortHeader
                    label="Bron"
                    sortKey="source"
                    active={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="w-48"
                  />
                  <SortHeader
                    label="Status"
                    sortKey="status"
                    active={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="w-28"
                  />
                  <SortHeader
                    label="Streefdatum"
                    sortKey="target_date"
                    active={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="w-32"
                  />
                  <SortHeader
                    label="Aangemaakt"
                    sortKey="created_at"
                    active={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="w-32"
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((it) => (
                  <TableRow
                    key={it.id}
                    item={it}
                    onOpen={() => setSelected(it)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelected(null);
        }}
      >
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
          {selected && (
            <DetailModal
              key={selected.id}
              item={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <CreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  );
}

function SortHeader({
  label,
  sortKey,
  active,
  dir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const isActive = active === sortKey;
  return (
    <th
      className={cn(
        "px-4 py-3 text-left font-medium text-muted-foreground",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        {isActive ? (
          dir === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

function TableRow({ item, onOpen }: { item: DossierItem; onOpen: () => void }) {
  const [status, setStatus] = useState(item.status);
  const [isPending, startTransition] = useTransition();
  const completed = status === "completed";
  const expired = status === "expired";

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    const next = completed ? "open" : "completed";
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      try {
        await updateActionItemStatus({ id: item.id, status: next });
      } catch {
        setStatus(previous);
      }
    });
  }

  return (
    <tr
      onClick={onOpen}
      className="group cursor-pointer transition-colors hover:bg-accent/40"
    >
      {/* Checkbox */}
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label={completed ? "Markeer als open" : "Markeer als afgerond"}
          onClick={toggle}
          disabled={isPending || expired}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-md border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50",
            completed
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-border bg-background text-transparent hover:border-foreground/40",
          )}
        >
          <Check className="h-3 w-3" strokeWidth={2.5} />
        </button>
      </td>

      {/* Description */}
      <td className="px-4 py-3">
        <span
          className={cn(
            "font-medium leading-snug",
            completed && "text-muted-foreground",
            expired && "italic text-muted-foreground",
          )}
        >
          {item.description}
        </span>
      </td>

      {/* Source */}
      <td className="px-4 py-3">
        <SourceCell item={item} />
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={status} />
      </td>

      {/* Target date */}
      <td className="px-4 py-3 text-muted-foreground">
        {item.target_date ? (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
            {formatDate(item.target_date)}
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>

      {/* Created */}
      <td className="px-4 py-3 text-muted-foreground">
        {formatRelativeWeeks(item.created_at)}
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed")
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
        Afgerond
      </span>
    );
  if (status === "expired")
    return (
      <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        Vervallen
      </span>
    );
  return (
    <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
      Lopend
    </span>
  );
}

function SourceCell({ item }: { item: DossierItem }) {
  const { source } = item;
  if (!source) return <span className="text-muted-foreground/40">—</span>;
  const label =
    source.kind === "one_on_one"
      ? "1-op-1"
      : source.kind === "personal"
        ? "Persoonlijk"
        : source.label;
  const inner = (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground/75 transition-colors group-hover:bg-muted/80">
      {source.kind === "one_on_one" ? (
        <MessageSquareText className="h-3 w-3" strokeWidth={1.75} />
      ) : source.kind === "personal" ? (
        <User className="h-3 w-3" strokeWidth={1.75} />
      ) : (
        <Sparkles className="h-3 w-3" strokeWidth={1.75} />
      )}
      {label}
      {source.with ? ` · ${firstName(source.with.name)}` : ""}
    </span>
  );
  if (source.href)
    return (
      <Link
        href={source.href}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex"
      >
        {inner}
      </Link>
    );
  return inner;
}

function DetailModal({
  item,
  onClose,
}: {
  item: DossierItem;
  onClose: () => void;
}) {
  const isPersonal = item.source_type === "personal";
  const [status, setStatus] = useState(item.status);
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(item.description);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [targetDate, setTargetDate] = useState(item.target_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState({
    description: item.description,
    notes: item.notes,
    target_date: item.target_date,
  });

  const completed = status === "completed";
  const expired = status === "expired";

  function toggle() {
    const next = completed ? "open" : "completed";
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      try {
        await updateActionItemStatus({ id: item.id, status: next });
      } catch {
        setStatus(previous);
      }
    });
  }

  function startEdit() {
    setDescription(currentItem.description);
    setNotes(currentItem.notes ?? "");
    setTargetDate(currentItem.target_date ?? "");
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  function saveEdit() {
    const desc = description.trim();
    if (!desc) {
      setError("Geef je actiepunt een korte beschrijving.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await updateActionItemDetails({
          id: item.id,
          description: desc,
          notes: notes.trim() ? notes : null,
          targetDate: targetDate ? targetDate : null,
        });
        setCurrentItem({
          description: desc,
          notes: notes.trim() ? notes.trim() : null,
          target_date: targetDate ? targetDate : null,
        });
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Opslaan mislukt");
      }
    });
  }

  function remove() {
    if (!confirm("Dit actiepunt verwijderen?")) return;
    startTransition(async () => {
      try {
        await deleteActionItem(item.id);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Verwijderen mislukt");
      }
    });
  }

  const accentClass = completed
    ? "bg-emerald-500"
    : expired
      ? "bg-amber-400"
      : "bg-blue-500";

  const timeLabel = completed
    ? `Afgerond ${formatRelativeWeeks(item.completed_at)}`
    : expired
      ? "Vervallen"
      : `Open sinds ${formatRelativeWeeks(item.created_at)}`;

  const sourceKind = item.source?.kind;

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Status accent strip */}
      <div className={cn("h-1 w-full shrink-0", accentClass)} />

      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <div className="mb-2 flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-[11px] text-muted-foreground">{timeLabel}</span>
        </div>
        {editing ? (
          <div className="grid gap-2">
            <Label htmlFor="ai-edit-desc" className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Beschrijving
            </Label>
            <Input
              id="ai-edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
            />
          </div>
        ) : (
          <DialogTitle className="text-[17px] font-semibold leading-snug text-foreground">
            {currentItem.description}
          </DialogTitle>
        )}
      </div>

      <div className="mx-6 h-px bg-border/60" />

      {/* Omschrijving */}
      {editing ? (
        <div className="mx-6 mt-4 grid gap-2">
          <Label htmlFor="ai-edit-notes" className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Omschrijving
          </Label>
          <Textarea
            id="ai-edit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optionele context of subtaken."
          />
        </div>
      ) : currentItem.notes ? (
        <div className="mx-6 mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3.5 dark:border-amber-900/30 dark:bg-amber-950/20">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-700/70 dark:text-amber-400/70">
            <StickyNote className="h-3.5 w-3.5" strokeWidth={1.75} />
            Omschrijving
          </div>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80">
            {currentItem.notes}
          </p>
        </div>
      ) : null}

      {/* Info tiles */}
      <div className="px-6 py-4 grid grid-cols-2 gap-2">
        <InfoTile
          icon={<Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />}
          label="Aangemaakt"
        >
          {formatDate(item.created_at)}
        </InfoTile>

        {editing ? (
          <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/50 px-3.5 py-2.5">
            <Label
              htmlFor="ai-edit-target"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <Target className="h-3.5 w-3.5" strokeWidth={1.75} />
              Streefdatum
            </Label>
            <input
              id="ai-edit-target"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </div>
        ) : item.source ? (
          <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/50 px-3.5 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {sourceKind === "one_on_one" ? (
                <MessageSquareText className="h-3.5 w-3.5" strokeWidth={1.75} />
              ) : sourceKind === "personal" ? (
                <User className="h-3.5 w-3.5" strokeWidth={1.75} />
              ) : (
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
              Bron
            </div>
            {item.source.href ? (
              <Link
                href={item.source.href}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
              >
                <span className="truncate">
                  {item.source.kind === "one_on_one"
                    ? "1-op-1"
                    : item.source.label}
                  {item.source.with ? ` met ${item.source.with.name}` : ""}
                  {item.source.date ? ` · ${formatDate(item.source.date)}` : ""}
                </span>
                <ExternalLink
                  className="h-3 w-3 shrink-0 opacity-60"
                  strokeWidth={1.75}
                />
              </Link>
            ) : (
              <span className="text-[13px] font-medium text-foreground/80">
                {item.source.kind === "personal"
                  ? "Persoonlijk"
                  : item.source.label}
              </span>
            )}
          </div>
        ) : currentItem.target_date ? (
          <InfoTile
            icon={<Target className="h-3.5 w-3.5" strokeWidth={1.75} />}
            label="Streefdatum"
          >
            {formatDate(currentItem.target_date)}
          </InfoTile>
        ) : item.completed_at ? (
          <InfoTile
            icon={<CalendarCheck2 className="h-3.5 w-3.5" strokeWidth={1.75} />}
            label="Afgerond op"
          >
            {formatDate(item.completed_at)}
          </InfoTile>
        ) : null}

        {/* Persoonlijke streefdatum als losse tile naast bron-tile */}
        {!editing && isPersonal && currentItem.target_date ? (
          <InfoTile
            icon={<Target className="h-3.5 w-3.5" strokeWidth={1.75} />}
            label="Streefdatum"
          >
            {formatDate(currentItem.target_date)}
          </InfoTile>
        ) : null}
      </div>

      {error ? (
        <p className="px-6 pb-2 text-[12.5px] text-destructive">{error}</p>
      ) : null}

      {/* Action footer */}
      <div className="px-6 pb-5 pt-2 flex flex-wrap items-center justify-between gap-2">
        {editing ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelEdit}
              disabled={isPending}
            >
              <X className="h-3.5 w-3.5" data-icon="inline-start" />
              Annuleer
            </Button>
            <Button size="sm" onClick={saveEdit} disabled={isPending}>
              <Check className="h-3.5 w-3.5" data-icon="inline-start" />
              {isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </>
        ) : expired ? (
          <p className="w-full py-1 text-center text-[12px] italic text-muted-foreground">
            Dit actiepunt is vervallen en kan niet meer worden bijgewerkt.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {isPersonal ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startEdit}
                    disabled={isPending}
                  >
                    <Pencil className="h-3.5 w-3.5" data-icon="inline-start" />
                    Bewerken
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={remove}
                    disabled={isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" data-icon="inline-start" />
                    Verwijderen
                  </Button>
                </>
              ) : null}
            </div>
            <button
              type="button"
              onClick={toggle}
              disabled={isPending}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold shadow-sm transition-all disabled:opacity-60",
                completed
                  ? "bg-muted text-foreground hover:bg-muted/70"
                  : "bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600 dark:shadow-emerald-900/40",
                isPersonal ? "" : "w-full",
              )}
            >
              {completed ? (
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              )}
              {completed ? "Toch openstaand" : "Markeer als afgerond"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setDescription("");
    setNotes("");
    setTargetDate("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next && !isPending) reset();
    onOpenChange(next);
  }

  function submit() {
    const desc = description.trim();
    if (!desc) {
      setError("Geef je actiepunt een korte beschrijving.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await createPersonalActionItem({
          description: desc,
          notes: notes.trim() ? notes : null,
          targetDate: targetDate ? targetDate : null,
        });
        reset();
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Aanmaken mislukt");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuw actiepunt</DialogTitle>
          <DialogDescription>
            Iets dat je voor jezelf wil onthouden. Verschijnt alleen op je eigen
            lijst.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ai-new-desc">Beschrijving</Label>
            <Input
              id="ai-new-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bijvoorbeeld: voorbereiding overleg vrijdag"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ai-new-notes">Omschrijving (optioneel)</Label>
            <Textarea
              id="ai-new-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Extra context of subtaken."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ai-new-date">Streefdatum (optioneel)</Label>
            <input
              id="ai-new-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </div>
        <DialogFooter>
          <DialogClose
            disabled={isPending}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Annuleer
          </DialogClose>
          <Button size="sm" onClick={submit} disabled={isPending}>
            {isPending ? "Aanmaken..." : "Aanmaken"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoTile({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/50 px-3.5 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-[13px] font-medium text-foreground/85">
        {children}
      </div>
    </div>
  );
}

function SegmentedTabs({
  value,
  onChange,
  counts,
}: {
  value: TabKey;
  onChange: (v: TabKey) => void;
  counts: { open: number; completed: number; all: number };
}) {
  const options: { key: TabKey; label: string; count: number }[] = [
    { key: "open", label: "Lopend", count: counts.open },
    { key: "completed", label: "Afgerond", count: counts.completed },
    { key: "all", label: "Alles", count: counts.all },
  ];
  return (
    <div className="inline-flex items-center rounded-xl border border-border bg-card p-1 shadow-sm">
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-primary/8 text-primary"
                : "text-foreground/65 hover:text-foreground",
            )}
            aria-pressed={active}
          >
            {opt.label}
            <span
              className={cn(
                "inline-flex h-5 min-w-[20px] items-center justify-center rounded-md px-1.5 text-[11px] font-semibold tabular-nums",
                active
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {opt.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({
  tab,
  hasQuery,
  onCreate,
}: {
  tab: TabKey;
  hasQuery: boolean;
  onCreate: () => void;
}) {
  if (hasQuery)
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Niks gevonden. Probeer een ander woord.
        </p>
      </div>
    );
  const message =
    tab === "open"
      ? "Geen openstaande actiepunten. Niks om je druk over te maken."
      : tab === "completed"
        ? "Nog niks afgerond in de afgelopen 12 maanden."
        : "Je actiepunten zijn nog leeg. Maak er eentje voor jezelf, of wacht tot je eerste 1-op-1.";
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" onClick={onCreate}>
        <Plus className="h-3.5 w-3.5" data-icon="inline-start" />
        Nieuw actiepunt
      </Button>
    </div>
  );
}

function sourceLabel(item: DossierItem): string {
  if (!item.source) return "";
  if (item.source.kind === "one_on_one") {
    return `1-op-1${item.source.with ? ` met ${item.source.with.name}` : ""}`;
  }
  if (item.source.kind === "personal") return "Persoonlijk";
  return item.source.label ?? "";
}

function firstName(full: string): string {
  return full.split(" ")[0] ?? full;
}
