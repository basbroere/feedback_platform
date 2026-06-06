import { createClient } from "@/lib/supabase/server";
import type {
  ActionItem,
  PersonRef,
  TemplateQuestion,
} from "@/lib/one-on-ones/types";
import { getFeedbackForEmployee } from "@/lib/feedback/queries";
import type { FeedbackStatus, FeedbackWithSource } from "@/lib/feedback/types";
import type {
  CycleFeedback,
  CycleInputs,
  DossierActionItem,
  PerformanceReviewDossier,
  PerformanceReviewForEmployee,
  PerformanceReviewFull,
  PerformanceReviewListItem,
  PerformanceReviewStatus,
} from "./types";

const PERSON_COLS = "id, name, avatar_url";
const TEMPLATE_COLS = "id, name, questions";

const SAFE_PR_COLS =
  "id, manager_id, employee_id, template_id, status, subject, cycle_started_at, completed_at, scheduled_at, employee_self_evaluation, shared_summary";

const FULL_PR_COLS =
  "id, manager_id, employee_id, template_id, status, subject, cycle_started_at, completed_at, scheduled_at, employee_self_evaluation, manager_preparation, manager_private_notes, shared_summary";

const SIX_MONTHS_DAYS = 182;

type RawPerformanceReviewRow = {
  id: string;
  manager_id: string;
  employee_id: string;
  template_id: string | null;
  status: PerformanceReviewStatus;
  subject: string | null;
  cycle_started_at: string;
  completed_at: string | null;
  scheduled_at: string | null;
  employee_self_evaluation: Record<string, string> | null;
  manager_preparation?: Record<string, string> | null;
  manager_private_notes?: string | null;
  shared_summary: string | null;
  manager?: PersonRef | null;
  employee?: PersonRef | null;
  template?: { id: string; name: string; questions: TemplateQuestion[] } | null;
};

function mapFull(row: RawPerformanceReviewRow): PerformanceReviewFull {
  return {
    id: row.id,
    manager_id: row.manager_id,
    employee_id: row.employee_id,
    template_id: row.template_id,
    status: row.status,
    subject: row.subject ?? null,
    cycle_started_at: row.cycle_started_at,
    completed_at: row.completed_at,
    scheduled_at: row.scheduled_at ?? null,
    employee_self_evaluation: row.employee_self_evaluation ?? {},
    manager_preparation: row.manager_preparation ?? {},
    manager_private_notes: row.manager_private_notes ?? null,
    shared_summary: row.shared_summary,
    manager: row.manager ?? { id: row.manager_id, name: "", avatar_url: null },
    employee: row.employee ?? {
      id: row.employee_id,
      name: "",
      avatar_url: null,
    },
    template: row.template
      ? {
          id: row.template.id,
          name: row.template.name,
          questions: row.template.questions ?? [],
        }
      : null,
  };
}

export async function getPerformanceReviewForManager(
  id: string,
  managerId: string,
): Promise<PerformanceReviewFull | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("performance_reviews")
    .select(
      `${FULL_PR_COLS}, manager:users!performance_reviews_manager_id_fkey(${PERSON_COLS}), employee:users!performance_reviews_employee_id_fkey(${PERSON_COLS}), template:templates(${TEMPLATE_COLS})`,
    )
    .eq("id", id)
    .eq("manager_id", managerId)
    .maybeSingle();
  if (error || !data) return null;
  return mapFull(data as unknown as RawPerformanceReviewRow);
}

// Strip privé velden voor de employee-view. Type sluit ze al uit op compile-time;
// hier verwijderen we ze ook runtime zodat ze niet per ongeluk meelekken via JSON.
export async function getPerformanceReviewForEmployee(
  id: string,
  employeeId: string,
): Promise<PerformanceReviewForEmployee | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("performance_reviews")
    .select(
      `${SAFE_PR_COLS}, manager:users!performance_reviews_manager_id_fkey(${PERSON_COLS}), employee:users!performance_reviews_employee_id_fkey(${PERSON_COLS}), template:templates(${TEMPLATE_COLS})`,
    )
    .eq("id", id)
    .eq("employee_id", employeeId)
    .maybeSingle();
  if (error || !data) return null;
  const mapped = mapFull(data as unknown as RawPerformanceReviewRow);
  const {
    manager_private_notes: _omitNotes,
    manager_preparation: _omitPrep,
    ...safe
  } = mapped;
  void _omitNotes;
  void _omitPrep;
  return safe;
}

type RawListRow = {
  id: string;
  status: PerformanceReviewStatus;
  cycle_started_at: string;
  completed_at: string | null;
  scheduled_at: string | null;
  employee_self_evaluation: Record<string, string> | null;
  template: { name: string } | null;
  employee: PersonRef | null;
  manager: PersonRef | null;
};

