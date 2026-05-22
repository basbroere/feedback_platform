"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { deleteUser, updateUser } from "@/lib/hr/admin-actions";
import {
  ROLE_LABEL,
  ROLE_OPTIONS,
  ROLE_TONE,
} from "@/lib/hr/roles";
import type { AdminUser } from "@/lib/hr/admin-types";
import type { UserRole } from "@/lib/persona/types";

type TeamOption = { id: string; name: string };

export function PersonTable({
  users,
  teams,
  currentUserId,
}: {
  users: AdminUser[];
  teams: TeamOption[];
  currentUserId: string;
}) {
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (users.length === 0) {
    return (
      <p className="py-4 text-[13px] text-muted-foreground">
        Nog geen gebruikers in het systeem. Voeg er hierboven een toe.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border/70 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Naam</th>
              <th className="py-2 pr-3 font-medium">E-mail</th>
              <th className="py-2 pr-3 font-medium">Rol</th>
              <th className="py-2 pr-3 font-medium">Team</th>
              <th className="py-2 text-right font-medium">Acties</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-border/40 last:border-0"
              >
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2.5">
                    <PersonAvatar
                      id={u.id}
                      name={u.name}
                      avatarUrl={u.avatar_url}
                      size="sm"
                    />
                    <span className="font-medium text-foreground">
                      {u.name}
                      {u.id === currentUserId ? (
                        <span className="ml-1.5 text-[11px] text-muted-foreground">
                          (jij)
                        </span>
                      ) : null}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  {u.email}
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={ROLE_TONE[u.role]}>
                      {ROLE_LABEL[u.role]}
                    </Badge>
                    {u.is_admin ? (
                      <Badge variant="default" className="text-[10px]">
                        Beheerder
                      </Badge>
                    ) : null}
                  </div>
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  {u.team_name ?? (
                    <span className="text-foreground/40">Geen team</span>
                  )}
                </td>
                <td className="py-2.5 text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(u)}
                      aria-label={`Bewerk ${u.name}`}
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingId(u.id)}
                      disabled={u.id === currentUserId}
                      aria-label={`Verwijder ${u.name}`}
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
        <EditUserDialog
          user={editing}
          teams={teams}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {deletingId ? (
        <DeleteUserDialog
          user={users.find((u) => u.id === deletingId) ?? null}
          onClose={() => setDeletingId(null)}
        />
      ) : null}
    </>
  );
}

function EditUserDialog({
  user,
  teams,
  onClose,
}: {
  user: AdminUser;
  teams: TeamOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<UserRole>(user.role);
  const [isAdmin, setIsAdmin] = useState(user.is_admin);
  const [teamId, setTeamId] = useState<string>(user.team_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await updateUser({
          id: user.id,
          name,
          email,
          role,
          is_admin: isAdmin,
          teamId: teamId === "" ? null : teamId,
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
          <DialogTitle>Gebruiker bewerken</DialogTitle>
          <DialogDescription>Pas naam, rol of team aan.</DialogDescription>
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
              <Label htmlFor="edit-name">Naam</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-role">Rol</Label>
              <select
                id="edit-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={isPending}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-team">Team</Label>
              <select
                id="edit-team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                disabled={isPending}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Geen team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              id="edit-admin"
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              disabled={isPending}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <Label htmlFor="edit-admin" className="cursor-pointer font-normal">
              Beheerder
            </Label>
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

function DeleteUserDialog({
  user,
  onClose,
}: {
  user: AdminUser | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!user) return null;

  function confirm() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteUser({ id: user!.id });
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
          <DialogTitle>{user.name} verwijderen?</DialogTitle>
          <DialogDescription>
            Hiermee verdwijnt ook alle gekoppelde data: 1-op-1&apos;s,
            actiepunten, feedback en notificaties. Dit kun je niet
            terugdraaien.
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
