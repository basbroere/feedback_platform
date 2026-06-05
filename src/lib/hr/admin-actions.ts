"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPersona } from "@/lib/persona/server";
import type { UserRole } from "@/lib/persona/types";

const ROLES: UserRole[] = ["employee", "team_lead", "manager"];

async function requireAdmin(): Promise<string> {
  const persona = await getCurrentPersona();
  if (!persona) throw new Error("Geen persona geselecteerd");
  if (!persona.is_admin) throw new Error("Alleen HR kan deze actie uitvoeren");
  return persona.id;
}

function revalidateBeheer() {
  revalidatePath("/beheer");
  revalidatePath("/beheer/personen");
  revalidatePath("/beheer/teams");
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/team");
}

function normaliseEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function assertValidEmail(email: string) {
  if (!email) throw new Error("Vul een e-mailadres in");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("E-mailadres ziet er niet geldig uit");
  }
}

function assertValidRole(role: string): asserts role is UserRole {
  if (!ROLES.includes(role as UserRole)) {
    throw new Error("Ongeldige rol");
  }
}

// Houdt `teams.lead_user_id` synchroon met de manager-rol van een gebruiker.
// Manager + team => deze gebruiker wordt lead van dat team, en eventueel
// lead-status in andere teams wordt opgeschoond. Geen manager of geen team =>
// lead-status overal verwijderd.
async function syncTeamLeadForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  role: UserRole,
  teamId: string | null,
): Promise<void> {
  if (role === "manager" && teamId) {
    const { error: clearError } = await supabase
      .from("teams")
      .update({ lead_user_id: null })
      .eq("lead_user_id", userId)
      .neq("id", teamId);
    if (clearError) throw new Error(clearError.message);

    const { error: setError } = await supabase
      .from("teams")
      .update({ lead_user_id: userId })
      .eq("id", teamId);
    if (setError) throw new Error(setError.message);
    return;
  }

  const { error } = await supabase
    .from("teams")
    .update({ lead_user_id: null })
    .eq("lead_user_id", userId);
  if (error) throw new Error(error.message);
}

export async function createUser(input: {
  name: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
  teamId: string | null;
}): Promise<{ id: string }> {
  await requireAdmin();

  const name = input.name.trim();
  const email = normaliseEmail(input.email);
  if (!name) throw new Error("Vul een naam in");
  assertValidEmail(email);
  assertValidRole(input.role);

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing?.id) throw new Error("Dit e-mailadres bestaat al");

  if (input.teamId) {
    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("id", input.teamId)
      .maybeSingle();
    if (!team) throw new Error("Team niet gevonden");
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      name,
      email,
      role: input.role,
      is_admin: input.is_admin,
      team_id: input.teamId,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Aanmaken mislukt");

  await syncTeamLeadForUser(supabase, data.id, input.role, input.teamId);

  revalidateBeheer();
  return { id: data.id };
}

export async function updateUser(input: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
  teamId: string | null;
}): Promise<void> {
  const adminId = await requireAdmin();

  const name = input.name.trim();
  const email = normaliseEmail(input.email);
  if (!name) throw new Error("Vul een naam in");
  assertValidEmail(email);
  assertValidRole(input.role);

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("users")
    .select("id, email, is_admin")
    .eq("id", input.id)
    .maybeSingle();
  if (!current) throw new Error("Gebruiker niet gevonden");

  // Voorkom dat de laatste HR-gebruiker zichzelf de HR-status ontneemt
  if ((current as unknown as { is_admin: boolean }).is_admin && !input.is_admin) {
    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", true);
    if ((count ?? 0) <= 1) {
      throw new Error("Er moet altijd minimaal één HR-gebruiker zijn");
    }
  }

  if (current.email !== email) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing?.id && existing.id !== input.id) {
      throw new Error("Dit e-mailadres bestaat al");
    }
  }

  if (input.teamId) {
    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("id", input.teamId)
      .maybeSingle();
    if (!team) throw new Error("Team niet gevonden");
  }

  const { error } = await supabase
    .from("users")
    .update({
      name,
      email,
      role: input.role,
      is_admin: input.is_admin,
      team_id: input.teamId,
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);

  await syncTeamLeadForUser(supabase, input.id, input.role, input.teamId);

  revalidateBeheer();
  void adminId;
}

export async function deleteUser(input: { id: string }): Promise<void> {
  const adminId = await requireAdmin();
  if (adminId === input.id) {
    throw new Error("Je kunt je eigen account niet verwijderen");
  }

  const supabase = await createClient();

  const { data: target } = await supabase
    .from("users")
    .select("id, is_admin")
    .eq("id", input.id)
    .maybeSingle();
  if (!target) throw new Error("Gebruiker niet gevonden");

  if ((target as unknown as { is_admin: boolean }).is_admin) {
    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", true);
    if ((count ?? 0) <= 1) {
      throw new Error("Laatste HR-gebruiker kan niet verwijderd worden");
    }
  }

  const { error } = await supabase.from("users").delete().eq("id", input.id);
  if (error) throw new Error(error.message);

  revalidateBeheer();
}

export async function createTeam(input: {
  name: string;
  leadUserId: string | null;
}): Promise<{ id: string }> {
  await requireAdmin();

  const name = input.name.trim();
  if (!name) throw new Error("Vul een teamnaam in");

  const supabase = await createClient();

  if (input.leadUserId) {
    const { data: lead } = await supabase
      .from("users")
      .select("id")
      .eq("id", input.leadUserId)
      .maybeSingle();
    if (!lead) throw new Error("Teamlead niet gevonden");
  }

  const { data, error } = await supabase
    .from("teams")
    .insert({ name, lead_user_id: input.leadUserId })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Aanmaken mislukt");

  revalidateBeheer();
  return { id: data.id };
}

export async function updateTeam(input: {
  id: string;
  name: string;
  leadUserId: string | null;
}): Promise<void> {
  await requireAdmin();

  const name = input.name.trim();
  if (!name) throw new Error("Vul een teamnaam in");

  const supabase = await createClient();

  const { error } = await supabase
    .from("teams")
    .update({ name, lead_user_id: input.leadUserId })
    .eq("id", input.id);
  if (error) throw new Error(error.message);

  revalidateBeheer();
}

export async function deleteTeam(input: { id: string }): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", input.id)
    .maybeSingle();
  if (!team) throw new Error("Team niet gevonden");

  // Verwijder teamkoppeling van leden zodat de FK geen blokkade geeft.
  await supabase.from("users").update({ team_id: null }).eq("team_id", input.id);

  const { error } = await supabase.from("teams").delete().eq("id", input.id);
  if (error) throw new Error(error.message);

  revalidateBeheer();
}
