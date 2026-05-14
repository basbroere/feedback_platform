import { redirect } from "next/navigation";
import { requirePersona } from "@/lib/persona/server";
import { getTeamMembers } from "@/lib/one-on-ones/queries";
import { TeamList } from "@/components/one-on-one/team-list";

export default async function TeamPage() {
  const persona = await requirePersona();
  if (persona.role === "employee") redirect("/dashboard");

  const members = await getTeamMembers(persona.id);

  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight md:text-[32px]">
          Jouw team
        </h1>
        <p className="text-[15px] text-muted-foreground">
          {persona.team?.name
            ? `${persona.team.name} · plan en bekijk 1-op-1's per teamlid.`
            : "Plan en bekijk 1-op-1's per teamlid."}
        </p>
      </header>

      <TeamList members={members} />
    </div>
  );
}
