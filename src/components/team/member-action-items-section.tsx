"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  MessageSquareText,
  Sparkles,
  User,
} from "lucide-react";
import { updateActionItemStatus } from "@/lib/action-items/actions";
import type { DossierItem } from "@/lib/action-items/queries";
import { InlineTabs } from "./inline-tabs";
import { formatDate, formatRelativeWeeks } from "@/lib/format";
import { cn } from "@/lib/utils";

type TabKey = "open" | "completed";

const INITIAL_VISIBLE = 8;
const STEP = 8;

export function MemberActionItemsSection({
  open,
  completed,
  hideTabs = false,
}: {
  open: DossierItem[];
  completed: DossierItem[];
  hideTabs?: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("open");
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const base = tab === "open" ? open : completed;
  const slice = useMemo(() => base.slice(0, visible), [base, visible]);
  const remaining = base.length - visible;

  function changeTab(next: TabKey) {
    setTab(next);
    setVisible(INITIAL_VISIBLE);
  }

  const tabOptions: { key: TabKey; label: string; count: number }[] = [
    { key: "open", label: "Lopend", count: open.length },
    { key: "completed", label: "Afgerond", count: completed.length },
  ];

  return (
    <div className="space-y-3">
      {hideTabs ? null : (
        <div className="border-b border-border/60">
          <InlineTabs<TabKey>
            value={tab}
            onChange={changeTab}
            options={tabOptions}
            size="sm"
          />
        </div>
      )}

      {slice.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {tab === "open"
              ? "Geen openstaande actiepunten."
              : "Nog niks afgerond."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {slice.map((item) => (
            <ActionRow key={item.id} item={item} />
          ))}
        </ul>
      )}

      {remaining > 0 ? (
        <button
          type="button"
          onClick={() => setVisible((v) => v + STEP)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground/75 transition-colors hover:bg-accent/50"
        >
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
          Toon nog {Math.min(STEP, remaining)}
          <span className="text-muted-foreground">
            · {remaining} resterend
          </span>
        </button>
      ) : null}
    </div>
  );
}

function ActionRow({ item }: { item: DossierItem }) {
  const [status, setStatus] = useState(item.status);
  const [isPending, startTransition] = useTransition();
  const completed = status === "completed";
  const expired = status === "expired";

  function toggle() {
    if (expired) return;
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
    <li
      className={cn(
        "rounded-xl border border-border/60 bg-card p-3 shadow-sm transition-colors hover:bg-accent/30",
        (completed || expired) && "opacity-75",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label={completed ? "Markeer als open" : "Markeer als afgerond"}
          onClick={toggle}
          disabled={isPending || expired}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50",
            completed
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-border bg-background text-transparent hover:border-foreground/40",
          )}
        >
          <Check className="h-3 w-3" strokeWidth={2.5} />
        </button>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p
            className={cn(
              "text-[13.5px] font-medium leading-snug",
              completed && "line-through text-muted-foreground",
              expired && "italic text-muted-foreground",
            )}
          >
            {item.description}
          </p>

          {item.notes ? (
            <p className="line-clamp-2 whitespace-pre-wrap text-[12px] leading-snug text-muted-foreground">
              {item.notes}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <SourceChip item={item} />
            {item.target_date ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" strokeWidth={1.75} />
                {formatDate(item.target_date)}
              </span>
            ) : (
              <span className="text-muted-foreground/50">
                {completed && item.completed_at
                  ? `Afgerond ${formatRelativeWeeks(item.completed_at)}`
                  : formatRelativeWeeks(item.created_at)}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function SourceChip({ item }: { item: DossierItem }) {
  const { source } = item;
  if (!source) return null;
  const label =
    source.kind === "one_on_one"
      ? source.with
        ? `1-op-1 · ${firstName(source.with.name)}`
        : "1-op-1"
      : source.kind === "personal"
        ? "Persoonlijk"
        : source.label;
  const Icon =
    source.kind === "one_on_one"
      ? MessageSquareText
      : source.kind === "personal"
        ? User
        : Sparkles;
  const inner = (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground/75">
      <Icon className="h-3 w-3" strokeWidth={1.75} />
      {label}
      {source.href ? (
        <ChevronRight
          className="h-3 w-3 opacity-50 transition-transform group-hover:translate-x-0.5"
          strokeWidth={1.75}
        />
      ) : null}
    </span>
  );
  if (source.href) {
    return (
      <Link
        href={source.href}
        onClick={(e) => e.stopPropagation()}
        className="group inline-flex"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

function firstName(full: string): string {
  return full.split(" ")[0] ?? full;
}
