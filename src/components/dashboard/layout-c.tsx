import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  CheckSquare,
  ClipboardCheck,
  MessageCircle,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DashboardData } from "./dashboard-view-switcher";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { formatDateTime, formatRelativeWeeks } from "@/lib/format";
import { TONE_BG, type Tone } from "@/lib/ui/tone";
import { cn } from "@/lib/utils";

type PlateItem = {
  key: string;
  leading: React.ReactNode;
  title: React.ReactNode;
  meta: string;
  cta: string;
  href: string;
};

const BADGE: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
  primary: "bg-primary/15 text-primary",
};

function IconLead({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
  return (
    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", TONE_BG[tone])}>
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </span>
  );
}

function AvatarLead({
  id, name, avatarUrl, badge: BadgeIcon, badgeTone,
}: {
  id: string;
  name: string;
  avatarUrl: string | null;
  badge: LucideIcon;
  badgeTone: keyof typeof BADGE;
}) {
  return (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
      <PersonAvatar id={id} name={name} avatarUrl={avatarUrl} />
      <span className={cn(
        "absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card",
        BADGE[badgeTone],
      )}>
        <BadgeIcon className="h-2.5 w-2.5" strokeWidth={2} />
      </span>
    </span>
  );
}

function buildGesprekken(data: DashboardData): PlateItem[] {
  const items: PlateItem[] = [];

  if (data.upcoming) {
    items.push({
      key: data.upcoming.id,
      leading: <IconLead icon={CalendarClock} tone="blue" />,
      title: data.upcoming.subject || "1-op-1",
      meta: formatDateTime(data.upcoming.scheduled_at),
      cta: "Voorbereiden",
      href: `/een-op-een/${data.upcoming.id}/voorbereiden`,
    });
  }

  // Medewerker: ingepland of klaar voor gesprek
  const ownScheduled =
    data.ownOpenPerformanceReview?.status === "scheduled" ||
    data.ownOpenPerformanceReview?.status === "ready_for_meeting"
      ? data.ownOpenPerformanceReview
      : null;
  if (ownScheduled) {
    items.push({
      key: `pr-own-sched-${ownScheduled.id}`,
      leading: <IconLead icon={ClipboardCheck} tone="amber" />,
      title: `Functioneringsgesprek met ${ownScheduled.manager.name}`,
      meta: ownScheduled.scheduled_at ? formatDateTime(ownScheduled.scheduled_at) : "Ingepland",
      cta: "Bekijken",
      href: `/functioneringsgesprek/${ownScheduled.id}`,
    });
  }

  for (const m of data.managerUpcoming) {
    items.push({
      key: m.id,
      leading: <AvatarLead id={m.employee.id} name={m.employee.name} avatarUrl={m.employee.avatar_url} badge={UsersRound} badgeTone="violet" />,
      title: <><span className="font-semibold">{m.employee.name}</span>{" · 1-op-1"}</>,
      meta: formatDateTime(m.scheduled_at),
      cta: "Openen",
      href: `/een-op-een/${m.id}`,
    });
  }

  for (const r of data.scheduledPerformanceReviews) {
    items.push({
      key: `pr-sched-${r.id}`,
      leading: <AvatarLead id={r.employee.id} name={r.employee.name} avatarUrl={r.employee.avatar_url} badge={ClipboardCheck} badgeTone="amber" />,
      title: <><span className="font-semibold">{r.employee.name}</span>{" · Functioneringsgesprek"}</>,
      meta: r.scheduled_at ? formatDateTime(r.scheduled_at) : "Ingepland",
      cta: "Openen",
      href: `/functioneringsgesprek/${r.id}`,
    });
  }

  for (const r of data.managerOpenPerformanceReviews.filter(
    (r) => r.status !== "scheduled" && r.status !== "ready_for_meeting",
  )) {
    items.push({
      key: `pr-${r.id}`,
      leading: <AvatarLead id={r.employee.id} name={r.employee.name} avatarUrl={r.employee.avatar_url} badge={ClipboardCheck} badgeTone="amber" />,
      title: <><span className="font-semibold">{r.employee.name}</span>{" · Functioneringsgesprek"}</>,
      meta: r.has_employee_input ? "Zelfevaluatie binnen" : "Wacht op zelfevaluatie",
      cta: "Openen",
      href: `/functioneringsgesprek/${r.id}`,
    });
  }

  for (const r of data.managerOpenPerformanceReviews.filter(
    (r) => r.status === "ready_for_meeting",
  )) {
    items.push({
      key: `pr-ready-${r.id}`,
      leading: <AvatarLead id={r.employee.id} name={r.employee.name} avatarUrl={r.employee.avatar_url} badge={ClipboardCheck} badgeTone="amber" />,
      title: <><span className="font-semibold">{r.employee.name}</span>{" · Functioneringsgesprek"}</>,
      meta: r.scheduled_at ? formatDateTime(r.scheduled_at) : "Alle feedback binnen",
      cta: "Openen",
      href: `/functioneringsgesprek/${r.id}`,
    });
  }

  return items;
}

function buildTaken(data: DashboardData): PlateItem[] {
  const items: PlateItem[] = [];

  const ownPr =
    data.ownOpenPerformanceReview &&
    !data.ownOpenPerformanceReview.has_employee_input &&
    data.ownOpenPerformanceReview.status !== "scheduled" &&
    data.ownOpenPerformanceReview.status !== "ready_for_meeting"
      ? data.ownOpenPerformanceReview
      : null;

  if (ownPr) {
    items.push({
      key: ownPr.id,
      leading: <IconLead icon={ClipboardCheck} tone="amber" />,
      title: ownPr.template_name ?? "Functioneringsgesprek",
      meta: `Zelfevaluatie open · met ${ownPr.manager.name}`,
      cta: "Invullen",
      href: `/functioneringsgesprek/${ownPr.id}/voorbereiden`,
    });
  }

  for (const req of data.feedbackRequests) {
    items.push({
      key: `feedback-${req.feedback_id}`,
      leading: <AvatarLead id={req.requester.id} name={req.requester.name} avatarUrl={req.requester.avatar_url} badge={MessageCircle} badgeTone="primary" />,
      title: <><span className="font-semibold">{req.requester.name}</span>{" · Peer feedback"}</>,
      meta: `${req.template?.name ?? "Feedback"} · ${formatRelativeWeeks(req.requested_at ?? req.created_at)}`,
      cta: "Invullen",
      href: `/feedback-verzoek/${req.feedback_id}`,
    });
  }

  return items;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="border-t border-border bg-muted/30 px-6 py-2">
      <p className="text-[12px] font-medium font-heading text-muted-foreground/70">
        {label}
      </p>
    </div>
  );
}

