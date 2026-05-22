"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTeam } from "@/lib/hr/admin-actions";

export function CreateTeamForm({
  managers,
}: {
  managers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [leadUserId, setLeadUserId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setOkMessage(null);
    startTransition(async () => {
      try {
        await createTeam({
          name,
          leadUserId: leadUserId === "" ? null : leadUserId,
        });
        setOkMessage(`${name.trim()} is aangemaakt`);
        setName("");
        setLeadUserId("");
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
          <Label htmlFor="team-name">Teamnaam</Label>
          <Input
            id="team-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bijv. Partner Happiness"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="team-lead">Teamlead</Label>
          <select
            id="team-lead"
            value={leadUserId}
            onChange={(e) => setLeadUserId(e.target.value)}
            disabled={isPending}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Nog geen lead</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
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
          {isPending ? "Aanmaken..." : "Team aanmaken"}
        </Button>
      </div>
    </form>
  );
}
