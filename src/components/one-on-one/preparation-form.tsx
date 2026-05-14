"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveEmployeePreparation } from "@/lib/one-on-ones/actions";
import type { ActionItem, OneOnOneTemplate } from "@/lib/one-on-ones/types";
import { cn } from "@/lib/utils";

type Status = "open" | "completed" | "expired";

export function PreparationForm({
  oneOnOneId,
  template,
  initialAnswers,
  previousActionItems,
  redirectTo,
}: {
  oneOnOneId: string;
  template: OneOnOneTemplate | null;
  initialAnswers: Record<string, string>;
  previousActionItems: ActionItem[];
  redirectTo: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(
    initialAnswers ?? {},
  );
  const [items, setItems] = useState(previousActionItems);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function updateAnswer(qid: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  function submit() {
    setError(null);
    setSaved(false);
    const updates = items
      .filter((it) => it.status !== previousActionItems.find((p) => p.id === it.id)?.status)
      .map((it) => ({ id: it.id, status: it.status as Status }));
    startTransition(async () => {
      try {
        await saveEmployeePreparation({
          oneOnOneId,
          answers,
          actionItemUpdates: updates,
        });
        setSaved(true);
        router.push(redirectTo);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Opslaan mislukt");
      }
    });
  }

  return (
    <div className="space-y-8">
      {previousActionItems.length > 0 ? (
        <section className="space-y-3">
          <header>
            <h2 className="text-[15px] font-semibold tracking-tight">
              Actiepunten van vorige keer
            </h2>
            <p className="text-[13px] text-muted-foreground">
              Update gerust de status, dan zien jullie het meteen samen.
            </p>
          </header>
          <PreparationActionItems items={items} onChange={setItems} />
        </section>
      ) : null}

      <section className="space-y-3">
        <header>
          <h2 className="text-[15px] font-semibold tracking-tight">
            Voorbereiding
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Vragen zijn suggesties. Vul aan waar je iets te zeggen hebt.
          </p>
        </header>

        {template ? (
          <div className="space-y-5">
            {template.questions.map((q) => (
              <div key={q.id} className="space-y-1.5">
                <Label htmlFor={`q-${q.id}`}>{q.label}</Label>
                <Textarea
                  id={`q-${q.id}`}
                  rows={3}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => updateAnswer(q.id, e.target.value)}
                  placeholder="Wat wil je hierover delen?"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Geen template gekoppeld aan deze 1-op-1.
          </p>
        )}
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={isPending}>
          {isPending ? "Bezig..." : "Opslaan"}
        </Button>
        {saved ? (
          <span className="text-sm text-muted-foreground">Opgeslagen.</span>
        ) : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </div>
  );
}

function PreparationActionItems({
  items,
  onChange,
}: {
  items: ActionItem[];
  onChange: (items: ActionItem[]) => void;
}) {
  function setStatus(id: string, status: Status) {
    onChange(
      items.map((it) => (it.id === id ? { ...it, status } : it)),
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
        Geen openstaande actiepunten van eerder.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const completed = item.status === "completed";
        const expired = item.status === "expired";
        return (
          <li
            key={item.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3",
              (completed || expired) && "opacity-70",
            )}
          >
            <button
              type="button"
              aria-label={
                completed ? "Markeer als open" : "Markeer als afgerond"
              }
              onClick={() => setStatus(item.id, completed ? "open" : "completed")}
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                completed
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-border bg-background text-transparent hover:border-foreground/30",
              )}
            >
              <Check className="h-3 w-3" strokeWidth={2.5} />
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-[14px] leading-snug",
                  completed && "text-muted-foreground line-through",
                  expired && "text-muted-foreground italic",
                )}
              >
                {item.description}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

