import { createClient } from "@/lib/supabase/server";
import type { OffboardedUser } from "@/lib/hr/offboarding-types";

const TWO_YEARS_DAYS = 2 * 365;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

type UserRow = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: OffboardedUser["role"];
  team_id: string | null;
  left_at: string | null;
  created_at: string;
  team: { id: string; name: string } | null;
};

export async function listOffboardedUsers(): Promise<OffboardedUser[]> {
  const supabase = await createClient();
  const cutoff = isoDaysAgo(TWO_YEARS_DAYS);

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, name, email, avatar_url, role, team_id, left_at, created_at, team:teams!users_team_id_fkey(id, name)",
    )
    .not("left_at", "is", null)
    .gte("left_at", cutoff)
    .order("left_at", { ascending: false });

  if (error || !data) return [];

  return (data as unknown as UserRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    avatar_url: row.avatar_url,
    role: row.role,
    team_id: row.team_id,
    team_name: row.team?.name ?? null,
    left_at: row.left_at ?? "",
    created_at: row.created_at,
  }));
}

export async function getOffboardedUser(
  userId: string,
): Promise<OffboardedUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, name, email, avatar_url, role, team_id, left_at, created_at, team:teams!users_team_id_fkey(id, name)",
    )
    .eq("id", userId)
    .not("left_at", "is", null)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as UserRow;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar_url: row.avatar_url,
    role: row.role,
    team_id: row.team_id,
    team_name: row.team?.name ?? null,
    left_at: row.left_at ?? "",
    created_at: row.created_at,
  };
}

const PERSON_COLS = "id, name, avatar_url";
const TEMPLATE_COLS = "id, name, questions";

export type TemplateInfo = {
  id: string;
  name: string;
  questions: Array<{
    id: string;
    label: string;
    kind: string;
    options?: string[];
    required?: boolean;
    hint?: string;
  }>;
};

export type DossierOneOnOne = {
  id: string;
  subject: string;
  scheduled_at: string | null;
  completed_at: string | null;
  shared_summary: string | null;
  employee_preparation: Record<string, string | string[]>;
  template: TemplateInfo | null;
  counterpart: { id: string; name: string; avatar_url: string | null } | null;
  counterpart_role: "manager" | "employee";
};

export type DossierPerformanceReview = {
  id: string;
  status: string;
  cycle_started_at: string;
  completed_at: string | null;
  shared_summary: string | null;
  employee_self_evaluation: Record<string, string | string[]>;
  template: TemplateInfo | null;
  counterpart: { id: string; name: string; avatar_url: string | null } | null;
  counterpart_role: "manager" | "employee";
};

export type DossierEvaluation = {
  id: string;
  scheduled_at: string | null;
  completed_at: string | null;
  shared_summary: string | null;
  employee_self_reflection: Record<string, string | string[]>;
  manager_assessments: Record<
    string,
    { rating?: string; notes?: string } | string
  >;
  template: TemplateInfo | null;
  counterpart: { id: string; name: string; avatar_url: string | null } | null;
  counterpart_role: "manager" | "employee";
};

export type DossierActionItem = {
  id: string;
  description: string;
  status: "open" | "completed" | "expired";
  source_type: "one_on_one" | "performance_review" | "evaluation";
  source_id: string;
  target_date: string | null;
  created_at: string;
  completed_at: string | null;
};

export type DossierPeerFeedback = {
  id: string;
  body: string | null;
  prompt: string | null;
  is_cross_team: boolean;
  status: "requested" | "submitted" | "declined";
  submitted_at: string | null;
  created_at: string;
  author: { id: string; name: string; avatar_url: string | null } | null;
};

export type OffboardingDossier = {
  user: OffboardedUser;
  oneOnOnes: DossierOneOnOne[];
  performanceReviews: DossierPerformanceReview[];
  evaluations: DossierEvaluation[];
  actionItems: DossierActionItem[];
  peerFeedback: DossierPeerFeedback[];
};

