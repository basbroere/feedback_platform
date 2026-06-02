import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  listTeamsForAdmin,
  listUsersForAdmin,
} from "@/lib/hr/admin-queries";
import { AddTeamSheet } from "@/components/hr/create-team-form";
import { TeamTable } from "@/components/hr/team-table";

export default async function TeamsBeheerPage() {
  const persona = await requirePersona();
  if (!persona.is_admin) redirect("/dashboard");

  const [teams, users] = await Promise.all([
    listTeamsForAdmin(),
    listUsersForAdmin(),
  ]);

  const leadOptions = users
    .filter((u) => u.role === "manager")
    .map((u) => ({ id: u.id, name: u.name }));

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <Link
            href="/beheer"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Terug naar beheer
          </Link>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
            Teams
          </h1>
          <p className="text-[14px] text-muted-foreground">
            Maak teams aan. Leden voeg je toe via Personen.
          </p>
        </div>

        <div className="shrink-0 pt-6">
          <AddTeamSheet />
        </div>
      </header>

      <Card>
        <CardHeader className="flex-row items-center gap-2 pb-0">
          <span className="text-[15px] font-semibold">Alle teams</span>
          <Badge variant="outline" className="ml-1">
            {teams.length}
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          <TeamTable teams={teams} leadOptions={leadOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
