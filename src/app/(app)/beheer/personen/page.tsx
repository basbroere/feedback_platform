import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
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
import { CreateUserForm } from "@/components/hr/create-user-form";
import { PersonTable } from "@/components/hr/person-table";

export default async function PersonenBeheerPage() {
  const persona = await requirePersona();
  if (!persona.is_admin) redirect("/dashboard");

  const [users, teams] = await Promise.all([
    listUsersForAdmin(),
    listTeamsForAdmin(),
  ]);

  const teamOptions = teams.map((t) => ({ id: t.id, name: t.name }));

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
          Personen
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Voeg gebruikers toe, pas rollen of teams aan en verwijder accounts.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus
              className="h-4 w-4 text-muted-foreground"
              strokeWidth={1.75}
            />
            Nieuwe persoon
          </CardTitle>
          <CardDescription>
            Kies een rol en koppel optioneel een team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm teams={teamOptions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Alle personen
            <Badge variant="outline" className="ml-1">
              {users.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PersonTable
            users={users}
            teams={teamOptions}
            currentUserId={persona.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
