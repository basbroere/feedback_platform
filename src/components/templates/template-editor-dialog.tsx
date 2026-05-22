"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createTemplate,
  updateTemplate,
} from "@/lib/templates/actions";
import { TEMPLATE_TYPE_LABEL, type TemplateType } from "@/lib/templates/types";
import type { TemplateQuestion } from "@/lib/one-on-ones/types";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS: TemplateType[] = [
  "peer_360",
  "one_on_one",
  "evaluation",
];

const KIND_OPTIONS: {
  value: TemplateQuestion["kind"];
  label: string;
  hint: string;
}[] = [
  {
    value: "rating_b_1_5",
    label: "B-rating (1-5)",
    hint: "Score op 5 B's plus verklaring.",
  },
  { value: "open", label: "Open tekst", hint: "Vrije tekst." },
  {
    value: "scale_1_5",
    label: "Schaal 1-5",
    hint: "Cijferschaal zonder iconen.",
  },
  {
    value: "choice_single",
    label: "Keuze (één)",
    hint: "Eén antwoord uit een lijst.",
  },
  {
    value: "choice_multi",
    label: "Meerkeuze",
    hint: "Meerdere antwoorden mogelijk.",
  },
];

type Props =
  | {
      mode: "create";
      triggerLabel?: string;
    }
  | {
      mode: "edit";
      templateId: string;
      initialName: string;
      initialType: TemplateType;
      initialQuestions: TemplateQuestion[];
      triggerLabel?: string;
      asMenuItem?: boolean;
    };

type DraftQuestion = TemplateQuestion & { _key: string };

function withKey(q: TemplateQuestion, idx: number): DraftQuestion {
  return { ...q, _key: `${q.id}_${idx}_${Math.random().toString(36).slice(2, 8)}` };
}

const EMPTY_DRAFT: DraftQuestion = {
  _key: "",
  id: "",
  label: "",
  kind: "rating_b_1_5",
};

