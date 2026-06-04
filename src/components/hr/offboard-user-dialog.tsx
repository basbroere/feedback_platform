"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getOffboardingImpact,
  offboardUser,
} from "@/lib/hr/offboarding-actions";
import type { OffboardingImpact } from "@/lib/hr/offboarding-types";

function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function impactLines(impact: OffboardingImpact): string[] {
  const lines: string[] = [];
  if (impact.openActionItems > 0) {
    lines.push(
      `${impact.openActionItems} open actiepunt${impact.openActionItems === 1 ? "" : "en"} worden afgesloten`,
    );
  }
  if (impact.openOneOnOnes > 0) {
    lines.push(
      `${impact.openOneOnOnes} lopende 1-op-1${impact.openOneOnOnes === 1 ? "" : "'s"} worden afgerond`,
    );
  }
  if (impact.openPerformanceReviews > 0) {
    lines.push(
      `${impact.openPerformanceReviews} lopend${impact.openPerformanceReviews === 1 ? "" : "e"} functioneringsgesprek${impact.openPerformanceReviews === 1 ? "" : "ken"} worden geannuleerd`,
    );
  }
  if (impact.openEvaluations > 0) {
    lines.push(
      `${impact.openEvaluations} lopend${impact.openEvaluations === 1 ? "" : "e"} beoordelingsgesprek${impact.openEvaluations === 1 ? "" : "ken"} worden afgesloten`,
    );
  }
  if (impact.pendingFeedback > 0) {
    lines.push(
      `${impact.pendingFeedback} openstaand${impact.pendingFeedback === 1 ? "" : "e"} feedback-verzoek${impact.pendingFeedback === 1 ? "" : "en"} worden afgewezen`,
    );
  }
  if (impact.teamsLed > 0) {
    lines.push(
      `${impact.teamsLed} team${impact.teamsLed === 1 ? "" : "s"} ${impact.teamsLed === 1 ? "verliest" : "verliezen"} hun teamlead, kies later een nieuwe`,
    );
  }
  return lines;
}

export function OffboardUserDialog({
  userId,
  userName,
  onClose,
}: {
  userId: string;
  userName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [leftAt, setLeftAt] = useState(todayIso());
  const [impact, setImpact] = useState<OffboardingImpact | null>(null);
  const [impactLoading, setImpactLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setImpactLoading(true);
    getOffboardingImpact(userId)
      .then((result) => {
        if (!cancelled) setImpact(result);
      })
      .catch(() => {
        if (!cancelled) setImpact(null);
      })
      .finally(() => {
        if (!cancelled) setImpactLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  function confirm() {
    setError(null);
    startTransition(async () => {
      try {
        await offboardUser({ userId, leftAt });
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Uit dienst zetten mislukt");
      }
    });
  }

  const lines = impact ? impactLines(impact) : [];

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{userName} uit dienst zetten</DialogTitle>
          <DialogDescription>
            De medewerker verdwijnt uit alle actieve overzichten. Het dossier
            blijft bewaard onder Beheer · Uit dienst. Reactiveren kan altijd
            later.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirm();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="left-at">Laatste werkdag</Label>
            <Input
              id="left-at"
              type="date"
              value={leftAt}
              onChange={(e) => setLeftAt(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 dark:border-amber-900/60 dark:bg-amber-950/30">
            <div className="flex items-start gap-2.5">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                strokeWidth={2}
              />
              <div className="space-y-1.5">
                <p className="text-[13px] font-medium text-amber-900 dark:text-amber-200">
                  Wat er gebeurt
                </p>
                {impactLoading ? (
                  <p className="flex items-center gap-1.5 text-[12.5px] text-amber-800/80 dark:text-amber-300/80">
                    <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                    Lopend werk inventariseren...
                  </p>
                ) : lines.length === 0 ? (
                  <p className="text-[12.5px] text-amber-800/80 dark:text-amber-300/80">
                    Geen lopend werk gevonden. Alleen het account wordt op uit
                    dienst gezet.
                  </p>
                ) : (
                  <ul className="space-y-0.5 text-[12.5px] text-amber-800/90 dark:text-amber-300/90">
                    {lines.map((line) => (
                      <li key={line}>· {line}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {error ? (
            <p className="text-[13px] text-destructive">{error}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
            >
              Annuleren
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Bezig..." : "Ja, uit dienst zetten"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
