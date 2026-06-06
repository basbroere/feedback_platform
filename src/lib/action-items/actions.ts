"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPersonaId } from "@/lib/persona/server";

type ActionStatus = "open" | "completed" | "expired";

type SourceRow = {
  source_id: string | null;
  source_type: string | null;
};

async function isSourceManager(
  supabase: Awaited<ReturnType<typeof createClient>>,
  personaId: string,
  row: SourceRow,
): Promise<boolean> {
  if (!row.source_id) return false;
  if (row.source_type === "one_on_one") {
    const { data } = await supabase
      .from("one_on_ones")
      .select("manager_id")
      .eq("id", row.source_id)
      .maybeSingle();
    return data?.manager_id === personaId;
  }
  if (row.source_type === "performance_review") {
    const { data } = await supabase
      .from("performance_reviews")
      .select("manager_id")
      .eq("id", row.source_id)
      .maybeSingle();
    return data?.manager_id === personaId;
  }
  return false;
}

export async function updateActionItemStatus(input: {
  id: string;
  status: ActionStatus;
}) {
  const personaId = await getCurrentPersonaId();
  if (!personaId) throw new Error("Geen persona geselecteerd");

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("action_items")
    .select("id, owner_id, source_id, source_type")
    .eq("id", input.id)
    .maybeSingle();
  if (error || !row) throw new Error("Actiepunt niet gevonden");

  // Owner mag altijd. Anders moet je manager zijn van de bron (1-op-1 of functioneringsgesprek).
  let allowed = row.owner_id === personaId;
  if (!allowed) allowed = await isSourceManager(supabase, personaId, row);
  if (!allowed) throw new Error("Niet toegestaan");

  const completedAt =
    input.status === "completed" ? new Date().toISOString() : null;
  const { error: updErr } = await supabase
    .from("action_items")
    .update({ status: input.status, completed_at: completedAt })
    .eq("id", input.id);
  if (updErr) throw new Error(updErr.message);

  revalidatePath("/een-op-een");
  revalidatePath("/team");
  revalidatePath("/dashboard");
  revalidatePath("/actiepunten");
}

