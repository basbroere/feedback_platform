import type {
  ActionItem,
  PersonRef,
  TemplateQuestion,
} from "@/lib/one-on-ones/types";
import type { FeedbackStatus } from "@/lib/feedback/types";

export type PerformanceReviewStatus =
  | "draft"
  | "collecting_input"
  | "ready_for_meeting"
  | "scheduled"
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
  scheduled_at: string | null;
  template_name: string | null;
  has_employee_input: boolean;
  has_manager_input: boolean;
  has_peer_submitted: boolean;
  has_manager_submitted: boolean;
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
  scheduled_at: string | null;
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

// Een 360-cyclus heeft drie feedback-stromen: zelfevaluatie (in
// performance_reviews.employee_self_evaluation), peer (1 collega) en manager.
// Peer en manager landen in de feedback-tabel met source_type='performance_review'.
export type CycleFeedback = {
  feedback_id: string;
  author: PersonRef;
  status: FeedbackStatus;
  responses: Record<string, string>;
  submitted_at: string | null;
  is_cross_team: boolean;
};

export type CycleInputs = {
  peer: CycleFeedback | null;
  manager: CycleFeedback | null;
};
