import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { OneOnOneTemplate, TemplateQuestion } from "./types";

export const getDefaultOneOnOneTemplate = cache(
  async (): Promise<OneOnOneTemplate | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("templates")
      .select("id, name, questions")
      .eq("type", "one_on_one")
      .eq("name", "Reguliere 1-op-1")
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

export async function getTemplateById(
  templateId: string,
): Promise<OneOnOneTemplate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("id, name, questions")
    .eq("id", templateId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    questions: (data.questions as TemplateQuestion[]) ?? [],
  };
}
