"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPersonaId } from "@/lib/persona/server";
import { getDefaultPerformanceReviewTemplate } from "./template";

type ActionStatus = "open" | "completed" | "expired";

export type ActionItemUpdate = {
  id: string;
  status: ActionStatus;
};

export type NewActionItemInput = {
  description: string;
};

async function requirePersonaId(): Promise<string> {
  const id = await getCurrentPersonaId();
  if (!id) throw new Error("Geen persona geselecteerd");
  return id;
}

async function ensureManagerOf(
  supabase: Awaited<ReturnType<typeof createClient>>,
  managerId: string,
  employeeId: string,
): Promise<void> {
  const { data: employee, error: empErr } = await supabase
    .from("users")
    .select("id, team_id")
    .eq("id", employeeId)
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
}

export async function startPerformanceReview(input: {
  employeeId: string;
  templateId?: string | null;
}): Promise<{ id: string }> {
  const managerId = await requirePersonaId();
  const supabase = await createClient();
  await ensureManagerOf(supabase, managerId, input.employeeId);

  let templateId = input.templateId ?? null;
  if (!templateId) {
    const template = await getDefaultPerformanceReviewTemplate();
    templateId = template?.id ?? null;
  }

  const { data, error } = await supabase
    .from("performance_reviews")
    .insert({
      manager_id: managerId,
      employee_id: input.employeeId,
      template_id: templateId,
      status: "draft" as const,
      cycle_started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Starten mislukt");
  }

  revalidatePath("/team");
  revalidatePath(`/team/${input.employeeId}`);
  revalidatePath("/functioneringsgesprek");
  revalidatePath("/dashboard");
  return { id: data.id };
}

export async function saveEmployeeSelfEvaluation(input: {
  performanceReviewId: string;
  answers: Record<string, string>;
}) {
  const employeeId = await requirePersonaId();
  const supabase = await createClient();

  const { data: row, error: rowErr } = await supabase
    .from("performance_reviews")
    .select("id, employee_id, status, completed_at")
    .eq("id", input.performanceReviewId)
    .maybeSingle();
  if (rowErr || !row) throw new Error("Functioneringsgesprek niet gevonden");
  if (row.employee_id !== employeeId)
    throw new Error("Niet jouw functioneringsgesprek");
  if (row.completed_at)
    throw new Error("Dit functioneringsgesprek is al afgerond");

  const hasAny = Object.values(input.answers).some(
    (v) => typeof v === "string" && v.trim().length > 0,
  );

  const patch: Record<string, unknown> = {
    employee_self_evaluation: input.answers,
  };
  if (hasAny && row.status === "draft") {
    patch.status = "ready_for_meeting";
  }

  const { error: updErr } = await supabase
    .from("performance_reviews")
    .update(patch)
    .eq("id", input.performanceReviewId);
  if (updErr) throw new Error(updErr.message);

  revalidatePath(`/functioneringsgesprek/${input.performanceReviewId}`);
  revalidatePath(
    `/functioneringsgesprek/${input.performanceReviewId}/voorbereiden`,
  );
  revalidatePath("/functioneringsgesprek");
  revalidatePath("/dashboard");
}

export async function saveManagerPerformanceReviewMeeting(input: {
  performanceReviewId: string;
  managerPreparation?: Record<string, string>;
  sharedSummary: string;
  privateNotes: string;
  actionItemUpdates: ActionItemUpdate[];
  newActionItems: NewActionItemInput[];
  complete?: boolean;
}) {
  const managerId = await requirePersonaId();
  const supabase = await createClient();

  const { data: row, error: rowErr } = await supabase
    .from("performance_reviews")
    .select("id, manager_id, employee_id, status, completed_at")
    .eq("id", input.performanceReviewId)
    .maybeSingle();
  if (rowErr || !row) throw new Error("Functioneringsgesprek niet gevonden");
  if (row.manager_id !== managerId)
    throw new Error("Niet jouw functioneringsgesprek");

  const patch: Record<string, unknown> = {
    shared_summary: input.sharedSummary || null,
    manager_private_notes: input.privateNotes || null,
  };
  if (input.managerPreparation !== undefined) {
    patch.manager_preparation = input.managerPreparation;
  }
  if (input.complete) {
    patch.completed_at = new Date().toISOString();
    patch.status = "completed" as const;
  } else if (row.status === "draft") {
    patch.status = "ready_for_meeting" as const;
  }

  const { error: updErr } = await supabase
    .from("performance_reviews")
    .update(patch)
    .eq("id", input.performanceReviewId);
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
        owner_id: row.employee_id as string,
        description: a.description.trim(),
        status: "open" as const,
        source_type: "performance_review" as const,
        source_id: input.performanceReviewId,
      }));
    if (rows.length) {
      const { error: insErr } = await supabase.from("action_items").insert(rows);
      if (insErr) throw new Error(insErr.message);
    }
  }

  revalidatePath(`/functioneringsgesprek/${input.performanceReviewId}`);
  revalidatePath(`/team/${row.employee_id}`);
  revalidatePath("/team");
  revalidatePath("/functioneringsgesprek");
  revalidatePath("/dashboard");
  revalidatePath("/actiepunten");
}

export async function createActionItemForPerformanceReview(input: {
  performanceReviewId: string;
  description: string;
  notes?: string | null;
}): Promise<{ id: string }> {
  const personaId = await requirePersonaId();
  const description = input.description.trim();
  if (!description) throw new Error("Titel is leeg");
  const notes = input.notes?.trim() ? input.notes.trim() : null;

  const supabase = await createClient();
  const { data: pr, error: prErr } = await supabase
    .from("performance_reviews")
    .select("id, manager_id, employee_id")
    .eq("id", input.performanceReviewId)
    .maybeSingle();
  if (prErr || !pr) throw new Error("Functioneringsgesprek niet gevonden");
  if (pr.manager_id !== personaId && pr.employee_id !== personaId) {
    throw new Error("Niet toegestaan");
  }

  const { data, error } = await supabase
    .from("action_items")
    .insert({
      owner_id: pr.employee_id,
      description,
      notes,
      status: "open" as const,
      source_type: "performance_review" as const,
      source_id: pr.id,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Aanmaken mislukt");

  revalidatePath(`/functioneringsgesprek/${pr.id}`);
  revalidatePath("/functioneringsgesprek");
  revalidatePath("/dashboard");
  revalidatePath("/actiepunten");
  return { id: data.id };
}
