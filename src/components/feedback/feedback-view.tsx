"use client";

import { useMemo, useState } from "react";
import { ChevronRight, MessageSquareText, Search, Sparkles } from "lucide-react";
import type { FeedbackWithSource } from "@/lib/feedback/types";
import type { TemplateQuestion } from "@/lib/one-on-ones/types";
import { Input } from "@/components/ui/input";
import { formatDate, formatRelativeWeeks } from "@/lib/format";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { FeedbackDetailDialog } from "./feedback-detail-dialog";
import { parseRating } from "@/lib/templates/rating";

export function FeedbackView({ items }: { items: FeedbackWithSource[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (f) =>
        (f.body?.toLowerCase().includes(q) ?? false) ||
        (f.author?.name?.toLowerCase().includes(q) ?? false) ||
        (f.source?.label?.toLowerCase().includes(q) ?? false) ||
        Object.values(f.responses ?? {}).some((v) =>
          v.toLowerCase().includes(q),
        ),
    );
  }, [items, query]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
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
          <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="text-sm text-muted-foreground">
              {query.trim()
                ? "Niks gevonden. Probeer een ander woord."
                : "Nog geen feedback ontvangen. Peer-feedback komt binnen via je functioneringsgesprek; je manager kan ook feedback geven na een 1-op-1."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((f) => (
              <FeedbackRow key={f.id} item={f} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export function FeedbackRow({ item }: { item: FeedbackWithSource }) {
  const author = item.author;
  const dateLabel = item.submitted_at ?? item.created_at;
  const sourceLabel = item.source?.label ?? "";
  const teaser = buildTeaser(item);

  // De row is altijd klikbaar; dialog opent met het volledige template.
  return (
    <li>
      <FeedbackDetailDialog
        item={item}
        trigger={
          <div className="group rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-accent/40">
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
    // Pak eerst een rating-vraag (geeft een lekker concrete snippet),
    // anders een eerste niet-lege open vraag.
    const ratingHit = pickRatingTeaser(questions, responses);
    if (ratingHit) return ratingHit;
    for (const q of questions) {
      if (q.kind === "rating_b_1_5") continue;
      const v = responses[q.id]?.trim();
      if (v) return truncate(v, 160);
    }
    // Anders niets uit template.
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
