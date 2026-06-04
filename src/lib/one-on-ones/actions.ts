"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPersonaId } from "@/lib/persona/server";
import { upsertManagerFeedbackForOneOnOne } from "@/lib/feedback/actions";
import { getDefaultOneOnOneTemplate } from "./template";

type ActionStatus = "open" | "completed" | "expired";

export type ActionItemUpdate = {
  id: string;
  status: ActionStatus;
};

export type NewActionItemInput = {
  description: string;
  owner_id: string;
};

async function requirePersonaId(): Promise<string> {
  const id = await getCurrentPersonaId();
  if (!id) throw new Error("Geen persona geselecteerd");
  return id;
}

const DEFAULT_SUBJECT = "Reguliere 1-op-1";

export type RecurrenceInput = {
  intervalWeeks: 1 | 2 | 4;
  occurrences: number;
};

const MAX_OCCURRENCES = 12;

export async function createOneOnOne(input: {
  employeeId: string;
  subject?: string;
  scheduledAt: string;
  recurrence?: RecurrenceInput | null;
}): Promise<{ id: string; created: number }> {
  const managerId = await requirePersonaId();
  const subject = input.subject?.trim() || DEFAULT_SUBJECT;

  const supabase = await createClient();

  // Valideer dat de manager dit team leidt en dat de medewerker daar in zit.
  const { data: employee, error: empErr } = await supabase
    .from("users")
    .select("id, team_id")
    .eq("id", input.employeeId)
    .maybeSingle();
  if (empErr || !employee?.team_id) throw new Error("Medewerker niet gevonden");

  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .select("id, lead_user_id")
    .eq("id", employee.team_id)
    .maybeSingle();
  if (teamErr || !team) throw new Error("Team niet gevonden");
  if (team.lead_user_id !== managerId) {
    throw new Error("Je leidt deze medewerker niet");
  }

  const template = await getDefaultOneOnOneTemplate();

  const occurrences = input.recurrence
    ? Math.min(Math.max(input.recurrence.occurrences, 1), MAX_OCCURRENCES)
    : 1;
  const intervalDays = input.recurrence
    ? input.recurrence.intervalWeeks * 7
    : 0;

  const start = new Date(input.scheduledAt);
  const rows = Array.from({ length: occurrences }, (_, i) => {
    const at = new Date(start);
    if (i > 0) at.setDate(at.getDate() + intervalDays * i);
    return {
      manager_id: managerId,
      employee_id: input.employeeId,
      template_id: template?.id ?? null,
      subject,
      scheduled_at: at.toISOString(),
    };
  });

  const { data, error } = await supabase
    .from("one_on_ones")
    .insert(rows)
    .select("id, scheduled_at")
    .order("scheduled_at", { ascending: true });
  if (error || !data || data.length === 0) {
    throw new Error(error?.message ?? "Inplannen mislukt");
  }

  revalidatePath("/team");
  revalidatePath(`/team/${input.employeeId}`);
  revalidatePath("/een-op-een");
  revalidatePath("/dashboard");
  return { id: data[0].id, created: data.length };
}

export async function saveEmployeePreparation(input: {
  oneOnOneId: string;
  answers: Record<string, string>;
  actionItemUpdates: ActionItemUpdate[];
}) {
  const employeeId = await requirePersonaId();
  const supabase = await createClient();

  const { data: row, error: rowErr } = await supabase
    .from("one_on_ones")
    .select("id, employee_id, completed_at")
    .eq("id", input.oneOnOneId)
    .maybeSingle();
  if (rowErr || !row) throw new Error("1-op-1 niet gevonden");
  if (row.employee_id !== employeeId) throw new Error("Niet jouw 1-op-1");
  if (row.completed_at) throw new Error("Deze 1-op-1 is al afgerond");

  const { error: updErr } = await supabase
    .from("one_on_ones")
    .update({ employee_preparation: input.answers })
    .eq("id", input.oneOnOneId);
  if (updErr) throw new Error(updErr.message);

  for (const upd of input.actionItemUpdates) {
    const completedAt =
      upd.status === "completed" ? new Date().toISOString() : null;
    const { error: aiErr } = await supabase
      .from("action_items")
      .update({ status: upd.status, completed_at: completedAt })
      .eq("id", upd.id)
      .eq("owner_id", employeeId);
    if (aiErr) throw new Error(aiErr.message);
  }

  revalidatePath(`/een-op-een/${input.oneOnOneId}`);
  revalidatePath(`/een-op-een/${input.oneOnOneId}/voorbereiden`);
  revalidatePath("/een-op-een");
  revalidatePath("/dashboard");
}

