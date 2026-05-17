import { createClient } from "@/lib/supabase/server";

export type HrSnapshot = {
  oneOnOnesThisMonth: number;
  feedbackThisMonth: number;
  crossTeamRate: number | null;
  teamCount: number;
  employeeCount: number;
};

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export async function getHrSnapshot(): Promise<HrSnapshot> {
  const supabase = await createClient();
  const monthStart = startOfMonthIso();

  const [
    oneOnOnesRes,
    feedbackTotalRes,
    feedbackCrossRes,
    teamsRes,
    employeesRes,
  ] = await Promise.all([
    supabase
      .from("one_on_ones")
      .select("id", { count: "exact", head: true })
      .gte("completed_at", monthStart),
    supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted")
      .gte("submitted_at", monthStart),
    supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted")
      .eq("is_cross_team", true)
      .gte("submitted_at", monthStart),
    supabase.from("teams").select("id", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .neq("role", "hr"),
  ]);

  const feedbackTotal = feedbackTotalRes.count ?? 0;
  const feedbackCross = feedbackCrossRes.count ?? 0;
  const crossTeamRate =
    feedbackTotal > 0 ? Math.round((feedbackCross / feedbackTotal) * 100) : null;

  return {
    oneOnOnesThisMonth: oneOnOnesRes.count ?? 0,
    feedbackThisMonth: feedbackTotal,
    crossTeamRate,
    teamCount: teamsRes.count ?? 0,
    employeeCount: employeesRes.count ?? 0,
  };
}
