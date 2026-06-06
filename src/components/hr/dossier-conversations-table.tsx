"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  MessageSquareText,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { InlineTabs } from "@/components/team/inline-tabs";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  DossierEvaluation,
  DossierOneOnOne,
  DossierPerformanceReview,
  TemplateInfo,
} from "@/lib/hr/offboarding-queries";

type ConversationKind = "one_on_one" | "performance_review" | "evaluation";
type FilterKey = "all" | ConversationKind;
type SortKey = "date" | "kind" | "subject";
type SortDir = "asc" | "desc";

type Section = { heading: string; fields: Field[] };
type Field = { label: string; value: string | string[] | null | undefined };

type ConversationRow = {
  id: string;
  kind: ConversationKind;
  subject: string;
  date: string | null;
  counterpart: string | null;
  badge: string | null;
  searchHaystack: string;
  sharedSummary: string | null;
  sections: Section[];
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Concept",
  scheduled: "Ingepland",
  collecting_input: "Input ophalen",
  ready_for_meeting: "Klaar voor gesprek",
  completed: "Afgerond",
  cancelled: "Geannuleerd",
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "one_on_one", label: "1-op-1" },
  { key: "performance_review", label: "Functionering" },
  { key: "evaluation", label: "Beoordeling" },
];

function buildAnswerFields(
  template: TemplateInfo | null,
  answers: Record<string, string | string[]>,
): Field[] {
  if (!template) {
    return Object.entries(answers).map(([id, value]) => ({
      label: id,
      value,
    }));
  }
  return template.questions.map((q) => ({
    label: q.label,
    value: answers[q.id] ?? null,
  }));
}

