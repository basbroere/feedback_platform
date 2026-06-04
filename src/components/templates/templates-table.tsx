"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { TemplateEditorDialog } from "./template-editor-dialog";
import { deleteTemplate, setTemplateActive } from "@/lib/templates/actions";
import { TEMPLATE_TYPE_LABEL, type ManagedTemplate, type TemplateType } from "@/lib/templates/types";
import { cn } from "@/lib/utils";

const TYPE_ACCENT: Record<TemplateType, string> = {
  one_on_one: "bg-blue-500",
  performance_review: "bg-purple-500",
  evaluation: "bg-amber-400",
  peer_360: "bg-emerald-500",
  peer_feedback: "bg-violet-500",
};

const TYPE_COLOR: Record<TemplateType, string> = {
  one_on_one:
    "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
  performance_review:
    "bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:ring-purple-800",
  evaluation:
    "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  peer_360:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  peer_feedback:
    "bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800",
};

const KIND_LABEL: Record<string, string> = {
  open: "Open",
  rating_b_1_5: "Bamback-schaal",
  choice_single: "Keuze",
  choice_multi: "Meerkeuze",
};

function TemplateRow({
  t,
  onSelect,
  onToggle,
  onRemove,
  isPending,
}: {
  t: ManagedTemplate;
  onSelect: () => void;
  onToggle: () => void;
  onRemove: () => void;
  isPending: boolean;
}) {
  return (
    <tr className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
      <td className="py-3 pr-4">
        <button
          onClick={onSelect}
          className="text-left text-[13px] font-medium text-foreground hover:underline"
        >
          {t.name}
        </button>
      </td>
      <td className="py-3 pr-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${TYPE_COLOR[t.type]}`}
        >
          {TEMPLATE_TYPE_LABEL[t.type]}
        </span>
      </td>
      <td className="py-3 pr-4 text-[13px] text-muted-foreground tabular-nums">
        {t.questions.length}
      </td>
      <td className="py-3 pr-4 text-right">
        <div className="inline-flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSelect}
            aria-label="Bekijk vragen"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </Button>
          <TemplateEditorDialog
            mode="edit"
            templateId={t.id}
            initialName={t.name}
            initialType={t.type}
            initialQuestions={t.questions}
            asMenuItem
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            disabled={isPending}
            aria-label={t.is_active ? "Archiveer" : "Heractiveer"}
          >
            {t.is_active ? (
              <Archive className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <ArchiveRestore className="h-4 w-4" strokeWidth={1.75} />
            )}
          </Button>
          {t.usage_count === 0 ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              disabled={isPending}
              aria-label="Verwijder"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          ) : (
            <div className="h-9 w-9" />
          )}
        </div>
      </td>
    </tr>
  );
}

function TemplateTable({
  rows,
  onSelect,
  onToggle,
  onRemove,
  isPending,
}: {
  rows: ManagedTemplate[];
  onSelect: (t: ManagedTemplate) => void;
  onToggle: (t: ManagedTemplate) => void;
  onRemove: (t: ManagedTemplate) => void;
  isPending: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border/70 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <th className="pb-2.5 pr-4 font-medium">Naam</th>
            <th className="pb-2.5 pr-4 font-medium">Categorie</th>
            <th className="pb-2.5 pr-4 font-medium">Vragen</th>
            <th className="pb-2.5 text-right font-medium">Acties</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <TemplateRow
              key={t.id}
              t={t}
              onSelect={() => onSelect(t)}
              onToggle={() => onToggle(t)}
              onRemove={() => onRemove(t)}
              isPending={isPending}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TemplateDetailModal({ template: t, onClose }: { template: ManagedTemplate; onClose: () => void }) {
  return (
    <div className="flex max-h-[85vh] flex-col overflow-hidden">
      {/* Accent strip */}
      <div className={cn("h-1 w-full shrink-0", TYPE_ACCENT[t.type])} />

      {/* Header */}
      <div className="shrink-0 px-6 pb-4 pt-5">
        <div className="mb-2 flex items-center gap-2">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${TYPE_COLOR[t.type]}`}>
            {TEMPLATE_TYPE_LABEL[t.type]}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {t.questions.length} {t.questions.length === 1 ? "vraag" : "vragen"}
            {t.usage_count > 0 ? ` · ${t.usage_count}x in gebruik` : ""}
            {!t.is_active ? " · Gearchiveerd" : ""}
          </span>
        </div>
        <DialogTitle className="text-[17px] font-semibold leading-snug text-foreground">
          {t.name}
        </DialogTitle>
      </div>

      <div className="mx-6 h-px shrink-0 bg-border/60" />

      {/* Questions list - scrollable */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-6 py-4">
        {t.questions.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-muted-foreground">Nog geen vragen in dit template.</p>
        ) : (
          t.questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-border/50 bg-muted/40 px-3.5 py-3">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-snug">{q.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {KIND_LABEL[q.kind] ?? q.kind}
                    {q.required ? " · Verplicht" : ""}
                  </p>
                  {q.options && q.options.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {q.options.map((opt, oi) => (
                        <li key={oi} className="text-[11px] text-muted-foreground">{oi + 1}. {opt}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border/50 px-6 pb-5 pt-4">
        <div className="[&>button]:w-full [&>button]:justify-center">
          <TemplateEditorDialog
            mode="edit"
            templateId={t.id}
            initialName={t.name}
            initialType={t.type}
            initialQuestions={t.questions}
            triggerLabel="Template bewerken"
          />
        </div>
      </div>
    </div>
  );
}

export function TemplatesTable({ templates }: { templates: ManagedTemplate[] }) {
  const [selected, setSelected] = useState<ManagedTemplate | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const active = templates.filter((t) => t.is_active);
  const archived = templates.filter((t) => !t.is_active);

  function toggleActive(t: ManagedTemplate) {
    startTransition(async () => {
      try {
        await setTemplateActive({ id: t.id, is_active: !t.is_active });
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Wijziging mislukt");
      }
    });
  }

  function remove(t: ManagedTemplate) {
    if (!confirm("Template definitief verwijderen?")) return;
    startTransition(async () => {
      try {
        await deleteTemplate({ id: t.id });
        if (selected?.id === t.id) setSelected(null);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Verwijderen mislukt");
      }
    });
  }

  if (templates.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-8 text-center text-sm text-muted-foreground">
        Nog geen templates. Maak er een aan via de knop rechts.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <section>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Actief
            <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
              {active.length}
            </span>
          </h3>
          {active.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Geen actieve templates.</p>
          ) : (
            <TemplateTable
              rows={active}
              onSelect={setSelected}
              onToggle={toggleActive}
              onRemove={remove}
              isPending={isPending}
            />
          )}
        </section>

        {archived.length > 0 && (
          <section>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Gearchiveerd
              <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                {archived.length}
              </span>
            </h3>
            <div className="opacity-60">
              <TemplateTable
                rows={archived}
                onSelect={setSelected}
                onToggle={toggleActive}
                onRemove={remove}
                isPending={isPending}
              />
            </div>
          </section>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
          {selected && (
            <TemplateDetailModal template={selected} onClose={() => setSelected(null)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
