"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createFeedbackRequest } from "@/lib/feedback/actions";
import type { FeedbackTemplate } from "@/lib/feedback/types";
import type { TeamWithMembers } from "@/lib/persona/server";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { cn } from "@/lib/utils";

export function RequestFeedbackDialog({
  templates,
  teams,
  currentUserId,
  currentTeamId,
}: {
  templates: FeedbackTemplate[];
  teams: TeamWithMembers[];
  currentUserId: string;
  currentTeamId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState<string>(
    templates[0]?.id ?? "",
  );
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  );

  const hasCrossTeam = useMemo(() => {
    if (!currentTeamId) return selected.size > 0;
    for (const team of teams) {
      if (team.id === currentTeamId) continue;
      for (const m of team.members) {
        if (selected.has(m.id)) return true;
      }
    }
    return false;
  }, [selected, teams, currentTeamId]);

  function reset() {
    setTemplateId(templates[0]?.id ?? "");
    setPrompt("");
    setSelected(new Set());
    setError(null);
  }

  function togglePeer(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setError(null);
    if (!templateId) {
      setError("Kies een template");
      return;
    }
    if (selected.size === 0) {
      setError("Kies minstens één collega");
      return;
    }
    startTransition(async () => {
      try {
        await createFeedbackRequest({
          templateId,
          prompt: prompt.trim() || undefined,
          peerIds: Array.from(selected),
        });
        reset();
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Versturen mislukt");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Feedback aanvragen
      </Button>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Feedback aanvragen bij collega&apos;s</DialogTitle>
          <DialogDescription>
            Kies een template, schrijf optioneel waar je feedback op wil, en
            selecteer collega&apos;s. Zij krijgen een verzoek op hun dashboard.
            Hun naam is straks zichtbaar bij de feedback.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-2">
            <Label>Template</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {templates.map((t) => {
                const active = templateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplateId(t.id)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                      active
                        ? "border-primary bg-primary/8"
                        : "border-border bg-card hover:bg-accent/40",
                    )}
                  >
                    <p className="text-[13px] font-semibold">{t.name}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {t.questions.length} vragen
                    </p>
                  </button>
                );
              })}
            </div>
            {selectedTemplate ? (
              <ul className="mt-1 space-y-0.5 pl-4 text-[12px] text-muted-foreground">
                {selectedTemplate.questions.map((q) => (
                  <li key={q.id} className="list-disc">
                    {q.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="space-y-2">
            <Label htmlFor="feedback-prompt">Waar wil je feedback op? (optioneel)</Label>
            <Textarea
              id="feedback-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Bijvoorbeeld: hoe ervaar jij mijn aanpak in het Acme-project?"
              rows={3}
            />
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Collega&apos;s ({selected.size} gekozen)</Label>
              {hasCrossTeam ? (
                <span className="inline-flex items-center gap-1 text-[12px] text-primary">
                  <Sparkles className="h-3 w-3" strokeWidth={1.75} />
                  Cross-team meegenomen
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                  <Users className="h-3 w-3" strokeWidth={1.75} />
                  Tip: kies ook iemand uit een ander team
                </span>
              )}
            </div>
            <div className="max-h-[260px] overflow-y-auto rounded-xl border border-border bg-card">
              {teams.map((team) => {
                const members = team.members.filter(
                  (m) => m.id !== currentUserId,
                );
                if (members.length === 0) return null;
                return (
                  <div key={team.id} className="border-b border-border last:border-b-0">
                    <p className="bg-muted/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {team.name}
                    </p>
                    <ul>
                      {members.map((m) => {
                        const checked = selected.has(m.id);
                        return (
                          <li key={m.id}>
                            <label
                              className={cn(
                                "flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors",
                                checked
                                  ? "bg-primary/8"
                                  : "hover:bg-accent/40",
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePeer(m.id)}
                                className="h-4 w-4 rounded border-border accent-primary"
                              />
                              <PersonAvatar
                                id={m.id}
                                name={m.name}
                                avatarUrl={m.avatar_url}
                                size="sm"
                              />
                              <span className="flex-1 text-[13px]">{m.name}</span>
                              {team.id !== currentTeamId ? (
                                <span className="text-[11px] text-muted-foreground">
                                  Cross-team
                                </span>
                              ) : null}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Annuleren
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={isPending || selected.size === 0}
            >
              {isPending
                ? "Versturen..."
                : `Verstuur ${selected.size > 0 ? `(${selected.size})` : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
