import Link from "next/link";
import {
  ArrowRight,
  CalendarPlus,
  CheckSquare,
  ClipboardCheck,
  MessageCircle,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { DashboardData } from "./dashboard-view-switcher";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { formatDateTime, formatRelativeWeeks } from "@/lib/format";
import { TONE_BG } from "@/lib/ui/tone";
import { cn } from "@/lib/utils";

type AgendaRow = {
  key: string;
  personId: string;
  personName: string;
  avatarUrl: string | null;
  date: string;
  type: "1-op-1" | "Functionering";
  href: string;
};

function buildAgenda(data: DashboardData): AgendaRow[] {
  const rows: AgendaRow[] = [];

  if (data.upcoming) {
    rows.push({
      key: data.upcoming.id,
      personId: data.persona.id,
      personName: data.persona.name,
      avatarUrl: data.persona.avatar_url,
      date: formatDateTime(data.upcoming.scheduled_at),
      type: "1-op-1",
      href: `/een-op-een/${data.upcoming.id}/voorbereiden`,
    });
  }

  for (const m of data.managerUpcoming) {
    rows.push({
      key: m.id,
      personId: m.employee.id,
      personName: m.employee.name,
      avatarUrl: m.employee.avatar_url,
      date: formatDateTime(m.scheduled_at),
      type: "1-op-1",
      href: `/een-op-een/${m.id}`,
    });
  }

  const ownPr =
    data.ownOpenPerformanceReview && !data.ownOpenPerformanceReview.has_employee_input
      ? data.ownOpenPerformanceReview
      : null;

  if (ownPr) {
    rows.push({
      key: ownPr.id,
      personId: ownPr.manager.id,
      personName: ownPr.manager.name,
      avatarUrl: null,
      date: "Zelfevaluatie open",
      type: "Functionering",
      href: `/functioneringsgesprek/${ownPr.id}/voorbereiden`,
    });
  }

  for (const r of data.managerOpenPerformanceReviews) {
    rows.push({
      key: `pr-${r.id}`,
      personId: r.employee.id,
      personName: r.employee.name,
      avatarUrl: r.employee.avatar_url,
      date: r.has_employee_input ? "Zelfevaluatie binnen" : "Wacht op input",
      type: "Functionering",
      href: `/functioneringsgesprek/${r.id}`,
    });
  }

  return rows;
}

export function LayoutC({ data }: { data: DashboardData }) {
  const { persona, dossier, feedbackRequests } = data;
  const firstName = persona.name.split(" ")[0];
  const isManager = persona.role === "manager";
  const agenda = buildAgenda(data);
  const openItems = dossier.open.slice(0, 8);

  const quickLinks = isManager
    ? [
        { href: "/een-op-een", icon: CalendarPlus, tone: "blue" as const, title: "1-op-1 gesprekken", subtitle: "Plannen en documenteren" },
        { href: "/team", icon: UsersRound, tone: "violet" as const, title: "Team overzicht", subtitle: "Status per teamlid" },
        { href: "/functioneringsgesprek", icon: ClipboardCheck, tone: "amber" as const, title: "Functioneringsgesprekken", subtitle: "Cycli en voortgang" },
        { href: "/actiepunten", icon: CheckSquare, tone: "emerald" as const, title: "Actiepunten", subtitle: `${dossier.stats.openTotal} open` },
      ]
    : [
        { href: "/een-op-een", icon: CalendarPlus, tone: "blue" as const, title: "Mijn 1-op-1's", subtitle: "Voorbereiden en terugkijken" },
        { href: "/actiepunten", icon: CheckSquare, tone: "emerald" as const, title: "Actiepunten", subtitle: `${dossier.stats.openTotal} open` },
        { href: "/feedback", icon: MessageCircle, tone: "primary" as const, title: "Feedback", subtitle: "Ontvangen en gegeven" },
        { href: "/functioneringsgesprek", icon: Sparkles, tone: "amber" as const, title: "Functioneringsgesprek", subtitle: "Zelfevaluatie en voortgang" },
      ];

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome */}
      <header>
        <h1 className="text-[30px] font-semibold tracking-tight leading-tight">
          Welkom {firstName}
        </h1>
        <p className="mt-0.5 text-[13px] text-foreground/40">
          hier is een overzicht van wat speelt
        </p>
      </header>

      {/* Main row: agenda + actiepunten */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">

        {/* Agenda */}
        <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Agenda
            </h2>
            <Link
              href="/een-op-een"
              className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Alle gesprekken
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {agenda.length === 0 ? (
            <p className="px-6 pb-6 text-[13px] text-muted-foreground">
              Geen gesprekken gepland.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-y border-border">
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                    Persoon
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                    Datum / Status
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                    Type
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {agenda.map((row) => (
                  <tr
                    key={row.key}
                    className="group border-b border-border/60 last:border-b-0 transition-colors hover:bg-accent/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <PersonAvatar
                          id={row.personId}
                          name={row.personName}
                          avatarUrl={row.avatarUrl}
                        />
                        <span className="text-[14px] font-semibold">{row.personName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-muted-foreground whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="hidden md:table-cell px-4 py-4">
                      <TypeBadge type={row.type} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={row.href}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground/50 transition-colors group-hover:text-primary"
                      >
                        Open
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Actiepunten */}
        <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Actiepunten
            </h2>
            <Link
              href="/actiepunten"
              className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Alles
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {openItems.length === 0 && feedbackRequests.length === 0 ? (
            <p className="px-5 pb-6 text-[13px] text-muted-foreground">
              Niks open. Lekker rustig.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-y border-border">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                    Omschrijving
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                    Sinds
                  </th>
                </tr>
              </thead>
              <tbody>
                {feedbackRequests.map((req, i) => (
                  <tr
                    key={req.feedback_id}
                    className={cn(
                      "group border-b border-border/40 last:border-b-0 transition-colors hover:bg-accent/40",
                      i % 2 === 1 && "bg-muted/30",
                    )}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", TONE_BG["primary"])}>
                          <MessageCircle className="h-3 w-3" strokeWidth={1.75} />
                        </span>
                        <Link
                          href={`/feedback-verzoek/${req.feedback_id}`}
                          className="truncate text-[12.5px] font-medium leading-snug hover:text-primary max-w-[180px]"
                        >
                          Feedback voor {req.requester.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-muted-foreground whitespace-nowrap">
                      {formatRelativeWeeks(req.requested_at ?? req.created_at)}
                    </td>
                  </tr>
                ))}
                {openItems.map((item, i) => {
                  const offset = feedbackRequests.length;
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "group border-b border-border/40 last:border-b-0 transition-colors hover:bg-accent/40",
                        (i + offset) % 2 === 1 && "bg-muted/30",
                      )}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", TONE_BG["emerald"])}>
                            <CheckSquare className="h-3 w-3" strokeWidth={1.75} />
                          </span>
                          <Link
                            href="/actiepunten"
                            className="truncate text-[12.5px] font-medium leading-snug hover:text-primary max-w-[180px]"
                          >
                            {item.description}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11.5px] text-muted-foreground whitespace-nowrap">
                        {formatRelativeWeeks(item.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick links */}
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Snelkoppelingen
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", TONE_BG[link.tone])}>
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold leading-tight">
                    {link.title}
                  </p>
                  <p className="truncate text-[12.5px] text-muted-foreground mt-0.5">
                    {link.subtitle}
                  </p>
                </div>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground/60"
                  strokeWidth={2}
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TypeBadge({ type }: { type: "1-op-1" | "Functionering" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        type === "1-op-1"
          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      )}
    >
      {type}
    </span>
  );
}
