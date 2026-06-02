import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { cn } from "@/lib/utils";
import {
  listTeamsForAdmin,
  listUsersForAdmin,
} from "@/lib/hr/admin-queries";

export default async function BeheerPage() {
  const persona = await requirePersona();
  if (!persona.is_admin) redirect("/dashboard");

  await Promise.all([listUsersForAdmin(), listTeamsForAdmin()]);

  return (
    <div className="space-y-10">
      <PageTitle
        icon={ShieldCheck}
        tone="rose"
        title="Beheer"
        subtitle="Teams en personen"
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <BeheerCard
          href="/beheer/personen"
          icon={UserPlus}
          tone="primary"
          title="Personen"
          description="Aanmaken, bewerken en rollen instellen."
        />
        <BeheerCard
          href="/beheer/teams"
          icon={UsersRound}
          tone="emerald"
          title="Teams"
          description="Teams aanmaken en een team-lead koppelen."
        />
      </div>
    </div>
  );
}

type Tone = "primary" | "emerald";

const TONE: Record<Tone, { icon: string; button: string }> = {
  primary: {
    icon: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
    button: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
};

function BeheerCard({
  href,
  icon: Icon,
  tone,
  title,
  description,
}: {
  href: string;
  icon: typeof UsersRound;
  tone: Tone;
  title: string;
  description: string;
}) {
  return (
    <Card className="flex flex-col gap-6 p-6">
      <span
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl",
          TONE[tone].icon,
        )}
      >
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </span>

      <div className="space-y-1.5">
        <h3 className="text-[18px] font-bold leading-snug text-foreground">{title}</h3>
        <p className="text-[14px] leading-relaxed text-muted-foreground">{description}</p>
      </div>

      <div>
        <Link
          href={href}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-semibold transition-colors",
            TONE[tone].button,
          )}
        >
          Beheren
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>
    </Card>
  );
}
