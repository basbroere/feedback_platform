import type { TemplateQuestion } from "@/lib/one-on-ones/types";

export type TemplateType =
  | "one_on_one"
  | "performance_review"
  | "evaluation"
  | "peer_360";

export type ManagedTemplate = {
  id: string;
  type: TemplateType;
  name: string;
  questions: TemplateQuestion[];
  is_active: boolean;
  usage_count: number;
};

export const TEMPLATE_TYPE_LABEL: Record<TemplateType, string> = {
  one_on_one: "1-op-1",
  performance_review: "Functioneringsgesprek (legacy)",
  evaluation: "Beoordelingsgesprek",
  peer_360: "360 feedback",
};
