import { createClient } from "@/lib/supabase/server";
import type {
  ActionItem,
  OneOnOneForEmployee,
  OneOnOneFull,
  OneOnOneListItem,
  PersonRef,
  TemplateQuestion,
} from "./types";

const PERSON_COLS = "id, name, avatar_url";

const TEMPLATE_COLS = "id, name, questions";

// Velden zonder manager_private_notes. Wordt voor employee-views gebruikt.
const SAFE_ONE_ON_ONE_COLS =
  "id, manager_id, employee_id, template_id, subject, scheduled_at, completed_at, employee_preparation, shared_summary";

const FULL_ONE_ON_ONE_COLS =
  "id, manager_id, employee_id, template_id, subject, scheduled_at, completed_at, employee_preparation, shared_summary, manager_private_notes";

type RawOneOnOneRow = {
  id: string;
  manager_id: string;
  employee_id: string;
  template_id: string | null;
  subject: string;
  scheduled_at: string | null;
  completed_at: string | null;
  employee_preparation: Record<string, string> | null;
  shared_summary: string | null;
  manager_private_notes?: string | null;
  manager?: PersonRef | null;
  employee?: PersonRef | null;
  template?: { id: string; name: string; questions: TemplateQuestion[] } | null;
};

function mapFull(
  row: RawOneOnOneRow,
  existingManagerFeedback: string | null = null,
): OneOnOneFull {
  return {
    id: row.id,
    manager_id: row.manager_id,
    employee_id: row.employee_id,
    template_id: row.template_id,
    subject: row.subject,
    scheduled_at: row.scheduled_at,
    completed_at: row.completed_at,
    employee_preparation: row.employee_preparation ?? {},
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
    existing_manager_feedback: existingManagerFeedback,
  };
}

export async function listOneOnOnesForPair(
  managerId: string,
  employeeId: string,
): Promise<OneOnOneListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("one_on_ones")
    .select("id, subject, scheduled_at, completed_at, shared_summary")
    .eq("manager_id", managerId)
    .eq("employee_id", employeeId)
    .order("scheduled_at", { ascending: false });
  if (error || !data) return [];
  return data as OneOnOneListItem[];
}

export async function getOneOnOneForManager(
  id: string,
  managerId: string,
): Promise<OneOnOneFull | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("one_on_ones")
    .select(
      `${FULL_ONE_ON_ONE_COLS}, manager:users!one_on_ones_manager_id_fkey(${PERSON_COLS}), employee:users!one_on_ones_employee_id_fkey(${PERSON_COLS}), template:templates(${TEMPLATE_COLS})`,
    )
    .eq("id", id)
    .eq("manager_id", managerId)
    .maybeSingle();
  if (error || !data) return null;

  const { data: fb } = await supabase
    .from("feedback")
    .select("body")
    .eq("source_type", "one_on_one")
    .eq("source_id", id)
    .eq("author_id", managerId)
    .maybeSingle();

  return mapFull(data as unknown as RawOneOnOneRow, fb?.body ?? null);
}

// Bewust geen manager_private_notes in de select. Het type sluit het ook uit
// zodat callers er niet per ongeluk op kunnen leunen.
export async function getOneOnOneForEmployee(
  id: string,
  employeeId: string,
): Promise<OneOnOneForEmployee | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("one_on_ones")
    .select(
      `${SAFE_ONE_ON_ONE_COLS}, manager:users!one_on_ones_manager_id_fkey(${PERSON_COLS}), employee:users!one_on_ones_employee_id_fkey(${PERSON_COLS}), template:templates(${TEMPLATE_COLS})`,
    )
    .eq("id", id)
    .eq("employee_id", employeeId)
    .maybeSingle();
  if (error || !data) return null;
  const mapped = mapFull(data as unknown as RawOneOnOneRow);
  // Strip private notes en manager-feedback uit het object; type-wise al uitgesloten.
  const {
    manager_private_notes: _omitNotes,
    existing_manager_feedback: _omitFb,
    ...safe
  } = mapped;
  void _omitNotes;
  void _omitFb;
  return safe;
}

