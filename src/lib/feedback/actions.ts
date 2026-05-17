"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPersonaId } from "@/lib/persona/server";

async function requirePersonaId(): Promise<string> {
  const id = await getCurrentPersonaId();
  if (!id) throw new Error("Geen persona geselecteerd");
  return id;
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

export async function createFeedbackRequest(input: {
  templateId: string;
  prompt?: string;
  peerIds: string[];
}): Promise<{ requestId: string; createdCount: number }> {
  const requesterId = await requirePersonaId();
  const supabase = await createClient();

  const peers = Array.from(new Set(input.peerIds)).filter(
    (id) => id && id !== requesterId,
  );
  if (peers.length === 0) throw new Error("Kies minstens één collega");

  const { data: template, error: tmplErr } = await supabase
    .from("templates")
    .select("id, type, is_active")
    .eq("id", input.templateId)
    .maybeSingle();
  if (tmplErr || !template) throw new Error("Template niet gevonden");
  if (template.type !== "peer_360" || !template.is_active) {
    throw new Error("Template is niet geldig voor peer feedback");
  }

  const { data: peerRows, error: peerErr } = await supabase
    .from("users")
    .select("id")
    .in("id", peers);
  if (peerErr) throw new Error(peerErr.message);
  const validPeerIds = (peerRows ?? []).map((p) => p.id);
  if (validPeerIds.length === 0) throw new Error("Geen geldige collega's gevonden");

  const prompt = input.prompt?.trim() ? input.prompt.trim() : null;

  const { data: request, error: reqErr } = await supabase
    .from("feedback_requests")
    .insert({
      requester_id: requesterId,
      template_id: template.id,
      prompt,
    })
    .select("id")
    .single();
  if (reqErr || !request) throw new Error(reqErr?.message ?? "Aanmaken mislukt");

  const now = new Date().toISOString();
  const feedbackRows = validPeerIds.map((peerId) => ({
    recipient_id: requesterId,
    author_id: peerId,
    source_type: "peer_request" as const,
    source_id: request.id,
    prompt,
    status: "requested" as const,
    requested_at: now,
  }));

  const { data: insertedFeedback, error: fbErr } = await supabase
    .from("feedback")
    .insert(feedbackRows)
    .select("id, author_id");
  if (fbErr) throw new Error(fbErr.message);

  const notifRows = (insertedFeedback ?? []).map((row) => ({
    user_id: row.author_id,
    type: "feedback_requested" as const,
    payload: {
      feedback_id: row.id,
      request_id: request.id,
      requester_id: requesterId,
    },
  }));
  if (notifRows.length) {
    await supabase.from("notifications").insert(notifRows);
  }

  revalidatePath("/dashboard");
  revalidatePath("/feedback");
  return { requestId: request.id, createdCount: validPeerIds.length };
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
  if (row.source_type !== "peer_request") {
    throw new Error("Alleen peer-verzoeken zijn invulbaar");
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
      request_id: row.source_id,
      peer_id: peerId,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/feedback");
}

export async function declineFeedbackRequest(input: { feedbackId: string }) {
  const peerId = await requirePersonaId();
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("feedback")
    .select("id, author_id, recipient_id, source_type, status")
    .eq("id", input.feedbackId)
    .maybeSingle();
  if (error || !row) throw new Error("Feedback-verzoek niet gevonden");
  if (row.author_id !== peerId) throw new Error("Niet jouw verzoek");
  if (row.source_type !== "peer_request") {
    throw new Error("Alleen peer-verzoeken zijn declineerbaar");
  }
  if (row.status !== "requested") throw new Error("Verzoek is al afgehandeld");

  const { error: updErr } = await supabase
    .from("feedback")
    .update({ status: "declined" })
    .eq("id", row.id);
  if (updErr) throw new Error(updErr.message);

  revalidatePath("/dashboard");
  revalidatePath("/feedback");
}
