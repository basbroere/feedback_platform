"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPersona } from "@/lib/persona/server";
import type { UserRole } from "@/lib/persona/types";

const ROLES: UserRole[] = ["employee", "team_lead", "manager", "hr"];

async function requireHr(): Promise<string> {
  const persona = await getCurrentPersona();
  if (!persona) throw new Error("Geen persona geselecteerd");
  if (persona.role !== "hr") throw new Error("Alleen HR kan deze actie uitvoeren");
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

export async function createUser(input: {
  name: string;
  email: string;
  role: UserRole;
  teamId: string | null;
}): Promise<{ id: string }> {
  await requireHr();

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
      team_id: input.teamId,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Aanmaken mislukt");

  revalidateBeheer();
  return { id: data.id };
}

export async function updateUser(input: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId: string | null;
}): Promise<void> {
  await requireHr();

  const name = input.name.trim();
  const email = normaliseEmail(input.email);
  if (!name) throw new Error("Vul een naam in");
  assertValidEmail(email);
  assertValidRole(input.role);

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("users")
    .select("id, email")
    .eq("id", input.id)
    .maybeSingle();
  if (!current) throw new Error("Gebruiker niet gevonden");

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
      team_id: input.teamId,
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);

  revalidateBeheer();
}

export async function deleteUser(input: { id: string }): Promise<void> {
  const personaId = await requireHr();
  if (personaId === input.id) {
    throw new Error("Je kunt je eigen account niet verwijderen");
  }

  const supabase = await createClient();

  const { data: target } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", input.id)
    .maybeSingle();
  if (!target) throw new Error("Gebruiker niet gevonden");

  if (target.role === "hr") {
    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "hr");
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
  await requireHr();

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
    .insert({
      name,
      lead_user_id: input.leadUserId,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Aanmaken mislukt");

  revalidateBeheer();
  return { id: data.id };
}
