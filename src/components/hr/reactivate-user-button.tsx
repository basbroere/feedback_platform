"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { reactivateUser } from "@/lib/hr/offboarding-actions";

export function ReactivateUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      try {
        await reactivateUser({ userId });
        router.refresh();
        router.push("/beheer/personen");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Reactiveren mislukt");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <UserPlus className="h-4 w-4" strokeWidth={1.75} />
        Reactiveer medewerker
      </Button>

      {open ? (
        <Dialog open onOpenChange={(o) => setOpen(o)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{userName} reactiveren?</DialogTitle>
              <DialogDescription>
                De medewerker verschijnt weer in alle overzichten en de
                persona-switcher. Lopend werk dat eerder is afgesloten blijft
                afgesloten. Plan nieuwe gesprekken wanneer dat past.
              </DialogDescription>
            </DialogHeader>

            {error ? (
              <p className="text-[13px] text-destructive">{error}</p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Annuleren
              </Button>
              <Button type="button" onClick={confirm} disabled={isPending}>
                {isPending ? "Bezig..." : "Ja, reactiveer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
