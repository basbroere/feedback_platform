import type { UserRole } from "@/lib/persona/types";

export type OffboardingImpact = {
  openActionItems: number;
  openOneOnOnes: number;
  openPerformanceReviews: number;
  openEvaluations: number;
  pendingFeedback: number;
  teamsLed: number;
};

export type OffboardedUser = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  team_id: string | null;
  team_name: string | null;
  left_at: string;
  created_at: string;
};
