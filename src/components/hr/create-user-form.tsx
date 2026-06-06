"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { createUser } from "@/lib/hr/admin-actions";
import { ROLE_OPTIONS } from "@/lib/hr/roles";
import type { UserRole } from "@/lib/persona/types";

const SELECT_CLS =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

export function AddPersonSheet({
  teams,
}: {
  teams: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("employee");
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamId, setTeamId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setEmail("");
    setRole("employee");
    setIsAdmin(false);
    setTeamId("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await createUser({
          name,
          email,
          role,
          is_admin: isAdmin,
          teamId: teamId === "" ? null : teamId,
        });
        router.refresh();
        handleOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Aanmaken mislukt");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Nieuwe medewerker
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="data-[side=right]:sm:max-w-[420px] overflow-y-auto p-0">
          <SheetHeader className="border-b border-border/50 px-6 pb-4 pt-6">
            <SheetTitle className="text-[20px] font-bold">Nieuwe medewerker</SheetTitle>
            <SheetDescription className="sr-only">
              Vul de gegevens in van de nieuwe medewerker.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex flex-col gap-6 px-6 py-6"
          >
            <section className="space-y-4">
              <p className="text-[11.5px] font-medium font-heading text-primary/80">
                Basisgegevens
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="user-name">Naam</Label>
                <Input
                  id="user-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Volledige naam"
                  disabled={isPending}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-email">E-mail</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="naam@bambelo.com"
                  disabled={isPending}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-role">Rol</Label>
                <select
                  id="user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  disabled={isPending}
                  className={SELECT_CLS}
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
                  className={SELECT_CLS}
                >
                  <option value="">Geen team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  id="user-admin"
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <Label htmlFor="user-admin" className="cursor-pointer font-normal">
                  HR (templates, kennisbank en gebruikersbeheer)
                </Label>
              </div>
            </section>

            {error ? (
              <p className="text-[13px] text-destructive">{error}</p>
            ) : null}

            <SheetFooter className="p-0">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Toevoegen..." : "Medewerker toevoegen"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
