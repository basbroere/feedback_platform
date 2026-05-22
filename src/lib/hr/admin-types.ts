import type { UserRole } from "@/lib/persona/types";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
  avatar_url: string | null;
  team_id: string | null;
  team_name: string | null;
  created_at: string;
};

export type AdminTeam = {
  id: string;
  name: string;
  lead_user_id: string | null;
  lead_name: string | null;
  member_count: number;
  created_at: string;
};
