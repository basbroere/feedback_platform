export type UserRole = "employee" | "manager" | "hr";

export type Persona = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  team_id: string | null;
  avatar_url: string | null;
  team?: { id: string; name: string } | null;
};

export const PERSONA_COOKIE = "bambelo_persona";