export async function createActionItemForOneOnOne(input: {
  oneOnOneId: string;
  description: string;
  notes?: string | null;
}): Promise<{ id: string }> {
  const personaId = await getCurrentPersonaId();
  if (!personaId) throw new Error("Geen persona geselecteerd");

  const description = input.description.trim();
  if (!description) throw new Error("Titel is leeg");
  const notes = input.notes?.trim() ? input.notes.trim() : null;

  const supabase = await createClient();
  const { data: one, error: oneErr } = await supabase
    .from("one_on_ones")
    .select("id, manager_id, employee_id")
    .eq("id", input.oneOnOneId)
    .maybeSingle();
  if (oneErr || !one) throw new Error("1-op-1 niet gevonden");
  if (one.manager_id !== personaId && one.employee_id !== personaId) {
    throw new Error("Niet toegestaan");
  }

  const { data, error } = await supabase
    .from("action_items")
    .insert({
      owner_id: one.employee_id,
      description,
      notes,
      status: "open" as const,
      source_type: "one_on_one" as const,
      source_id: one.id,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Aanmaken mislukt");

  revalidatePath(`/een-op-een/${one.id}`);
  revalidatePath("/een-op-een");
  revalidatePath("/dashboard");
  return { id: data.id };
}

export async function createPersonalActionItem(input: {
  description: string;
  notes?: string | null;
  targetDate?: string | null;
}): Promise<{ id: string }> {
  const personaId = await getCurrentPersonaId();
  if (!personaId) throw new Error("Geen persona geselecteerd");

  const description = input.description.trim();
  if (!description) throw new Error("Titel is leeg");
  const notes = input.notes?.trim() ? input.notes.trim() : null;
  const targetDate = input.targetDate?.trim() ? input.targetDate.trim() : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("action_items")
    .insert({
      owner_id: personaId,
      description,
      notes,
      target_date: targetDate,
      status: "open" as const,
      source_type: "personal" as const,
      source_id: null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Aanmaken mislukt");

  revalidatePath("/actiepunten");
  revalidatePath("/dashboard");
  return { id: data.id };
}

export async function updateActionItemDetails(input: {
  id: string;
  description: string;
  notes?: string | null;
  targetDate?: string | null;
}) {
  const personaId = await getCurrentPersonaId();
  if (!personaId) throw new Error("Geen persona geselecteerd");

  const description = input.description.trim();
  if (!description) throw new Error("Titel is leeg");
  const notes =
    input.notes === undefined
      ? undefined
      : input.notes && input.notes.trim()
        ? input.notes.trim()
        : null;
  const targetDate =
    input.targetDate === undefined
      ? undefined
      : input.targetDate && input.targetDate.trim()
        ? input.targetDate.trim()
        : null;

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("action_items")
    .select("id, owner_id, source_id, source_type")
    .eq("id", input.id)
    .maybeSingle();
  if (error || !row) throw new Error("Actiepunt niet gevonden");

  let allowed = row.owner_id === personaId;
  if (!allowed) allowed = await isSourceManager(supabase, personaId, row);
  if (!allowed) throw new Error("Niet toegestaan");

  const patch: Record<string, unknown> = { description };
  if (notes !== undefined) patch.notes = notes;
  if (targetDate !== undefined) patch.target_date = targetDate;

  const { error: updErr } = await supabase
    .from("action_items")
    .update(patch)
    .eq("id", input.id);
  if (updErr) throw new Error(updErr.message);

  if (row.source_type === "one_on_one" && row.source_id) {
    revalidatePath(`/een-op-een/${row.source_id}`);
  }
  if (row.source_type === "performance_review" && row.source_id) {
    revalidatePath(`/functioneringsgesprek/${row.source_id}`);
  }
  revalidatePath("/een-op-een");
  revalidatePath("/dashboard");
  revalidatePath("/actiepunten");
}

export async function deleteActionItem(id: string) {
  const personaId = await getCurrentPersonaId();
  if (!personaId) throw new Error("Geen persona geselecteerd");

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("action_items")
    .select("id, owner_id, source_id, source_type")
    .eq("id", id)
    .maybeSingle();
  if (error || !row) throw new Error("Actiepunt niet gevonden");

  // Persoonlijke items: eigenaar mag zelf verwijderen.
  // 1-op-1- en functioneringsgesprek-items: alleen de manager van de bron.
  let allowed = false;
  if (row.source_type === "personal") {
    allowed = row.owner_id === personaId;
  } else {
    allowed = await isSourceManager(supabase, personaId, row);
  }
  if (!allowed) throw new Error("Niet toegestaan");

  const { error: delErr } = await supabase
    .from("action_items")
    .delete()
    .eq("id", id);
  if (delErr) throw new Error(delErr.message);

  if (row.source_type === "one_on_one" && row.source_id) {
    revalidatePath(`/een-op-een/${row.source_id}`);
  }
  if (row.source_type === "performance_review" && row.source_id) {
    revalidatePath(`/functioneringsgesprek/${row.source_id}`);
  }
  revalidatePath("/een-op-een");
  revalidatePath("/dashboard");
  revalidatePath("/actiepunten");
}

export async function updateActionItemOwner(input: {
  id: string;
  ownerId: string;
}) {
  const personaId = await getCurrentPersonaId();
  if (!personaId) throw new Error("Geen persona geselecteerd");

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("action_items")
    .select("id, source_id, source_type")
    .eq("id", input.id)
    .maybeSingle();
  if (error || !row) throw new Error("Actiepunt niet gevonden");
  if (row.source_type !== "one_on_one") {
    throw new Error("Eigenaar wijzigen alleen ondersteund voor 1-op-1's");
  }

  const { data: one } = await supabase
    .from("one_on_ones")
    .select("manager_id, employee_id")
    .eq("id", row.source_id)
    .maybeSingle();
  if (!one) throw new Error("1-op-1 niet gevonden");
  if (one.manager_id !== personaId) throw new Error("Niet toegestaan");
  if (input.ownerId !== one.manager_id && input.ownerId !== one.employee_id) {
    throw new Error("Eigenaar moet manager of medewerker zijn");
  }

  const { error: updErr } = await supabase
    .from("action_items")
    .update({ owner_id: input.ownerId })
    .eq("id", input.id);
  if (updErr) throw new Error(updErr.message);

  revalidatePath(`/een-op-een/${row.source_id}`);
  revalidatePath("/een-op-een");
  revalidatePath("/dashboard");
}
