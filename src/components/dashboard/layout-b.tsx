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
import type { LucideIcon } from "lucide-react";
import type { DashboardData } from "./dashboard-view-switcher";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { formatDate, formatDateTime, formatRelativeWeeks } from "@/lib/format";
import { TONE_BG, type Tone } from "@/lib/ui/tone";
import { cn } from "@/lib/utils";

const STALE_WEEKS = 3;

type TodoItem = {
  key: string;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  meta: string;
  href: string;
};

type AgendaRow = {
  key: string;
  personId: string;
  personName: string;
  avatarUrl: string | null;
  date: string;
  type: "1-op-1" | "Functionering";
  href: string;
};

function buildTodos(data: DashboardData): TodoItem[] {
  const todos: TodoItem[] = [];
  const ownPr =
    data.ownOpenPerformanceReview && !data.ownOpenPerformanceReview.has_employee_input
      ? data.ownOpenPerformanceReview
      : null;

  if (ownPr) {
    todos.push({
      key: ownPr.id,
      icon: ClipboardCheck,
      tone: "amber",
      title: "Zelfevaluatie invullen",
      meta: `${ownPr.template_name ?? "Functioneringsgesprek"} · met ${ownPr.manager.name}`,
      href: `/functioneringsgesprek/${ownPr.id}/voorbereiden`,
    });
  }

  for (const r of data.managerOpenPerformanceReviews) {
    todos.push({
      key: r.id,
      icon: ClipboardCheck,
      tone: "amber",
      title: `Functioneringsgesprek met ${r.employee.name}`,
      meta: r.has_employee_input ? "Zelfevaluatie binnen" : "Wacht op zelfevaluatie",
      href: `/functioneringsgesprek/${r.id}`,
    });
  }

  if (data.upcoming) {
    todos.push({
      key: data.upcoming.id,
      icon: CalendarPlus,
      tone: "blue",
      title: data.upcoming.subject || "1-op-1",
      meta: formatDateTime(data.upcoming.scheduled_at),
      href: `/een-op-een/${data.upcoming.id}/voorbereiden`,
    });
  }

  for (const req of data.feedbackRequests) {
    todos.push({
      key: req.feedback_id,
      icon: MessageCircle,
      tone: "primary",
      title: `Feedback voor ${req.requester.name}`,
      meta: req.template?.name ?? "Feedback-aanvraag",
      href: `/feedback-verzoek/${req.feedback_id}`,
    });
  }

  for (const item of data.dossier.open.slice(0, 4)) {
    todos.push({
      key: item.id,
      icon: CheckSquare,
      tone: "emerald",
      title: item.description,
      meta: `Open · ${formatRelativeWeeks(item.created_at)}`,
      href: "/actiepunten",
    });
  }

  return todos;
}

