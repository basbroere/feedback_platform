"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deleteTemplate,
  setTemplateActive,
} from "@/lib/templates/actions";
import { TemplateEditorDialog } from "./template-editor-dialog";
import type { ManagedTemplate } from "@/lib/templates/types";

export function TemplateRowActions({
  template,
}: {
  template: ManagedTemplate;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      try {
        await setTemplateActive({
          id: template.id,
          is_active: !template.is_active,
        });
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Wijziging mislukt");
      }
    });
  }

  function remove() {
    if (!confirm("Template definitief verwijderen?")) return;
    startTransition(async () => {
      try {
        await deleteTemplate({ id: template.id });
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Verwijderen mislukt");
      }
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <TemplateEditorDialog
        mode="edit"
        templateId={template.id}
        initialName={template.name}
        initialType={template.type}
        initialQuestions={template.questions}
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={toggleActive}
        disabled={isPending}
      >
        {template.is_active ? (
          <>
            <Archive className="h-3.5 w-3.5" data-icon="inline-start" />
            Archiveer
          </>
        ) : (
          <>
            <ArchiveRestore className="h-3.5 w-3.5" data-icon="inline-start" />
            Heractiveer
          </>
        )}
      </Button>
      {template.usage_count === 0 ? (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={remove}
          disabled={isPending}
          aria-label="Verwijder"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
