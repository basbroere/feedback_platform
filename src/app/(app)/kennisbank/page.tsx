import { BookOpen } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import { listArticles } from "@/lib/kennisbank/queries";
import { PageTitle } from "@/components/ui/page-title";
import { ArticleCard } from "@/components/kennisbank/article-card";
import { ArticleEditorSheet } from "@/components/kennisbank/article-editor-sheet";

export default async function KennisbankPage() {
  const persona = await requirePersona();
  const articles = await listArticles();

  return (
    <div className="space-y-10">
      <PageTitle
        icon={BookOpen}
        tone="sky"
        title="Kennisbank"
        subtitle="Artikelen over feedback geven en samenwerken."
        action={persona.is_admin ? <ArticleEditorSheet mode="create" /> : null}
      />

      {articles.length === 0 ? (
        <EmptyState canCreate={persona.is_admin} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-500 dark:bg-sky-950/40 dark:text-sky-300">
        <BookOpen className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h2 className="text-[16px] font-semibold text-foreground">
        Nog geen artikelen
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] text-muted-foreground">
        {canCreate
          ? "Schrijf het eerste artikel om de kennisbank te starten."
          : "Zodra HR artikelen plaatst, vind je ze hier terug."}
      </p>
    </div>
  );
}
