import Link from "next/link";
import {
  ArrowRight,
  Award,
  Building2,
  CalendarClock,
  CheckSquare,
  MessageSquareText,
  RefreshCcw,
  Sprout,
  User,
  UsersRound,
} from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import type { Persona } from "@/lib/persona/types";
import { ShortcutCard, type ShortcutCardProps } from "@/components/app/shortcut-card";
import { getUpcomingOneOnOneForEmployee } from "@/lib/one-on-ones/queries";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

const ROLE_LABEL: Record<Persona["role"], string> = {
  hr: "HR",
  manager: "Manager",
  employee: "Medewerker",
};

type Shortcut = Omit<ShortcutCardProps, "onClick">;

function moduleShortcuts(role: Persona["role"]): Shortcut[] {
  const oneOnOne: Shortcut =
    role === "hr"
      ? {
          icon: MessageSquareText,
          tone: "blue",
          title: "1-op-1's",
          description: "Tweewekelijks moment tussen manager en medewerker.",
          comingSoon: true,
        }
      : {
          icon: MessageSquareText,
          tone: "blue",
          title: role === "manager" ? "Team & 1-op-1's" : "Mijn 1-op-1's",
          description:
            role === "manager"
              ? "Plan, leid en leg gesprekken vast met je team."
              : "Tweewekelijks moment met je manager.",
          href: role === "manager" ? "/team" : "/een-op-een",
        };

  const base: Shortcut[] = [
    oneOnOne,
    {
      icon: CheckSquare,
      tone: "emerald",
      title: "Actiepunten",
      description: "De rode draad door je gesprekken.",
      comingSoon: true,
    },
    {
      icon: UsersRound,
      tone: "primary",
      title: "Functioneringsgesprek",
      description: "Zelfevaluatie en peer feedback.",
      comingSoon: true,
    },
    {
      icon: Award,
      tone: "violet",
      title: "Beoordeling",
      description: "Jaarlijks moment, samen vooruitkijken.",
      comingSoon: true,
    },
  ];

  if (role === "hr") {
    return [
      ...base,
      {
        icon: Sprout,
        tone: "teal",
        title: "Templates",
        description: "Vragenlijsten voor elke gesprekssoort.",
        comingSoon: true,
      },
      {
        icon: Building2,
        tone: "amber",
        title: "Organisatie",
        description: "Teams, medewerkers en rollen.",
        comingSoon: true,
      },
    ];
  }

  return base;
}

export default async function DashboardPage() {
  const persona = await requirePersona();
  const firstName = persona.name.split(" ")[0];
  const shortcuts = moduleShortcuts(persona.role);
  const upcoming =
    persona.role !== "hr"
      ? await getUpcomingOneOnOneForEmployee(persona.id)
      : null;

  return (
    <div className="space-y-10">
      <header className="space-y-1.5">
        <h1 className="text-[30px] font-semibold leading-tight tracking-tight md:text-[34px]">
          Welkom, {firstName}
        </h1>
        <p className="text-[15px] text-muted-foreground">
          {ROLE_LABEL[persona.role]}
          {persona.team?.name ? ` · ${persona.team.name}` : ""}. Hier groeit je dashboard mee terwijl we modules toevoegen.
        </p>
      </header>

      {upcoming ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                <CalendarClock className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[14px] font-medium">{upcoming.subject}</p>
                <p className="text-[13px] text-muted-foreground">
                  Volgende 1-op-1 · {formatDateTime(upcoming.scheduled_at)}
                </p>
              </div>
            </div>
            <Link
              href={`/een-op-een/${upcoming.id}/voorbereiden`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Voorbereiden
              <ArrowRight className="h-3.5 w-3.5" data-icon="inline-end" />
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Snelkoppelingen
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {shortcuts.map((s) => (
            <ShortcutCard key={s.title} {...s} />
          ))}
        </div>
      </section>

      <section className="space-y-3.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Persoonlijk
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ShortcutCard
            icon={User}
            tone="neutral"
            title="Mijn profiel"
            description={`${persona.name} · ${persona.email}`}
            comingSoon
          />
          <ShortcutCard
            icon={RefreshCcw}
            tone="neutral"
            title="Wissel persona"
            description="Bekijk de demo door andermans ogen."
            href="/?wissel=1"
          />
        </div>
      </section>
    </div>
  );
}
