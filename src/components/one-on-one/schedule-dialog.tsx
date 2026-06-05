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
import type { PersonRef } from "@/lib/one-on-ones/types";
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

type Props =
  | {
      employeeId: string;
      employeeName: string;
      teamMembers?: undefined;
      triggerLabel?: string;
      triggerVariant?: "default" | "outline" | "secondary" | "ghost";
    }
  | {
      employeeId?: undefined;
      employeeName?: undefined;
      teamMembers: PersonRef[];
      triggerLabel?: string;
      triggerVariant?: "default" | "outline" | "secondary" | "ghost";
    };

export function ScheduleDialog(props: Props) {
  const {
    employeeId: fixedEmployeeId,
    employeeName: fixedEmployeeName,
    teamMembers,
    triggerLabel = "Nieuwe 1-op-1",
    triggerVariant = "outline",
  } = props;

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    fixedEmployeeId ?? teamMembers?.[0]?.id ?? "",
  );
  const [value, setValue] = useState(defaultScheduledAt());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const targetName =
    fixedEmployeeName ??
    teamMembers?.find((m) => m.id === selectedEmployeeId)?.name ??
    "een teamlid";

  function submit() {
    setError(null);
    const employeeId = fixedEmployeeId ?? selectedEmployeeId;
    if (!employeeId) {
      setError("Kies een teamlid.");
      return;
    }
    if (!value) {
      setError("Kies een datum en tijd.");
      return;
    }
    const iso = new Date(value).toISOString();
    startTransition(async () => {
      try {
        const { id } = await createOneOnOne({
          employeeId,
          scheduledAt: iso,
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
          <DialogTitle>
            {fixedEmployeeName
              ? `Nieuwe 1-op-1 met ${fixedEmployeeName}`
              : "Nieuwe 1-op-1"}
          </DialogTitle>
          <DialogDescription>
            {fixedEmployeeName
              ? `Kies een datum en tijd. ${fixedEmployeeName} krijgt de mogelijkheid om zich voor te bereiden.`
              : "Kies een teamlid en een moment. Het teamlid krijgt de mogelijkheid om zich voor te bereiden."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {!fixedEmployeeId && teamMembers ? (
            <div className="grid gap-2">
              <Label htmlFor="employee">Teamlid</Label>
              {teamMembers.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">
                  Je hebt nog geen teamleden.
                </p>
              ) : (
                <select
                  id="employee"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="scheduled_at">Datum en tijd</Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          {!fixedEmployeeName && selectedEmployeeId ? (
            <p className="text-[12.5px] text-muted-foreground">
              {targetName} krijgt na opslaan de uitnodiging om voor te bereiden.
            </p>
          ) : null}

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
