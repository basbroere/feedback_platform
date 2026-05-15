"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOneOnOne } from "@/lib/one-on-ones/actions";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type RecurrenceOption = "once" | "weekly" | "biweekly" | "monthly";

const RECURRENCE_LABELS: Record<RecurrenceOption, string> = {
  once: "Eenmalig",
  weekly: "Elke week",
  biweekly: "Elke 2 weken",
  monthly: "Elke 4 weken",
};

const RECURRENCE_INTERVAL: Record<
  Exclude<RecurrenceOption, "once">,
  1 | 2 | 4
> = {
  weekly: 1,
  biweekly: 2,
  monthly: 4,
};

const RECURRING_OCCURRENCES = 6;

function defaultScheduledAt(): string {
  const now = new Date();
  // Volgende werkdag om 10:00.
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  // Formatteer als YYYY-MM-DDTHH:mm zonder seconden.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleDialog({
  employeeId,
  employeeName,
  triggerLabel = "Nieuwe 1-op-1",
  triggerVariant = "outline",
}: {
  employeeId: string;
  employeeName: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultScheduledAt());
  const [recurrence, setRecurrence] = useState<RecurrenceOption>("biweekly");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const lastOccurrenceLabel = useMemo(() => {
    if (recurrence === "once" || !value) return null;
    const interval = RECURRENCE_INTERVAL[recurrence];
    const start = new Date(value);
    if (Number.isNaN(start.getTime())) return null;
    const last = new Date(start);
    last.setDate(last.getDate() + interval * 7 * (RECURRING_OCCURRENCES - 1));
    return formatDate(last);
  }, [recurrence, value]);

  function submit() {
    setError(null);
    if (!value) {
      setError("Kies een datum en tijd.");
      return;
    }
    const iso = new Date(value).toISOString();
    const recurrencePayload =
      recurrence === "once"
        ? null
        : {
            intervalWeeks: RECURRENCE_INTERVAL[recurrence],
            occurrences: RECURRING_OCCURRENCES,
          };
    startTransition(async () => {
      try {
        const { id } = await createOneOnOne({
          employeeId,
          scheduledAt: iso,
          recurrence: recurrencePayload,
        });
        setOpen(false);
        router.push(`/een-op-een/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Er ging iets mis");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(buttonVariants({ variant: triggerVariant, size: "sm" }))}
      >
        <Plus className="h-3.5 w-3.5" data-icon="inline-start" />
        <span>{triggerLabel}</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe 1-op-1 met {employeeName}</DialogTitle>
          <DialogDescription>
            Kies een datum en tijd. {employeeName} krijgt de mogelijkheid om
            zich voor te bereiden.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="scheduled_at">Datum en tijd</Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="recurrence">Herhalen</Label>
            <select
              id="recurrence"
              value={recurrence}
              onChange={(e) =>
                setRecurrence(e.target.value as RecurrenceOption)
              }
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {(Object.keys(RECURRENCE_LABELS) as RecurrenceOption[]).map(
                (key) => (
                  <option key={key} value={key}>
                    {RECURRENCE_LABELS[key]}
                  </option>
                ),
              )}
            </select>
            {recurrence !== "once" && lastOccurrenceLabel ? (
              <p className="text-[12.5px] text-muted-foreground">
                We plannen {RECURRING_OCCURRENCES} momenten op dezelfde tijd,
                tot en met {lastOccurrenceLabel}. Verschuiven of laten vervallen
                kan per moment.
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </div>
        <DialogFooter>
          <DialogClose
            disabled={isPending}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Annuleer
          </DialogClose>
          <Button size="sm" onClick={submit} disabled={isPending}>
            {isPending ? "Inplannen..." : "Inplannen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