export async function saveManagerMeeting(input: {
  oneOnOneId: string;
  subject?: string;
  sharedSummary: string;
  privateNotes: string;
  actionItemUpdates: ActionItemUpdate[];
  newActionItems: NewActionItemInput[];
  feedbackBody?: string;
  complete?: boolean;
}) {
  const managerId = await requirePersonaId();
  const supabase = await createClient();

  const { data: row, error: rowErr } = await supabase
    .from("one_on_ones")
    .select("id, manager_id, employee_id")
    .eq("id", input.oneOnOneId)
    .maybeSingle();
  if (rowErr || !row) throw new Error("1-op-1 niet gevonden");
  if (row.manager_id !== managerId) throw new Error("Niet jouw 1-op-1");

  const patch: Record<string, unknown> = {
    subject: input.subject?.trim() || DEFAULT_SUBJECT,
    shared_summary: input.sharedSummary || null,
    manager_private_notes: input.privateNotes || null,
  };
  if (input.complete) {
    patch.completed_at = new Date().toISOString();
  }

  const { error: updErr } = await supabase
    .from("one_on_ones")
    .update(patch)
    .eq("id", input.oneOnOneId);
  if (updErr) throw new Error(updErr.message);

  for (const upd of input.actionItemUpdates) {
    const completedAt =
      upd.status === "completed" ? new Date().toISOString() : null;
    const { error: aiErr } = await supabase
      .from("action_items")
      .update({ status: upd.status, completed_at: completedAt })
      .eq("id", upd.id);
    if (aiErr) throw new Error(aiErr.message);
  }

  if (input.newActionItems.length) {
    const rows = input.newActionItems
      .filter((a) => a.description.trim().length > 0)
      .map((a) => ({
        owner_id: a.owner_id,
        description: a.description.trim(),
        status: "open" as const,
        source_type: "one_on_one" as const,
        source_id: input.oneOnOneId,
      }));
    if (rows.length) {
      const { error: insErr } = await supabase.from("action_items").insert(rows);
      if (insErr) throw new Error(insErr.message);
    }
  }

  if (input.feedbackBody !== undefined) {
    await upsertManagerFeedbackForOneOnOne({
      oneOnOneId: input.oneOnOneId,
      body: input.feedbackBody,
    });
  }

  revalidatePath(`/een-op-een/${input.oneOnOneId}`);
  revalidatePath(`/team/${row.employee_id}`);
  revalidatePath("/team");
  revalidatePath("/een-op-een");
  revalidatePath("/dashboard");
  revalidatePath("/actiepunten");
  revalidatePath("/feedback");
}

export async function completeOneOnOne(oneOnOneId: string) {
  const managerId = await requirePersonaId();
  const supabase = await createClient();

  const { data: row, error: rowErr } = await supabase
    .from("one_on_ones")
    .select("id, manager_id, employee_id")
    .eq("id", oneOnOneId)
    .maybeSingle();
  if (rowErr || !row) throw new Error("1-op-1 niet gevonden");
  if (row.manager_id !== managerId) throw new Error("Niet jouw 1-op-1");

  const { error: updErr } = await supabase
    .from("one_on_ones")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", oneOnOneId);
  if (updErr) throw new Error(updErr.message);

  revalidatePath(`/een-op-een/${oneOnOneId}`);
  revalidatePath(`/team/${row.employee_id}`);
  revalidatePath("/team");
}

export async function rescheduleOneOnOne(input: {
  oneOnOneId: string;
  scheduledAt: string;
}) {
  const managerId = await requirePersonaId();
  const supabase = await createClient();

  const { data: row, error: rowErr } = await supabase
    .from("one_on_ones")
    .select("id, manager_id, employee_id, completed_at")
    .eq("id", input.oneOnOneId)
    .maybeSingle();
  if (rowErr || !row) throw new Error("1-op-1 niet gevonden");
  if (row.manager_id !== managerId) throw new Error("Niet jouw 1-op-1");
  if (row.completed_at) throw new Error("Een afgerond gesprek kun je niet verplaatsen");

  const parsed = new Date(input.scheduledAt);
  if (Number.isNaN(parsed.getTime())) throw new Error("Ongeldige datum");

  const { error: updErr } = await supabase
    .from("one_on_ones")
    .update({ scheduled_at: parsed.toISOString() })
    .eq("id", input.oneOnOneId);
  if (updErr) throw new Error(updErr.message);

  revalidatePath(`/een-op-een/${input.oneOnOneId}`);
  revalidatePath(`/team/${row.employee_id}`);
  revalidatePath("/team");
  revalidatePath("/een-op-een");
  revalidatePath("/dashboard");
}

export async function deleteOneOnOne(oneOnOneId: string) {
  const managerId = await requirePersonaId();
  const supabase = await createClient();

  const { data: row, error: rowErr } = await supabase
    .from("one_on_ones")
    .select("id, manager_id, employee_id")
    .eq("id", oneOnOneId)
    .maybeSingle();
  if (rowErr || !row) throw new Error("1-op-1 niet gevonden");
  if (row.manager_id !== managerId) throw new Error("Niet jouw 1-op-1");

  // Actiepunten en feedback uit dit gesprek mee verwijderen, zodat er geen weesrijen blijven hangen.
  const { error: aiErr } = await supabase
    .from("action_items")
    .delete()
    .eq("source_type", "one_on_one")
    .eq("source_id", oneOnOneId);
  if (aiErr) throw new Error(aiErr.message);

  const { error: fbErr } = await supabase
    .from("feedback")
    .delete()
    .eq("source_type", "one_on_one")
    .eq("source_id", oneOnOneId);
  if (fbErr) throw new Error(fbErr.message);

  const { error: delErr } = await supabase
    .from("one_on_ones")
    .delete()
    .eq("id", oneOnOneId);
  if (delErr) throw new Error(delErr.message);

  revalidatePath(`/team/${row.employee_id}`);
  revalidatePath("/team");
  revalidatePath("/een-op-een");
  revalidatePath("/dashboard");
  revalidatePath("/actiepunten");
  return { employeeId: row.employee_id };
}