function mapListRow(
  row: RawListRow,
  feedbackStats?: Map<string, { has_peer_submitted: boolean; has_manager_submitted: boolean }>,
): PerformanceReviewListItem | null {
  if (!row.employee || !row.manager) return null;
  const stats = feedbackStats?.get(row.id);
  return {
    id: row.id,
    status: row.status,
    cycle_started_at: row.cycle_started_at,
    completed_at: row.completed_at,
    scheduled_at: row.scheduled_at ?? null,
    template_name: row.template?.name ?? null,
    has_employee_input:
      Object.values(row.employee_self_evaluation ?? {}).some(
        (v) => typeof v === "string" && v.trim().length > 0,
      ) ?? false,
    has_peer_submitted: stats?.has_peer_submitted ?? false,
    has_manager_submitted: stats?.has_manager_submitted ?? false,
    employee: row.employee,
    manager: row.manager,
  };
}

const LIST_COLS = `id, status, cycle_started_at, completed_at, scheduled_at, employee_self_evaluation, template:templates(name), employee:users!performance_reviews_employee_id_fkey(${PERSON_COLS}), manager:users!performance_reviews_manager_id_fkey(${PERSON_COLS})`;

async function batchFeedbackStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  prIds: string[],
  managerIds: Map<string, string>,
  employeeIds: Map<string, string>,
): Promise<Map<string, { has_peer_submitted: boolean; has_manager_submitted: boolean }>> {
  if (!prIds.length) return new Map();
  const { data } = await supabase
    .from("feedback")
    .select("source_id, author_id, status")
    .eq("source_type", "performance_review")
    .in("source_id", prIds)
    .eq("status", "submitted");

  type Row = { source_id: string; author_id: string; status: string };
  const rows = (data ?? []) as Row[];
  const result = new Map<string, { has_peer_submitted: boolean; has_manager_submitted: boolean }>();
  for (const prId of prIds) {
    const managerId = managerIds.get(prId);
    const employeeId = employeeIds.get(prId);
    const prRows = rows.filter((r) => r.source_id === prId);
    result.set(prId, {
      has_manager_submitted: prRows.some((r) => r.author_id === managerId),
      has_peer_submitted: prRows.some(
        (r) => r.author_id !== managerId && r.author_id !== employeeId,
      ),
    });
  }
  return result;
}

export async function listPerformanceReviewsForManager(
  managerId: string,
): Promise<PerformanceReviewListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("performance_reviews")
    .select(LIST_COLS)
    .eq("manager_id", managerId)
    .order("cycle_started_at", { ascending: false });
  if (error || !data) return [];
  const rows = data as unknown as RawListRow[];
  const prIds = rows.map((r) => r.id);
  const managerIds = new Map(rows.map((r) => [r.id, managerId]));
  const employeeIds = new Map(rows.map((r) => [r.id, r.employee?.id ?? ""]));
  const stats = await batchFeedbackStats(supabase, prIds, managerIds, employeeIds);
  return rows
    .map((r) => mapListRow(r, stats))
    .filter((r): r is PerformanceReviewListItem => r !== null);
}

export async function listPerformanceReviewsBetween(
  managerId: string,
  employeeId: string,
): Promise<PerformanceReviewListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("performance_reviews")
    .select(LIST_COLS)
    .eq("manager_id", managerId)
    .eq("employee_id", employeeId)
    .order("cycle_started_at", { ascending: false });
  if (error || !data) return [];
  const rows = data as unknown as RawListRow[];
  const prIds = rows.map((r) => r.id);
  const managerIds = new Map(rows.map((r) => [r.id, managerId]));
  const employeeIds = new Map(rows.map((r) => [r.id, employeeId]));
  const stats = await batchFeedbackStats(supabase, prIds, managerIds, employeeIds);
  return rows
    .map((r) => mapListRow(r, stats))
    .filter((r): r is PerformanceReviewListItem => r !== null);
}

export async function listPerformanceReviewsForEmployee(
  employeeId: string,
): Promise<PerformanceReviewListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("performance_reviews")
    .select(LIST_COLS)
    .eq("employee_id", employeeId)
    .order("cycle_started_at", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as RawListRow[])
    .map((r) => mapListRow(r))
    .filter((r): r is PerformanceReviewListItem => r !== null);
}

export async function getActiveActionItemsForPerformanceReview(
  performanceReviewId: string,
): Promise<ActionItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("action_items")
    .select(
      `id, owner_id, description, status, target_date, notes, source_type, source_id, created_at, completed_at, owner:users!action_items_owner_id_fkey(${PERSON_COLS})`,
    )
    .eq("source_type", "performance_review")
    .eq("source_id", performanceReviewId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as unknown as ActionItem[];
}

