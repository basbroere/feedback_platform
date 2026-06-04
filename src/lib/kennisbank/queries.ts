import { createClient } from "@/lib/supabase/server";
import type { Article, ArticleSummary } from "./types";
import { htmlToPlainText, sanitizeArticleHtml } from "./sanitize";

type ArticleRow = {
  id: string;
  title: string;
  content_html: string;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  author: { name: string | null } | null;
};

const SELECT_FIELDS =
  "id, title, content_html, cover_image_url, created_at, updated_at, author:users!kennisbank_articles_created_by_fkey(name)";

function makeExcerpt(html: string): string {
  const text = htmlToPlainText(html);
  if (text.length <= 160) return text;
  return text.slice(0, 157).trimEnd() + "...";
}

export async function listArticles(): Promise<ArticleSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kennisbank_articles")
    .select(SELECT_FIELDS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as ArticleRow[];
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    cover_image_url: row.cover_image_url,
    excerpt: makeExcerpt(row.content_html),
    created_at: row.created_at,
    updated_at: row.updated_at,
    author_name: row.author?.name ?? null,
  }));
}

export async function getArticle(id: string): Promise<Article | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kennisbank_articles")
    .select(SELECT_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as unknown as ArticleRow;
  return {
    id: row.id,
    title: row.title,
    content_html: sanitizeArticleHtml(row.content_html),
    cover_image_url: row.cover_image_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author_name: row.author?.name ?? null,
  };
}