// Bouwt het volledige uit-dienst-dossier voor één medewerker.
// Privé-notities van managers worden bewust niet meegeladen.
export async function getOffboardingDossier(
  userId: string,
): Promise<OffboardingDossier | null> {
  const user = await getOffboardedUser(userId);
  if (!user) return null;

  const supabase = await createClient();

  const [oneOnOnesRes, reviewsRes, evaluationsRes, actionItemsRes, feedbackRes] =
    await Promise.all([
      supabase
        .from("one_on_ones")
        .select(
          `id, manager_id, employee_id, subject, scheduled_at, completed_at, shared_summary, employee_preparation, template:templates(${TEMPLATE_COLS}), manager:users!one_on_ones_manager_id_fkey(${PERSON_COLS}), employee:users!one_on_ones_employee_id_fkey(${PERSON_COLS})`,
        )
        .or(`employee_id.eq.${userId},manager_id.eq.${userId}`)
        .order("scheduled_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("performance_reviews")
        .select(
          `id, manager_id, employee_id, status, cycle_started_at, completed_at, shared_summary, employee_self_evaluation, template:templates(${TEMPLATE_COLS}), manager:users!performance_reviews_manager_id_fkey(${PERSON_COLS}), employee:users!performance_reviews_employee_id_fkey(${PERSON_COLS})`,
        )
        .or(`employee_id.eq.${userId},manager_id.eq.${userId}`)
        .order("cycle_started_at", { ascending: false }),
      supabase
        .from("evaluations")
        .select(
          `id, manager_id, employee_id, scheduled_at, completed_at, shared_summary, employee_self_reflection, manager_assessments, template:templates(${TEMPLATE_COLS}), manager:users!evaluations_manager_id_fkey(${PERSON_COLS}), employee:users!evaluations_employee_id_fkey(${PERSON_COLS})`,
        )
        .or(`employee_id.eq.${userId},manager_id.eq.${userId}`)
        .order("scheduled_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("action_items")
        .select(
          "id, description, status, source_type, source_id, target_date, created_at, completed_at",
        )
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("feedback")
        .select(
          `id, body, prompt, status, submitted_at, created_at, is_cross_team, author:users!feedback_author_id_fkey(${PERSON_COLS})`,
        )
        .eq("recipient_id", userId)
        .order("submitted_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }),
    ]);

  type OneOnOneRow = {
    id: string;
    manager_id: string;
    employee_id: string;
    subject: string;
    scheduled_at: string | null;
    completed_at: string | null;
    shared_summary: string | null;
    employee_preparation: Record<string, string | string[]> | null;
    template: TemplateInfo | null;
    manager: { id: string; name: string; avatar_url: string | null } | null;
    employee: { id: string; name: string; avatar_url: string | null } | null;
  };

  const oneOnOnes: DossierOneOnOne[] = (
    (oneOnOnesRes.data ?? []) as unknown as OneOnOneRow[]
  ).map((row) => {
    const isEmployee = row.employee_id === userId;
    return {
      id: row.id,
      subject: row.subject,
      scheduled_at: row.scheduled_at,
      completed_at: row.completed_at,
      shared_summary: row.shared_summary,
      employee_preparation: row.employee_preparation ?? {},
      template: row.template,
      counterpart: isEmployee ? row.manager : row.employee,
      counterpart_role: isEmployee ? "manager" : "employee",
    };
  });

  type ReviewRow = {
    id: string;
    manager_id: string;
    employee_id: string;
    status: string;
    cycle_started_at: string;
    completed_at: string | null;
    shared_summary: string | null;
    employee_self_evaluation: Record<string, string | string[]> | null;
    template: TemplateInfo | null;
    manager: { id: string; name: string; avatar_url: string | null } | null;
    employee: { id: string; name: string; avatar_url: string | null } | null;
  };

  const performanceReviews: DossierPerformanceReview[] = (
    (reviewsRes.data ?? []) as unknown as ReviewRow[]
  ).map((row) => {
    const isEmployee = row.employee_id === userId;
    return {
      id: row.id,
      status: row.status,
      cycle_started_at: row.cycle_started_at,
      completed_at: row.completed_at,
      shared_summary: row.shared_summary,
      employee_self_evaluation: row.employee_self_evaluation ?? {},
      template: row.template,
      counterpart: isEmployee ? row.manager : row.employee,
      counterpart_role: isEmployee ? "manager" : "employee",
    };
  });

  type EvaluationRow = {
    id: string;
    manager_id: string;
    employee_id: string;
    scheduled_at: string | null;
    completed_at: string | null;
    shared_summary: string | null;
    employee_self_reflection: Record<string, string | string[]> | null;
    manager_assessments:
      | Record<string, { rating?: string; notes?: string } | string>
      | null;
    template: TemplateInfo | null;
    manager: { id: string; name: string; avatar_url: string | null } | null;
    employee: { id: string; name: string; avatar_url: string | null } | null;
  };

  const evaluations: DossierEvaluation[] = (
    (evaluationsRes.data ?? []) as unknown as EvaluationRow[]
  ).map((row) => {
    const isEmployee = row.employee_id === userId;
    return {
      id: row.id,
      scheduled_at: row.scheduled_at,
      completed_at: row.completed_at,
      shared_summary: row.shared_summary,
      employee_self_reflection: row.employee_self_reflection ?? {},
      manager_assessments: row.manager_assessments ?? {},
      template: row.template,
      counterpart: isEmployee ? row.manager : row.employee,
      counterpart_role: isEmployee ? "manager" : "employee",
    };
  });

  const actionItems = (actionItemsRes.data ?? []) as unknown as DossierActionItem[];

  type FeedbackRow = {
    id: string;
    body: string | null;
    prompt: string | null;
    status: "requested" | "submitted" | "declined";
    submitted_at: string | null;
    created_at: string;
    is_cross_team: boolean;
    author: { id: string; name: string; avatar_url: string | null } | null;
  };

  const peerFeedback: DossierPeerFeedback[] = (
    (feedbackRes.data ?? []) as unknown as FeedbackRow[]
  ).map((row) => ({
    id: row.id,
    body: row.body,
    prompt: row.prompt,
    status: row.status,
    submitted_at: row.submitted_at,
    created_at: row.created_at,
    is_cross_team: row.is_cross_team,
    author: row.author,
  }));

  return {
    user,
    oneOnOnes,
    performanceReviews,
    evaluations,
    actionItems,
    peerFeedback,
  };
}
