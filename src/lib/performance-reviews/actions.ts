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
  scheduledAt?: string | null;
}): Promise<{ id: string }> {
  const managerId = await requirePersonaId();
  const supabase = await createClient();
  await ensureManagerOf(supabase, managerId, input.employeeId);

  let templateId = input.templateId ?? null;
  if (!templateId) {
    const template = await getDefaultPerformanceReviewTemplate();
    templateId = template?.id ?? null;
  }

  const scheduledAt = input.scheduledAt ?? null;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("performance_reviews")
    .insert({
      manager_id: managerId,
      employee_id: input.employeeId,
      template_id: templateId,
      status: scheduledAt ? ("scheduled" as const) : ("draft" as const),
      scheduled_at: scheduledAt,
      cycle_started_at: now,
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

  const { error: updErr } = await supabase
    .from("performance_reviews")
    .update({ employee_self_evaluation: input.answers })
    .eq("id", input.performanceReviewId);
  if (updErr) throw new Error(updErr.message);

  revalidatePath(`/functioneringsgesprek/${input.performanceReviewId}`);
  revalidatePath(
    `/functioneringsgesprek/${input.performanceReviewId}/voorbereiden`,
  );
  revalidatePath("/functioneringsgesprek");
  revalidatePath("/dashboard");
}

// Medewerker rondt voorbereiding af: zelfreflectie ingevuld én peer gekozen.
// Zet status van 'draft' naar 'collecting_input'.
export async function finalizeEmployeePreparation(input: {
  performanceReviewId: string;
}): Promise<void> {
  const employeeId = await requirePersonaId();
  const supabase = await createClient();

  const { data: row, error: rowErr } = await supabase
    .from("performance_reviews")
    .select("id, employee_id, status, employee_self_evaluation, completed_at")
    .eq("id", input.performanceReviewId)
    .maybeSingle();
  if (rowErr || !row) throw new Error("Functioneringsgesprek niet gevonden");
  if (row.employee_id !== employeeId) throw new Error("Niet jouw functioneringsgesprek");
  if (row.completed_at) throw new Error("Dit functioneringsgesprek is al afgerond");
  if (row.status === "ready_for_meeting" || row.status === "completed" || row.status === "cancelled") return;

  const hasEval = Object.values(row.employee_self_evaluation ?? {}).some(
    (v) => typeof v === "string" && (v as string).trim().length > 0,
  );
  if (!hasEval) throw new Error("Vul eerst je zelfreflectie in");

  const { data: peerRow } = await supabase
    .from("feedback")
    .select("id")
    .eq("source_type", "performance_review")
    .eq("source_id", input.performanceReviewId)
    .neq("author_id", row.employee_id)
    .in("status", ["requested", "submitted"])
    .limit(1)
    .maybeSingle();
  if (!peerRow) throw new Error("Kies eerst een peer-reviewer");

  const nextStatus: "scheduled" | "collecting_input" =
    row.status === "scheduled" ? "scheduled" : "collecting_input";
  const { error: updErr } = await supabase
    .from("performance_reviews")
    .update({ status: nextStatus })
    .eq("id", input.performanceReviewId);
  if (updErr) throw new Error(updErr.message);

  revalidatePath(`/functioneringsgesprek/${input.performanceReviewId}`);
  revalidatePath(`/functioneringsgesprek/${input.performanceReviewId}/voorbereiden`);
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

// Medewerker kiest 1 collega voor peer-feedback binnen deze cyclus. Eventuele
// nog niet beantwoorde eerdere keuze wordt vervangen; submitted of declined
// rijen blijven staan voor de historie.
export async function chooseCyclePeer(input: {
  performanceReviewId: string;
  peerId: string;
}): Promise<{ feedbackId: string }> {
  const employeeId = await requirePersonaId();
  const supabase = await createClient();

  const { data: pr, error: prErr } = await supabase
    .from("performance_reviews")
    .select("id, manager_id, employee_id, completed_at")
    .eq("id", input.performanceReviewId)
    .maybeSingle();
  if (prErr || !pr) throw new Error("Functioneringsgesprek niet gevonden");
  if (pr.employee_id !== employeeId)
    throw new Error("Niet jouw functioneringsgesprek");
  if (pr.completed_at)
    throw new Error("Dit functioneringsgesprek is al afgerond");
  if (!input.peerId) throw new Error("Kies een collega");
  if (input.peerId === pr.employee_id)
    throw new Error("Je kunt jezelf niet kiezen");
  if (input.peerId === pr.manager_id)
    throw new Error("Je manager geeft al feedback in deze cyclus");

  const { data: peer, error: peerErr } = await supabase
    .from("users")
    .select("id")
    .eq("id", input.peerId)
    .is("left_at", null)
    .maybeSingle();
  if (peerErr || !peer) throw new Error("Collega niet gevonden");

  // Verwijder eerder verzonden maar nog niet beantwoorde peer-rijen.
  const { data: existing } = await supabase
    .from("feedback")
    .select("id, author_id, status")
    .eq("source_type", "performance_review")
    .eq("source_id", input.performanceReviewId)
    .neq("author_id", pr.manager_id)
    .neq("author_id", pr.employee_id);
  const toDelete = (existing ?? [])
    .filter((r) => r.status === "requested")
    .map((r) => r.id);
  if (toDelete.length) {
    await supabase.from("feedback").delete().in("id", toDelete);
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("feedback")
    .insert({
      recipient_id: pr.employee_id,
      author_id: input.peerId,
      source_type: "performance_review" as const,
      source_id: input.performanceReviewId,
      status: "requested" as const,
      requested_at: now,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Uitnodigen mislukt");

  await supabase.from("notifications").insert({
    user_id: input.peerId,
    type: "feedback_requested" as const,
    payload: {
      feedback_id: data.id,
      performance_review_id: input.performanceReviewId,
      requester_id: employeeId,
    },
  });

  revalidatePath(`/functioneringsgesprek/${input.performanceReviewId}`);
  revalidatePath(
    `/functioneringsgesprek/${input.performanceReviewId}/voorbereiden`,
  );
  revalidatePath("/functioneringsgesprek");
  revalidatePath("/feedback");
  revalidatePath("/dashboard");
  return { feedbackId: data.id };
}

// Medewerker wist de peer-keuze. Mag alleen als de peer nog niet heeft
// geantwoord; anders blijft de feedback in het dossier staan.
export async function removeCyclePeer(input: {
  performanceReviewId: string;
}): Promise<void> {
  const employeeId = await requirePersonaId();
  const supabase = await createClient();

  const { data: pr, error: prErr } = await supabase
    .from("performance_reviews")
    .select("id, manager_id, employee_id, completed_at")
    .eq("id", input.performanceReviewId)
    .maybeSingle();
  if (prErr || !pr) throw new Error("Functioneringsgesprek niet gevonden");
  if (pr.employee_id !== employeeId)
    throw new Error("Niet jouw functioneringsgesprek");
  if (pr.completed_at)
    throw new Error("Dit functioneringsgesprek is al afgerond");

  const { data: existing } = await supabase
    .from("feedback")
    .select("id, author_id, status")
    .eq("source_type", "performance_review")
    .eq("source_id", input.performanceReviewId)
    .neq("author_id", pr.manager_id)
    .neq("author_id", pr.employee_id);
  const toDelete = (existing ?? [])
    .filter((r) => r.status === "requested")
    .map((r) => r.id);
  if (toDelete.length) {
    await supabase.from("feedback").delete().in("id", toDelete);
  }

  revalidatePath(`/functioneringsgesprek/${input.performanceReviewId}`);
  revalidatePath(
    `/functioneringsgesprek/${input.performanceReviewId}/voorbereiden`,
  );
}

// Manager vult zelf het 360-template in en bewaart of submit het direct.
// Opslaan als concept (status='requested') mag ook; submit zet de status op
// 'submitted' en stuurt notificatie naar de medewerker.
export async function submitManagerCycleFeedback(input: {
  performanceReviewId: string;
  responses: Record<string, string>;
  submit?: boolean;
}): Promise<{ feedbackId: string }> {
  const managerId = await requirePersonaId();
  const supabase = await createClient();

  const { data: pr, error: prErr } = await supabase
    .from("performance_reviews")
    .select("id, manager_id, employee_id, completed_at")
    .eq("id", input.performanceReviewId)
    .maybeSingle();
  if (prErr || !pr) throw new Error("Functioneringsgesprek niet gevonden");
  if (pr.manager_id !== managerId)
    throw new Error("Niet jouw functioneringsgesprek");

  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.responses ?? {})) {
    if (typeof v === "string" && v.trim().length > 0) {
      cleaned[k] = v.trim();
    }
  }

  const wantsSubmit = input.submit === true;
  if (wantsSubmit && Object.keys(cleaned).length === 0) {
    throw new Error("Vul minstens één vraag in voordat je verstuurt");
  }

  const { data: existing } = await supabase
    .from("feedback")
    .select("id, status")
    .eq("source_type", "performance_review")
    .eq("source_id", input.performanceReviewId)
    .eq("author_id", managerId)
    .maybeSingle();

  const now = new Date().toISOString();
  let feedbackId: string;

  if (existing?.id) {
    const patch: Record<string, unknown> = {
      responses: cleaned,
    };
    if (wantsSubmit) {
      patch.status = "submitted";
      patch.submitted_at = now;
    }
    const { error: updErr } = await supabase
      .from("feedback")
      .update(patch)
      .eq("id", existing.id);
    if (updErr) throw new Error(updErr.message);
    feedbackId = existing.id;
  } else {
    const { data, error } = await supabase
      .from("feedback")
      .insert({
        recipient_id: pr.employee_id,
        author_id: managerId,
        source_type: "performance_review" as const,
        source_id: input.performanceReviewId,
        responses: cleaned,
        status: wantsSubmit ? ("submitted" as const) : ("requested" as const),
        submitted_at: wantsSubmit ? now : null,
        requested_at: now,
      })
      .select("id")
      .single();
    if (error || !data)
      throw new Error(error?.message ?? "Opslaan mislukt");
    feedbackId = data.id;
  }

  if (wantsSubmit) {
    await supabase.from("notifications").insert({
      user_id: pr.employee_id as string,
      type: "feedback_submitted" as const,
      payload: {
        feedback_id: feedbackId,
        performance_review_id: input.performanceReviewId,
        author_id: managerId,
      },
    });

    await maybeAdvanceToReadyForMeeting(supabase, input.performanceReviewId, pr.manager_id as string, pr.employee_id as string);
  }

  revalidatePath(`/functioneringsgesprek/${input.performanceReviewId}`);
  revalidatePath("/functioneringsgesprek");
  revalidatePath("/feedback");
  revalidatePath("/dashboard");
  return { feedbackId };
}

// Interne helper: als alle drie inputs binnen zijn, zet status op 'ready_for_meeting'.
async function maybeAdvanceToReadyForMeeting(
  supabase: Awaited<ReturnType<typeof createClient>>,
  prId: string,
  managerId: string,
  employeeId: string,
): Promise<void> {
  const { data: pr } = await supabase
    .from("performance_reviews")
    .select("status, employee_self_evaluation")
    .eq("id", prId)
    .maybeSingle();
  if (!pr) return;
  if (pr.status === "ready_for_meeting" || pr.status === "completed" || pr.status === "cancelled") return;

  const hasEval = Object.values(pr.employee_self_evaluation ?? {}).some(
    (v) => typeof v === "string" && (v as string).trim().length > 0,
  );
  if (!hasEval) return;

  const { data: feedbackRows } = await supabase
    .from("feedback")
    .select("author_id, status")
    .eq("source_type", "performance_review")
    .eq("source_id", prId)
    .eq("status", "submitted");

  type FRow = { author_id: string; status: string };
  const rows = (feedbackRows ?? []) as FRow[];
  const managerSubmitted = rows.some((r) => r.author_id === managerId);
  const peerSubmitted = rows.some(
    (r) => r.author_id !== managerId && r.author_id !== employeeId,
  );

  if (managerSubmitted && peerSubmitted) {
    await supabase
      .from("performance_reviews")
      .update({ status: "ready_for_meeting" as const })
      .eq("id", prId);
  }
}

// Manager plant een datum voor het gesprek. Vereist status 'ready_for_meeting'.
export async function schedulePerformanceReviewMeeting(input: {
  performanceReviewId: string;
  scheduledAt: string;
}): Promise<void> {
  const managerId = await requirePersonaId();
  const supabase = await createClient();

  const { data: pr, error: prErr } = await supabase
    .from("performance_reviews")
    .select("id, manager_id, employee_id, status")
    .eq("id", input.performanceReviewId)
    .maybeSingle();
  if (prErr || !pr) throw new Error("Functioneringsgesprek niet gevonden");
  if (pr.manager_id !== managerId) throw new Error("Niet jouw functioneringsgesprek");
  if (pr.status !== "ready_for_meeting") throw new Error("Nog niet alle feedback binnen");

  const date = new Date(input.scheduledAt);
  if (isNaN(date.getTime())) throw new Error("Ongeldige datum");

  const { error: updErr } = await supabase
    .from("performance_reviews")
    .update({ status: "scheduled" as const, scheduled_at: date.toISOString() })
    .eq("id", input.performanceReviewId);
  if (updErr) throw new Error(updErr.message);

  await supabase.from("notifications").insert({
    user_id: pr.employee_id as string,
    type: "feedback_submitted" as const,
    payload: {
      performance_review_id: input.performanceReviewId,
      scheduled_at: date.toISOString(),
    },
  });

  revalidatePath(`/functioneringsgesprek/${input.performanceReviewId}`);
  revalidatePath("/functioneringsgesprek");
  revalidatePath("/dashboard");
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
