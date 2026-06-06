"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { createPeerFeedbackRequest } from "@/lib/feedback/actions";
import type { TeamWithMembers } from "@/lib/persona/server";

type TemplateOption = { id: string; name: string };

export function RequestPeerDialog({
  teams,
  templates,
  currentUserId,
}: {
  teams: TeamWithMembers[];
  templates: TemplateOption[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedPeer = useMemo(() => {
    if (!selectedPeerId) return null;
    for (const t of teams) {
      const m = t.members.find((m) => m.id === selectedPeerId);
      if (m) return { ...m, teamName: t.name };
    }
    return null;
  }, [selectedPeerId, teams]);

  const currentUserTeamId = useMemo(() => {
    for (const t of teams) {
      if (t.members.some((m) => m.id === currentUserId)) return t.id;
    }
    return null;
  }, [teams, currentUserId]);

  const filter = (name: string) =>
    !query.trim() || name.toLowerCase().includes(query.trim().toLowerCase());

  function reset() {
    setSelectedPeerId(null);
    setTemplateId(templates[0]?.id ?? "");
    setPrompt("");
    setQuery("");
    setError(null);
  }

  function submit() {
    if (!selectedPeerId) { setError("Kies een collega."); return; }
    if (!templateId) { setError("Kies een template."); return; }
    setError(null);
    startTransition(async () => {
      try {
        await createPeerFeedbackRequest({ peerId: selectedPeerId, templateId, prompt: prompt.trim() });
        setOpen(false);
        reset();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Aanvraag mislukt");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger className={buttonVariants({ size: "sm" })}>
        <Plus className="h-3.5 w-3.5" data-icon="inline-start" />
        Feedback aanvragen
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Feedback aanvragen</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {templates.length === 0 ? (
            <p className="rounded-xl bg-muted/60 px-4 py-3 text-[13px] text-muted-foreground">
              Er zijn nog geen peer-feedback-templates aangemaakt. Vraag een HR-collega om een template van het type "Losse peer feedback" toe te voegen via het Templates-overzicht.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Van wie wil je feedback?</Label>
                {selectedPeer ? (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                    <div className="flex items-center gap-3">
                      <PersonAvatar
                        id={selectedPeer.id}
                        name={selectedPeer.name}
                        avatarUrl={selectedPeer.avatar_url}
                        size="sm"
                      />
                      <div className="space-y-0.5">
                        <p className="text-[13.5px] font-medium leading-tight">{selectedPeer.name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11.5px] text-muted-foreground">{selectedPeer.teamName}</span>
                          {currentUserTeamId && selectedPeer.teamName !== teams.find((t) => t.id === currentUserTeamId)?.name ? (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              <Sparkles className="h-2.5 w-2.5" />
                              Cross-team
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPeerId(null)}
                      className="text-[12px] text-muted-foreground hover:text-foreground"
                    >
                      Wijzigen
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Zoek op naam"
                      autoFocus
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                    />
                    <div className="max-h-60 space-y-3 overflow-y-auto">
                      {teams.map((team) => {
                        const visible = team.members.filter(
                          (m) => m.id !== currentUserId && filter(m.name),
                        );
                        if (!visible.length) return null;
                        const isCrossTeam = team.id !== currentUserTeamId;
                        return (
                          <div key={team.id} className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <p className="text-[12.5px] font-medium font-heading text-muted-foreground">
                                {team.name}
                              </p>
                              {isCrossTeam ? (
                                <span className="text-[11.5px] font-medium font-heading text-muted-foreground/60">
                                  cross-team
                                </span>
                              ) : null}
                            </div>
                            <ul className="space-y-1">
                              {visible.map((m) => (
                                <li key={m.id}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPeerId(m.id)}
                                    className="flex w-full items-center gap-3 rounded-lg bg-background px-3 py-2 text-left text-[13.5px] transition-colors hover:bg-accent"
                                  >
                                    <PersonAvatar id={m.id} name={m.name} avatarUrl={m.avatar_url} size="sm" />
                                    <span className="truncate">{m.name}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="req-template">Template</Label>
                <select
                  id="req-template"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="req-prompt">
                  Contextvraag{" "}
                  <span className="font-normal text-muted-foreground">(optioneel)</span>
                </Label>
                <Textarea
                  id="req-prompt"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Bijv. ik ben benieuwd hoe de samenwerking op project X werd ervaren."
                />
              </div>
            </>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <DialogClose className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Annuleer
          </DialogClose>
          {templates.length > 0 ? (
            <Button
              size="sm"
              onClick={submit}
              disabled={isPending || !selectedPeerId || !templateId}
            >
              {isPending ? "Bezig..." : "Aanvragen"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
