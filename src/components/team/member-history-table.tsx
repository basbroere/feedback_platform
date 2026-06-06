"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  MessageSquareText,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { InlineTabs } from "./inline-tabs";
import { formatDate } from "@/lib/format";
import type { OneOnOneListItem } from "@/lib/one-on-ones/types";
import type { PerformanceReviewListItem } from "@/lib/performance-reviews/types";
import { cn } from "@/lib/utils";

type ConversationKind =
  | "one_on_one"
  | "performance_review"
  | "evaluation"; // toekomstig

type FilterKey = "all" | ConversationKind;
type SortKey = "date" | "kind" | "subject";
type SortDir = "asc" | "desc";

type ConversationRow = {
  id: string;
  kind: ConversationKind;
  subject: string;
  templateName: string | null;
  date: string | null;
  searchHaystack: string;
  href: string;
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "one_on_one", label: "1-op-1" },
  { key: "performance_review", label: "Functionering" },
];

export function MemberHistoryTable({
  oneOnOnes,
  performanceReviews,
}: {
  oneOnOnes: OneOnOneListItem[];
  performanceReviews: PerformanceReviewListItem[];
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows: ConversationRow[] = useMemo(() => {
    const oneOnOneRows: ConversationRow[] = oneOnOnes.map((o) => ({
      id: o.id,
      kind: "one_on_one",
      subject: o.subject || "1-op-1",
      templateName: null,
      date: o.completed_at ?? o.scheduled_at,
      searchHaystack: [o.subject, o.shared_summary].filter(Boolean).join(" "),
      href: `/een-op-een/${o.id}`,
    }));

    const reviewRows: ConversationRow[] = performanceReviews.map((r) => {
      const date =
        r.completed_at ?? r.scheduled_at ?? r.cycle_started_at ?? null;
      return {
        id: r.id,
        kind: "performance_review",
        subject: r.template_name ?? "Functioneringsgesprek",
        templateName: r.template_name,
        date,
        searchHaystack: r.template_name ?? "Functioneringsgesprek",
        href: `/functioneringsgesprek/${r.id}`,
      };
    });

    return [...oneOnOneRows, ...reviewRows];
  }, [oneOnOnes, performanceReviews]);

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
                : "Nog geen gesprekken in deze categorie."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
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
                    className="w-44"
                  />
                  <SortHeader
                    label="Onderwerp"
                    sortKey="subject"
                    active={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="min-w-[200px]"
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((row) => (
                  <ConversationRowView
                    key={`${row.kind}-${row.id}`}
                    row={row}
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

function ConversationRowView({ row }: { row: ConversationRow }) {
  return (
    <tr className="group cursor-pointer transition-colors hover:bg-accent/40">
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
        <Link href={row.href} className="block">
          {row.date ? formatDate(row.date) : "—"}
        </Link>
      </td>
      <td className="px-4 py-3">
        <Link href={row.href} className="block">
          <KindBadge kind={row.kind} />
        </Link>
      </td>
      <td className="px-4 py-3">
        <Link href={row.href} className="block">
          <span className="font-medium leading-snug">{row.subject}</span>
        </Link>
      </td>
    </tr>
  );
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
