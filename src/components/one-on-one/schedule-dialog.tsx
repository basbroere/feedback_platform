"use client";

import { useState, useTransition } from "react";
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
import { cn } from "@/lib/utils";

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
        const { id } = await createOneOnOne({ employeeId, scheduledAt: iso });
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
        <div className="grid gap-2">
          <Label htmlFor="scheduled_at">Datum en tijd</Label>
          <Input
            id="scheduled_at"
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
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
