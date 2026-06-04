"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

type Author = { id: string; name: string; avatar_url: string | null };

export function PeerFeedbackCard({
  feedback,
}: {
  feedback: {
    id: string;
    body: string | null;
    prompt: string | null;
    is_cross_team: boolean;
    status: "requested" | "submitted" | "declined";
    submitted_at: string | null;
    created_at: string;
    author: Author | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const stamp = feedback.submitted_at ?? feedback.created_at;
  const hasBody = Boolean(feedback.body && feedback.body.trim().length > 0);
  const expandable = hasBody || Boolean(feedback.prompt);

  return (
    <Card className="p-0">
      <button
        type="button"
        onClick={() => expandable && setOpen((v) => !v)}
        disabled={!expandable}
        className={cn(
          "flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors",
          expandable ? "cursor-pointer hover:bg-muted/30" : "cursor-default",
        )}
        aria-expanded={open}
      >
        {feedback.author ? (
          <PersonAvatar
            id={feedback.author.id}
            name={feedback.author.name}
            avatarUrl={feedback.author.avatar_url}
            size="sm"
          />
        ) : null}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold text-foreground">
              {feedback.author?.name ?? "Onbekende collega"}
            </span>
            {feedback.is_cross_team ? (
              <Badge variant="outline" className="text-[10px]">
                Cross-team
              </Badge>
            ) : null}
            <span className="text-[11.5px] text-muted-foreground">
              {formatDate(stamp)}
            </span>
          </div>
          {!open ? (
            <p className="line-clamp-1 text-[13px] text-muted-foreground">
              {hasBody
                ? feedback.body
                : feedback.status === "declined"
                  ? "Verzoek afgewezen of vervallen"
                  : "Geen inhoud"}
            </p>
          ) : null}
        </div>
        {expandable ? (
          <ChevronDown
            className={cn(
              "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
            strokeWidth={1.75}
          />
        ) : null}
      </button>

      {open && expandable ? (
        <div className="space-y-3 border-t border-border/60 px-4 py-4">
          {feedback.prompt ? (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Vraag
              </p>
              <p className="text-[13px] italic text-muted-foreground">
                {feedback.prompt}
              </p>
            </div>
          ) : null}
          {hasBody ? (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Feedback
              </p>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/90">
                {feedback.body}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
