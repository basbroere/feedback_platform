"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPersonaId } from "@/lib/persona/server";

async function requirePersonaId(): Promise<string> {
  const id = await getCurrentPersonaId();
  if (!id) throw new Error("Geen persona geselecteerd");
  return id;
}

export async function createPeerFeedbackRequest(input: {
  peerId: string;
  templateId: string;
  prompt: string;
}): Promise<void> {
  const personaId = await requirePersonaId();
  if (personaId === input.peerId) throw new Error("Je kunt geen feedback aan jezelf vragen");
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, team_id")
    .in("id", [personaId, input.peerId]);
  type UserRow = { id: string; team_id: string | null };
  const me = (users ?? []).find((u: UserRow) => u.id === personaId) as UserRow | undefined;
  const peer = (users ?? []).find((u: UserRow) => u.id === input.peerId) as UserRow | undefined;
  const is_cross_team = !!(me?.team_id && peer?.team_id && me.team_id !== peer.team_id);

  const now = new Date().toISOString();

  const { data: req, error: reqErr } = await supabase
    .from("feedback_requests")
    .insert({
      requester_id: personaId,
      template_id: input.templateId,
      prompt: input.prompt || null,
    })
    .select("id")
    .single();
  if (reqErr || !req) throw new Error(reqErr?.message ?? "Aanmaken mislukt");

  const { error: fbErr } = await supabase.from("feedback").insert({
    recipient_id: personaId,
    author_id: input.peerId,
    source_type: "peer_request" as const,
    source_id: req.id,
    status: "requested" as const,
    requested_at: now,
    is_cross_team,
  });
  if (fbErr) throw new Error(fbErr.message);

  revalidatePath("/feedback");
  revalidatePath("/dashboard");
}

export async function upsertManagerFeedbackForOneOnOne(input: {
  oneOnOneId: string;
  body: string;
}) {
  const personaId = await getCurrentPersonaId();
  if (!personaId) throw new Error("Geen persona geselecteerd");

  const supabase = await createClient();
  const { data: one, error: oneErr } = await supabase
    .from("one_on_ones")
    .select("id, manager_id, employee_id")
    .eq("id", input.oneOnOneId)
    .maybeSingle();
  if (oneErr || !one) throw new Error("1-op-1 niet gevonden");
  if (one.manager_id !== personaId) throw new Error("Niet toegestaan");

  const body = input.body.trim();

  if (!body) {
    const { error: delErr } = await supabase
      .from("feedback")
      .delete()
      .eq("source_type", "one_on_one")
      .eq("source_id", input.oneOnOneId)
      .eq("author_id", personaId);
    if (delErr) throw new Error(delErr.message);
  } else {
    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from("feedback")
      .select("id")
      .eq("source_type", "one_on_one")
      .eq("source_id", input.oneOnOneId)
      .eq("author_id", personaId)
      .maybeSingle();

    if (existing?.id) {
      const { error: updErr } = await supabase
        .from("feedback")
        .update({ body, submitted_at: now })
        .eq("id", existing.id);
      if (updErr) throw new Error(updErr.message);
    } else {
      const { error: insErr } = await supabase.from("feedback").insert({
        recipient_id: one.employee_id,
        author_id: personaId,
        source_type: "one_on_one" as const,
        source_id: input.oneOnOneId,
        body,
        status: "submitted" as const,
        submitted_at: now,
      });
      if (insErr) throw new Error(insErr.message);
    }
  }

  revalidatePath(`/een-op-een/${input.oneOnOneId}`);
  revalidatePath(`/team/${one.employee_id}`);
  revalidatePath("/feedback");
  revalidatePath("/dashboard");
}

export async function submitFeedbackResponse(input: {
  feedbackId: string;
  responses: Record<string, string>;
}) {
  const peerId = await requirePersonaId();
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("feedback")
    .select("id, author_id, recipient_id, source_type, source_id, status")
    .eq("id", input.feedbackId)
    .maybeSingle();
  if (error || !row) throw new Error("Feedback-verzoek niet gevonden");
  if (row.author_id !== peerId) throw new Error("Niet jouw verzoek");
  if (
    row.source_type !== "peer_request" &&
    row.source_type !== "performance_review"
  ) {
    throw new Error("Dit verzoek is niet via deze flow invulbaar");
  }
  if (row.status !== "requested") throw new Error("Verzoek is al afgehandeld");

  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.responses ?? {})) {
    if (typeof v === "string" && v.trim().length > 0) {
      cleaned[k] = v.trim();
    }
  }
  if (Object.keys(cleaned).length === 0) {
    throw new Error("Vul minstens één vraag in");
  }

  const now = new Date().toISOString();
  const { error: updErr } = await supabase
    .from("feedback")
    .update({
      responses: cleaned,
      status: "submitted",
      submitted_at: now,
    })
    .eq("id", row.id);
  if (updErr) throw new Error(updErr.message);

  await supabase.from("notifications").insert({
    user_id: row.recipient_id,
    type: "feedback_submitted" as const,
    payload: {
      feedback_id: row.id,
      source_type: row.source_type,
      source_id: row.source_id,
      peer_id: peerId,
    },
  });

  if (row.source_type === "performance_review" && row.source_id) {
    const prId = row.source_id as string;
    const { data: pr } = await supabase
      .from("performance_reviews")
      .select("status, manager_id, employee_id, employee_self_evaluation")
      .eq("id", prId)
      .maybeSingle();

    if (
      pr &&
      pr.status !== "ready_for_meeting" &&
      pr.status !== "completed" &&
      pr.status !== "cancelled"
    ) {
      const hasEval = Object.values(pr.employee_self_evaluation ?? {}).some(
        (v) => typeof v === "string" && (v as string).trim().length > 0,
      );
      if (hasEval) {
        const { data: submittedRows } = await supabase
          .from("feedback")
          .select("author_id")
          .eq("source_type", "performance_review")
          .eq("source_id", prId)
          .eq("status", "submitted");
        type FRow = { author_id: string };
        const fbRows = (submittedRows ?? []) as FRow[];
        const managerSubmitted = fbRows.some((r) => r.author_id === pr.manager_id);
        const peerSubmitted = fbRows.some(
          (r) => r.author_id !== pr.manager_id && r.author_id !== pr.employee_id,
        );
        if (managerSubmitted && peerSubmitted) {
          await supabase
            .from("performance_reviews")
            .update({ status: "ready_for_meeting" as const })
            .eq("id", prId);
        }
      }
    }
    revalidatePath(`/functioneringsgesprek/${prId}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/feedback");
}

export async function declineFeedbackRequest(input: { feedbackId: string }) {
  const peerId = await requirePersonaId();
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("feedback")
    .select("id, author_id, recipient_id, source_type, source_id, status")
    .eq("id", input.feedbackId)
    .maybeSingle();
  if (error || !row) throw new Error("Feedback-verzoek niet gevonden");
  if (row.author_id !== peerId) throw new Error("Niet jouw verzoek");
  if (
    row.source_type !== "peer_request" &&
    row.source_type !== "performance_review"
  ) {
    throw new Error("Dit verzoek is niet declineerbaar");
  }
  if (row.status !== "requested") throw new Error("Verzoek is al afgehandeld");

  const { error: updErr } = await supabase
    .from("feedback")
    .update({ status: "declined" })
    .eq("id", row.id);
  if (updErr) throw new Error(updErr.message);

  revalidatePath("/dashboard");
  revalidatePath("/feedback");
  if (row.source_type === "performance_review" && row.source_id) {
    revalidatePath(`/functioneringsgesprek/${row.source_id}`);
  }
}
