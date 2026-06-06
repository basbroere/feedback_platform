"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, MessageSquareText, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { TemplateAnswers } from "@/components/performance-review/template-answers";
import { formatDate } from "@/lib/format";
import type { FeedbackWithSource } from "@/lib/feedback/types";
import { cn } from "@/lib/utils";

export function FeedbackDetailDialog({
  item,
  trigger,
}: {
  item: FeedbackWithSource;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const author = item.author;
  const dateLabel = item.submitted_at ?? item.created_at;
  const sourceLabel = item.source?.label ?? "Feedback";
  const { href: sourceHref, label: sourceLinkLabel } = buildSourceHref(item);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/40 rounded-2xl",
        )}
      >
        {trigger}
      </button>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-3">
            {author ? (
              <PersonAvatar
                id={author.id}
                name={author.name}
                avatarUrl={author.avatar_url}
                size="lg"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-[18px]">
                Feedback van {author?.name ?? "Onbekend"}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2 text-[12.5px]">
                <span>{formatDate(dateLabel)}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquareText className="h-3 w-3" />
                  {sourceLabel}
                </span>
                {item.is_cross_team ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <Sparkles className="h-3 w-3" />
                    Cross-team
                  </span>
                ) : null}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {item.template_questions && item.template_questions.length > 0 ? (
            <TemplateAnswers
              questions={item.template_questions}
              answers={item.responses ?? {}}
            />
          ) : item.body ? (
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/90">
              {item.body}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Geen inhoud beschikbaar.
            </p>
          )}
        </div>

        {sourceHref ? (
          <DialogFooter>
            <Link
              href={sourceHref}
              className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
              onClick={() => setOpen(false)}
            >
              <ExternalLink className="h-3.5 w-3.5" data-icon="inline-start" />
              {sourceLinkLabel}
            </Link>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function buildSourceHref(item: FeedbackWithSource): {
  href: string | null;
  label: string;
} {
  if (item.source?.kind === "one_on_one" && item.source.href) {
    return { href: item.source.href, label: "Naar de 1-op-1" };
  }
  if (item.source_type === "performance_review" && item.source_id) {
    return {
      href: `/functioneringsgesprek/${item.source_id}`,
      label: "Naar het functioneringsgesprek",
    };
  }
  if (item.source_type === "upward_feedback" && item.source_id) {
    return {
      href: `/functioneringsgesprek/${item.source_id}`,
      label: "Naar het functioneringsgesprek",
    };
  }
  return { href: null, label: "" };
}
