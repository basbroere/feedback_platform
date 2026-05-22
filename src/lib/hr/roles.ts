import type { UserRole } from "@/lib/persona/types";

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "employee", label: "Medewerker" },
  { value: "team_lead", label: "Team-lead" },
  { value: "manager", label: "Manager" },
  { value: "hr", label: "HR / Admin" },
];

export const ROLE_LABEL: Record<UserRole, string> = {
  employee: "Medewerker",
  team_lead: "Team-lead",
  manager: "Manager",
  hr: "HR / Admin",
};

export const ROLE_TONE: Record<
  UserRole,
  "default" | "secondary" | "outline"
> = {
  hr: "default",
  manager: "secondary",
  team_lead: "secondary",
  employee: "outline",
};
