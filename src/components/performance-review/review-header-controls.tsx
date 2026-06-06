"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deletePerformanceReview,
  reschedulePerformanceReview,
  updatePerformanceReviewSubject,
} from "@/lib/performance-reviews/actions";

function toDateTimeLocalValue(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ReviewSubjectInput({
  performanceReviewId,
  initialSubject,
  employeeName,
  disabled = false,
}: {
  performanceReviewId: string;
  initialSubject: string | null;
  employeeName: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialSubject ?? "");
  const [saving, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(initialSubject ?? "");
  }, [initialSubject]);

  function persist() {
    const trimmed = value.trim();
    if (trimmed === (initialSubject ?? "").trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await updatePerformanceReviewSubject({
          performanceReviewId,
          subject: trimmed,
        });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Opslaan mislukt");
        setValue(initialSubject ?? "");
      }
    });
  }

  return (
    <div className="space-y-1">
      <div className="group/title relative max-w-2xl">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={persist}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setValue(initialSubject ?? "");
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder={`360 functioneringsgesprek met ${employeeName}`}
          aria-label="Titel van dit functioneringsgesprek"
          maxLength={120}
          disabled={disabled || saving}
          className="block w-full border-0 border-b border-dashed border-border bg-transparent px-0 py-0.5 pr-7 text-[24px] font-semibold leading-tight tracking-tight outline-none placeholder:text-muted-foreground/60 hover:border-foreground/40 focus:border-solid focus:border-ring focus:placeholder:text-muted-foreground/40 disabled:cursor-not-allowed disabled:border-transparent disabled:opacity-100"
        />
        {!disabled ? (
          <Pencil
            aria-hidden
            className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-hover/title:text-muted-foreground group-focus-within/title:text-ring"
          />
        ) : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function ReviewActionsMenu({
  performanceReviewId,
  employeeId,
  scheduledAt,
}: {
  performanceReviewId: string;
  employeeId: string;
  scheduledAt: string | null;
}) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setRescheduleOpen(true)}
          aria-label="Datum aanpassen"
          title="Datum aanpassen"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <CalendarClock className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          aria-label="Functioneringsgesprek verwijderen"
          title="Verwijderen"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        performanceReviewId={performanceReviewId}
        scheduledAt={scheduledAt}
      />
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        performanceReviewId={performanceReviewId}
        employeeId={employeeId}
      />
    </>
  );
}

function RescheduleDialog({
  open,
  onOpenChange,
  performanceReviewId,
  scheduledAt,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  performanceReviewId: string;
  scheduledAt: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(toDateTimeLocalValue(scheduledAt));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!value) {
      setError("Kies een datum en tijd.");
      return;
    }
    const iso = new Date(value).toISOString();
    startTransition(async () => {
      try {
        await reschedulePerformanceReview({
          performanceReviewId,
          scheduledAt: iso,
        });
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Verplaatsen mislukt");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
        if (next) setValue(toDateTimeLocalValue(scheduledAt));
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Datum aanpassen</DialogTitle>
          <DialogDescription>
            Kies een nieuw moment voor het gesprek. Alle voorbereiding blijft
            bewaard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="pr-reschedule_at">Datum en tijd</Label>
          <Input
            id="pr-reschedule_at"
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isPending}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter className="flex flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuleer
          </Button>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? "Opslaan..." : "Opslaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  open,
  onOpenChange,
  performanceReviewId,
  employeeId,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  performanceReviewId: string;
  employeeId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await deletePerformanceReview(performanceReviewId);
        onOpenChange(false);
        router.push(`/team/${employeeId}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Verwijderen mislukt");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Functioneringsgesprek verwijderen?</DialogTitle>
          <DialogDescription>
            De voorbereiding, peer-feedback, upward feedback en open actiepunten
            uit dit gesprek worden ook verwijderd. Dit kan niet ongedaan worden
            gemaakt.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter className="flex flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuleer
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={submit}
            disabled={isPending}
          >
            {isPending ? "Verwijderen..." : "Ja, verwijderen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
