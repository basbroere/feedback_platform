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
import { createTeam } from "@/lib/hr/admin-actions";

export function AddTeamSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
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
        await createTeam({ name, leadUserId: null });
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
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-700"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Nieuw team
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="data-[side=right]:sm:max-w-[420px] overflow-y-auto p-0">
          <SheetHeader className="border-b border-border/50 px-6 pb-4 pt-6">
            <SheetTitle className="text-[20px] font-bold">Nieuw team</SheetTitle>
            <SheetDescription className="sr-only">
              Geef het team een naam om het aan te maken.
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600/80">
                Teamgegevens
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="team-name">Teamnaam</Label>
                <Input
                  id="team-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bijv. Partner Happiness"
                  disabled={isPending}
                  required
                />
              </div>

              <p className="text-[12px] text-muted-foreground">
                De manager van dit team wordt automatisch teamlead. Leden voeg je toe via Personen.
              </p>
            </section>

            {error ? (
              <p className="text-[13px] text-destructive">{error}</p>
            ) : null}

            <SheetFooter className="p-0">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isPending ? "Aanmaken..." : "Team aanmaken"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