// Dossier-window van een functioneringsgesprek: 6 maanden voor cycle_started_at
// tot completed_at, of tot nu als nog niet afgerond.
function dossierWindow(
  cycleStartedAt: string,
  completedAt: string | null,
): { startIso: string; endIso: string } {
  const cycleStart = new Date(cycleStartedAt);
  const start = new Date(cycleStart);
  start.setDate(start.getDate() - SIX_MONTHS_DAYS);
  const endIso = completedAt ?? new Date().toISOString();
  return { startIso: start.toISOString(), endIso };
}

export async function getPerformanceReviewDossier(
  performanceReviewId: string,
): Promise<PerformanceReviewDossier | null> {
  const supabase = await createClient();
  const { data: pr, error } = await supabase
    .from("performance_reviews")
    .select("employee_id, cycle_started_at, completed_at")
    .eq("id", performanceReviewId)
    .maybeSingle();
  if (error || !pr) return null;

  const { startIso, endIso } = dossierWindow(
    pr.cycle_started_at as string,
    pr.completed_at as string | null,
  );

  const [completedItemsRes, feedback, oneOnOneCountRes] = await Promise.all([
    supabase
      .from("action_items")
      .select(
        `id, owner_id, description, status, target_date, notes, source_type, source_id, created_at, completed_at, owner:users!action_items_owner_id_fkey(${PERSON_COLS})`,
      )
      .eq("owner_id", pr.employee_id)
      .eq("status", "completed")
      .gte("completed_at", startIso)
      .lte("completed_at", endIso)
      .order("completed_at", { ascending: false }),
    getFeedbackForEmployee(pr.employee_id as string, {
      sinceIso: startIso,
      untilIso: endIso,
    }),
    supabase
      .from("one_on_ones")
      .select("id", { count: "exact", head: true })
      .eq("employee_id", pr.employee_id)
      .not("completed_at", "is", null)
      .gte("completed_at", startIso)
      .lte("completed_at", endIso),
  ]);

  const items = (completedItemsRes.data ?? []) as unknown as ActionItem[];

  // Verrijk actiepunten met source-info voor de UI (link terug naar 1-op-1).
  const oneOnOneIds = Array.from(
    new Set(
      items
        .filter(
          (i): i is ActionItem & { source_id: string } =>
            i.source_type === "one_on_one" && i.source_id !== null,
        )
        .map((i) => i.source_id),
    ),
  );
  const oneOnOneMap = new Map<
    string,
    { subject: string; date: string | null }
  >();
  if (oneOnOneIds.length) {
    const { data: rows } = await supabase
      .from("one_on_ones")
      .select("id, subject, scheduled_at, completed_at")
      .in("id", oneOnOneIds);
    type Row = {
      id: string;
      subject: string;
      scheduled_at: string | null;
      completed_at: string | null;
    };
    for (const raw of (rows ?? []) as unknown as Row[]) {
      oneOnOneMap.set(raw.id, {
        subject: raw.subject || "1-op-1",
        date: raw.completed_at ?? raw.scheduled_at,
      });
    }
  }

  const completedActionItems: DossierActionItem[] = items.map((it) => {
    if (it.source_type === "one_on_one" && it.source_id) {
      const info = oneOnOneMap.get(it.source_id);
      return {
        ...it,
        source_label: info?.subject ?? "1-op-1",
        source_href: `/een-op-een/${it.source_id}`,
        source_date: info?.date ?? null,
      };
    }
    if (it.source_type === "performance_review") {
      return {
        ...it,
        source_label: "Functioneringsgesprek",
        source_href: null,
        source_date: null,
      };
    }
    if (it.source_type === "personal") {
      return {
        ...it,
        source_label: "Persoonlijk",
        source_href: null,
        source_date: null,
      };
    }
    return {
      ...it,
      source_label: "Beoordelingsgesprek",
      source_href: null,
      source_date: null,
    };
  });

  return {
    windowStart: startIso,
    windowEnd: endIso,
    completedActionItems,
    receivedFeedbackCount: feedback.length,
    oneOnOneCount: oneOnOneCountRes.count ?? 0,
  };
}

// Helper om feedback in het dossier-window direct op te halen voor de UI.
export async function getDossierFeedback(
  performanceReviewId: string,
): Promise<FeedbackWithSource[]> {
  const supabase = await createClient();
  const { data: pr } = await supabase
    .from("performance_reviews")
    .select("employee_id, cycle_started_at, completed_at")
    .eq("id", performanceReviewId)
    .maybeSingle();
  if (!pr) return [];
  const { startIso, endIso } = dossierWindow(
    pr.cycle_started_at as string,
    pr.completed_at as string | null,
  );
  return getFeedbackForEmployee(pr.employee_id as string, {
    sinceIso: startIso,
    untilIso: endIso,
  });
}

