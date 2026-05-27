"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { finalizeEmployeePreparation } from "@/lib/performance-reviews/actions";
import { useState } from "react";

export function FinalizePreparationButton({
  performanceReviewId,
  canFinalize,
}: {
  performanceReviewId: string;
  canFinalize: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function finalize() {
    setError(null);
    startTransition(async () => {
      try {
        await finalizeEmployeePreparation({ performanceReviewId });
        router.push(`/functioneringsgesprek/${performanceReviewId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Afronden mislukt");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={finalize}
        disabled={!canFinalize || isPending}
        className="gap-2"
      >
        <CheckCircle2 className="h-4 w-4" />
        {isPending ? "Bezig..." : "Voorbereiding afronden"}
      </Button>
      {!canFinalize && (
        <p className="text-[12.5px] text-muted-foreground">
          Kies eerst een peer-reviewer en vul minimaal één vraag in.
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
