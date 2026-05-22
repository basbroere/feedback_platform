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
import { getTeamMembers } from "@/lib/one-on-ones/queries";
import { StartPerformanceReviewDialog } from "@/components/performance-review/start-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PerformanceReviewListItem } from "@/lib/performance-reviews/types";

export default async function PerformanceReviewIndex() {
  const persona = await requirePersona();

  if (persona.role === "hr") {
    return (
      <div className="space-y-6">
        <PageTitle
          icon={ClipboardCheck}
          tone="amber"
          title="Functionering"
          subtitle="HR-aggregaties volgen later."
        />
      </div>
    );
  }

  const [asManager, asEmployee, managerTeam, prTemplates] = await Promise.all([
    listPerformanceReviewsForManager(persona.id),
    listPerformanceReviewsForEmployee(persona.id),
    persona.role === "manager"
      ? getTeamMembers(persona.id)
      : Promise.resolve([]),
    persona.role === "manager"
      ? listActivePerformanceReviewTemplates()
      : Promise.resolve([]),
  ]);

  const employeesWithoutOpenReview =
    persona.role === "manager"
      ? managerTeam
          .map((m) => ({ id: m.id, name: m.name, avatar_url: m.avatar_url }))
          .filter(
            (m) =>
              !asManager.some(
                (r) =>
                  r.employee.id === m.id &&
                  r.status !== "completed" &&
                  r.status !== "cancelled",
              ),
          )
      : [];

  const allOwnOpen = [...asEmployee].filter(
    (r) => r.status !== "completed" && r.status !== "cancelled",
  );
  const allOwnCompleted = [...asEmployee].filter(
    (r) => r.status === "completed",
  );

  return (
    <div className="space-y-8">
      <PageTitle
        icon={ClipboardCheck}
        tone="amber"
        title="Functionering"
        subtitle="Terugkijken en vooruitkijken, halfjaarlijks."
        action={
          persona.role === "manager" && employeesWithoutOpenReview.length > 0 ? (
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
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Met jou als medewerker
          </h2>

          {allOwnOpen.length > 0 ? (
            <div className="space-y-3">
              {allOwnOpen.map((r) => (
                <OwnReviewCard key={r.id} review={r} role="employee" />
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

      {persona.role === "manager" ? (
        <section className="space-y-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Met jou als manager
          </h2>
          {asManager.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Nog geen functioneringsgesprek-cyclus gestart. Open een
                teamlid via /team en klik op &ldquo;Functioneringsgesprek
                starten&rdquo;.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {asManager.map((r) => (
                <ManagerReviewCard key={r.id} review={r} />
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

function OwnReviewCard({
  review,
  role,
}: {
  review: PerformanceReviewListItem;
  role: "employee" | "manager";
}) {
  const counterpart = role === "employee" ? review.manager : review.employee;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-blue-500" />
          {review.template_name ?? "Functioneringsgesprek"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PersonAvatar
            id={counterpart.id}
            name={counterpart.name}
            avatarUrl={counterpart.avatar_url}
            size="sm"
          />
          <div className="space-y-0.5">
            <p className="text-[13px] text-foreground/85">
              Met {counterpart.name}
            </p>
            <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <CalendarClock className="h-3 w-3" />
              Cyclus gestart op {formatDate(review.cycle_started_at)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {role === "employee" && !review.has_employee_input ? (
            <Link
              href={`/functioneringsgesprek/${review.id}/voorbereiden`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Zelfevaluatie invullen
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

function ManagerReviewCard({ review }: { review: PerformanceReviewListItem }) {
  const isCompleted = review.status === "completed";
  return (
    <li className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <PersonAvatar
            id={review.employee.id}
            name={review.employee.name}
            avatarUrl={review.employee.avatar_url}
          />
          <div className="space-y-0.5">
            <p className="text-[14px] font-semibold leading-tight">
              {review.employee.name}
            </p>
            <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              {isCompleted ? (
                <CircleCheck className="h-3 w-3 text-emerald-500" />
              ) : (
                <CalendarClock className="h-3 w-3 text-blue-500" />
              )}
              {review.template_name ?? "Functioneringsgesprek"} · gestart{" "}
              {formatDate(review.cycle_started_at)}
              {isCompleted && review.completed_at
                ? ` · afgerond ${formatDate(review.completed_at)}`
                : ""}
            </p>
            {!isCompleted ? (
              <p className="text-[12px] text-muted-foreground">
                Zelfevaluatie:{" "}
                {review.has_employee_input ? "ingevuld" : "nog leeg"} · jouw
                voorbereiding:{" "}
                {review.has_manager_input ? "ingevuld" : "nog leeg"}
              </p>
            ) : null}
          </div>
        </div>
        <Link
          href={`/functioneringsgesprek/${review.id}`}
          className={cn(buttonVariants({ size: "sm" }))}
        >
          Open gesprek
        </Link>
      </div>
    </li>
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
        className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-accent"
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
