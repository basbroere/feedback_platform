"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil } from "lucide-react";
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
import {
  PERFORMANCE_REVIEW_SECTION_KEYS,
  PERFORMANCE_REVIEW_SECTION_LABEL,
  TEMPLATE_TYPE_LABEL,
  type PerformanceReviewBundleSections,
  type PerformanceReviewSectionKey,
  type TemplateType,
} from "@/lib/templates/types";
import type { TemplateQuestion } from "@/lib/one-on-ones/types";
import { cn } from "@/lib/utils";
import {
  TemplateSectionStepper,
  type SectionFilledMap,
} from "./template-section-stepper";

const TYPE_OPTIONS: TemplateType[] = [
  "performance_review_bundle",
  "peer_feedback",
  "one_on_one",
  "evaluation",
];

const SECTION_DESCRIPTIONS: Record<PerformanceReviewSectionKey, string> = {
  self_reflection:
    "Vragen waarmee de medewerker reflecteert op zichzelf voorafgaand aan het gesprek.",
  peer_360:
    "Vragen die een collega (1 peer) beantwoordt over de medewerker. Sta cross-team feedback expliciet toe.",
  manager_prep:
    "Vragen waarmee de manager zijn eigen feedback en observaties op een rij zet.",
  upward:
    "Vragen waarmee de medewerker optioneel feedback teruggeeft aan de manager.",
};

