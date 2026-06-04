import { createClient } from "@/lib/supabase/server";
import type { AdminTeam, AdminUser } from "@/lib/hr/admin-types";

export type { AdminTeam, AdminUser } from "@/lib/hr/admin-types";

export async function listUsersForAdmin(): Promise<AdminUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, name, email, role, is_admin, avatar_url, team_id, created_at, team:teams!users_team_id_fkey(id, name)",
    )
    .is("left_at", null)
    .order("role")
    .order("name");

  if (error || !data) return [];

  type Row = Omit<AdminUser, "team_name"> & {
    team: { id: string; name: string } | null;
  };

  return (data as unknown as Row[]).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    is_admin: (row as unknown as { is_admin: boolean }).is_admin ?? false,
    avatar_url: row.avatar_url,
    team_id: row.team_id,
    team_name: row.team?.name ?? null,
    created_at: row.created_at,
  }));
}

export async function listTeamsForAdmin(): Promise<AdminTeam[]> {
  const supabase = await createClient();

  const [teamsRes, usersRes] = await Promise.all([
    supabase
      .from("teams")
      .select(
        "id, name, lead_user_id, created_at, lead:users!teams_lead_user_fk(id, name)",
      )
      .order("name"),
    supabase.from("users").select("id, team_id").is("left_at", null),
  ]);

  if (teamsRes.error || !teamsRes.data) return [];

  type TeamRow = {
    id: string;
    name: string;
    lead_user_id: string | null;
    created_at: string;
    lead: { id: string; name: string } | null;
  };

  const memberCount = new Map<string, number>();
  for (const u of (usersRes.data ?? []) as { id: string; team_id: string | null }[]) {
    if (!u.team_id) continue;
    memberCount.set(u.team_id, (memberCount.get(u.team_id) ?? 0) + 1);
  }

  return (teamsRes.data as unknown as TeamRow[]).map((t) => ({
    id: t.id,
    name: t.name,
    lead_user_id: t.lead_user_id,
    lead_name: t.lead?.name ?? null,
    member_count: memberCount.get(t.id) ?? 0,
    created_at: t.created_at,
  }));
}
