import { createClient } from "@/lib/supabase/server";
import type { TemplateQuestion } from "@/lib/one-on-ones/types";
import type { ManagedTemplate, TemplateType } from "./types";

// Types en labels staan in ./types zodat client components ze kunnen importeren
// zonder de server-only supabase-client mee te trekken.
export type { ManagedTemplate, TemplateType } from "./types";
export { TEMPLATE_TYPE_LABEL } from "./types";

export async function listAllTemplates(): Promise<ManagedTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("id, type, name, questions, is_active")
    .order("type")
    .order("name");
  if (error || !data) return [];

  // Tel hoe vaak het template als reference wordt gebruikt zodat HR weet of
  // archiveren of verwijderen veilig is.
  const ids = data.map((t) => t.id as string);
  const usage = new Map<string, number>();
  if (ids.length) {
    const [{ data: oos }, { data: prs }, { data: evs }, { data: frs }] =
      await Promise.all([
        supabase.from("one_on_ones").select("template_id").in("template_id", ids),
        supabase
          .from("performance_reviews")
          .select("template_id")
          .in("template_id", ids),
        supabase.from("evaluations").select("template_id").in("template_id", ids),
        supabase
          .from("feedback_requests")
          .select("template_id")
          .in("template_id", ids),
      ]);
    type Row = { template_id: string | null };
    for (const r of (oos ?? []) as Row[]) {
      if (r.template_id)
        usage.set(r.template_id, (usage.get(r.template_id) ?? 0) + 1);
    }
    for (const r of (prs ?? []) as Row[]) {
      if (r.template_id)
        usage.set(r.template_id, (usage.get(r.template_id) ?? 0) + 1);
    }
    for (const r of (evs ?? []) as Row[]) {
      if (r.template_id)
        usage.set(r.template_id, (usage.get(r.template_id) ?? 0) + 1);
    }
    for (const r of (frs ?? []) as Row[]) {
      if (r.template_id)
        usage.set(r.template_id, (usage.get(r.template_id) ?? 0) + 1);
    }
  }

  return data.map((row) => ({
    id: row.id as string,
    type: row.type as TemplateType,
    name: row.name as string,
    questions: (row.questions ?? []) as TemplateQuestion[],
    is_active: row.is_active as boolean,
    usage_count: usage.get(row.id as string) ?? 0,
  }));
}

export async function getManagedTemplate(
  id: string,
): Promise<ManagedTemplate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("id, type, name, questions, is_active")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id as string,
    type: data.type as TemplateType,
    name: data.name as string,
    questions: (data.questions ?? []) as TemplateQuestion[],
    is_active: data.is_active as boolean,
    usage_count: 0,
  };
}
