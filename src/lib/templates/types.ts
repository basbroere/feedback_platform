import type { TemplateQuestion } from "@/lib/one-on-ones/types";

export type TemplateType =
  | "one_on_one"
  | "performance_review"
  | "performance_review_bundle"
  | "evaluation"
  | "peer_360"
  | "peer_feedback"
  | "upward_feedback";

export const PERFORMANCE_REVIEW_SECTION_KEYS = [
  "self_reflection",
  "peer_360",
  "manager_prep",
  "upward",
] as const;

export type PerformanceReviewSectionKey =
  (typeof PERFORMANCE_REVIEW_SECTION_KEYS)[number];

export const PERFORMANCE_REVIEW_SECTION_LABEL: Record<
  PerformanceReviewSectionKey,
  string
> = {
  self_reflection: "Zelfreflectie",
  peer_360: "Peer 360",
  manager_prep: "Manager-voorbereiding",
  upward: "Upward feedback",
};

export type PerformanceReviewBundleSections = Record<
  PerformanceReviewSectionKey,
  TemplateQuestion[]
>;

export type ManagedTemplate = {
  id: string;
  type: TemplateType;
  name: string;
  questions: TemplateQuestion[];
  sections: PerformanceReviewBundleSections | null;
  is_active: boolean;
  usage_count: number;
};

export const TEMPLATE_TYPE_LABEL: Record<TemplateType, string> = {
  one_on_one: "1-op-1",
  performance_review: "Functioneringsgesprek (legacy)",
  performance_review_bundle: "Functioneringsgesprek",
  evaluation: "Beoordelingsgesprek",
  peer_360: "Peer feedback (legacy)",
  peer_feedback: "Losse peer feedback",
  upward_feedback: "Upward feedback (legacy)",
};
