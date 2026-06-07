import { createClient } from "@/lib/supabase/server";
import type { PersonRef } from "@/lib/one-on-ones/types";

export type ConversationKind =
  | "one_on_one"
  | "performance_review"
  | "evaluation";

export type ManagerConversationEvent = {
  id: string;
  kind: ConversationKind;
  scheduledAt: string;
  subject: string;
  employee: PersonRef;
  href: string;
  prepHref: string | null;
  hasEmployeePrep: boolean;
};

const PERSON_COLS = "id, name, avatar_url";

const ONE_MONTH_DAYS = 30;
const STALE_CYCLE_WEEKS = 8;
const STALE_PEER_REQUEST_DAYS = 7;

export async function getManagerConversationsBetween(
  managerId: string,
  startIso: string,
  endIso: string,
): Promise<ManagerConversationEvent[]> {
  const supabase = await createClient();

  const [oneOnOneRes, prRes] = await Promise.all([
    supabase
      .from("one_on_ones")
      .select(
        `id, subject, scheduled_at, employee_preparation, employee:users!one_on_ones_employee_id_fkey(${PERSON_COLS})`,
      )
      .eq("manager_id", managerId)
      .is("completed_at", null)
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", startIso)
      .lte("scheduled_at", endIso)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("performance_reviews")
      .select(
        `id, subject, scheduled_at, employee_self_evaluation, template:templates(name), employee:users!performance_reviews_employee_id_fkey(${PERSON_COLS})`,
      )
      .eq("manager_id", managerId)
      .neq("status", "completed")
      .neq("status", "cancelled")
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", startIso)
      .lte("scheduled_at", endIso)
      .order("scheduled_at", { ascending: true }),
  ]);

  type OneOnOneRow = {
    id: string;
    subject: string | null;
    scheduled_at: string;
    employee_preparation: Record<string, string> | null;
    employee: PersonRef | null;
  };
  type PrRow = {
    id: string;
    subject: string | null;
    scheduled_at: string;
    employee_self_evaluation: Record<string, string> | null;
    template: { name: string } | null;
    employee: PersonRef | null;
  };

  const events: ManagerConversationEvent[] = [];

  for (const row of (oneOnOneRes.data ?? []) as unknown as OneOnOneRow[]) {
    if (!row.employee) continue;
    const hasPrep = hasContent(row.employee_preparation);
    events.push({
      id: row.id,
      kind: "one_on_one",
      scheduledAt: row.scheduled_at,
      subject: row.subject || `1-op-1 met ${row.employee.name}`,
      employee: row.employee,
      href: `/een-op-een/${row.id}`,
      prepHref: null,
      hasEmployeePrep: hasPrep,
    });
  }

  for (const row of (prRes.data ?? []) as unknown as PrRow[]) {
    if (!row.employee) continue;
    const hasPrep = hasContent(row.employee_self_evaluation);
    events.push({
      id: row.id,
      kind: "performance_review",
      scheduledAt: row.scheduled_at,
      subject:
        row.subject ||
        row.template?.name ||
        `Functioneringsgesprek met ${row.employee.name}`,
      employee: row.employee,
      href: `/functioneringsgesprek/${row.id}`,
      prepHref: null,
      hasEmployeePrep: hasPrep,
    });
  }

  events.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  return events;
}

function hasContent(obj: Record<string, string> | null): boolean {
  if (!obj) return false;
  return Object.values(obj).some(
    (v) => typeof v === "string" && v.trim().length > 0,
  );
}

export type ManagerNotificationKind =
  | "stale_one_on_one"
  | "no_follow_up"
  | "stale_performance_cycle"
  | "open_peer_request";

export type ManagerNotification = {
  id: string;
  kind: ManagerNotificationKind;
  title: string;
  detail: string;
  href: string;
  person: PersonRef | null;
  daysAgo: number | null;
};

