"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowUpRight,
  Calendar,
  Check,
  MessageSquareText,
  Search,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { updateActionItemStatus } from "@/lib/action-items/actions";
import type { DossierItem } from "@/lib/action-items/queries";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatRelativeWeeks } from "@/lib/format";
import { cn } from "@/lib/utils";

type TabKey = "open" | "completed" | "all";

export function DossierView({
  open,
  completed,
}: {
  open: DossierItem[];
  completed: DossierItem[];
}) {
  const [tab, setTab] = useState<TabKey>("open");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DossierItem | null>(null);

  const all = useMemo(
    () =>
      [...open, ...completed].sort(
        (a, b) =>
          new Date(b.completed_at ?? b.created_at).getTime() -
          new Date(a.completed_at ?? a.created_at).getTime(),
      ),
    [open, completed],
  );

  const base = tab === "open" ? open : tab === "completed" ? completed : all;
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (it) =>
        it.description.toLowerCase().includes(q) ||
        (it.source?.label?.toLowerCase().includes(q) ?? false) ||
        (it.source?.with?.name?.toLowerCase().includes(q) ?? false),
    );
  }, [base, query]);

  const counts = {
    open: open.length,
    completed: completed.length,
    all: all.length,
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="mt-5 rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {items.length === 0 ? (
          <EmptyState tab={tab} hasQuery={!!query.trim()} />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((it) => (
              <Row
                key={it.id}
                item={it}
                onOpen={() => setSelected(it)}
              />
            ))}
          </ul>
        )}
      </div>

      <DetailDialog item={selected} onClose={() => setSelected(null)} />
    </>
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
    <div className="inline-flex items-center rounded-xl border border-border bg-card p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
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

function Row({
  item,
  onOpen,
}: {
  item: DossierItem;
  onOpen: () => void;
}) {
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

  const datestamp = completed && item.completed_at ? item.completed_at : item.created_at;
  const datelabel = completed
    ? `Afgerond ${formatRelativeWeeks(item.completed_at)}`
    : `Open sinds ${formatRelativeWeeks(item.created_at)}`;

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/40 focus-visible:bg-accent/60 outline-none"
      >
        <button
          type="button"
          aria-label={completed ? "Markeer als open" : "Markeer als afgerond"}
          onClick={toggle}
          disabled={isPending}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
            completed
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-border bg-background text-transparent hover:border-foreground/30",
          )}
        >
          <Check className="h-3 w-3" strokeWidth={2.5} />
        </button>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p
            className={cn(
              "text-[14px] leading-snug",
              completed && "text-muted-foreground line-through",
              expired && "italic text-muted-foreground",
            )}
          >
            {item.description}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground">
            <SourcePill item={item} />
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" strokeWidth={1.75} />
              {datelabel}
            </span>
            {item.target_date ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-muted-foreground/60">Streefdatum</span>
                <span className="text-foreground/80">
                  {formatDate(item.target_date)}
                </span>
              </span>
            ) : null}
          </div>
        </div>

        <ArrowUpRight
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground/70"
          strokeWidth={1.75}
        />
        <span className="sr-only">{datestamp}</span>
      </button>
    </li>
  );
}

function SourcePill({ item }: { item: DossierItem }) {
  if (!item.source) return null;
  const { source } = item;
  const Icon = source.kind === "one_on_one" ? MessageSquareText : Sparkles;

  const inner = (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground/75 transition-colors group-hover:bg-muted/80">
      <Icon className="h-3 w-3" strokeWidth={1.75} />
      <span>
        {source.kind === "one_on_one" ? "1-op-1" : source.label}
        {source.with ? ` met ${firstName(source.with.name)}` : ""}
        {source.date ? ` · ${formatDate(source.date)}` : ""}
      </span>
    </span>
  );

  if (source.href) {
    return (
      <Link
        href={source.href}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

function EmptyState({ tab, hasQuery }: { tab: TabKey; hasQuery: boolean }) {
  if (hasQuery) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Niks gevonden. Probeer een ander woord.
        </p>
      </div>
    );
  }
  const message =
    tab === "open"
      ? "Geen openstaande actiepunten. Niks om je druk over te maken."
      : tab === "completed"
      ? "Nog niks afgerond in de afgelopen 12 maanden."
      : "Je dossier is nog leeg. Na je eerste 1-op-1 vult dit zich vanzelf.";
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function DetailDialog({
  item,
  onClose,
}: {
  item: DossierItem | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-[17px] leading-snug">
            {item?.description ?? ""}
          </DialogTitle>
          {item ? (
            <DialogDescription>
              {item.status === "completed"
                ? `Afgerond ${formatRelativeWeeks(item.completed_at)}`
                : item.status === "expired"
                ? "Vervallen"
                : `Open sinds ${formatRelativeWeeks(item.created_at)}`}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {item ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-[120px_1fr] items-start gap-x-4 gap-y-2.5 text-[13px]">
              {item.source ? (
                <>
                  <span className="text-muted-foreground">Bron</span>
                  <div>
                    {item.source.href ? (
                      <Link
                        href={item.source.href}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <MessageSquareText
                          className="h-3.5 w-3.5"
                          strokeWidth={1.75}
                        />
                        {item.source.kind === "one_on_one"
                          ? "1-op-1"
                          : item.source.label}
                        {item.source.with
                          ? ` met ${item.source.with.name}`
                          : ""}
                        {item.source.date
                          ? ` · ${formatDate(item.source.date)}`
                          : ""}
                      </Link>
                    ) : (
                      <span className="text-foreground/80">
                        {item.source.label}
                      </span>
                    )}
                  </div>
                </>
              ) : null}

              <span className="text-muted-foreground">Aangemaakt</span>
              <span className="text-foreground/85">
                {formatDate(item.created_at)}
              </span>

              {item.target_date ? (
                <>
                  <span className="text-muted-foreground">Streefdatum</span>
                  <span className="text-foreground/85">
                    {formatDate(item.target_date)}
                  </span>
                </>
              ) : null}

              {item.completed_at ? (
                <>
                  <span className="text-muted-foreground">Afgerond op</span>
                  <span className="text-foreground/85">
                    {formatDate(item.completed_at)}
                  </span>
                </>
              ) : null}
            </div>

            {item.notes ? (
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                <div className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                  <StickyNote className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Notities
                </div>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/85">
                  {item.notes}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function firstName(full: string): string {
  return full.split(" ")[0] ?? full;
}
