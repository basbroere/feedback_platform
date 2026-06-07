import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { TemplateQuestion } from "@/lib/one-on-ones/types";
import {
  PERFORMANCE_REVIEW_SECTION_KEYS,
  type PerformanceReviewBundleSections,
  type PerformanceReviewSectionKey,
} from "@/lib/templates/types";
import type {
  PerformanceReviewTemplate,
  UpwardFeedbackTemplate,
} from "./types";

// Een functioneringsgesprek-template bundelt vier perspectieven: zelfreflectie
// van de medewerker, peer 360-feedback, manager-voorbereiding en upward feedback.
// Eén DB-rij van type 'performance_review_bundle' bevat alle vier secties.

export type PerformanceReviewBundle = {
  id: string;
  name: string;
  sections: PerformanceReviewBundleSections;
};

export const EMPTY_BUNDLE_SECTIONS: PerformanceReviewBundleSections = {
  self_reflection: [],
  peer_360: [],
  manager_prep: [],
  upward: [],
};

function normalizeSections(raw: unknown): PerformanceReviewBundleSections {
  const r = (raw ?? {}) as Record<string, unknown>;
  const out: PerformanceReviewBundleSections = { ...EMPTY_BUNDLE_SECTIONS };
  for (const key of PERFORMANCE_REVIEW_SECTION_KEYS) {
    const value = r[key];
    out[key] = Array.isArray(value) ? (value as TemplateQuestion[]) : [];
  }
  return out;
}

export const getActivePerformanceReviewBundle = cache(
  async (): Promise<PerformanceReviewBundle | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("templates")
      .select("id, name, sections")
      .eq("type", "performance_review_bundle")
      .eq("is_active", true)
      .order("name")
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id as string,
      name: data.name as string,
      sections: normalizeSections(data.sections),
    };
  },
);

export async function getPerformanceReviewBundleById(
  templateId: string,
): Promise<PerformanceReviewBundle | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("id, name, type, questions, sections")
    .eq("id", templateId)
    .maybeSingle();
  if (error || !data) return null;

  if (data.type === "performance_review_bundle") {
    return {
      id: data.id as string,
      name: data.name as string,
      sections: normalizeSections(data.sections),
    };
  }

  // Legacy fallback: oude cycli wijzen nog naar een peer_360- of
  // upward_feedback-template. Virtualiseer die als bundle zodat de UI
  // historische antwoorden kan blijven renderen met de juiste vragen.
  const legacyQuestions = (data.questions ?? []) as TemplateQuestion[];

  if (data.type === "peer_360") {
    // Oude flow: zelfreflectie, peer en manager beantwoordden allemaal
    // dezelfde 360-vragen. Upward kwam uit een aparte upward_feedback-template.
    const { data: upwardRow } = await supabase
      .from("templates")
      .select("questions")
      .eq("type", "upward_feedback")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const upwardQuestions = (upwardRow?.questions ??
      []) as TemplateQuestion[];
    return {
      id: data.id as string,
      name: data.name as string,
      sections: {
        self_reflection: legacyQuestions,
        peer_360: legacyQuestions,
        manager_prep: legacyQuestions,
        upward: upwardQuestions,
      },
    };
  }

  if (data.type === "upward_feedback") {
    return {
      id: data.id as string,
      name: data.name as string,
      sections: {
        self_reflection: [],
        peer_360: [],
        manager_prep: [],
        upward: legacyQuestions,
      },
    };
  }

  return null;
}

export async function listActivePerformanceReviewBundles(): Promise<
  PerformanceReviewBundle[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("id, name, sections")
    .eq("type", "performance_review_bundle")
    .eq("is_active", true)
    .order("name");
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    sections: normalizeSections(row.sections),
  }));
}

function bundleSection(
  bundle: PerformanceReviewBundle | null,
  key: PerformanceReviewSectionKey,
): { id: string; name: string; questions: TemplateQuestion[] } | null {
  if (!bundle) return null;
  return {
    id: bundle.id,
    name: bundle.name,
    questions: bundle.sections[key] ?? [],
  };
}

// Legacy helpers, behouden voor bestaande aanroepers. Plukken de juiste sectie
// uit het actieve gebundelde template.

export async function getDefaultPerformanceReviewTemplate(): Promise<PerformanceReviewTemplate | null> {
  const bundle = await getActivePerformanceReviewBundle();
  return bundleSection(bundle, "self_reflection");
}

export async function getDefaultUpwardFeedbackTemplate(): Promise<UpwardFeedbackTemplate | null> {
  const bundle = await getActivePerformanceReviewBundle();
  return bundleSection(bundle, "upward");
}

export async function listActivePerformanceReviewTemplates(): Promise<
  PerformanceReviewTemplate[]
> {
  const bundles = await listActivePerformanceReviewBundles();
  return bundles.map((b) => ({
    id: b.id,
    name: b.name,
    questions: b.sections.self_reflection,
  }));
}
