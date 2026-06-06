"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  MessageSquareText,
  Search,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { InlineTabs } from "./inline-tabs";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { FeedbackDetailDialog } from "@/components/feedback/feedback-detail-dialog";
import { parseRating } from "@/lib/templates/rating";
import { formatDate } from "@/lib/format";
import type {
  FeedbackSource,
  FeedbackWithSource,
} from "@/lib/feedback/types";
import type { TemplateQuestion } from "@/lib/one-on-ones/types";
import { cn } from "@/lib/utils";

type FilterKey =
  | "all"
  | "one_on_one"
  | "peer_request"
  | "performance_review"
  | "cross_team";
type SortKey = "date" | "author" | "source";
type SortDir = "asc" | "desc";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "one_on_one", label: "1-op-1" },
  { key: "peer_request", label: "Peer" },
  { key: "performance_review", label: "Functionering" },
  { key: "cross_team", label: "Cross-team" },
];

export function MemberFeedbackTable({ items }: { items: FeedbackWithSource[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<FeedbackWithSource | null>(null);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: items.length,
      one_on_one: 0,
      peer_request: 0,
      performance_review: 0,
      cross_team: 0,
    };
    for (const f of items) {
      if (f.source_type === "one_on_one") c.one_on_one += 1;
      if (f.source_type === "peer_request") c.peer_request += 1;
      if (f.source_type === "performance_review") c.performance_review += 1;
      if (f.is_cross_team) c.cross_team += 1;
    }
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = items.filter((f) => matchesFilter(f, filter));
    const searched = q
      ? base.filter(
          (f) =>
            (f.body?.toLowerCase().includes(q) ?? false) ||
            (f.author?.name?.toLowerCase().includes(q) ?? false) ||
            (f.source?.label?.toLowerCase().includes(q) ?? false) ||
            Object.values(f.responses ?? {}).some((v) =>
              v.toLowerCase().includes(q),
            ),
        )
      : base;

    return [...searched].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") {
        const ta = new Date(a.submitted_at ?? a.created_at).getTime();
        const tb = new Date(b.submitted_at ?? b.created_at).getTime();
        cmp = ta - tb;
      } else if (sortKey === "author") {
        cmp = (a.author?.name ?? "").localeCompare(b.author?.name ?? "", "nl");
      } else {
        cmp = sourceTypeOrder(a.source_type) - sourceTypeOrder(b.source_type);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, filter, query, sortKey, sortDir]);

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
    <>
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
              placeholder="Zoek in feedback of naam"
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
                  : filter !== "all"
                    ? "Geen feedback in deze categorie."
                    : "Nog geen feedback ontvangen over deze persoon."}
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
                      label="Van"
                      sortKey="author"
                      active={sortKey}
                      dir={sortDir}
                      onSort={toggleSort}
                      className="w-52"
                    />
                    <SortHeader
                      label="Bron"
                      sortKey="source"
                      active={sortKey}
                      dir={sortDir}
                      onSort={toggleSort}
                      className="w-48"
                    />
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground min-w-[240px]">
                      Fragment
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((f) => (
                    <FeedbackTableRow
                      key={f.id}
                      item={f}
                      onOpen={() => setSelected(f)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected ? (
        <FeedbackDetailDialog
          key={selected.id}
          item={selected}
          open={Boolean(selected)}
          onOpenChange={(o) => {
            if (!o) setSelected(null);
          }}
        />
      ) : null}
    </>
  );
}

function FeedbackTableRow({
  item,
  onOpen,
}: {
  item: FeedbackWithSource;
  onOpen: () => void;
}) {
  const author = item.author;
  const dateLabel = item.submitted_at ?? item.created_at;
  const teaser = buildTeaser(item);

  return (
    <tr
      onClick={onOpen}
      className="group cursor-pointer transition-colors hover:bg-accent/40"
    >
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
        {formatDate(dateLabel)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {author ? (
            <PersonAvatar
              id={author.id}
              name={author.name}
              avatarUrl={author.avatar_url}
              size="sm"
            />
          ) : null}
          <span className="font-medium text-foreground/85 truncate">
            {author?.name ?? "Onbekend"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <SourceChip type={item.source_type} label={item.source?.label} />
          {item.is_cross_team ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
              <Sparkles className="h-3 w-3" strokeWidth={1.75} />
              Cross-team
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 text-foreground/80">
        {teaser ? (
          <span className="line-clamp-2 leading-snug">{teaser}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>
    </tr>
  );
}

function SourceChip({
  type,
  label,
}: {
  type: FeedbackSource;
  label?: string | null;
}) {
  if (type === "one_on_one") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
        <MessageSquareText className="h-3 w-3" strokeWidth={1.75} />
        1-op-1
      </span>
    );
  }
  if (type === "peer_request") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
        <Sparkles className="h-3 w-3" strokeWidth={1.75} />
        Peer
      </span>
    );
  }
  if (type === "performance_review") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        <ClipboardCheck className="h-3 w-3" strokeWidth={1.75} />
        Functionering
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
      Upward
      {label ? <span className="font-normal opacity-60">{label}</span> : null}
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

function matchesFilter(item: FeedbackWithSource, filter: FilterKey): boolean {
  switch (filter) {
    case "all":
      return true;
    case "one_on_one":
      return item.source_type === "one_on_one";
    case "peer_request":
      return item.source_type === "peer_request";
    case "performance_review":
      return item.source_type === "performance_review";
    case "cross_team":
      return item.is_cross_team;
  }
}

function sourceTypeOrder(type: FeedbackSource): number {
  return (
    { one_on_one: 0, peer_request: 1, performance_review: 2, upward_feedback: 3 }[
      type
    ] ?? 99
  );
}

function buildTeaser(item: FeedbackWithSource): string | null {
  const questions = item.template_questions;
  const responses = item.responses ?? {};
  if (questions && questions.length > 0) {
    const ratingHit = pickRatingTeaser(questions, responses);
    if (ratingHit) return ratingHit;
    for (const q of questions) {
      if (q.kind === "rating_b_1_5") continue;
      const v = responses[q.id]?.trim();
      if (v) return truncate(v, 140);
    }
  }
  if (item.body) return truncate(item.body, 140);
  return null;
}

function pickRatingTeaser(
  questions: TemplateQuestion[],
  responses: Record<string, string>,
): string | null {
  for (const q of questions) {
    if (q.kind !== "rating_b_1_5") continue;
    const { rating, comment } = parseRating(responses[q.id]);
    if (rating === null && !comment.trim()) continue;
    const ratingPart =
      rating !== null ? `${rating}/5 op "${q.label}"` : `"${q.label}"`;
    const commentPart = comment.trim() ? `: ${truncate(comment, 100)}` : "";
    return `${ratingPart}${commentPart}`;
  }
  return null;
}

function truncate(s: string, n: number): string {
  const cleaned = s.trim().replace(/\s+/g, " ");
  return cleaned.length > n ? cleaned.slice(0, n - 1) + "…" : cleaned;
}