export async function getManagerNotifications(
  managerId: string,
): Promise<ManagerNotification[]> {
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("lead_user_id", managerId)
    .maybeSingle();

  const notifications: ManagerNotification[] = [];
  const now = Date.now();

  if (team) {
    const { data: members } = await supabase
      .from("users")
      .select("id, name, avatar_url")
      .eq("team_id", team.id)
      .neq("id", managerId)
      .is("left_at", null);

    const memberList = (members ?? []) as PersonRef[];
    const memberIds = memberList.map((m) => m.id);

    if (memberIds.length) {
      const { data: rows } = await supabase
        .from("one_on_ones")
        .select("id, employee_id, scheduled_at, completed_at")
        .eq("manager_id", managerId)
        .in("employee_id", memberIds);

      type RawRow = {
        id: string;
        employee_id: string;
        scheduled_at: string | null;
        completed_at: string | null;
      };

      const byEmployee = new Map<
        string,
        {
          lastCompletedAt: string | null;
          lastCompletedId: string | null;
          upcomingAt: string | null;
        }
      >();

      for (const m of memberList) {
        byEmployee.set(m.id, {
          lastCompletedAt: null,
          lastCompletedId: null,
          upcomingAt: null,
        });
      }

      const nowIso = new Date().toISOString();
      for (const row of (rows ?? []) as RawRow[]) {
        const slot = byEmployee.get(row.employee_id);
        if (!slot) continue;
        if (row.completed_at) {
          if (
            !slot.lastCompletedAt ||
            row.completed_at > slot.lastCompletedAt
          ) {
            slot.lastCompletedAt = row.completed_at;
            slot.lastCompletedId = row.id;
          }
        } else if (row.scheduled_at && row.scheduled_at >= nowIso) {
          if (!slot.upcomingAt || row.scheduled_at < slot.upcomingAt) {
            slot.upcomingAt = row.scheduled_at;
          }
        }
      }

      for (const m of memberList) {
        const slot = byEmployee.get(m.id);
        if (!slot) continue;
        if (slot.upcomingAt) continue;

        if (!slot.lastCompletedAt) {
          notifications.push({
            id: `stale-${m.id}`,
            kind: "stale_one_on_one",
            title: `${m.name} heeft nog geen 1-op-1 gehad`,
            detail: "Plan een eerste gesprek in om de lijntjes kort te houden.",
            href: `/team/${m.id}`,
            person: m,
            daysAgo: null,
          });
          continue;
        }

        const daysSince = Math.floor(
          (now - new Date(slot.lastCompletedAt).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (daysSince >= ONE_MONTH_DAYS) {
          notifications.push({
            id: `stale-${m.id}`,
            kind: "stale_one_on_one",
            title: `${daysSince} dagen geen 1-op-1 met ${m.name}`,
            detail: "Tijd voor een check-in, plan een nieuwe 1-op-1?",
            href: `/team/${m.id}`,
            person: m,
            daysAgo: daysSince,
          });
        } else {
          notifications.push({
            id: `follow-${m.id}`,
            kind: "no_follow_up",
            title: `Geen vervolg-1-op-1 met ${m.name}`,
            detail: `Laatste gesprek was ${daysSince === 0 ? "vandaag" : daysSince === 1 ? "gisteren" : `${daysSince} dagen geleden`}, er staat nog niets in de agenda.`,
            href: `/team/${m.id}`,
            person: m,
            daysAgo: daysSince,
          });
        }
      }
    }
  }

  const { data: cycles } = await supabase
    .from("performance_reviews")
    .select(
      `id, cycle_started_at, scheduled_at, status, employee:users!performance_reviews_employee_id_fkey(${PERSON_COLS})`,
    )
    .eq("manager_id", managerId)
    .neq("status", "completed")
    .neq("status", "cancelled")
    .is("scheduled_at", null);

  type CycleRow = {
    id: string;
    cycle_started_at: string;
    scheduled_at: string | null;
    status: string;
    employee: PersonRef | null;
  };

  const staleCutoff = STALE_CYCLE_WEEKS * 7 * 24 * 60 * 60 * 1000;
  for (const row of (cycles ?? []) as unknown as CycleRow[]) {
    if (!row.employee) continue;
    const ageMs = now - new Date(row.cycle_started_at).getTime();
    if (ageMs < staleCutoff) continue;
    const weeks = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 7));
    notifications.push({
      id: `cycle-${row.id}`,
      kind: "stale_performance_cycle",
      title: `Functioneringscyclus met ${row.employee.name} loopt al ${weeks} weken`,
      detail: "Plan het gesprek in zodra de input binnen is.",
      href: `/functioneringsgesprek/${row.id}`,
      person: row.employee,
      daysAgo: Math.floor(ageMs / (1000 * 60 * 60 * 24)),
    });
  }

  const peerCutoffIso = new Date(
    now - STALE_PEER_REQUEST_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: teamMembersForPeer } = team
    ? await supabase
        .from("users")
        .select("id")
        .eq("team_id", team.id)
        .is("left_at", null)
    : { data: null };

  const teamMemberIds = ((teamMembersForPeer ?? []) as { id: string }[]).map(
    (u) => u.id,
  );

  if (teamMemberIds.length) {
    const { data: peerRows } = await supabase
      .from("feedback")
      .select(
        `id, source_type, source_id, requested_at, created_at, author:users!feedback_author_id_fkey(${PERSON_COLS}), recipient:users!feedback_recipient_id_fkey(${PERSON_COLS})`,
      )
      .in("author_id", teamMemberIds)
      .in("source_type", ["peer_request", "performance_review"])
      .eq("status", "requested")
      .lte("created_at", peerCutoffIso);

    type PeerRow = {
      id: string;
      source_type: "peer_request" | "performance_review";
      source_id: string | null;
      requested_at: string | null;
      created_at: string;
      author: PersonRef | null;
      recipient: PersonRef | null;
    };

    for (const row of (peerRows ?? []) as unknown as PeerRow[]) {
      if (!row.author) continue;
      const ts = row.requested_at ?? row.created_at;
      const days = Math.floor(
        (now - new Date(ts).getTime()) / (1000 * 60 * 60 * 24),
      );
      notifications.push({
        id: `peer-${row.id}`,
        kind: "open_peer_request",
        title: `${row.author.name} moet nog peer-feedback geven`,
        detail: row.recipient
          ? `Aan ${row.recipient.name}, ${days} dagen open.`
          : `${days} dagen open.`,
        href: `/feedback-verzoek/${row.id}`,
        person: row.author,
        daysAgo: days,
      });
    }
  }

  notifications.sort((a, b) => (b.daysAgo ?? 0) - (a.daysAgo ?? 0));
  return notifications;
}
