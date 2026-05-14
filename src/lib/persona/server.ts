import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { PERSONA_COOKIE, type Persona } from "./types";

// Cookies mogen alleen in Server Actions / Route Handlers gemuteerd worden.
// Wanneer een server component een ongeldige persona detecteert, redirecten
// we naar `/`. Daar wordt de picker getoond en kiest de gebruiker opnieuw,
// waardoor de cookie via de selectPersona-action overschreven wordt.

export const getCurrentPersonaId = cache(async () => {
  const cookieStore = await cookies();
  return cookieStore.get(PERSONA_COOKIE)?.value ?? null;
});

export const getCurrentPersona = cache(async (): Promise<Persona | null> => {
  const personaId = await getCurrentPersonaId();
  if (!personaId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, team_id, avatar_url, team:teams!users_team_id_fkey(id, name)")
    .eq("id", personaId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as Persona;
});

// Voor server components in de (app) groep: garandeert een geldige persona.
// Bij een ongeldige cookie redirecten we naar `/`, waar de picker de cookie
// vervangt zodra er gekozen wordt.
export async function requirePersona(): Promise<Persona> {
  const personaId = await getCurrentPersonaId();
  if (!personaId) redirect("/");
  const persona = await getCurrentPersona();
  if (!persona) redirect("/");
  return persona;
}

export type TeamWithMembers = {
  id: string;
  name: string;
  members: Persona[];
};

export async function listTeamsWithMembers(): Promise<TeamWithMembers[]> {
  const supabase = await createClient();
  const { data: teams, error: teamsErr } = await supabase
    .from("teams")
    .select("id, name")
    .order("name");
  if (teamsErr || !teams) return [];

  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("id, name, email, role, team_id, avatar_url")
    .order("role")
    .order("name");
  if (usersErr || !users) return teams.map((t) => ({ id: t.id, name: t.name, members: [] }));

  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    members: (users as Persona[]).filter((u) => u.team_id === t.id),
  }));
}
