import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UsersRound } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  listTeamsForAdmin,
  listUsersForAdmin,
} from "@/lib/hr/admin-queries";
import { CreateTeamForm } from "@/components/hr/create-team-form";

export default async function TeamsBeheerPage() {
  const persona = await requirePersona();
  if (persona.role !== "hr") redirect("/dashboard");

  const [teams, users] = await Promise.all([
    listTeamsForAdmin(),
    listUsersForAdmin(),
  ]);

  const leadOptions = users
    .filter(
      (u) =>
        u.role === "team_lead" || u.role === "manager" || u.role === "hr",
    )
    .map((u) => ({ id: u.id, name: u.name }));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
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
          Maak teams aan en koppel desgewenst een team-lead. Teamleden voeg
          je toe via personen.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRound
              className="h-4 w-4 text-muted-foreground"
              strokeWidth={1.75}
            />
            Nieuw team
          </CardTitle>
          <CardDescription>
            Een team-lead is optioneel en kun je later koppelen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTeamForm managers={leadOptions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Bestaande teams
            <Badge variant="outline" className="ml-1">
              {teams.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <p className="py-2 text-[13px] text-muted-foreground">
              Nog geen teams. Maak hierboven het eerste team aan.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {teams.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium">
                      {t.name}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {t.member_count}{" "}
                      {t.member_count === 1 ? "lid" : "leden"}
                      {t.lead_name ? ` · Lead: ${t.lead_name}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