export function DossierConversationsTable({
  oneOnOnes,
  performanceReviews,
  evaluations,
}: {
  oneOnOnes: DossierOneOnOne[];
  performanceReviews: DossierPerformanceReview[];
  evaluations: DossierEvaluation[];
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows: ConversationRow[] = useMemo(() => {
    const oneOnOneRows: ConversationRow[] = oneOnOnes.map((o) => {
      const date = o.completed_at ?? o.scheduled_at;
      return {
        id: `one_on_one:${o.id}`,
        kind: "one_on_one",
        subject: o.subject || "1-op-1",
        date,
        counterpart: o.counterpart
          ? `${o.counterpart_role === "manager" ? "Met" : "Voor"} ${o.counterpart.name}`
          : null,
        badge: o.completed_at ? null : "Niet afgerond",
        searchHaystack: [o.subject, o.shared_summary].filter(Boolean).join(" "),
        sharedSummary: o.shared_summary,
        sections: [
          {
            heading: "Voorbereiding medewerker",
            fields: buildAnswerFields(o.template, o.employee_preparation),
          },
        ],
      };
    });

    const reviewRows: ConversationRow[] = performanceReviews.map((r) => ({
      id: `performance_review:${r.id}`,
      kind: "performance_review",
      subject: r.template?.name ?? "Functioneringsgesprek",
      date: r.completed_at ?? r.cycle_started_at,
      counterpart: r.counterpart ? `Met ${r.counterpart.name}` : null,
      badge: STATUS_LABEL[r.status] ?? r.status,
      searchHaystack: r.template?.name ?? "Functioneringsgesprek",
      sharedSummary: r.shared_summary,
      sections: [
        {
          heading: "Zelfevaluatie medewerker",
          fields: buildAnswerFields(r.template, r.employee_self_evaluation),
        },
      ],
    }));

    const evaluationRows: ConversationRow[] = evaluations.map((e) => {
      const date = e.completed_at ?? e.scheduled_at;
      const assessmentFields: Field[] = Object.entries(
        e.manager_assessments,
      ).map(([key, value]) => {
        if (typeof value === "string") return { label: key, value };
        const rating = value?.rating ?? "";
        const notes = value?.notes ?? "";
        const combined = [rating, notes].filter(Boolean).join(" · ");
        return { label: key, value: combined };
      });
      return {
        id: `evaluation:${e.id}`,
        kind: "evaluation",
        subject: e.template?.name ?? "Beoordelingsgesprek",
        date,
        counterpart: e.counterpart ? `Met ${e.counterpart.name}` : null,
        badge: e.completed_at ? null : "Niet afgerond",
        searchHaystack: e.template?.name ?? "Beoordelingsgesprek",
        sharedSummary: e.shared_summary,
        sections: [
          {
            heading: "Zelfreflectie medewerker",
            fields: buildAnswerFields(e.template, e.employee_self_reflection),
          },
          {
            heading: "Beoordeling per punt",
            fields: assessmentFields,
          },
        ],
      };
    });

    return [...oneOnOneRows, ...reviewRows, ...evaluationRows];
  }, [oneOnOnes, performanceReviews, evaluations]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: rows.length,
      one_on_one: 0,
      performance_review: 0,
      evaluation: 0,
    };
    for (const r of rows) c[r.kind] += 1;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base =
      filter === "all" ? rows : rows.filter((r) => r.kind === filter);
    const searched = q
      ? base.filter((r) => r.searchHaystack.toLowerCase().includes(q))
      : base;

    return [...searched].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") {
        const ta = a.date ? new Date(a.date).getTime() : 0;
        const tb = b.date ? new Date(b.date).getTime() : 0;
        cmp = ta - tb;
      } else if (sortKey === "kind") {
        cmp = a.kind.localeCompare(b.kind, "nl");
      } else {
        cmp = a.subject.localeCompare(b.subject, "nl");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, filter, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  }

  const tabOptions = FILTERS.map((f) => ({
    key: f.key,
    label: f.label,
    count: counts[f.key],
  }));

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <InlineTabs<FilterKey>
          value={filter}
          onChange={setFilter}
          options={tabOptions}
        />
        <div className="relative w-full pb-2 sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek in onderwerp of samenvatting"
            className="h-8 pl-9 text-[13px]"
          />
        </div>
      </div>

      <div className="min-h-[260px] rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {query.trim()
                ? "Niks gevonden. Probeer een ander woord."
                : "Geen gesprekken in deze categorie."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="w-8 px-2 py-3" aria-hidden />
                  <SortHeader
                    label="Datum"
                    sortKey="date"
                    active={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="w-32"
                  />
                  <SortHeader
                    label="Type"
                    sortKey="kind"
                    active={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="w-40"
                  />
                  <SortHeader
                    label="Onderwerp"
                    sortKey="subject"
                    active={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="min-w-[200px]"
                  />
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                    Met
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((row) => (
                  <ConversationRowView
                    key={row.id}
                    row={row}
                    open={openId === row.id}
                    onToggle={() =>
                      setOpenId((v) => (v === row.id ? null : row.id))
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationRowView({
  row,
  open,
  onToggle,
}: {
  row: ConversationRow;
  open: boolean;
  onToggle: () => void;
}) {
  const hasContent =
    Boolean(row.sharedSummary) ||
    row.sections.some((s) => s.fields.some((f) => hasValue(f.value)));

  return (
    <>
      <tr
        className={cn(
          "group transition-colors",
          hasContent
            ? "cursor-pointer hover:bg-accent/40"
            : "cursor-default opacity-80",
          open && "bg-accent/30",
        )}
        onClick={() => {
          if (hasContent) onToggle();
        }}
      >
        <td className="px-2 py-3 align-middle">
          {hasContent ? (
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                open && "rotate-90",
              )}
              strokeWidth={2}
            />
          ) : (
            <span className="block h-3.5 w-3.5" aria-hidden />
          )}
        </td>
        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
          {row.date ? formatDate(row.date) : "—"}
        </td>
        <td className="px-4 py-3">
          <KindBadge kind={row.kind} />
        </td>
        <td className="px-4 py-3">
          <span className="font-medium leading-snug">{row.subject}</span>
        </td>
        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
          {row.counterpart ?? "—"}
        </td>
        <td className="px-4 py-3 text-right text-muted-foreground">
          {row.badge ?? "—"}
        </td>
      </tr>
      {open && hasContent ? (
        <tr className="bg-muted/30">
          <td className="px-2 py-0" aria-hidden />
          <td colSpan={5} className="px-4 py-4">
            <ExpandedDetails row={row} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function ExpandedDetails({ row }: { row: ConversationRow }) {
  return (
    <div className="space-y-4">
      {row.sharedSummary ? (
        <FieldBlock heading="Gedeelde samenvatting" value={row.sharedSummary} />
      ) : null}
      {row.sections.map((section) => {
        const populated = section.fields.filter((f) => hasValue(f.value));
        if (!populated.length) return null;
        return (
          <div key={section.heading} className="space-y-2.5">
            <p className="text-[12.5px] font-medium font-heading text-muted-foreground">
              {section.heading}
            </p>
            <div className="space-y-2">
              {populated.map((f) => (
                <FieldBlock key={f.label} heading={f.label} value={f.value} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
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

function hasValue(v: string | string[] | null | undefined): boolean {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  return v.trim().length > 0;
}

function KindBadge({ kind }: { kind: ConversationKind }) {
  if (kind === "one_on_one") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
        <MessageSquareText className="h-3 w-3" strokeWidth={1.75} />
        1-op-1
      </span>
    );
  }
  if (kind === "performance_review") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        <ClipboardCheck className="h-3 w-3" strokeWidth={1.75} />
        Functionering
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
      <ClipboardCheck className="h-3 w-3" strokeWidth={1.75} />
      Beoordeling
    </span>
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
