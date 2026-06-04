"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPersona } from "@/lib/persona/server";
import type { OffboardingImpact } from "@/lib/hr/offboarding-types";

async function requireAdmin(): Promise<string> {
  const persona = await getCurrentPersona();
  if (!persona) throw new Error("Geen persona geselecteerd");
  if (!persona.is_admin) throw new Error("Alleen beheerders kunnen deze actie uitvoeren");
  return persona.id;
}

function revalidateOffboardingRoutes(userId: string) {
  revalidatePath("/beheer");
  revalidatePath("/beheer/personen");
  revalidatePath("/beheer/uitdienst");
  revalidatePath(`/beheer/uitdienst/${userId}`);
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/team");
}

function parseLeftAt(raw: string | null | undefined): Date {
  if (!raw) return new Date();
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Datum is niet geldig");
  }
  return parsed;
}

// Snelle inventarisatie van wat er afgesloten wordt bij uit dienst zetten.
// Wordt gebruikt in de bevestigingsdialoog.
export async function getOffboardingImpact(userId: string): Promise<OffboardingImpact> {
  await requireAdmin();
  const supabase = await createClient();

  const [actionItems, oneOnOnes, performanceReviews, evaluations, feedback, teams] =
    await Promise.all([
      supabase
        .from("action_items")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId)
        .eq("status", "open"),
      supabase
        .from("one_on_ones")
        .select("id", { count: "exact", head: true })
        .or(`employee_id.eq.${userId},manager_id.eq.${userId}`)
        .is("completed_at", null),
      supabase
        .from("performance_reviews")
        .select("id", { count: "exact", head: true })
        .or(`employee_id.eq.${userId},manager_id.eq.${userId}`)
        .not("status", "in", "(completed,cancelled)"),
      supabase
        .from("evaluations")
        .select("id", { count: "exact", head: true })
        .or(`employee_id.eq.${userId},manager_id.eq.${userId}`)
        .is("completed_at", null),
      supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .or(`author_id.eq.${userId},recipient_id.eq.${userId}`)
        .eq("status", "requested"),
      supabase
        .from("teams")
        .select("id", { count: "exact", head: true })
        .eq("lead_user_id", userId),
    ]);

  return {
    openActionItems: actionItems.count ?? 0,
    openOneOnOnes: oneOnOnes.count ?? 0,
    openPerformanceReviews: performanceReviews.count ?? 0,
    openEvaluations: evaluations.count ?? 0,
    pendingFeedback: feedback.count ?? 0,
    teamsLed: teams.count ?? 0,
  };
}

export async function offboardUser(input: {
  userId: string;
  leftAt: string;
}): Promise<void> {
  const adminId = await requireAdmin();
  if (adminId === input.userId) {
    throw new Error("Je kunt jezelf niet uit dienst zetten");
  }

  const leftAt = parseLeftAt(input.leftAt);
  const leftAtIso = leftAt.toISOString();

  const supabase = await createClient();

  const { data: target } = await supabase
    .from("users")
    .select("id, is_admin, left_at")
    .eq("id", input.userId)
    .maybeSingle();
  if (!target) throw new Error("Medewerker niet gevonden");
  if ((target as unknown as { left_at: string | null }).left_at) {
    throw new Error("Deze medewerker is al uit dienst");
  }

  // Voorkom dat de laatste beheerder uit dienst gezet wordt.
  if ((target as unknown as { is_admin: boolean }).is_admin) {
    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", true)
      .is("left_at", null);
    if ((count ?? 0) <= 1) {
      throw new Error("Laatste beheerder kan niet uit dienst gezet worden");
    }
  }

  // 1. Markeer uit dienst.
  const { error: userErr } = await supabase
    .from("users")
    .update({ left_at: leftAtIso })
    .eq("id", input.userId);
  if (userErr) throw new Error(userErr.message);

  // 2. Maak team-lead leeg voor teams die deze persoon leidde.
  await supabase
    .from("teams")
    .update({ lead_user_id: null })
    .eq("lead_user_id", input.userId);

  // 3. Open actiepunten van deze persoon: expired.
  await supabase
    .from("action_items")
    .update({ status: "expired", completed_at: leftAtIso })
    .eq("owner_id", input.userId)
    .eq("status", "open");

  // 4. Open 1-op-1's waar deze persoon employee of manager is: afsluiten.
  await supabase
    .from("one_on_ones")
    .update({ completed_at: leftAtIso })
    .or(`employee_id.eq.${input.userId},manager_id.eq.${input.userId}`)
    .is("completed_at", null);

  // 5. Lopende functioneringsgesprek-cycli: cancelled.
  await supabase
    .from("performance_reviews")
    .update({ status: "cancelled" })
    .or(`employee_id.eq.${input.userId},manager_id.eq.${input.userId}`)
    .not("status", "in", "(completed,cancelled)");

  // 6. Lopende beoordelingsgesprekken: afsluiten.
  await supabase
    .from("evaluations")
    .update({ completed_at: leftAtIso })
    .or(`employee_id.eq.${input.userId},manager_id.eq.${input.userId}`)
    .is("completed_at", null);

  // 7. Openstaande feedback-verzoeken: declined.
  await supabase
    .from("feedback")
    .update({ status: "declined" })
    .or(`author_id.eq.${input.userId},recipient_id.eq.${input.userId}`)
    .eq("status", "requested");

  revalidateOffboardingRoutes(input.userId);
}

export async function reactivateUser(input: { userId: string }): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: target } = await supabase
    .from("users")
    .select("id, left_at")
    .eq("id", input.userId)
    .maybeSingle();
  if (!target) throw new Error("Medewerker niet gevonden");
  if (!(target as unknown as { left_at: string | null }).left_at) {
    throw new Error("Deze medewerker is niet uit dienst");
  }

  const { error } = await supabase
    .from("users")
    .update({ left_at: null })
    .eq("id", input.userId);
  if (error) throw new Error(error.message);

  revalidateOffboardingRoutes(input.userId);
}
