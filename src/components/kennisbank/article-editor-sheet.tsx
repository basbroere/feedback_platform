"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Plus,
  Underline as UnderlineIcon,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { createArticle, updateArticle } from "@/lib/kennisbank/actions";
import { cn } from "@/lib/utils";

const COVER_BUCKET = "kennisbank-covers";

export type ArticleEditorInitial = {
  id: string;
  title: string;
  contentHtml: string;
  coverImageUrl: string | null;
};

type Props = {
  mode: "create" | "edit";
  initial?: ArticleEditorInitial;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ArticleEditorSheet({
  mode,
  initial,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (controlledOpen === undefined) setInternalOpen(next);
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="inline-flex">
          {trigger}
        </div>
      ) : controlledOpen === undefined ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Nieuw artikel
        </button>
      ) : null}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="data-[side=right]:sm:max-w-[640px] overflow-y-auto p-0"
        >
          <SheetHeader className="border-b border-border/50 px-6 pb-4 pt-6">
            <SheetTitle className="text-[20px] font-bold">
              {mode === "create" ? "Nieuw artikel" : "Artikel bewerken"}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Vul titel, cover en inhoud in.
            </SheetDescription>
          </SheetHeader>

          {open ? (
            <ArticleEditorForm
              mode={mode}
              initial={initial}
              onDone={() => setOpen(false)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function ArticleEditorForm({
  mode,
  initial,
  onDone,
}: {
  mode: "create" | "edit";
  initial?: ArticleEditorInitial;
  onDone: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(
    initial?.coverImageUrl ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initial?.contentHtml ?? "",
    editorProps: {
      attributes: {
        class: "editor-prose",
      },
    },
    immediatelyRender: false,
  });

  async function handleUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(COVER_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
      setCoverUrl(data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload mislukt");
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    setError(null);
    const html = editor?.getHTML() ?? "";
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createArticle({
            title,
            contentHtml: html,
            coverImageUrl: coverUrl,
          });
        } else if (initial) {
          await updateArticle({
            id: initial.id,
            title,
            contentHtml: html,
            coverImageUrl: coverUrl,
          });
        }
        router.refresh();
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Opslaan mislukt");
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-6 px-6 py-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="article-title">Titel</Label>
        <Input
          id="article-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bijvoorbeeld: Hoe geef je opbouwende feedback?"
          disabled={isPending}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Cover-afbeelding</Label>
        {coverUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-border/60">
            <Image
              src={coverUrl}
              alt="Cover"
              width={1200}
              height={675}
              unoptimized
              className="h-44 w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setCoverUrl(null)}
              className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow"
              aria-label="Cover verwijderen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-muted/30 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 disabled:opacity-60"
          >
            {uploading ? (
              <span>Uploaden...</span>
            ) : (
              <>
                <Upload className="h-5 w-5" strokeWidth={1.75} />
                <span>Klik om een afbeelding te kiezen</span>
              </>
            )}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Inhoud</Label>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <EditorToolbar editor={editor} disabled={isPending} />
          <EditorContent editor={editor} />
        </div>
        <p className="text-[12px] text-muted-foreground">
          Tip: gebruik koppen voor hoofdstukken, vetgedrukt voor accenten.
        </p>
      </div>

      {error ? <p className="text-[13px] text-destructive">{error}</p> : null}

      <SheetFooter className="p-0">
        <Button
          type="submit"
          disabled={isPending || uploading}
          className="w-full"
        >
          {isPending
            ? "Opslaan..."
            : mode === "create"
              ? "Artikel publiceren"
              : "Wijzigingen opslaan"}
        </Button>
      </SheetFooter>
    </form>
  );
}

function EditorToolbar({
  editor,
  disabled,
}: {
  editor: Editor | null;
  disabled: boolean;
}) {
  if (!editor) {
    return <div className="h-10 border-b border-border/60 bg-muted/30" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 bg-muted/30 px-2 py-1.5">
      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        disabled={disabled}
        label="Grote kop"
      >
        <span className="text-[13px] font-bold">H1</span>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        disabled={disabled}
        label="Middenkop"
      >
        <span className="text-[12px] font-bold">H2</span>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        disabled={disabled}
        label="Subkop"
      >
        <span className="text-[11px] font-bold">H3</span>
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border/60" />
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={disabled}
        label="Dikgedrukt"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={disabled}
        label="Schuingedrukt"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={disabled}
        label="Onderstreept"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border/60" />
      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={disabled}
        label="Opsomming"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={disabled}
        label="Genummerde lijst"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  disabled,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-foreground/70 transition-colors hover:bg-background hover:text-foreground",
        active && "bg-background text-foreground shadow-sm",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {children}
    </button>
  );
}
