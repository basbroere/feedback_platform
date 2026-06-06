"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { forceStartPerformanceReviewMeeting } from "@/lib/performance-reviews/actions";

export function StartMeetingButton({
  performanceReviewId,
  missingInputs,
}: {
  performanceReviewId: string;
  missingInputs: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    startTransition(async () => {
      try {
        await forceStartPerformanceReviewMeeting({ performanceReviewId });
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Starten mislukt");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500/40"
      >
        <PlayCircle className="h-4 w-4" />
        Gesprek starten
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gesprek nu starten?</DialogTitle>
          <DialogDescription>
            Niet alle feedback is binnen. Als je nu start, ga je het gesprek
            voeren met de input die er op dit moment is.
          </DialogDescription>
        </DialogHeader>
        {missingInputs.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-[13px] text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <p className="font-medium">Nog niet binnen:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {missingInputs.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
        <DialogFooter>
          <DialogClose
            disabled={isPending}
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            Annuleren
          </DialogClose>
          <Button
            type="button"
            onClick={confirm}
            disabled={isPending}
            className="bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500/40"
          >
            {isPending ? "Bezig..." : "Ja, gesprek starten"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