function buildAgenda(data: DashboardData): AgendaRow[] {
  const rows: AgendaRow[] = [];
  const isManager = data.persona.role === "manager";
  const twoWeeksFromNow = isManager
    ? Date.now() + 14 * 24 * 60 * 60 * 1000
    : null;
  const withinTwoWeeks = (iso: string | null) => {
    if (twoWeeksFromNow === null) return true;
    if (!iso) return false;
    return new Date(iso).getTime() <= twoWeeksFromNow;
  };

  if (data.upcoming && withinTwoWeeks(data.upcoming.scheduled_at)) {
    rows.push({
      key: data.upcoming.id,
      personId: data.persona.id,
      personName: data.persona.name.split(" ")[0],
      avatarUrl: data.persona.avatar_url,
      date: formatDateTime(data.upcoming.scheduled_at),
      type: "1-op-1",
      href: `/een-op-een/${data.upcoming.id}/voorbereiden`,
    });
  }

  for (const m of data.managerUpcoming) {
    if (!withinTwoWeeks(m.scheduled_at)) continue;
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

  if (!isManager) {
    for (const r of data.managerOpenPerformanceReviews) {
      rows.push({
        key: `pr-${r.id}`,
        personId: r.employee.id,
        personName: r.employee.name,
        avatarUrl: r.employee.avatar_url,
        date: "Lopend",
        type: "Functionering",
        href: `/functioneringsgesprek/${r.id}`,
      });
    }
  }

  return rows;
}

export function LayoutB({ data }: { data: DashboardData }) {
  const { persona, dossier, feedbackLast4Weeks, latestOneOnOne, teamMembers, feedback } = data;
  const isManager = persona.role === "manager";
  const firstName = persona.name.split(" ")[0];
  const todos = buildTodos(data);
  const agenda = buildAgenda(data);

  const staleMembers = teamMembers
    .filter((m) => (m.weeks_since_last ?? Infinity) >= STALE_WEEKS)
    .sort((a, b) => (b.weeks_since_last ?? 0) - (a.weeks_since_last ?? 0))
    .slice(0, 5);

  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_3fr]">
      {/* Left column */}
      <div className="flex flex-col gap-5">
        {/* Greeting + metrics */}
        <div className="rounded-2xl bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <PersonAvatar
              id={persona.id}
              name={persona.name}
              avatarUrl={persona.avatar_url}
              size="lg"
            />
            <div className="min-w-0">
              <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
                Hi {firstName}
              </h1>
              {data.subtitle ? (
                <p className="truncate text-[13px] text-muted-foreground">{data.subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <MetricChip
              value={dossier.stats.openTotal}
              label="Actiepunten"
              warn={dossier.stats.openOver4Weeks > 0}
            />
            <MetricChip value={feedbackLast4Weeks} label="Feedback (4w)" />
            <MetricChip
              value={latestOneOnOne ? formatRelativeWeeks(latestOneOnOne.completed_at) : "Geen"}
              label="Laatste 1-op-1"
            />
          </div>
        </div>

        {/* Todo checklist */}
        <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h2 className="text-[12.5px] font-medium font-heading text-muted-foreground">
              Op je bord
            </h2>
            {todos.length > 4 ? (
              <Link
                href="/actiepunten"
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
              >
                Alles
                <ArrowRight className="h-3 w-3" />
              </Link>
            ) : null}
          </div>
          {todos.length === 0 ? (
            <p className="px-5 pb-5 text-[13px] text-muted-foreground">
              Niks open. Geniet ervan.
            </p>
          ) : (
            <ul>
              {todos.map((todo) => {
                const Icon = todo.icon;
                return (
                  <li key={todo.key} className="border-t border-border">
                    <Link
                      href={todo.href}
                      className="group flex items-center gap-3 px-5 py-3 hover:bg-accent/40 transition-colors"
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          TONE_BG[todo.tone],
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium leading-tight">
                          {todo.title}
                        </p>
                        <p className="truncate text-[11.5px] text-muted-foreground">{todo.meta}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-5">
        {/* Agenda table */}
        {agenda.length > 0 ? (
          <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-3">
              <h2 className="text-[12.5px] font-medium font-heading text-muted-foreground">
                Aankomende gesprekken
              </h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-y border-border">
                  <th className="px-5 py-2 text-left text-[12.5px] font-medium font-heading text-muted-foreground">
                    Persoon
                  </th>
                  <th className="px-3 py-2 text-left text-[12.5px] font-medium font-heading text-muted-foreground">
                    Datum
                  </th>
                  <th className="hidden sm:table-cell px-3 py-2 text-left text-[12.5px] font-medium font-heading text-muted-foreground">
                    Type
                  </th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody>
                {agenda.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-border last:border-b-0 group hover:bg-accent/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <PersonAvatar
                          id={row.personId}
                          name={row.personName}
                          avatarUrl={row.avatarUrl}
                          size="sm"
                        />
                        <span className="text-[13.5px] font-medium truncate">{row.personName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3">
                      <TypeBadge type={row.type} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={row.href}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground/50 group-hover:text-primary transition-colors"
                      >
                        Open
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Team pulse (manager) or recent feedback (employee) */}
        {isManager && staleMembers.length > 0 ? (
          <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <h2 className="text-[12.5px] font-medium font-heading text-muted-foreground">
                Tijd voor een 1-op-1?
              </h2>
              <Link
                href="/team"
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
              >
                Heel team
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-y border-border">
                  <th className="px-5 py-2 text-left text-[12.5px] font-medium font-heading text-muted-foreground">
                    Naam
                  </th>
                  <th className="px-3 py-2 text-left text-[12.5px] font-medium font-heading text-muted-foreground">
                    Laatste 1-op-1
                  </th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody>
                {staleMembers.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-border last:border-b-0 group hover:bg-accent/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <PersonAvatar
                          id={m.id}
                          name={m.name}
                          avatarUrl={m.avatar_url}
                          size="sm"
                        />
                        <span className="text-[13.5px] font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-muted-foreground">
                      {m.last_one_on_one_at
                        ? formatRelativeWeeks(m.last_one_on_one_at)
                        : "Nog niet geweest"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/team/${m.id}`}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground/50 group-hover:text-primary transition-colors"
                      >
                        Plan
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !isManager && feedback.length > 0 ? (
          <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <h2 className="text-[12.5px] font-medium font-heading text-muted-foreground">
                Recente feedback
              </h2>
              <Link
                href="/feedback"
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
              >
                Alles
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <ul>
              {feedback.slice(0, 4).map((f) => {
                const snippet = pickSnippet(f);
                return (
                  <li key={f.id} className="border-t border-border">
                    <div className="flex items-start gap-3 px-5 py-3.5">
                      {f.author ? (
                        <PersonAvatar
                          id={f.author.id}
                          name={f.author.name}
                          avatarUrl={f.author.avatar_url}
                          size="sm"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[13.5px] font-medium leading-tight">
                            {f.author?.name ?? "Onbekend"}
                          </p>
                          {f.is_cross_team ? (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              <Sparkles className="h-2.5 w-2.5" />
                              Cross-team
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11.5px] text-muted-foreground">
                          {formatRelativeWeeks(f.submitted_at ?? f.created_at)}
                        </p>
                        {snippet ? (
                          <p className="mt-1 line-clamp-2 text-[12.5px] text-foreground/80">
                            {snippet}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetricChip({
  value,
  label,
  warn,
}: {
  value: number | string;
  label: string;
  warn?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px]",
        warn
          ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
          : "bg-muted text-foreground/80",
      )}
    >
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function TypeBadge({ type }: { type: "1-op-1" | "Functionering" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium",
        type === "1-op-1"
          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      )}
    >
      {type}
    </span>
  );
}

function pickSnippet(item: { body?: string | null; responses?: Record<string, string> | null }): string | null {
  if (item.body?.trim()) return item.body.trim();
  if (item.responses) {
    for (const v of Object.values(item.responses)) {
      if (v?.trim()) return v.trim();
    }
  }
  return null;
}
