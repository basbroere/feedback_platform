import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import {
  listTeamsForAdmin,
  listUsersForAdmin,
} from "@/lib/hr/admin-queries";

export default async function BeheerPage() {
  const persona = await requirePersona();
  if (persona.role !== "hr") redirect("/dashboard");

  const [users, teams] = await Promise.all([
    listUsersForAdmin(),
    listTeamsForAdmin(),
  ]);

  return (
    <div className="space-y-10">
      <PageTitle
        icon={ShieldCheck}
        tone="rose"
        title="Beheer"
        subtitle="Teams en personen"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <BeheerCard
          href="/beheer/personen"
          icon={UserPlus}
          tone="primary"
          title="Personen"
          description="Voeg medewerkers, team-leads, managers en HR toe. Pas rollen aan of verwijder accounts."
          stat={`${users.length} ${users.length === 1 ? "persoon" : "personen"}`}
        />
        <BeheerCard
          href="/beheer/teams"
          icon={UsersRound}
          tone="emerald"
          title="Teams"
          description="Maak teams aan en koppel een team-lead. Teamleden voeg je toe via personen."
          stat={`${teams.length} ${teams.length === 1 ? "team" : "teams"}`}
        />
      </div>
    </div>
  );
}

type Tone = "primary" | "emerald";

const TONE: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  emerald:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
};

function BeheerCard({
  href,
  icon: Icon,
  tone,
  title,
  description,
  stat,
}: {
  href: string;
  icon: typeof UsersRound;
  tone: Tone;
  title: string;
  description: string;
  stat: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <span
              className={
                "flex h-9 w-9 items-center justify-center rounded-lg " +
                TONE[tone]
              }
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="text-[12px] font-medium text-muted-foreground">
              {stat}
            </span>
          </div>
          <CardTitle className="pt-3 text-[18px]">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-primary group-hover:underline">
            Openen
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
