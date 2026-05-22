"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPersona } from "@/lib/persona/server";
import type { TemplateQuestion } from "@/lib/one-on-ones/types";
import type { TemplateType } from "./types";

const ALLOWED_KINDS: TemplateQuestion["kind"][] = [
  "open",
  "scale_1_5",
  "rating_b_1_5",
  "choice_single",
  "choice_multi",
];

async function requireAdmin() {
  const persona = await getCurrentPersona();
  if (!persona) throw new Error("Geen persona geselecteerd");
  if (!persona.is_admin) throw new Error("Alleen beheerders mogen templates beheren");
  return persona;
}

function normalizeQuestions(input: unknown[]): TemplateQuestion[] {
  if (!Array.isArray(input)) return [];
  const cleaned: TemplateQuestion[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const label =
      typeof r.label === "string" ? r.label.trim() : "";
    if (!label) continue;
    const kind = (r.kind as TemplateQuestion["kind"]) ?? "open";
    if (!ALLOWED_KINDS.includes(kind)) continue;
    const id =
      typeof r.id === "string" && r.id.trim().length > 0
        ? r.id.trim()
        : label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .slice(0, 40) || `q${cleaned.length + 1}`;
    const hint = typeof r.hint === "string" ? r.hint.trim() : "";
    const required = Boolean(r.required);
    const options = Array.isArray(r.options)
      ? (r.options as unknown[])
          .map((o) => (typeof o === "string" ? o.trim() : ""))
          .filter(Boolean)
      : undefined;
    cleaned.push({
      id,
      label,
      kind,
      ...(hint ? { hint } : {}),
      ...(required ? { required: true } : {}),
      ...(options && options.length ? { options } : {}),
    });
  }
  // Dedupe ids door volgnummers toe te voegen.
  const seen = new Set<string>();
  return cleaned.map((q) => {
    let id = q.id;
    let i = 2;
    while (seen.has(id)) id = `${q.id}_${i++}`;
    seen.add(id);
    return { ...q, id };
  });
}

export async function createTemplate(input: {
  type: TemplateType;
  name: string;
  questions: TemplateQuestion[];
}): Promise<{ id: string }> {
  await requireAdmin();
  const name = input.name.trim();
  if (!name) throw new Error("Naam is verplicht");
  const questions = normalizeQuestions(input.questions);
  if (questions.length === 0)
    throw new Error("Voeg minstens één vraag toe");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .insert({
      type: input.type,
      name,
      questions,
      is_active: true,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Aanmaken mislukt");

  revalidatePath("/templates");
  return { id: data.id as string };
}

export async function updateTemplate(input: {
  id: string;
  name: string;
  questions: TemplateQuestion[];
}): Promise<void> {
  await requireAdmin();
  const name = input.name.trim();
  if (!name) throw new Error("Naam is verplicht");
  const questions = normalizeQuestions(input.questions);
  if (questions.length === 0)
    throw new Error("Voeg minstens één vraag toe");

  const supabase = await createClient();
  const { error } = await supabase
    .from("templates")
    .update({ name, questions })
    .eq("id", input.id);
  if (error) throw new Error(error.message);

  revalidatePath("/templates");
}

export async function setTemplateActive(input: {
  id: string;
  is_active: boolean;
}): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("templates")
    .update({ is_active: input.is_active })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath("/templates");
}

export async function deleteTemplate(input: { id: string }): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  // Voorkom verwijderen als nog in gebruik; archiveren is de juiste route.
  const ids = [input.id];
  const [{ data: oos }, { data: prs }, { data: evs }, { data: frs }] =
    await Promise.all([
      supabase.from("one_on_ones").select("id").in("template_id", ids).limit(1),
      supabase
        .from("performance_reviews")
        .select("id")
        .in("template_id", ids)
        .limit(1),
      supabase.from("evaluations").select("id").in("template_id", ids).limit(1),
      supabase
        .from("feedback_requests")
        .select("id")
        .in("template_id", ids)
        .limit(1),
    ]);
  const inUse =
    (oos ?? []).length + (prs ?? []).length + (evs ?? []).length + (frs ?? []).length;
  if (inUse > 0)
    throw new Error(
      "Template wordt nog gebruikt. Archiveer hem in plaats van verwijderen.",
    );

  const { error } = await supabase.from("templates").delete().eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath("/templates");
}
