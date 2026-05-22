import { redirect } from "next/navigation";
import { UsersRound } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import { getTeamMembers } from "@/lib/one-on-ones/queries";
import { TeamList } from "@/components/one-on-one/team-list";
import { PageTitle } from "@/components/ui/page-title";

export default async function TeamPage() {
  const persona = await requirePersona();
  if (persona.role === "employee") redirect("/dashboard");

  const members = await getTeamMembers(persona.id);

  return (
    <div className="space-y-8">
      <PageTitle
        icon={UsersRound}
        tone="violet"
        title={persona.team?.name ?? "Jouw team"}
        subtitle={
          members.length === 0
            ? "Geen teamleden gekoppeld."
            : `${members.length} ${members.length === 1 ? "teamlid" : "teamleden"}`
        }
      />

      <TeamList members={members} />
    </div>
  );
}
