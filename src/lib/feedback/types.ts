import type { PersonRef, TemplateQuestion } from "@/lib/one-on-ones/types";

export type FeedbackSource =
  | "one_on_one"
  | "peer_request"
  | "performance_review";

export type FeedbackStatus = "requested" | "submitted" | "declined";

export type Feedback = {
  id: string;
  recipient_id: string;
  author_id: string;
  source_type: FeedbackSource;
  source_id: string | null;
  prompt: string | null;
  body: string | null;
  responses: Record<string, string>;
  is_cross_team: boolean;
  status: FeedbackStatus;
  requested_at: string | null;
  submitted_at: string | null;
  created_at: string;
  author?: PersonRef;
};

export type FeedbackSourceRef = {
  kind: FeedbackSource;
  label: string;
  href: string | null;
  date: string | null;
  with: PersonRef | null;
};

export type FeedbackWithSource = Feedback & {
  source: FeedbackSourceRef | null;
  template_questions?: TemplateQuestion[];
};

export type FeedbackTemplate = {
  id: string;
  name: string;
  questions: TemplateQuestion[];
};

export type FeedbackRequest = {
  id: string;
  requester_id: string;
  template_id: string | null;
  prompt: string | null;
  created_at: string;
};

export type OpenFeedbackRequestForPeer = {
  feedback_id: string;
  request_id: string;
  requester: PersonRef;
  prompt: string | null;
  template: FeedbackTemplate | null;
  requested_at: string | null;
  created_at: string;
  is_cross_team: boolean;
};

export type OwnFeedbackRequestSummary = {
  request_id: string;
  prompt: string | null;
  template_name: string | null;
  created_at: string;
  peer_count: number;
  submitted_count: number;
  declined_count: number;
};