export async function getUpcomingOneOnOneForEmployee(
  employeeId: string,
): Promise<OneOnOneListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("one_on_ones")
    .select("id, subject, scheduled_at, completed_at, shared_summary")
    .eq("employee_id", employeeId)
    .is("completed_at", null)
    .order("scheduled_at", { ascending: true })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return data[0] as OneOnOneListItem;
}

export type ManagerUpcomingOneOnOne = OneOnOneListItem & {
  employee: PersonRef;
};

export async function getUpcomingOneOnOnesForManager(
  managerId: string,
  limit = 3,
): Promise<ManagerUpcomingOneOnOne[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("one_on_ones")
    .select(
      `id, subject, scheduled_at, completed_at, shared_summary, employee:users!one_on_ones_employee_id_fkey(${PERSON_COLS})`,
    )
    .eq("manager_id", managerId)
    .is("completed_at", null)
    .order("scheduled_at", { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  type Row = OneOnOneListItem & { employee: PersonRef | null };
  return (data as unknown as Row[])
    .filter((r): r is Row & { employee: PersonRef } => !!r.employee)
    .map((r) => ({
      id: r.id,
      subject: r.subject,
      scheduled_at: r.scheduled_at,
      completed_at: r.completed_at,
      shared_summary: r.shared_summary,
      employee: r.employee,
    }));
}

export async function getRecentCompletedOneOnOnesForManager(
  managerId: string,
  limit = 20,
): Promise<ManagerUpcomingOneOnOne[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("one_on_ones")
    .select(
      `id, subject, scheduled_at, completed_at, shared_summary, employee:users!one_on_ones_employee_id_fkey(${PERSON_COLS})`,
    )
    .eq("manager_id", managerId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  type Row = OneOnOneListItem & { employee: PersonRef | null };
  return (data as unknown as Row[])
    .filter((r): r is Row & { employee: PersonRef } => !!r.employee)
    .map((r) => ({
      id: r.id,
      subject: r.subject,
      scheduled_at: r.scheduled_at,
      completed_at: r.completed_at,
      shared_summary: r.shared_summary,
      employee: r.employee,
    }));
}

export async function getLatestCompletedOneOnOneForUser(
  userId: string,
  role: "employee" | "manager" | "hr",
): Promise<{ id: string; completed_at: string } | null> {
  if (role === "hr") return null;
  const supabase = await createClient();
  const column = role === "manager" ? "manager_id" : "employee_id";
  const { data, error } = await supabase
    .from("one_on_ones")
    .select("id, completed_at")
    .eq(column, userId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return { id: row.id, completed_at: row.completed_at as string };
}

export async function getLastCompletedOneOnOneForPair(
  managerId: string,
  employeeId: string,
): Promise<OneOnOneListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("one_on_ones")
    .select("id, subject, scheduled_at, completed_at, shared_summary")
    .eq("manager_id", managerId)
    .eq("employee_id", employeeId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return data[0] as OneOnOneListItem;
}

export type TeamMember = PersonRef & {
  email: string;
  role: "employee" | "manager" | "hr";
  last_one_on_one_at: string | null;
  weeks_since_last: number | null;
  upcoming_one_on_one_at: string | null;
};

// Leden van het team waar deze user als lead_user_id staat.
// Geeft een lege array als de user geen team leidt.
export async function getTeamMembers(
  managerId: string,
): Promise<TeamMember[]> {
  const supabase = await createClient();
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .select("id")
    .eq("lead_user_id", managerId)
    .maybeSingle();
  if (teamErr || !team) return [];

  const { data: members, error: memberErr } = await supabase
    .from("users")
    .select("id, name, email, role, avatar_url")
    .eq("team_id", team.id)
    .neq("id", managerId)
    .order("name");
  if (memberErr || !members) return [];

  const ids = members.map((m) => m.id);
  const lastByEmployee = new Map<string, string>();
  const upcomingByEmployee = new Map<string, string>();
  if (ids.length) {
    const { data: rows } = await supabase
      .from("one_on_ones")
      .select("employee_id, scheduled_at, completed_at")
      .eq("manager_id", managerId)
      .in("employee_id", ids)
      .order("scheduled_at", { ascending: false });
    if (rows) {
      const nowIso = new Date().toISOString();
      for (const row of rows) {
        const stamp = row.completed_at ?? row.scheduled_at;
        if (stamp && !lastByEmployee.has(row.employee_id)) {
          lastByEmployee.set(row.employee_id, stamp);
        }
        if (
          !row.completed_at &&
          row.scheduled_at &&
          row.scheduled_at >= nowIso
        ) {
          const current = upcomingByEmployee.get(row.employee_id);
          if (!current || row.scheduled_at < current) {
            upcomingByEmployee.set(row.employee_id, row.scheduled_at);
          }
        }
      }
    }
  }

  const now = Date.now();
  return members.map((m) => {
    const stamp = lastByEmployee.get(m.id) ?? null;
    const weeksSince = stamp
      ? Math.floor((now - new Date(stamp).getTime()) / (1000 * 60 * 60 * 24 * 7))
      : null;
    return {
      id: m.id,
      name: m.name,
      avatar_url: m.avatar_url,
      email: m.email,
      role: m.role,
      last_one_on_one_at: stamp,
      weeks_since_last: weeksSince,
      upcoming_one_on_one_at: upcomingByEmployee.get(m.id) ?? null,
    };
  });
}

// Wie is de manager van deze medewerker (= lead_user_id van zijn team).
export async function getManagerForEmployee(
  employeeId: string,
): Promise<PersonRef | null> {
  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("team_id")
    .eq("id", employeeId)
    .maybeSingle();
  if (error || !user?.team_id) return null;
  const { data: team } = await supabase
    .from("teams")
    .select("lead_user_id")
    .eq("id", user.team_id)
    .maybeSingle();
  if (!team?.lead_user_id || team.lead_user_id === employeeId) return null;
  const { data: lead } = await supabase
    .from("users")
    .select(PERSON_COLS)
    .eq("id", team.lead_user_id)
    .maybeSingle();
  return (lead as PersonRef | null) ?? null;
}

export async function getActionItemsBySource(
  sourceType: "one_on_one" | "performance_review" | "evaluation",
  sourceId: string,
): Promise<ActionItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("action_items")
    .select(
      `id, owner_id, description, status, target_date, notes, source_type, source_id, created_at, completed_at, owner:users!action_items_owner_id_fkey(${PERSON_COLS})`,
    )
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as unknown as ActionItem[];
}

// Actieve actiepunten van een medewerker uit eerdere 1-op-1's met deze manager.
// Open items zijn altijd zichtbaar. Voltooide items blijven 14 dagen na afronding
// in de lijst staan zodat ze in het volgende gesprek nog opduiken.
const RECENT_COMPLETED_WINDOW_DAYS = 14;

export async function getActiveActionItemsForEmployeeWithManager(
  employeeId: string,
  managerId: string,
): Promise<ActionItem[]> {
  const supabase = await createClient();
  const { data: pairRows } = await supabase
    .from("one_on_ones")
    .select("id")
    .eq("manager_id", managerId)
    .eq("employee_id", employeeId);
  const sourceIds = (pairRows ?? []).map((r) => r.id);
  if (!sourceIds.length) return [];

  const cutoff = new Date(
    Date.now() - RECENT_COMPLETED_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const selectCols = `id, owner_id, description, status, target_date, notes, source_type, source_id, created_at, completed_at, owner:users!action_items_owner_id_fkey(${PERSON_COLS})`;

  const [openRes, recentDoneRes] = await Promise.all([
    supabase
      .from("action_items")
      .select(selectCols)
      .eq("source_type", "one_on_one")
      .in("source_id", sourceIds)
      .eq("status", "open")
      .order("created_at", { ascending: true }),
    supabase
      .from("action_items")
      .select(selectCols)
      .eq("source_type", "one_on_one")
      .in("source_id", sourceIds)
      .eq("status", "completed")
      .gte("completed_at", cutoff)
      .order("completed_at", { ascending: false }),
  ]);

  const open = (openRes.data ?? []) as unknown as ActionItem[];
  const recentDone = (recentDoneRes.data ?? []) as unknown as ActionItem[];
  return [...open, ...recentDone];
}
