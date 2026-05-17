import type {
  ActionItem,
  PersonRef,
  TemplateQuestion,
} from "@/lib/one-on-ones/types";

export type PerformanceReviewStatus =
  | "draft"
  | "collecting_input"
  | "ready_for_meeting"
  | "completed"
  | "cancelled";

export type PerformanceReviewTemplate = {
  id: string;
  name: string;
  questions: TemplateQuestion[];
};

export type PerformanceReviewListItem = {
  id: string;
  status: PerformanceReviewStatus;
  cycle_started_at: string;
  completed_at: string | null;
  template_name: string | null;
  has_employee_input: boolean;
  has_manager_input: boolean;
  employee: PersonRef;
  manager: PersonRef;
};

export type PerformanceReviewFull = {
  id: string;
  manager_id: string;
  employee_id: string;
  template_id: string | null;
  status: PerformanceReviewStatus;
  cycle_started_at: string;
  completed_at: string | null;
  employee_self_evaluation: Record<string, string>;
  manager_preparation: Record<string, string>;
  manager_private_notes: string | null;
  shared_summary: string | null;
  manager: PersonRef;
  employee: PersonRef;
  template: PerformanceReviewTemplate | null;
};

export type PerformanceReviewForEmployee = Omit<
  PerformanceReviewFull,
  "manager_private_notes" | "manager_preparation"
>;

export type PerformanceReviewDossier = {
  windowStart: string;
  windowEnd: string;
  completedActionItems: DossierActionItem[];
  receivedFeedbackCount: number;
  oneOnOneCount: number;
};

export type DossierActionItem = ActionItem & {
  source_label: string;
  source_href: string | null;
  source_date: string | null;
};