const KIND_OPTIONS: {
  value: TemplateQuestion["kind"];
  label: string;
  hint: string;
}[] = [
  {
    value: "rating_b_1_5",
    label: "Bamback-schaal",
    hint: "Score op 5 B's plus verklaring.",
  },
  { value: "open", label: "Open tekst", hint: "Vrije tekst." },
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
      initialSections: PerformanceReviewBundleSections | null;
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

function emptySectionDraft(): Record<
  PerformanceReviewSectionKey,
  DraftQuestion[]
> {
  return {
    self_reflection: [{ ...EMPTY_DRAFT, _key: "init_self" }],
    peer_360: [{ ...EMPTY_DRAFT, _key: "init_peer" }],
    manager_prep: [{ ...EMPTY_DRAFT, _key: "init_mgr" }],
    upward: [{ ...EMPTY_DRAFT, _key: "init_upward" }],
  };
}

function sectionsFromInitial(
  initial: PerformanceReviewBundleSections | null,
): Record<PerformanceReviewSectionKey, DraftQuestion[]> {
  if (!initial) return emptySectionDraft();
  const out = {} as Record<PerformanceReviewSectionKey, DraftQuestion[]>;
  for (const key of PERFORMANCE_REVIEW_SECTION_KEYS) {
    const arr = initial[key] ?? [];
    out[key] = arr.length
      ? arr.map(withKey)
      : [{ ...EMPTY_DRAFT, _key: `init_${key}` }];
  }
  return out;
}

export function TemplateEditorDialog(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TemplateType>(
    props.mode === "edit" ? props.initialType : "performance_review_bundle",
  );
  const [name, setName] = useState(
    props.mode === "edit" ? props.initialName : "",
  );
  const [questions, setQuestions] = useState<DraftQuestion[]>(() =>
    props.mode === "edit"
      ? props.initialQuestions.map(withKey)
      : [{ ...EMPTY_DRAFT, _key: "init" }],
  );
  const [sections, setSections] = useState<
    Record<PerformanceReviewSectionKey, DraftQuestion[]>
  >(() =>
    props.mode === "edit"
      ? sectionsFromInitial(props.initialSections)
      : emptySectionDraft(),
  );
  const [activeSection, setActiveSection] =
    useState<PerformanceReviewSectionKey>("self_reflection");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isBundle = type === "performance_review_bundle";

  // Reset bij heropen.
  useEffect(() => {
    if (!open) return;
    if (props.mode === "edit") {
      setType(props.initialType);
      setName(props.initialName);
      setQuestions(props.initialQuestions.map(withKey));
      setSections(sectionsFromInitial(props.initialSections));
    } else {
      setType("performance_review_bundle");
      setName("");
      setQuestions([{ ...EMPTY_DRAFT, _key: "init" }]);
      setSections(emptySectionDraft());
    }
    setActiveSection("self_reflection");
    setError(null);
  }, [open, props]);

  const activeQuestions = isBundle ? sections[activeSection] : questions;
  const sectionFilled: SectionFilledMap = useMemo(() => {
    const out = {} as SectionFilledMap;
    for (const key of PERFORMANCE_REVIEW_SECTION_KEYS) {
      out[key] = sections[key].some((q) => q.label.trim().length > 0);
    }
    return out;
  }, [sections]);
  const allSectionsFilled =
    sectionFilled.self_reflection &&
    sectionFilled.peer_360 &&
    sectionFilled.manager_prep &&
    sectionFilled.upward;

  function patchActive(updater: (qs: DraftQuestion[]) => DraftQuestion[]) {
    if (isBundle) {
      setSections((prev) => ({
        ...prev,
        [activeSection]: updater(prev[activeSection]),
      }));
    } else {
      setQuestions((prev) => updater(prev));
    }
  }

  function updateQ(key: string, patch: Partial<TemplateQuestion>) {
    patchActive((p) => p.map((q) => (q._key === key ? { ...q, ...patch } : q)));
  }

  function removeQ(key: string) {
    patchActive((p) => p.filter((q) => q._key !== key));
  }

  function move(key: string, delta: -1 | 1) {
    patchActive((p) => {
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
    patchActive((p) => [
      ...p,
      { ...EMPTY_DRAFT, _key: Math.random().toString(36).slice(2) },
    ]);
  }

  function stripDraft(q: DraftQuestion): TemplateQuestion {
    return {
      id: q.id,
      label: q.label,
      kind: q.kind,
      ...(q.hint ? { hint: q.hint } : {}),
      ...(q.required ? { required: true } : {}),
      ...(q.options && q.options.length ? { options: q.options } : {}),
    };
  }

  function save() {
    setError(null);
    if (isBundle) {
      if (!allSectionsFilled) {
        setError(
          "Vul minstens één vraag in voor elk van de vier stappen voordat je publiceert.",
        );
        return;
      }
      const sectionPayload = {} as Record<
        PerformanceReviewSectionKey,
        TemplateQuestion[]
      >;
      for (const key of PERFORMANCE_REVIEW_SECTION_KEYS) {
        sectionPayload[key] = sections[key]
          .filter((q) => q.label.trim().length > 0)
          .map(stripDraft);
      }
      startTransition(async () => {
        try {
          if (props.mode === "edit") {
            await updateTemplate({
              id: props.templateId,
              name,
              questions: [],
              sections: sectionPayload,
            });
          } else {
            await createTemplate({
              type,
              name,
              questions: [],
              sections: sectionPayload,
            });
          }
          setOpen(false);
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Opslaan mislukt");
        }
      });
      return;
    }

    const stripped = questions
      .filter((q) => q.label.trim().length > 0)
      .map(stripDraft);
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
          props.mode === "edit" && (props as { asMenuItem?: boolean }).asMenuItem
            ? buttonVariants({ size: "icon", variant: "ghost" })
            : buttonVariants({
                size: "sm",
                variant: props.mode === "edit" ? "ghost" : "default",
              }),
        )}
        aria-label={props.mode === "edit" ? "Bewerken" : undefined}
      >
        {props.mode === "create" ? (
          <>
            <Plus className="h-3.5 w-3.5" data-icon="inline-start" />
            <span>{props.triggerLabel ?? "Nieuw template"}</span>
          </>
        ) : (props as { asMenuItem?: boolean }).asMenuItem ? (
          <Pencil className="h-4 w-4" strokeWidth={1.75} />
        ) : (
          <span>{props.triggerLabel ?? "Bewerken"}</span>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {props.mode === "edit" ? "Template bewerken" : "Nieuw template"}
          </DialogTitle>
          <DialogDescription>
            {isBundle
              ? "Een functioneringsgesprek-template bundelt vier stappen: zelfreflectie, peer 360, manager-voorbereiding en upward feedback. Voor publicatie heeft elke stap minstens één vraag."
              : "Vragen worden in de UI altijd als suggesties getoond, niet als verplichte invoer."}
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
                placeholder={
                  isBundle
                    ? "Bijv. Halfjaarlijks functioneringsgesprek"
                    : "Bijv. Reguliere 1-op-1"
                }
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

          {isBundle ? (
            <div className="space-y-3">
              <TemplateSectionStepper
                active={activeSection}
                filled={sectionFilled}
                onSelect={setActiveSection}
              />
              <p className="text-[12.5px] text-muted-foreground">
                {SECTION_DESCRIPTIONS[activeSection]}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label className="text-[13px] font-medium font-heading text-muted-foreground">
                {isBundle
                  ? `Vragen voor ${PERFORMANCE_REVIEW_SECTION_LABEL[
                      activeSection
                    ].toLowerCase()}`
                  : "Vragen"}
              </Label>
              <span className="text-[12px] text-muted-foreground">
                {activeQuestions.length}{" "}
                {activeQuestions.length === 1 ? "vraag" : "vragen"}
              </span>
            </div>
            <ul className="space-y-3">
              {activeQuestions.map((q, idx) => (
                <li
                  key={q._key}
                  className="rounded-xl bg-card p-3 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[12.5px] font-medium font-heading text-muted-foreground">
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
                        disabled={idx === activeQuestions.length - 1}
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
                      <Label htmlFor={`q-${q._key}-label`}>Titel</Label>
                      <Input
                        id={`q-${q._key}-label`}
                        value={q.label}
                        onChange={(e) =>
                          updateQ(q._key, { label: e.target.value })
                        }
                        placeholder="Bijv. Samenwerking"
                      />
                    </div>

                    <div className="grid gap-1.5 sm:col-span-2">
                      <Label htmlFor={`q-${q._key}-hint`}>Toelichting</Label>
                      <Textarea
                        id={`q-${q._key}-hint`}
                        rows={2}
                        value={q.hint ?? ""}
                        onChange={(e) =>
                          updateQ(q._key, { hint: e.target.value })
                        }
                        placeholder="Korte uitleg of voorbeeld onder de vraag (optioneel)."
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
                        {KIND_OPTIONS.find((k) => k.value === q.kind)?.hint}
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

                    {(q.kind === "choice_single" ||
                      q.kind === "choice_multi") ? (
                      <div className="grid gap-2 sm:col-span-2">
                        <Label>Opties</Label>
                        <ul className="space-y-1.5">
                          {(q.options ?? []).map((opt, oi) => (
                            <li key={oi} className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground w-4 text-right shrink-0">
                                {oi + 1}.
                              </span>
                              <Input
                                value={opt}
                                onChange={(e) => {
                                  const next = [...(q.options ?? [])];
                                  next[oi] = e.target.value;
                                  updateQ(q._key, { options: next });
                                }}
                                placeholder={`Optie ${oi + 1}`}
                                className="h-8 text-sm"
                              />
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => {
                                  const next = (q.options ?? []).filter((_, i) => i !== oi);
                                  updateQ(q._key, { options: next });
                                }}
                                aria-label="Optie verwijderen"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-fit"
                          onClick={() =>
                            updateQ(q._key, {
                              options: [...(q.options ?? []), ""],
                            })
                          }
                        >
                          <Plus className="h-3.5 w-3.5" data-icon="inline-start" />
                          Optie toevoegen
                        </Button>
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

          {isBundle && !allSectionsFilled ? (
            <p className="text-[12.5px] text-muted-foreground">
              Voeg in elk van de vier stappen minstens één vraag toe om dit
              template te kunnen opslaan.
            </p>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <DialogClose
            disabled={isPending}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Annuleer
          </DialogClose>
          <Button
            size="sm"
            onClick={save}
            disabled={isPending || (isBundle && !allSectionsFilled)}
          >
            {isPending ? "Bezig..." : "Opslaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