function PlateRow({ item }: { item: PlateItem }) {
  return (
    <li className="border-t border-border/60">
      <Link
        href={item.href}
        className="group flex items-center gap-4 px-6 py-3.5 hover:bg-accent/40 transition-colors"
      >
        {item.leading}
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-[13.5px] font-medium leading-tight">{item.title}</p>
          <p className="truncate text-[12px] text-muted-foreground">{item.meta}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-foreground/50 group-hover:text-primary transition-colors whitespace-nowrap">
          {item.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </li>
  );
}

export function LayoutC({ data }: { data: DashboardData }) {
  const { persona, dossier } = data;
  const firstName = persona.name.split(" ")[0];
  const isManager = persona.role === "manager";
  const gesprekken = buildGesprekken(data);
  const taken = buildTaken(data);
  const openItems = dossier.open.slice(0, 5);
  const hasAnything = gesprekken.length > 0 || taken.length > 0;

  const quickLinks = isManager
    ? [
        { href: "/een-op-een", icon: CalendarPlus, tone: "blue" as const, title: "1-op-1 gesprekken", subtitle: "Plannen en documenteren" },
        { href: "/team", icon: UsersRound, tone: "violet" as const, title: "Dossiers", subtitle: "Per teamlid" },
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
        <h1 className="font-heading text-[30px] font-semibold tracking-tight leading-tight">
          Welkom {firstName}
        </h1>
        <p className="mt-0.5 text-[13px] text-foreground/40">
          hier is een overzicht van wat speelt
        </p>
      </header>

      {/* Main row: op je bord + actiepunten */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">

        {/* Op je bord */}
        <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4">
            <h2 className="font-heading text-[13px] font-semibold tracking-tight text-foreground/80">
              Op je bord
            </h2>
          </div>

          {!hasAnything ? (
            <p className="px-6 pb-6 text-[13px] text-muted-foreground">
              Niks open. Geniet ervan.
            </p>
          ) : (
            <>
              {gesprekken.length > 0 && (
                <div>
                  <SectionHeader label="Aankomende gesprekken" />
                  <ul>
                    {gesprekken.map((item) => <PlateRow key={item.key} item={item} />)}
                  </ul>
                </div>
              )}

              {taken.length > 0 && (
                <div>
                  <SectionHeader label="Open taken" />
                  <ul>
                    {taken.map((item) => <PlateRow key={item.key} item={item} />)}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actiepunten */}
        <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-heading text-[13px] font-semibold tracking-tight text-foreground/80">
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

          {openItems.length === 0 ? (
            <p className="px-5 pb-6 text-[13px] text-muted-foreground">
              Niks open. Lekker rustig.
            </p>
          ) : (
            <ul>
              {openItems.map((item) => (
                <li key={item.id} className="border-t border-border">
                  <Link
                    href="/actiepunten"
                    className="group flex items-center gap-3 px-5 py-3 hover:bg-accent/40 transition-colors"
                  >
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", TONE_BG["emerald"])}>
                      <CheckSquare className="h-3 w-3" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium leading-snug">{item.description}</p>
                      <p className="text-[11px] text-muted-foreground">{formatRelativeWeeks(item.created_at)}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Snelkoppelingen */}
      <section>
        <h2 className="mb-4 font-heading text-[13px] font-semibold tracking-tight text-foreground/80">
          Snelkoppelingen
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", TONE_BG[link.tone])}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold leading-tight">
                    {link.title}
                  </p>
                  <p className="truncate text-[12px] text-muted-foreground">
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
