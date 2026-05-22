import Link from "next/link";
import { ArrowRight, Quote, Sparkles } from "lucide-react";
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

      <ul className="grid gap-3 sm:grid-cols-2">
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
    <li className="relative overflow-hidden rounded-2xl bg-primary/5 px-5 py-4 shadow-sm">
      <Quote
        className="pointer-events-none absolute right-3 top-3 h-7 w-7 text-primary/15"
        strokeWidth={1.5}
      />
      <div className="flex items-center gap-2.5">
        {item.author ? (
          <PersonAvatar
            id={item.author.id}
            name={item.author.name}
            avatarUrl={item.author.avatar_url}
            size="sm"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold leading-tight">
            {item.author?.name ?? "Onbekend"}
          </p>
          <p className="text-[11.5px] text-muted-foreground">
            {formatRelativeWeeks(date)}
          </p>
        </div>
        {item.is_cross_team ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            <Sparkles className="h-3 w-3" strokeWidth={1.75} />
            Cross-team
          </span>
        ) : null}
      </div>
      {snippet ? (
        <p className="mt-2.5 line-clamp-3 text-[13px] leading-relaxed text-foreground/90">
          {snippet}
        </p>
      ) : null}
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
