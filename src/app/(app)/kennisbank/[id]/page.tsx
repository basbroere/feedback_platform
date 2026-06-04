import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarDays, UserRound } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import { getArticle } from "@/lib/kennisbank/queries";
import { formatDate } from "@/lib/format";
import { ArticleActions } from "@/components/kennisbank/article-actions";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [persona, article] = await Promise.all([
    requirePersona(),
    getArticle(id),
  ]);

  if (!article) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/kennisbank"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Terug naar kennisbank
        </Link>
        {persona.is_admin ? (
          <ArticleActions
            article={{
              id: article.id,
              title: article.title,
              contentHtml: article.content_html,
              coverImageUrl: article.cover_image_url,
            }}
          />
        ) : null}
      </div>

      {article.cover_image_url ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted">
          <Image
            src={article.cover_image_url}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      ) : (
        <div className="flex aspect-[16/6] w-full items-center justify-center overflow-hidden rounded-2xl bg-sky-50 text-sky-500 dark:bg-sky-950/40 dark:text-sky-300">
          <BookOpen className="h-12 w-12" strokeWidth={1.5} />
        </div>
      )}

      <header className="space-y-3">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-foreground md:text-[34px]">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
            {formatDate(article.created_at)}
          </span>
          {article.author_name ? (
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5" strokeWidth={1.75} />
              {article.author_name}
            </span>
          ) : null}
        </div>
      </header>

      <article
        className="article-prose"
        dangerouslySetInnerHTML={{ __html: article.content_html }}
      />
    </div>
  );
}
