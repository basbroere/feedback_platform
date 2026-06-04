export type UserRole = "employee" | "team_lead" | "manager";

export type Persona = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
  team_id: string | null;
  avatar_url: string | null;
  team?: { id: string; name: string } | null;
};

export const PERSONA_COOKIE = "bamback_persona";
