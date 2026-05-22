"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import {
  chooseCyclePeer,
  removeCyclePeer,
} from "@/lib/performance-reviews/actions";
import type { CycleFeedback } from "@/lib/performance-reviews/types";
import type { TeamWithMembers } from "@/lib/persona/server";
import { cn } from "@/lib/utils";

type Props = {
  performanceReviewId: string;
  employeeId: string;
  managerId: string;
  currentTeamId: string | null;
  teams: TeamWithMembers[];
  peer: CycleFeedback | null;
};

export function CyclePeerPicker({
  performanceReviewId,
  employeeId,
  managerId,
  currentTeamId,
  teams,
  peer,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ownTeam = useMemo(
    () => teams.find((t) => t.id === currentTeamId) ?? null,
    [teams, currentTeamId],
  );
  const otherTeams = useMemo(
    () => teams.filter((t) => t.id !== currentTeamId),
    [teams, currentTeamId],
  );

  const filter = (name: string) =>
    query.trim().length === 0 ||
    name.toLowerCase().includes(query.trim().toLowerCase());

  function isSelectable(memberId: string) {
    return memberId !== employeeId && memberId !== managerId;
  }

  function pick(peerId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await chooseCyclePeer({ performanceReviewId, peerId });
        setOpen(false);
        setQuery("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Uitnodigen mislukt");
      }
    });
  }

  function clear() {
    setError(null);
    startTransition(async () => {
      try {
        await removeCyclePeer({ performanceReviewId });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Verwijderen mislukt");
      }
    });
  }

  const peerStatus = peer
    ? peer.status === "submitted"
      ? ("submitted" as const)
      : peer.status === "declined"
        ? ("declined" as const)
        : ("requested" as const)
    : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Kies een collega voor 360 feedback
          </CardTitle>
          <p className="text-[13px] text-muted-foreground">
            Eén collega die jou de afgelopen periode goed heeft zien werken.
            Je naam en die van je collega zijn straks zichtbaar.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {peer ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <PersonAvatar
                id={peer.author.id}
                name={peer.author.name}
                avatarUrl={peer.author.avatar_url}
                size="sm"
              />
              <div className="space-y-0.5">
                <p className="text-[14px] font-medium leading-tight">
                  {peer.author.name}
                </p>
                <PeerStatusLine status={peerStatus} />
              </div>
            </div>
            {peerStatus === "requested" ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen((p) => !p)}
                  disabled={isPending}
                >
                  Wissel collega
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clear}
                  disabled={isPending}
                  aria-label="Keuze wissen"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card/40 px-4 py-4 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <Users className="h-3.5 w-3.5" />
            Kies een collega
          </button>
        )}

        {open ? (
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek op naam"
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />

            <div className="max-h-80 space-y-3 overflow-y-auto">
              {ownTeam ? (
                <TeamGroup
                  team={ownTeam}
                  label="Je eigen team"
                  filter={filter}
                  isSelectable={isSelectable}
                  onPick={pick}
                  disabled={isPending}
                />
              ) : null}
              {otherTeams.map((t) => (
                <TeamGroup
                  key={t.id}
                  team={t}
                  label={t.name}
                  filter={filter}
                  isSelectable={isSelectable}
                  onPick={pick}
                  disabled={isPending}
                  hint="cross-team"
                />
              ))}
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

function PeerStatusLine({
  status,
}: {
  status: "submitted" | "requested" | "declined" | null;
}) {
  if (status === "submitted") {
    return (
      <p className="flex items-center gap-1.5 text-[12px] text-emerald-600">
        <CheckCircle2 className="h-3 w-3" />
        Heeft feedback gegeven
      </p>
    );
  }
  if (status === "declined") {
    return (
      <p className="text-[12px] text-muted-foreground">
        Heeft afgezien van feedback
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
      <Clock3 className="h-3 w-3" />
      Uitnodiging verstuurd
    </p>
  );
}

function TeamGroup({
  team,
  label,
  filter,
  isSelectable,
  onPick,
  disabled,
  hint,
}: {
  team: TeamWithMembers;
  label: string;
  filter: (name: string) => boolean;
  isSelectable: (id: string) => boolean;
  onPick: (id: string) => void;
  disabled: boolean;
  hint?: string;
}) {
  const visible = team.members.filter(
    (m) => isSelectable(m.id) && filter(m.name),
  );
  if (visible.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        {hint ? (
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
            {hint}
          </span>
        ) : null}
      </div>
      <ul className="space-y-1">
        {visible.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onPick(m.id)}
              disabled={disabled}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border border-transparent bg-background px-3 py-2 text-left text-[13.5px] transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <PersonAvatar
                id={m.id}
                name={m.name}
                avatarUrl={m.avatar_url}
                size="sm"
              />
              <span className="truncate">{m.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
