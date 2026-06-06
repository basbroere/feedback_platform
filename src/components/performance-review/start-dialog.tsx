"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { startPerformanceReview } from "@/lib/performance-reviews/actions";
import type { PerformanceReviewTemplate } from "@/lib/performance-reviews/types";
import type { PersonRef } from "@/lib/one-on-ones/types";
import { cn } from "@/lib/utils";

function defaultScheduledAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props =
  | {
      employeeId: string;
      employeeName: string;
      teamMembers?: undefined;
      templates: PerformanceReviewTemplate[];
      triggerLabel?: string;
      triggerVariant?: "default" | "outline" | "secondary" | "ghost";
    }
  | {
      employeeId?: undefined;
      employeeName?: undefined;
      teamMembers: PersonRef[];
      templates: PerformanceReviewTemplate[];
      triggerLabel?: string;
      triggerVariant?: "default" | "outline" | "secondary" | "ghost";
    };

export function StartPerformanceReviewDialog(props: Props) {
  const {
    employeeId: fixedEmployeeId,
    employeeName: fixedEmployeeName,
    teamMembers,
    templates,
    triggerLabel = "Functioneringsgesprek starten",
    triggerVariant = "outline",
  } = props;

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    fixedEmployeeId ?? teamMembers?.[0]?.id ?? "",
  );
  const [templateId, setTemplateId] = useState<string>(
    templates[0]?.id ?? "",
  );
  const [scheduledAt, setScheduledAt] = useState<string>(defaultScheduledAt());
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
    if (!scheduledAt) {
      setError("Kies een datum en tijd.");
      return;
    }
    startTransition(async () => {
      try {
        const { id } = await startPerformanceReview({
          employeeId,
          templateId: templateId || null,
          scheduledAt: new Date(scheduledAt).toISOString(),
        });
        setOpen(false);
        router.push(`/functioneringsgesprek/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Starten mislukt");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(buttonVariants({ variant: triggerVariant, size: "sm" }))}
      >
        <ClipboardCheck className="h-3.5 w-3.5" data-icon="inline-start" />
        <span>{triggerLabel}</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {fixedEmployeeName
              ? `360 functioneringsgesprek met ${fixedEmployeeName}`
              : "360 functioneringsgesprek starten"}
          </DialogTitle>
          <DialogDescription>
            Drie perspectieven op hetzelfde template: {targetName} reflecteert
            op zichzelf, kiest één collega voor peer-feedback, en jij vult als
            manager dezelfde 360-vragen in. Voltooide actiepunten en ontvangen
            feedback van het afgelopen half jaar staan straks naast elkaar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {!fixedEmployeeId && teamMembers ? (
            <div className="grid gap-2">
              <Label htmlFor="pr-employee">Teamlid</Label>
              {teamMembers.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">
                  Je hebt nog geen teamleden.
                </p>
              ) : (
                <select
                  id="pr-employee"
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
            <Label htmlFor="pr-date">Datum en tijd</Label>
            <input
              id="pr-date"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
            <p className="text-[12.5px] text-muted-foreground">
              Je kunt dit later nog wijzigen.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pr-template">Template</Label>
            <select
              id="pr-template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={templates.length === 0}
            >
              {templates.length === 0 ? (
                <option value="">Geen template beschikbaar</option>
              ) : (
                templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))
              )}
            </select>
            <p className="text-[12.5px] text-muted-foreground">
              Vragen zijn suggesties. Je kunt later in het gesprek alles
              aanpassen.
            </p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <DialogClose
            disabled={isPending}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Annuleer
          </DialogClose>
          <Button size="sm" onClick={submit} disabled={isPending}>
            {isPending ? "Starten..." : "Starten"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
