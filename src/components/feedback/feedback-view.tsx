"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MessageSquareText, Search, Sparkles } from "lucide-react";
import type {
  FeedbackTemplate,
  FeedbackWithSource,
  OwnFeedbackRequestSummary,
} from "@/lib/feedback/types";
import type { TeamWithMembers } from "@/lib/persona/server";
import { RequestFeedbackDialog } from "./request-feedback-dialog";
import { Input } from "@/components/ui/input";
import { formatDate, formatRelativeWeeks } from "@/lib/format";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";

export function FeedbackView({
  items,
  templates,
  teams,
  ownRequests,
  currentUserId,
  currentTeamId,
}: {
  items: FeedbackWithSource[];
  templates: FeedbackTemplate[];
  teams: TeamWithMembers[];
  ownRequests: OwnFeedbackRequestSummary[];
  currentUserId: string;
  currentTeamId: string | null;
}) {
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

  const openRequests = ownRequests.filter(
    (r) => r.submitted_count + r.declined_count < r.peer_count,
  );

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <RequestFeedbackDialog
          templates={templates}
          teams={teams}
          currentUserId={currentUserId}
          currentTeamId={currentTeamId}
        />
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

      {openRequests.length > 0 ? (
        <div className="mt-4 rounded-xl border border-border bg-primary/5 px-4 py-3">
          <p className="text-[13px] text-foreground/85">
            <span className="font-semibold">
              {openRequests.length} verzoek{openRequests.length === 1 ? "" : "en"}
            </span>{" "}
            staat nog open bij collega&apos;s. Je krijgt het terug zodra zij invullen.
          </p>
          <ul className="mt-2 space-y-1">
            {openRequests.slice(0, 3).map((r) => {
              const remaining =
                r.peer_count - r.submitted_count - r.declined_count;
              return (
                <li key={r.request_id} className="text-[12px] text-muted-foreground">
                  {r.template_name ?? "Feedback-aanvraag"} · {remaining} van{" "}
                  {r.peer_count} nog te ontvangen
                  {r.submitted_count > 0
                    ? ` · ${r.submitted_count} ingevuld`
                    : ""}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="mt-5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="text-sm text-muted-foreground">
              {query.trim()
                ? "Niks gevonden. Probeer een ander woord."
                : "Nog geen feedback ontvangen. Vraag een collega via de knop hierboven, of wacht op een momentje van je manager in een 1-op-1."}
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
  return (
    <li className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
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
        {item.is_cross_team ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            <Sparkles className="h-3 w-3" strokeWidth={1.75} />
            Cross-team
          </span>
        ) : null}
      </div>

      {item.source_type === "peer_request" && item.template_questions ? (
        <dl className="mt-3 space-y-3">
          {item.template_questions.map((q) => {
            const answer = item.responses?.[q.id]?.trim();
            if (!answer) return null;
            return (
              <div key={q.id}>
                <dt className="text-[12px] font-medium text-foreground/70">
                  {q.label}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/90">
                  {answer}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : item.body ? (
        <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/90">
          {item.body}
        </p>
      ) : null}

      {item.source ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
          {item.source.kind === "one_on_one" && item.source.href ? (
            <Link
              href={item.source.href}
              className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/75 transition-colors hover:bg-muted/80"
            >
              <MessageSquareText className="h-3 w-3" strokeWidth={1.75} />
              Uit 1-op-1
              {item.source.with ? ` met ${firstName(item.source.with.name)}` : ""}
              {item.source.date ? ` · ${formatDate(item.source.date)}` : ""}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/75">
              <MessageSquareText className="h-3 w-3" strokeWidth={1.75} />
              {item.source.kind === "peer_request"
                ? `Op je verzoek · ${item.source.label}`
                : item.source.label}
            </span>
          )}
        </div>
      ) : null}
    </li>
  );
}

function firstName(full: string): string {
  return full.split(" ")[0] ?? full;
}
