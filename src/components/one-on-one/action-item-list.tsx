"use client";

import { useState, useTransition } from "react";
import { Check, Circle } from "lucide-react";
import { updateActionItemStatus } from "@/lib/action-items/actions";
import type { ActionItem } from "@/lib/one-on-ones/types";
import { cn } from "@/lib/utils";
import { PersonAvatar } from "./person-avatar";

type Status = "open" | "completed" | "expired";

export function ActionItemList({
  items,
  emptyLabel = "Geen openstaande actiepunten.",
  readOnly = false,
  showOwner = true,
}: {
  items: ActionItem[];
  emptyLabel?: string;
  readOnly?: boolean;
  showOwner?: boolean;
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
      {items.map((item) => (
        <ActionItemRow
          key={item.id}
          item={item}
          readOnly={readOnly}
          showOwner={showOwner}
        />
      ))}
    </ul>
  );
}

function ActionItemRow({
  item,
  readOnly,
  showOwner,
}: {
  item: ActionItem;
  readOnly: boolean;
  showOwner: boolean;
}) {
  const [status, setStatus] = useState<Status>(item.status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setNext(next: Status) {
    const previous = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      try {
        await updateActionItemStatus({ id: item.id, status: next });
      } catch (e) {
        setStatus(previous);
        setError(e instanceof Error ? e.message : "Mislukt");
      }
    });
  }

  const completed = status === "completed";
  const expired = status === "expired";

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl bg-card px-4 py-3 shadow-sm",
        (completed || expired) && "opacity-70",
      )}
    >
      {!readOnly ? (
        <button
          type="button"
          aria-label={completed ? "Markeer als open" : "Markeer als afgerond"}
          onClick={() => setNext(completed ? "open" : "completed")}
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
      ) : (
        <span
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
            completed
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-border bg-background text-transparent",
          )}
        >
          {completed ? <Check className="h-3 w-3" strokeWidth={2.5} /> : <Circle className="h-3 w-3" />}
        </span>
      )}

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
        {showOwner && item.owner ? (
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <PersonAvatar
              id={item.owner.id}
              name={item.owner.name}
              avatarUrl={item.owner.avatar_url}
              size="sm"
            />
            <span>{item.owner.name}</span>
          </div>
        ) : null}
        {error ? (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        ) : null}
      </div>
    </li>
  );
}
