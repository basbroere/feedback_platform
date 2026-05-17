import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { TemplateQuestion } from "@/lib/one-on-ones/types";
import type { PerformanceReviewTemplate } from "./types";

export const getDefaultPerformanceReviewTemplate = cache(
  async (): Promise<PerformanceReviewTemplate | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("templates")
      .select("id, name, questions")
      .eq("type", "performance_review")
      .eq("name", "Halfjaarlijks functioneringsgesprek")
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      questions: (data.questions as TemplateQuestion[]) ?? [],
    };
  },
);

export async function listActivePerformanceReviewTemplates(): Promise<
  PerformanceReviewTemplate[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("id, name, questions")
    .eq("type", "performance_review")
    .eq("is_active", true)
    .order("name");
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    questions: (row.questions ?? []) as TemplateQuestion[],
  }));
}
