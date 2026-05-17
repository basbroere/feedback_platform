import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { FeedbackWithSource } from "@/lib/feedback/types";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { formatRelativeWeeks } from "@/lib/format";

const MAX_VISIBLE = 2;

export function RecentFeedback({ items }: { items: FeedbackWithSource[] }) {
  const recent = items.slice(0, MAX_VISIBLE);
  if (recent.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Recente feedback
        </h2>
        <Link
          href="/feedback"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground/65 hover:text-primary"
        >
          Alles bekijken
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <ul className="space-y-3">
        {recent.map((f) => (
          <FeedbackCard key={f.id} item={f} />
        ))}
      </ul>
    </section>
  );
}

function FeedbackCard({ item }: { item: FeedbackWithSource }) {
  const date = item.submitted_at ?? item.created_at;
  const snippet = pickSnippet(item);
  return (
    <li className="rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        {item.author ? (
          <PersonAvatar
            id={item.author.id}
            name={item.author.name}
            avatarUrl={item.author.avatar_url}
            size="sm"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-[14px] font-semibold leading-tight">
              {item.author?.name ?? "Onbekend"}
            </p>
            <span className="text-[12px] text-muted-foreground">
              · {formatRelativeWeeks(date)}
            </span>
            {item.is_cross_team ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-medium text-primary">
                <Sparkles className="h-3 w-3" strokeWidth={1.75} />
                Cross-team
              </span>
            ) : null}
          </div>
          {snippet ? (
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-foreground/85">
              {snippet}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function pickSnippet(item: FeedbackWithSource): string | null {
  if (item.body?.trim()) return item.body.trim();
  const responses = item.responses ?? {};
  for (const value of Object.values(responses)) {
    if (value?.trim()) return value.trim();
  }
  return null;
}
