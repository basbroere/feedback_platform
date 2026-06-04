"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPersona } from "@/lib/persona/server";
import { sanitizeArticleHtml } from "./sanitize";

async function requireAdmin(): Promise<string> {
  const persona = await getCurrentPersona();
  if (!persona) throw new Error("Geen persona geselecteerd");
  if (!persona.is_admin) throw new Error("Alleen HR kan deze actie uitvoeren");
  return persona.id;
}

function revalidate(id?: string) {
  revalidatePath("/kennisbank");
  if (id) revalidatePath(`/kennisbank/${id}`);
}

function normaliseTitle(raw: string): string {
  return raw.trim();
}

function assertTitle(title: string) {
  if (!title) throw new Error("Vul een titel in");
  if (title.length > 200) throw new Error("Titel is te lang (max 200 tekens)");
}

export async function createArticle(input: {
  title: string;
  contentHtml: string;
  coverImageUrl: string | null;
}): Promise<{ id: string }> {
  const adminId = await requireAdmin();

  const title = normaliseTitle(input.title);
  assertTitle(title);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kennisbank_articles")
    .insert({
      title,
      content_html: sanitizeArticleHtml(input.contentHtml ?? ""),
      cover_image_url: input.coverImageUrl,
      created_by: adminId,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Aanmaken mislukt");

  revalidate();
  return { id: data.id };
}

export async function updateArticle(input: {
  id: string;
  title: string;
  contentHtml: string;
  coverImageUrl: string | null;
}): Promise<void> {
  await requireAdmin();

  const title = normaliseTitle(input.title);
  assertTitle(title);

  const supabase = await createClient();
  const { error } = await supabase
    .from("kennisbank_articles")
    .update({
      title,
      content_html: sanitizeArticleHtml(input.contentHtml ?? ""),
      cover_image_url: input.coverImageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);

  revalidate(input.id);
}

export async function deleteArticle(id: string): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("kennisbank_articles")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidate();
}
