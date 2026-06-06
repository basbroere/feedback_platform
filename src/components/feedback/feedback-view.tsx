"use client";

import { useMemo, useState } from "react";
import { ChevronRight, MessageSquareText, Search, Sparkles } from "lucide-react";
import type { FeedbackWithSource } from "@/lib/feedback/types";
import type { FeedbackSource } from "@/lib/feedback/types";
import type { TemplateQuestion } from "@/lib/one-on-ones/types";
import { Input } from "@/components/ui/input";
import { formatDate, formatRelativeWeeks } from "@/lib/format";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { FeedbackDetailDialog } from "./feedback-detail-dialog";
import { parseRating } from "@/lib/templates/rating";
import { cn } from "@/lib/utils";

const SOURCE_BORDER: Record<FeedbackSource, string> = {
  one_on_one: "border-l-4 border-l-blue-400 dark:border-l-blue-500",
  performance_review: "border-l-4 border-l-amber-400 dark:border-l-amber-500",
  peer_request: "border-l-4 border-l-violet-400 dark:border-l-violet-500",
  upward_feedback: "border-l-4 border-l-emerald-400 dark:border-l-emerald-500",
};

type FilterKey = "all" | "one_on_one" | "performance_review" | "cross_team";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "one_on_one", label: "1-op-1" },
  { key: "performance_review", label: "Functionering" },
  { key: "cross_team", label: "Cross-team" },
];

function matchesFilter(item: FeedbackWithSource, filter: FilterKey): boolean {
  switch (filter) {
    case "all":
      return true;
    case "one_on_one":
      return item.source_type === "one_on_one";
    case "performance_review":
      return item.source_type === "performance_review";
    case "cross_team":
      return item.is_cross_team;
  }
}

export function FeedbackView({ items }: { items: FeedbackWithSource[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: items.length,
      one_on_one: 0,
      performance_review: 0,
      cross_team: 0,
    };
    for (const f of items) {
      if (f.source_type === "one_on_one") c.one_on_one += 1;
      if (f.source_type === "performance_review") c.performance_review += 1;
      if (f.is_cross_team) c.cross_team += 1;
    }
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((f) => {
      if (!matchesFilter(f, filter)) return false;
      if (!q) return true;
      return (
        (f.body?.toLowerCase().includes(q) ?? false) ||
        (f.author?.name?.toLowerCase().includes(q) ?? false) ||
        (f.source?.label?.toLowerCase().includes(q) ?? false) ||
        Object.values(f.responses ?? {}).some((v) =>
          v.toLowerCase().includes(q),
        )
      );
    });
  }, [items, query, filter]);

  const [featured, ...rest] = filtered;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count = counts[f.key];
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground/75 hover:bg-accent/50",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek in feedback of naam"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-card px-6 py-12 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              {query.trim()
                ? "Niks gevonden. Probeer een ander woord."
                : filter !== "all"
                  ? "Geen feedback in deze categorie. Probeer een ander filter."
                  : "Nog geen feedback ontvangen. Vraag feedback aan via de knop rechts boven, of wacht op feedback na een 1-op-1 of functioneringsgesprek."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {featured ? <FeaturedFeedbackCard item={featured} /> : null}
            {rest.length > 0 ? (
              <ul className="space-y-3">
                {rest.map((f) => (
                  <FeedbackRow key={f.id} item={f} />
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

function FeaturedFeedbackCard({ item }: { item: FeedbackWithSource }) {
  const author = item.author;
  const dateLabel = item.submitted_at ?? item.created_at;
  const teaser = buildTeaser(item);
  const borderClass = SOURCE_BORDER[item.source_type] ?? "";

  return (
    <FeedbackDetailDialog
      item={item}
      trigger={
        <div
          className={cn(
            "group rounded-2xl bg-card p-6 shadow-md transition-all hover:shadow-lg hover:bg-accent/30",
            borderClass,
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {author ? (
                <PersonAvatar
                  id={author.id}
                  name={author.name}
                  avatarUrl={author.avatar_url}
                  size="lg"
                />
              ) : null}
              <div className="space-y-0.5">
                <p className="text-[15px] font-semibold leading-tight">
                  {author?.name ?? "Onbekend"}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {formatRelativeWeeks(dateLabel)} · {formatDate(dateLabel)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                Nieuwste
              </span>
              {item.is_cross_team ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                  <Sparkles className="h-3 w-3" strokeWidth={1.75} />
                  Cross-team
                </span>
              ) : null}
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>

          {teaser ? (
            <div className="mt-4 rounded-xl bg-muted/60 px-4 py-3">
              <p className="line-clamp-4 text-[14.5px] leading-relaxed text-foreground/85">
                {teaser}
              </p>
            </div>
          ) : null}

          {item.source?.label ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
              <SourceLabel item={item} />
            </div>
          ) : null}
        </div>
      }
    />
  );
}

export function FeedbackRow({ item }: { item: FeedbackWithSource }) {
  const author = item.author;
  const dateLabel = item.submitted_at ?? item.created_at;
  const sourceLabel = item.source?.label ?? "";
  const teaser = buildTeaser(item);
  const borderClass = SOURCE_BORDER[item.source_type] ?? "";

  return (
    <li>
      <FeedbackDetailDialog
        item={item}
        trigger={
          <div
            className={cn(
              "group rounded-2xl bg-card p-5 shadow-sm transition-colors hover:bg-accent/40",
              borderClass,
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {author ? (
                  <PersonAvatar
                    id={author.id}
                    name={author.name}
                    avatarUrl={author.avatar_url}
                  />
                ) : null}
                <div className="space-y-0.5">
                  <p className="text-[14px] font-semibold leading-tight">
                    {author?.name ?? "Onbekend"}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {formatRelativeWeeks(dateLabel)} · {formatDate(dateLabel)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {item.is_cross_team ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <Sparkles className="h-3 w-3" strokeWidth={1.75} />
                    Cross-team
                  </span>
                ) : null}
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>

            {teaser ? (
              <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-foreground/85">
                {teaser}
              </p>
            ) : null}

            {sourceLabel ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                <SourceLabel item={item} />
              </div>
            ) : null}
          </div>
        }
      />
    </li>
  );
}

function SourceLabel({ item }: { item: FeedbackWithSource }) {
  const src = item.source;
  if (!src) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/75">
      <MessageSquareText className="h-3 w-3" strokeWidth={1.75} />
      {src.kind === "one_on_one"
        ? `Uit 1-op-1${src.with ? ` met ${firstName(src.with.name)}` : ""}${src.date ? ` · ${formatDate(src.date)}` : ""}`
        : src.kind === "peer_request"
          ? `Op je verzoek · ${src.label}`
          : src.kind === "performance_review"
            ? `Functioneringsgesprek · ${src.label}`
            : src.label}
    </span>
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
      if (v) return truncate(v, 160);
    }
  }
  if (item.body) return truncate(item.body, 160);
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
    const commentPart = comment.trim() ? `: ${truncate(comment, 120)}` : "";
    return `${ratingPart}${commentPart}`;
  }
  return null;
}

function truncate(s: string, n: number): string {
  const cleaned = s.trim().replace(/\s+/g, " ");
  return cleaned.length > n ? cleaned.slice(0, n - 1) + "…" : cleaned;
}

function firstName(full: string): string {
  return full.split(" ")[0] ?? full;
}