export async function getUpcomingPerformanceReviewForEmployee(
  employeeId: string,
): Promise<PerformanceReviewListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("performance_reviews")
    .select(LIST_COLS)
    .eq("employee_id", employeeId)
    .neq("status", "completed")
    .neq("status", "cancelled")
    .order("cycle_started_at", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return mapListRow(data[0] as unknown as RawListRow);
}

export async function listScheduledPerformanceReviewsForManager(
  managerId: string,
): Promise<PerformanceReviewListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("performance_reviews")
    .select(LIST_COLS)
    .eq("manager_id", managerId)
    .eq("status", "scheduled")
    .order("scheduled_at", { ascending: true });
  if (error || !data) return [];
  const rows = data as unknown as RawListRow[];
  const prIds = rows.map((r) => r.id);
  const managerIds = new Map(rows.map((r) => [r.id, managerId]));
  const employeeIds = new Map(rows.map((r) => [r.id, r.employee?.id ?? ""]));
  const stats = await batchFeedbackStats(supabase, prIds, managerIds, employeeIds);
  return rows
    .map((r) => mapListRow(r, stats))
    .filter((r): r is PerformanceReviewListItem => r !== null);
}

// Haalt peer-, manager- en upward-feedback-rijen op die bij deze cyclus horen.
// Peer = author die niet de manager en niet de medewerker is.
// Manager = author die de manager_id van de cyclus is.
// Upward = source_type 'upward_feedback' met author = medewerker, recipient = manager.
// hideUntilManagerSubmits: als true, wordt peer-rij verborgen als manager nog niet submitted heeft.
export async function getCycleInputs(
  performanceReviewId: string,
  options?: { hideUntilManagerSubmits?: boolean },
): Promise<CycleInputs> {
  const supabase = await createClient();
  const { data: pr } = await supabase
    .from("performance_reviews")
    .select("manager_id, employee_id")
    .eq("id", performanceReviewId)
    .maybeSingle();
  if (!pr) return { peer: null, manager: null, upward: null };

  const { data } = await supabase
    .from("feedback")
    .select(
      `id, source_type, author_id, status, responses, submitted_at, is_cross_team, created_at, author:users!feedback_author_id_fkey(${PERSON_COLS})`,
    )
    .in("source_type", ["performance_review", "upward_feedback"])
    .eq("source_id", performanceReviewId)
    .order("created_at", { ascending: false });

  type Row = {
    id: string;
    source_type: "performance_review" | "upward_feedback";
    author_id: string;
    status: FeedbackStatus;
    responses: Record<string, string> | null;
    submitted_at: string | null;
    is_cross_team: boolean;
    created_at: string;
    author: PersonRef | null;
  };

  const rows = (data ?? []) as unknown as Row[];

  const managerRow =
    rows.find(
      (r) =>
        r.source_type === "performance_review" &&
        r.author_id === pr.manager_id &&
        r.status !== "declined",
    ) ?? null;
  const peerRow =
    rows.find(
      (r) =>
        r.source_type === "performance_review" &&
        r.author_id !== pr.manager_id &&
        r.author_id !== pr.employee_id &&
        r.status !== "declined",
    ) ?? null;
  const upwardRow =
    rows.find(
      (r) =>
        r.source_type === "upward_feedback" &&
        r.author_id === pr.employee_id &&
        r.status !== "declined",
    ) ?? null;

  function toCycle(row: Row | null): CycleFeedback | null {
    if (!row || !row.author) return null;
    return {
      feedback_id: row.id,
      author: row.author,
      status: row.status,
      responses: row.responses ?? {},
      submitted_at: row.submitted_at,
      is_cross_team: row.is_cross_team,
    };
  }

  const managerHasSubmitted = managerRow?.status === "submitted";

  if (options?.hideUntilManagerSubmits && !managerHasSubmitted) {
    return { peer: null, manager: toCycle(managerRow), upward: toCycle(upwardRow) };
  }

  return {
    peer: toCycle(peerRow),
    manager: toCycle(managerRow),
    upward: toCycle(upwardRow),
  };
}

export async function listOpenPerformanceReviewsForManager(
  managerId: string,
): Promise<PerformanceReviewListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("performance_reviews")
    .select(LIST_COLS)
    .eq("manager_id", managerId)
    .neq("status", "completed")
    .neq("status", "cancelled")
    .order("cycle_started_at", { ascending: false });
  if (error || !data) return [];
  const rows = data as unknown as RawListRow[];
  const prIds = rows.map((r) => r.id);
  const managerIds = new Map(rows.map((r) => [r.id, managerId]));
  const employeeIds = new Map(rows.map((r) => [r.id, r.employee?.id ?? ""]));
  const stats = await batchFeedbackStats(supabase, prIds, managerIds, employeeIds);
  return rows
    .map((r) => mapListRow(r, stats))
    .filter((r): r is PerformanceReviewListItem => r !== null);
}
