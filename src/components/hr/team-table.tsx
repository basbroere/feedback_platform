"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteTeam, updateTeam } from "@/lib/hr/admin-actions";
import type { AdminTeam } from "@/lib/hr/admin-types";

type LeadOption = { id: string; name: string };

export function TeamTable({
  teams,
  leadOptions,
}: {
  teams: AdminTeam[];
  leadOptions: LeadOption[];
}) {
  const [editing, setEditing] = useState<AdminTeam | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (teams.length === 0) {
    return (
      <p className="py-4 text-[13px] text-muted-foreground">
        Nog geen teams. Maak hierboven het eerste team aan.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border/70 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Team</th>
              <th className="py-2 pr-3 font-medium">Lead</th>
              <th className="py-2 pr-3 font-medium">Leden</th>
              <th className="py-2 text-right font-medium">Acties</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => (
              <tr
                key={t.id}
                className={`border-b border-border/40 last:border-0 ${
                  i % 2 === 1 ? "bg-muted/30" : ""
                }`}
              >
                <td className="py-2.5 pr-3 font-medium text-foreground">
                  {t.name}
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  {t.lead_name ?? (
                    <span className="text-foreground/40">Geen lead</span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  {t.member_count}{" "}
                  {t.member_count === 1 ? "lid" : "leden"}
                </td>
                <td className="py-2.5 text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(t)}
                      aria-label={`Bewerk ${t.name}`}
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingId(t.id)}
                      aria-label={`Verwijder ${t.name}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing ? (
        <EditTeamDialog
          team={editing}
          leadOptions={leadOptions}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {deletingId ? (
        <DeleteTeamDialog
          team={teams.find((t) => t.id === deletingId) ?? null}
          onClose={() => setDeletingId(null)}
        />
      ) : null}
    </>
  );
}

function EditTeamDialog({
  team,
  leadOptions,
  onClose,
}: {
  team: AdminTeam;
  leadOptions: LeadOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(team.name);
  const [leadUserId, setLeadUserId] = useState<string>(
    team.lead_user_id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await updateTeam({
          id: team.id,
          name,
          leadUserId: leadUserId === "" ? null : leadUserId,
        });
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Opslaan mislukt");
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Team bewerken</DialogTitle>
          <DialogDescription>Pas naam of teamlead aan.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-team-name">Teamnaam</Label>
              <Input
                id="edit-team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-team-lead">Teamlead</Label>
              <select
                id="edit-team-lead"
                value={leadUserId}
                onChange={(e) => setLeadUserId(e.target.value)}
                disabled={isPending}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Geen lead</option>
                {leadOptions.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <p className="text-[13px] text-destructive">{error}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTeamDialog({
  team,
  onClose,
}: {
  team: AdminTeam | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!team) return null;

  function confirm() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteTeam({ id: team!.id });
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Verwijderen mislukt");
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{team.name} verwijderen?</DialogTitle>
          <DialogDescription>
            {team.member_count > 0
              ? `De ${team.member_count} ${team.member_count === 1 ? "medewerker wordt" : "medewerkers worden"} losgekoppeld van dit team. Gesprekken en actiepunten blijven bewaard.`
              : "Dit team heeft geen leden en kan veilig verwijderd worden."}
            {" "}Dit kun je niet terugdraaien.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-[13px] text-destructive">{error}</p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            Annuleren
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirm}
            disabled={isPending}
          >
            {isPending ? "Verwijderen..." : "Ja, verwijder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
