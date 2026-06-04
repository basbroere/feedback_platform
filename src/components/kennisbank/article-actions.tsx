"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteArticle } from "@/lib/kennisbank/actions";
import {
  ArticleEditorSheet,
  type ArticleEditorInitial,
} from "./article-editor-sheet";

export function ArticleActions({ article }: { article: ArticleEditorInitial }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteArticle(article.id);
        setConfirmOpen(false);
        router.push("/kennisbank");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Verwijderen mislukt");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <Pencil className="h-4 w-4" strokeWidth={2} />
        Bewerken
      </button>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3.5 py-2 text-[13px] font-semibold text-destructive transition-colors hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" strokeWidth={2} />
        Verwijderen
      </button>

      <ArticleEditorSheet
        mode="edit"
        initial={article}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Artikel verwijderen?</DialogTitle>
            <DialogDescription>
              Dit kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="text-[13px] text-destructive">{error}</p>
          ) : null}
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Annuleren
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={isPending}
            >
              {isPending ? "Verwijderen..." : "Ja, verwijderen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
