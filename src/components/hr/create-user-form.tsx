"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser } from "@/lib/hr/admin-actions";
import { ROLE_OPTIONS } from "@/lib/hr/roles";
import type { UserRole } from "@/lib/persona/types";

export function CreateUserForm({
  teams,
}: {
  teams: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("employee");
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamId, setTeamId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setOkMessage(null);
    startTransition(async () => {
      try {
        await createUser({
          name,
          email,
          role,
          is_admin: isAdmin,
          teamId: teamId === "" ? null : teamId,
        });
        setOkMessage(`${name.trim()} is toegevoegd`);
        setName("");
        setEmail("");
        setRole("employee");
        setIsAdmin(false);
        setTeamId("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Aanmaken mislukt");
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="user-name">Naam</Label>
          <Input
            id="user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bijv. Sanne Janssen"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-email">E-mail</Label>
          <Input
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sanne@bambelo.com"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-role">Rol</Label>
          <select
            id="user-role"
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
          <Label htmlFor="user-team">Team</Label>
          <select
            id="user-team"
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
          id="user-admin"
          type="checkbox"
          checked={isAdmin}
          onChange={(e) => setIsAdmin(e.target.checked)}
          disabled={isPending}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <Label htmlFor="user-admin" className="cursor-pointer font-normal">
          Beheerder (toegang tot templates en gebruikersbeheer)
        </Label>
      </div>

      {error ? (
        <p className="text-[13px] text-destructive">{error}</p>
      ) : null}
      {okMessage ? (
        <p className="text-[13px] text-emerald-600 dark:text-emerald-400">
          {okMessage}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          <Plus className="h-4 w-4" strokeWidth={2} />
          {isPending ? "Toevoegen..." : "Gebruiker toevoegen"}
        </Button>
      </div>
    </form>
  );
}
