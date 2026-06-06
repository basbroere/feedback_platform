import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CircleCheck,
  ClipboardCheck,
} from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import {
  listPerformanceReviewsForEmployee,
  listPerformanceReviewsForManager,
} from "@/lib/performance-reviews/queries";
import { listActivePerformanceReviewTemplates } from "@/lib/performance-reviews/template";
import {
  getManagerForEmployee,
  getTeamMembers,
} from "@/lib/one-on-ones/queries";
import { StartPerformanceReviewDialog } from "@/components/performance-review/start-dialog";
import { PerformanceReviewTimeline } from "@/components/performance-review/manager-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PerformanceReviewListItem } from "@/lib/performance-reviews/types";

export default async function PerformanceReviewIndex() {
  const persona = await requirePersona();

  if (persona.role === "manager") {
    return <ManagerView personaId={persona.id} />;
  }

  return <EmployeeView personaId={persona.id} />;
}

async function EmployeeView({ personaId }: { personaId: string }) {
  const [asEmployee, manager] = await Promise.all([
    listPerformanceReviewsForEmployee(personaId),
    getManagerForEmployee(personaId),
  ]);

  const open = asEmployee.find(
    (r) => r.status !== "completed" && r.status !== "cancelled",
  );
  const completed = asEmployee.filter((r) => r.status === "completed");

  return (
    <div className="space-y-8">
      <PageTitle
        icon={ClipboardCheck}
        tone="amber"
        title="Functioneringsgesprekken"
        subtitle={manager ? `Met ${manager.name}` : undefined}
      />

      <section className="space-y-3">
        <h2 className="text-[12.5px] font-medium font-heading text-muted-foreground">
          Opkomend
        </h2>
        {open ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {open.template_name ?? "Functioneringsgesprek"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5 text-blue-500" />
                  Cyclus gestart op {formatDate(open.cycle_started_at)}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  {open.has_employee_input
                    ? "Je voorbereiding staat klaar. Wijzigen kan nog."
                    : "Voorbereiden mag in 2 minuten."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/functioneringsgesprek/${open.id}/voorbereiden`}
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  {open.has_employee_input ? "Bijwerken" : "Voorbereiden"}
                  <ArrowRight className="h-3.5 w-3.5" data-icon="inline-end" />
                </Link>
                <Link
                  href={`/functioneringsgesprek/${open.id}`}
                  className={cn(
                    buttonVariants({ size: "sm", variant: "ghost" }),
                  )}
                >
                  Bekijk gesprek
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Geen openstaand functioneringsgesprek. Halfjaarlijks plant je
              manager er een in.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[12.5px] font-medium font-heading text-muted-foreground">
          Recent
        </h2>
        <EmployeeHistoryTable items={completed} />
      </section>
    </div>
  );
}

async function ManagerView({ personaId }: { personaId: string }) {
  const [asManager, asEmployee, managerTeam, prTemplates] = await Promise.all([
    listPerformanceReviewsForManager(personaId),
    listPerformanceReviewsForEmployee(personaId),
    getTeamMembers(personaId),
    listActivePerformanceReviewTemplates(),
  ]);

  const employeesWithoutOpenReview = managerTeam
    .map((m) => ({ id: m.id, name: m.name, avatar_url: m.avatar_url }))
    .filter(
      (m) =>
        !asManager.some(
          (r) =>
            r.employee.id === m.id &&
            r.status !== "completed" &&
            r.status !== "cancelled",
        ),
    );

  const allOwnOpen = asEmployee.filter(
    (r) => r.status !== "completed" && r.status !== "cancelled",
  );
  const allOwnCompleted = asEmployee.filter((r) => r.status === "completed");

  return (
    <div className="space-y-8">
      <PageTitle
        icon={ClipboardCheck}
        tone="amber"
        title="Functioneringsgesprekken"
        subtitle="Terugkijken en vooruitkijken, halfjaarlijks."
        action={
          employeesWithoutOpenReview.length > 0 ? (
            <StartPerformanceReviewDialog
              teamMembers={employeesWithoutOpenReview}
              templates={prTemplates}
              triggerLabel="Gesprek starten"
              triggerVariant="default"
            />
          ) : null
        }
      />

      {asEmployee.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-[12.5px] font-medium font-heading text-muted-foreground">
            Met jou als medewerker
          </h2>

          {allOwnOpen.length > 0 ? (
            <div className="space-y-3">
              {allOwnOpen.map((r) => (
                <OwnReviewCard key={r.id} review={r} />
              ))}
            </div>
          ) : null}

          {allOwnCompleted.length > 0 ? (
            <ul className="space-y-2">
              {allOwnCompleted.map((r) => (
                <CompletedRow key={r.id} review={r} role="employee" />
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <PerformanceReviewTimeline
        upcoming={asManager.filter(
          (r) => r.status !== "completed" && r.status !== "cancelled",
        )}
        recent={asManager.filter((r) => r.status === "completed")}
      />
    </div>
  );
}

function OwnReviewCard({ review }: { review: PerformanceReviewListItem }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {review.template_name ?? "Functioneringsgesprek"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PersonAvatar
            id={review.manager.id}
            name={review.manager.name}
            avatarUrl={review.manager.avatar_url}
            size="sm"
          />
          <div className="space-y-0.5">
            <p className="text-[13px] text-foreground/85">
              Met {review.manager.name}
            </p>
            <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <CalendarClock className="h-3 w-3" />
              Cyclus gestart op {formatDate(review.cycle_started_at)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!review.has_employee_input ? (
            <Link
              href={`/functioneringsgesprek/${review.id}/voorbereiden`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Zelfreflectie invullen
              <ArrowRight className="h-3.5 w-3.5" data-icon="inline-end" />
            </Link>
          ) : null}
          <Link
            href={`/functioneringsgesprek/${review.id}`}
            className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
          >
            Bekijk
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}


function CompletedRow({
  review,
  role,
}: {
  review: PerformanceReviewListItem;
  role: "employee" | "manager";
}) {
  const counterpart = role === "employee" ? review.manager : review.employee;
  return (
    <li>
      <Link
        href={`/functioneringsgesprek/${review.id}`}
        className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-sm transition-colors hover:bg-accent"
      >
        <CircleCheck className="h-4 w-4 text-emerald-500" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium">
            {review.template_name ?? "Functioneringsgesprek"} met{" "}
            {counterpart.name}
          </p>
          <p className="text-[12px] text-muted-foreground">
            Afgerond op{" "}
            {review.completed_at
              ? formatDate(review.completed_at)
              : formatDate(review.cycle_started_at)}
          </p>
        </div>
      </Link>
    </li>
  );
}

function EmployeeHistoryTable({
  items,
}: {
  items: PerformanceReviewListItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Nog geen afgeronde functioneringsgesprekken.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-6 py-3 text-left text-[12.5px] font-medium font-heading text-muted-foreground">
              Datum
            </th>
            <th className="px-4 py-3 text-left text-[12.5px] font-medium font-heading text-muted-foreground">
              Onderwerp
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-left text-[12.5px] font-medium font-heading text-muted-foreground">
              Status
            </th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr
              key={item.id}
              className={cn(
                "group border-b border-border/50 last:border-b-0 transition-colors hover:bg-accent/40",
                i % 2 === 1 && "bg-muted/30",
              )}
            >
              <td className="px-6 py-3.5 text-[13px] text-muted-foreground whitespace-nowrap">
                {formatDate(item.completed_at ?? item.cycle_started_at)}
              </td>
              <td className="px-4 py-3.5">
                <span className="text-[13.5px] font-medium">
                  {item.template_name ?? "Functioneringsgesprek"}
                </span>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground max-w-[320px]">
                  Met {item.manager.name}
                </p>
              </td>
              <td className="hidden sm:table-cell px-4 py-3.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CircleCheck className="h-3 w-3" strokeWidth={2} />
                  Afgerond
                </span>
              </td>
              <td className="px-6 py-3.5 text-right">
                <Link
                  href={`/functioneringsgesprek/${item.id}`}
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
    </div>
  );
}
