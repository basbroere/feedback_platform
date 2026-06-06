"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ExpandableField = {
  label: string;
  value: string | string[] | null | undefined;
};

export type ExpandableActionItem = {
  id: string;
  description: string;
  status: "open" | "completed" | "expired";
  target_date: string | null;
  completed_at: string | null;
};

export function DossierExpandable({
  title,
  meta,
  badge,
  badgeTone = "muted",
  sharedSummary,
  sections,
  relatedActionItems,
  defaultOpen = false,
}: {
  title: string;
  meta: (string | null)[];
  badge?: string;
  badgeTone?: "emerald" | "amber" | "muted";
  sharedSummary: string | null;
  sections?: Array<{
    heading: string;
    fields: ExpandableField[];
  }>;
  relatedActionItems?: ExpandableActionItem[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const cleanedMeta = meta.filter((m): m is string => Boolean(m));

  const hasContent =
    (sections?.some((s) => s.fields.some((f) => hasValue(f.value))) ?? false) ||
    (relatedActionItems && relatedActionItems.length > 0) ||
    Boolean(sharedSummary);

  const badgeClass =
    badgeTone === "emerald"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
      : badgeTone === "amber"
        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
        : "bg-slate-100 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300";

  return (
    <Card className="p-0">
      <button
        type="button"
        onClick={() => hasContent && setOpen((v) => !v)}
        disabled={!hasContent}
        className={cn(
          "flex w-full items-start justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors",
          hasContent
            ? "cursor-pointer hover:bg-muted/30"
            : "cursor-default",
        )}
        aria-expanded={open}
      >
        <div className="min-w-0 space-y-1">
          <p className="text-[14px] font-semibold text-foreground">{title}</p>
          {cleanedMeta.length ? (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-muted-foreground">
              <CalendarDays className="h-3 w-3" strokeWidth={1.75} />
              {cleanedMeta.join(" · ")}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {badge ? (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium font-heading ${badgeClass}`}
            >
              {badge}
            </span>
          ) : null}
          {hasContent ? (
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
              strokeWidth={1.75}
            />
          ) : null}
        </div>
      </button>

      {open && hasContent ? (
        <div className="space-y-4 border-t border-border/60 px-4 py-4">
          {sharedSummary ? (
            <FieldBlock
              heading="Gedeelde samenvatting"
              value={sharedSummary}
            />
          ) : null}

          {sections?.map((section) => {
            const populated = section.fields.filter((f) => hasValue(f.value));
            if (!populated.length) return null;
            return (
              <div key={section.heading} className="space-y-2.5">
                <p className="text-[12.5px] font-medium font-heading text-muted-foreground">
                  {section.heading}
                </p>
                <div className="space-y-2">
                  {populated.map((f) => (
                    <FieldBlock
                      key={f.label}
                      heading={f.label}
                      value={f.value}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {relatedActionItems && relatedActionItems.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[12.5px] font-medium font-heading text-muted-foreground">
                Actiepunten uit dit gesprek
              </p>
              <ul className="space-y-1">
                {relatedActionItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-border/50 bg-card/30 px-3 py-2 text-[13px] text-foreground/90"
                  >
                    <span className="font-medium">{item.description}</span>
                    <span className="ml-2 text-[11.5px] text-muted-foreground">
                      {item.status === "completed"
                        ? "Afgerond"
                        : item.status === "expired"
                          ? "Vervallen"
                          : "Open"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function hasValue(v: string | string[] | null | undefined): boolean {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  return v.trim().length > 0;
}

function FieldBlock({
  heading,
  value,
}: {
  heading: string;
  value: string | string[] | null | undefined;
}) {
  if (!hasValue(value)) return null;
  const display = Array.isArray(value) ? value.join(", ") : (value as string);
  return (
    <div className="space-y-1">
      <p className="text-[12px] font-medium text-foreground/80">{heading}</p>
      <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground/90">
        {display}
      </p>
    </div>
  );
}
