"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  declineFeedbackRequest,
  submitFeedbackResponse,
} from "@/lib/feedback/actions";
import type { FeedbackStatus, FeedbackTemplate } from "@/lib/feedback/types";
import type { PersonRef } from "@/lib/one-on-ones/types";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";

export function RespondForm({
  feedbackId,
  requester,
  prompt,
  template,
  initialResponses,
  status,
}: {
  feedbackId: string;
  requester: PersonRef;
  prompt: string | null;
  template: FeedbackTemplate | null;
  initialResponses: Record<string, string>;
  status: FeedbackStatus;
}) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, string>>(
    initialResponses ?? {},
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const readOnly = status !== "requested";

  function update(qid: string, value: string) {
    setResponses((prev) => ({ ...prev, [qid]: value }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await submitFeedbackResponse({ feedbackId, responses });
        router.push("/dashboard");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Versturen mislukt");
      }
    });
  }

  function decline() {
    setError(null);
    startTransition(async () => {
      try {
        await declineFeedbackRequest({ feedbackId });
        router.push("/dashboard");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Mislukt");
      }
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-[15px]">
            <PersonAvatar
              id={requester.id}
              name={requester.name}
              avatarUrl={requester.avatar_url}
              size="sm"
            />
            <span>Aanvraag van {requester.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {prompt ? (
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
              <p className="text-[12px] font-medium text-muted-foreground">
                Waar wil {requester.name.split(" ")[0]} feedback op?
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[14px] text-foreground/90">
                {prompt}
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">
              Geen specifieke context meegegeven, dus deel wat jij relevant
              vindt voor {requester.name.split(" ")[0]}.
            </p>
          )}
          {template ? (
            <p className="text-[12px] text-muted-foreground">
              Template: <span className="font-medium text-foreground/80">{template.name}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      {readOnly ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Je hebt dit verzoek al afgerond.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Jouw feedback</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={decline}
              disabled={isPending}
              type="button"
            >
              Ik geef geen feedback
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {template ? (
              template.questions.map((q) => (
                <div key={q.id} className="space-y-1.5">
                  <Label htmlFor={`q-${q.id}`}>
                    {q.label}
                    {q.required ? (
                      <span className="ml-1 text-muted-foreground">*</span>
                    ) : null}
                  </Label>
                  {q.hint ? (
                    <p className="text-[12px] text-muted-foreground">
                      {q.hint}
                    </p>
                  ) : null}
                  <Textarea
                    id={`q-${q.id}`}
                    value={responses[q.id] ?? ""}
                    onChange={(e) => update(q.id, e.target.value)}
                    placeholder="Typ hier je antwoord"
                    rows={3}
                    disabled={isPending}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Geen template gekoppeld. Vraag de aanvrager om het opnieuw te
                versturen.
              </p>
            )}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button onClick={submit} disabled={isPending || !template}>
                {isPending ? "Versturen..." : "Verstuur naar " + requester.name.split(" ")[0]}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
