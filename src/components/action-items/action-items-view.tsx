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
  RotateCcw,
  Search,
  Sparkles,
  StickyNote,
  Target,
} from "lucide-react";
import { updateActionItemStatus } from "@/lib/action-items/actions";
import type { DossierItem } from "@/lib/action-items/queries";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatRelativeWeeks } from "@/lib/format";
import { cn } from "@/lib/utils";

type TabKey = "open" | "completed" | "all";
type SortKey = "description" | "source" | "status" | "target_date" | "created_at";
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

  const all = useMemo(
    () => [...open, ...completed],
    [open, completed],
  );

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
        cmp = (order[a.status as keyof typeof order] ?? 0) - (order[b.status as keyof typeof order] ?? 0);
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

  const counts = { open: open.length, completed: completed.length, all: all.length };

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
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek in beschrijving, gesprek, naam"
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <EmptyState tab={tab} hasQuery={!!query.trim()} />
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
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
          {selected && (
            <DetailModal item={selected} onClose={() => setSelected(null)} />
          )}
        </DialogContent>
      </Dialog>
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
    <th className={cn("px-4 py-3 text-left font-medium text-muted-foreground", className)}>
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
  const Icon = source.kind === "one_on_one" ? MessageSquareText : Sparkles;
  const inner = (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground/75 transition-colors group-hover:bg-muted/80">
      <Icon className="h-3 w-3" strokeWidth={1.75} />
      {source.kind === "one_on_one" ? "1-op-1" : source.label}
      {source.with ? ` · ${firstName(source.with.name)}` : ""}
    </span>
  );
  if (source.href)
    return (
      <Link href={source.href} onClick={(e) => e.stopPropagation()} className="inline-flex">
        {inner}
      </Link>
    );
  return inner;
}

function DetailModal({ item, onClose }: { item: DossierItem; onClose: () => void }) {
  const [status, setStatus] = useState(item.status);
  const [isPending, startTransition] = useTransition();
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

  const SourceIcon = item.source?.kind === "one_on_one" ? MessageSquareText : Sparkles;

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
        <DialogTitle className="text-[17px] font-semibold leading-snug text-foreground">
          {item.description}
        </DialogTitle>
      </div>

      <div className="mx-6 h-px bg-border/60" />

      {/* Omschrijving */}
      {item.notes && (
        <div className="mx-6 mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3.5 dark:border-amber-900/30 dark:bg-amber-950/20">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-700/70 dark:text-amber-400/70">
            <StickyNote className="h-3.5 w-3.5" strokeWidth={1.75} />
            Omschrijving
          </div>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80">
            {item.notes}
          </p>
        </div>
      )}

      {/* Info tiles */}
      <div className="px-6 py-4 grid grid-cols-2 gap-2">
        <InfoTile icon={<Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />} label="Aangemaakt">
          {formatDate(item.created_at)}
        </InfoTile>

        {item.source ? (
          <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/50 px-3.5 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <SourceIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
              Bron
            </div>
            {item.source.href ? (
              <Link
                href={item.source.href}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
              >
                <span className="truncate">
                  {item.source.kind === "one_on_one" ? "1-op-1" : item.source.label}
                  {item.source.with ? ` met ${item.source.with.name}` : ""}
                  {item.source.date ? ` · ${formatDate(item.source.date)}` : ""}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-60" strokeWidth={1.75} />
              </Link>
            ) : (
              <span className="text-[13px] font-medium text-foreground/80">{item.source.label}</span>
            )}
          </div>
        ) : item.target_date ? (
          <InfoTile icon={<Target className="h-3.5 w-3.5" strokeWidth={1.75} />} label="Streefdatum">
            {formatDate(item.target_date)}
          </InfoTile>
        ) : item.completed_at ? (
          <InfoTile icon={<CalendarCheck2 className="h-3.5 w-3.5" strokeWidth={1.75} />} label="Afgerond op">
            {formatDate(item.completed_at)}
          </InfoTile>
        ) : null}
      </div>

      {/* Action footer */}
      <div className="px-6 pb-5 pt-4">
        {expired ? (
          <p className="py-1 text-center text-[12px] italic text-muted-foreground">
            Dit actiepunt is vervallen en kan niet meer worden bijgewerkt.
          </p>
        ) : (
          <button
            type="button"
            onClick={toggle}
            disabled={isPending}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold shadow-sm transition-all disabled:opacity-60",
              completed
                ? "bg-muted text-foreground hover:bg-muted/70"
                : "bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600 dark:shadow-emerald-900/40",
            )}
          >
            {completed ? (
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : (
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            )}
            {completed ? "Toch openstaand" : "Markeer als afgerond"}
          </button>
        )}
      </div>
    </div>
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
      <div className="text-[13px] font-medium text-foreground/85">{children}</div>
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

function EmptyState({ tab, hasQuery }: { tab: TabKey; hasQuery: boolean }) {
  if (hasQuery)
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">Niks gevonden. Probeer een ander woord.</p>
      </div>
    );
  const message =
    tab === "open"
      ? "Geen openstaande actiepunten. Niks om je druk over te maken."
      : tab === "completed"
      ? "Nog niks afgerond in de afgelopen 12 maanden."
      : "Je actiepunten zijn nog leeg. Na je eerste 1-op-1 vult dit zich vanzelf.";
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function sourceLabel(item: DossierItem): string {
  if (!item.source) return "";
  return item.source.kind === "one_on_one"
    ? `1-op-1${item.source.with ? ` met ${item.source.with.name}` : ""}`
    : (item.source.label ?? "");
}

function firstName(full: string): string {
  return full.split(" ")[0] ?? full;
}