export function TemplateEditorDialog(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TemplateType>(
    props.mode === "edit" ? props.initialType : "peer_360",
  );
  const [name, setName] = useState(
    props.mode === "edit" ? props.initialName : "",
  );
  const [questions, setQuestions] = useState<DraftQuestion[]>(() =>
    props.mode === "edit"
      ? props.initialQuestions.map(withKey)
      : [{ ...EMPTY_DRAFT, _key: "init" }],
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Reset bij heropen.
  useEffect(() => {
    if (!open) return;
    if (props.mode === "edit") {
      setType(props.initialType);
      setName(props.initialName);
      setQuestions(props.initialQuestions.map(withKey));
    } else {
      setType("peer_360");
      setName("");
      setQuestions([{ ...EMPTY_DRAFT, _key: "init" }]);
    }
    setError(null);
  }, [open, props]);

  function updateQ(key: string, patch: Partial<TemplateQuestion>) {
    setQuestions((p) => p.map((q) => (q._key === key ? { ...q, ...patch } : q)));
  }

  function removeQ(key: string) {
    setQuestions((p) => p.filter((q) => q._key !== key));
  }

  function move(key: string, delta: -1 | 1) {
    setQuestions((p) => {
      const idx = p.findIndex((q) => q._key === key);
      if (idx === -1) return p;
      const target = idx + delta;
      if (target < 0 || target >= p.length) return p;
      const next = [...p];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  function addQuestion() {
    setQuestions((p) => [
      ...p,
      {
        ...EMPTY_DRAFT,
        _key: Math.random().toString(36).slice(2),
      },
    ]);
  }

  function save() {
    setError(null);
    const stripped: TemplateQuestion[] = questions.map((q) => ({
      id: q.id,
      label: q.label,
      kind: q.kind,
      ...(q.hint ? { hint: q.hint } : {}),
      ...(q.required ? { required: true } : {}),
      ...(q.options && q.options.length ? { options: q.options } : {}),
    }));
    startTransition(async () => {
      try {
        if (props.mode === "edit") {
          await updateTemplate({
            id: props.templateId,
            name,
            questions: stripped,
          });
        } else {
          await createTemplate({ type, name, questions: stripped });
        }
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Opslaan mislukt");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({
            size: "sm",
            variant: props.mode === "edit" ? "ghost" : "default",
          }),
        )}
      >
        {props.mode === "create" ? (
          <Plus className="h-3.5 w-3.5" data-icon="inline-start" />
        ) : null}
        <span>{props.triggerLabel ?? (props.mode === "edit" ? "Bewerken" : "Nieuw template")}</span>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {props.mode === "edit" ? "Template bewerken" : "Nieuw template"}
          </DialogTitle>
          <DialogDescription>
            Vragen worden in de UI altijd als suggesties getoond, niet als
            verplichte invoer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="tpl-name">Naam</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bijv. 360 functioneringsgesprek"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tpl-type">Type</Label>
              <select
                id="tpl-type"
                value={type}
                disabled={props.mode === "edit"}
                onChange={(e) => setType(e.target.value as TemplateType)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {TEMPLATE_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Vragen
              </Label>
              <span className="text-[12px] text-muted-foreground">
                {questions.length}{" "}
                {questions.length === 1 ? "vraag" : "vragen"}
              </span>
            </div>
            <ul className="space-y-3">
              {questions.map((q, idx) => (
                <li
                  key={q._key}
                  className="rounded-xl border border-border bg-card p-3 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Vraag {idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => move(q._key, -1)}
                        disabled={idx === 0}
                        aria-label="Omhoog"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => move(q._key, 1)}
                        disabled={idx === questions.length - 1}
                        aria-label="Omlaag"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => removeQ(q._key)}
                        aria-label="Vraag verwijderen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5 sm:col-span-2">
                      <Label htmlFor={`q-${q._key}-label`}>Label</Label>
                      <Input
                        id={`q-${q._key}-label`}
                        value={q.label}
                        onChange={(e) =>
                          updateQ(q._key, { label: e.target.value })
                        }
                        placeholder="Bijv. Samenwerking"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor={`q-${q._key}-kind`}>Type vraag</Label>
                      <select
                        id={`q-${q._key}-kind`}
                        value={q.kind}
                        onChange={(e) =>
                          updateQ(q._key, {
                            kind: e.target.value as TemplateQuestion["kind"],
                          })
                        }
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                      >
                        {KIND_OPTIONS.map((k) => (
                          <option key={k.value} value={k.value}>
                            {k.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11.5px] text-muted-foreground">
                        {
                          KIND_OPTIONS.find((k) => k.value === q.kind)?.hint
                        }
                      </p>
                    </div>

                    <div className="grid gap-1.5">
                      <Label
                        htmlFor={`q-${q._key}-required`}
                        className="flex items-center gap-2 text-[13px]"
                      >
                        <input
                          id={`q-${q._key}-required`}
                          type="checkbox"
                          checked={!!q.required}
                          onChange={(e) =>
                            updateQ(q._key, { required: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-input"
                        />
                        Verplichte suggestie (kleine sterretje in UI)
                      </Label>
                    </div>

                    <div className="grid gap-1.5 sm:col-span-2">
                      <Label htmlFor={`q-${q._key}-hint`}>
                        Hint (optioneel)
                      </Label>
                      <Textarea
                        id={`q-${q._key}-hint`}
                        rows={2}
                        value={q.hint ?? ""}
                        onChange={(e) =>
                          updateQ(q._key, { hint: e.target.value })
                        }
                        placeholder="Korte uitleg of voorbeeld onder de vraag."
                      />
                    </div>

                    {(q.kind === "choice_single" ||
                      q.kind === "choice_multi") ? (
                      <div className="grid gap-1.5 sm:col-span-2">
                        <Label htmlFor={`q-${q._key}-options`}>
                          Opties (één per regel)
                        </Label>
                        <Textarea
                          id={`q-${q._key}-options`}
                          rows={3}
                          value={(q.options ?? []).join("\n")}
                          onChange={(e) =>
                            updateQ(q._key, {
                              options: e.target.value
                                .split(/\r?\n/)
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addQuestion}
              className="w-fit"
            >
              <Plus className="h-3.5 w-3.5" data-icon="inline-start" />
              Vraag toevoegen
            </Button>
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
          <Button size="sm" onClick={save} disabled={isPending}>
            {isPending ? "Bezig..." : "Opslaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
