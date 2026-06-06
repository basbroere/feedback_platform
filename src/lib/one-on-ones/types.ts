export type OneOnOneStatus = "scheduled" | "completed";

export type TemplateQuestionKind =
  | "open"
  | "scale_1_5"
  | "rating_b_1_5"
  | "choice_single"
  | "choice_multi";

export type TemplateQuestion = {
  id: string;
  label: string;
  kind: TemplateQuestionKind;
  options?: string[];
  required?: boolean;
  hint?: string;
};

export type OneOnOneTemplate = {
  id: string;
  name: string;
  questions: TemplateQuestion[];
};

export type PersonRef = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export type OneOnOneListItem = {
  id: string;
  subject: string;
  scheduled_at: string | null;
  completed_at: string | null;
  shared_summary: string | null;
};

export type OneOnOneFull = {
  id: string;
  manager_id: string;
  employee_id: string;
  template_id: string | null;
  subject: string;
  scheduled_at: string | null;
  completed_at: string | null;
  employee_preparation: Record<string, string>;
  manager_private_notes: string | null;
  shared_summary: string | null;
  manager: PersonRef;
  employee: PersonRef;
  template: OneOnOneTemplate | null;
  existing_manager_feedback: string | null;
};

export type OneOnOneForEmployee = Omit<
  OneOnOneFull,
  "manager_private_notes" | "existing_manager_feedback"
>;

export type ActionItem = {
  id: string;
  owner_id: string;
  description: string;
  status: "open" | "completed" | "expired";
  target_date: string | null;
  notes: string | null;
  source_type: "one_on_one" | "performance_review" | "evaluation" | "personal";
  source_id: string | null;
  created_at: string;
  completed_at: string | null;
  owner?: PersonRef;
};

export function oneOnOneStatus(row: {
  scheduled_at: string | null;
  completed_at: string | null;
}): OneOnOneStatus {
  return row.completed_at ? "completed" : "scheduled";
}
