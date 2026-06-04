import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { ArticleSummary } from "@/lib/kennisbank/types";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <Link
      href={`/kennisbank/${article.id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-xl"
    >
      <Card className="h-full transition-all group-hover:shadow-md group-hover:-translate-y-0.5">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {article.cover_image_url ? (
            <Image
              src={article.cover_image_url}
              alt=""
              fill
              unoptimized
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-sky-50 text-sky-500 dark:bg-sky-950/40 dark:text-sky-300">
              <BookOpen className="h-10 w-10" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="space-y-2 px-4 pb-4 pt-1">
          <h3 className="text-[16px] font-semibold leading-snug text-foreground line-clamp-2">
            {article.title}
          </h3>
          {article.excerpt ? (
            <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
              {article.excerpt}
            </p>
          ) : null}
          <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
            <span>{formatDate(article.created_at)}</span>
            {article.author_name ? (
              <>
                <span aria-hidden>·</span>
                <span>{article.author_name}</span>
              </>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
