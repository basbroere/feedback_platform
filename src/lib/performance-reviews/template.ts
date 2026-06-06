import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { TemplateQuestion } from "@/lib/one-on-ones/types";
import type {
  PerformanceReviewTemplate,
  UpwardFeedbackTemplate,
} from "./types";

// Een functioneringsgesprek draait om 360 feedback (zelf, een collega, jouw
// manager). Daarom gebruiken we 'peer_360'-templates: hetzelfde template wordt
// vanuit drie perspectieven ingevuld.

export const getDefaultPerformanceReviewTemplate = cache(
  async (): Promise<PerformanceReviewTemplate | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("templates")
      .select("id, name, questions")
      .eq("type", "peer_360")
      .eq("name", "Functioneringsgesprek 360")
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

// Upward feedback (medewerker -> manager) is een eigen template-type zodat de
// vragen los staan van het 360-template.
export const getDefaultUpwardFeedbackTemplate = cache(
  async (): Promise<UpwardFeedbackTemplate | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("templates")
      .select("id, name, questions")
      .eq("type", "upward_feedback")
      .eq("is_active", true)
      .order("name")
      .limit(1)
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
    .eq("type", "peer_360")
    .eq("is_active", true)
    .order("name");
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    questions: (row.questions ?? []) as TemplateQuestion[],
  }));
}
