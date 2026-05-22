import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckSquare,
  ClipboardCheck,
  MessageCircle,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { OneOnOneListItem } from "@/lib/one-on-ones/types";
import type { ManagerUpcomingOneOnOne } from "@/lib/one-on-ones/queries";
import type { OpenFeedbackRequestForPeer } from "@/lib/feedback/types";
import type { DossierItem } from "@/lib/action-items/queries";
import type { PerformanceReviewListItem } from "@/lib/performance-reviews/types";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { formatDate, formatDateTime, formatRelativeWeeks } from "@/lib/format";
import { TONE_BG, type Tone } from "@/lib/ui/tone";
import { cn } from "@/lib/utils";

export function OnYourPlate({
  upcoming,
  managerUpcoming,
  feedbackRequests,
  openActionItems,
  ownOpenPerformanceReview,
  managerOpenPerformanceReviews,
}: {
  upcoming: OneOnOneListItem | null;
  managerUpcoming: ManagerUpcomingOneOnOne[];
  feedbackRequests: OpenFeedbackRequestForPeer[];
  openActionItems: DossierItem[];
  ownOpenPerformanceReview: PerformanceReviewListItem | null;
  managerOpenPerformanceReviews: PerformanceReviewListItem[];
}) {
  const ownPrToShow =
    ownOpenPerformanceReview && !ownOpenPerformanceReview.has_employee_input
      ? ownOpenPerformanceReview
      : null;
  const hasAny =
    upcoming ||
    managerUpcoming.length > 0 ||
    feedbackRequests.length > 0 ||
    openActionItems.length > 0 ||
    ownPrToShow ||
    managerOpenPerformanceReviews.length > 0;

  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Op je bord
      </h2>

      {!hasAny ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Niks open. Geniet ervan.
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {ownPrToShow ? <OwnPerformanceReviewRow review={ownPrToShow} /> : null}
          {managerOpenPerformanceReviews.map((r) => (
            <ManagerPerformanceReviewRow key={r.id} review={r} />
          ))}
          {upcoming ? <UpcomingRow upcoming={upcoming} /> : null}
          {managerUpcoming.map((m) => (
            <ManagerUpcomingRow key={m.id} item={m} />
          ))}
          {feedbackRequests.map((req) => (
            <FeedbackRequestRow key={req.feedback_id} req={req} />
          ))}
          {openActionItems.map((it) => (
            <ActionItemRow key={it.id} item={it} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Row({
  icon: Icon,
  tone,
  title,
  meta,
  cta,
  href,
  leading,
  trailing,
}: {
  icon: typeof CalendarClock;
  tone: Tone;
  title: React.ReactNode;
  meta: React.ReactNode;
  cta: string;
  href: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        href={href}
        className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/40"
      >
        {leading ?? (
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", TONE_BG[tone])}>
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
        )}
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-[14px] font-medium leading-tight">{title}</p>
          <p className="truncate text-[12px] text-muted-foreground">{meta}</p>
        </div>
        {trailing}
        <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-foreground/65 group-hover:text-primary">
          {cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </li>
  );
}

function OwnPerformanceReviewRow({
  review,
}: {
  review: PerformanceReviewListItem;
}) {
  return (
    <Row
      icon={ClipboardCheck}
      tone="amber"
      title={review.template_name ?? "Functioneringsgesprek"}
      meta={`Met ${review.manager.name} · sinds ${formatDate(review.cycle_started_at)}`}
      cta="Zelfevaluatie"
      href={`/functioneringsgesprek/${review.id}/voorbereiden`}
    />
  );
}

function ManagerPerformanceReviewRow({
  review,
}: {
  review: PerformanceReviewListItem;
}) {
  const inputStatus = review.has_employee_input
    ? "zelfevaluatie binnen"
    : "wacht op zelfevaluatie";
  return (
    <Row
      icon={ClipboardCheck}
      tone="amber"
      leading={
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
          <PersonAvatar
            id={review.employee.id}
            name={review.employee.name}
            avatarUrl={review.employee.avatar_url}
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-amber-100 text-amber-600 dark:border-card dark:bg-amber-950/60 dark:text-amber-200">
            <ClipboardCheck className="h-2.5 w-2.5" strokeWidth={2} />
          </span>
        </span>
      }
      title={
        <span>
          Functioneringsgesprek met{" "}
          <span className="font-semibold">{review.employee.name}</span>
        </span>
      }
      meta={inputStatus}
      cta="Openen"
      href={`/functioneringsgesprek/${review.id}`}
    />
  );
}

function UpcomingRow({ upcoming }: { upcoming: OneOnOneListItem }) {
  return (
    <Row
      icon={CalendarClock}
      tone="blue"
      title={upcoming.subject || "1-op-1"}
      meta={formatDateTime(upcoming.scheduled_at)}
      cta="Voorbereiden"
      href={`/een-op-een/${upcoming.id}/voorbereiden`}
    />
  );
}

function ManagerUpcomingRow({ item }: { item: ManagerUpcomingOneOnOne }) {
  const subjectTrailing =
    item.subject && item.subject !== "1-op-1" ? ` · ${item.subject}` : "";
  return (
    <Row
      icon={UsersRound}
      tone="violet"
      leading={
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
          <PersonAvatar
            id={item.employee.id}
            name={item.employee.name}
            avatarUrl={item.employee.avatar_url}
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-violet-100 text-violet-600 dark:border-card dark:bg-violet-950/60 dark:text-violet-200">
            <UsersRound className="h-2.5 w-2.5" strokeWidth={2} />
          </span>
        </span>
      }
      title={
        <span>
          1-op-1 met{" "}
          <span className="font-semibold">{item.employee.name}</span>
        </span>
      }
      meta={`${formatDateTime(item.scheduled_at)}${subjectTrailing}`}
      cta="Openen"
      href={`/een-op-een/${item.id}`}
    />
  );
}

function FeedbackRequestRow({ req }: { req: OpenFeedbackRequestForPeer }) {
  return (
    <Row
      icon={MessageCircle}
      tone="primary"
      title={`Feedback voor ${req.requester.name}`}
      meta={`${req.template?.name ?? "Feedback-aanvraag"} · ${formatRelativeWeeks(
        req.requested_at ?? req.created_at,
      )}`}
      cta="Invullen"
      href={`/feedback-verzoek/${req.feedback_id}`}
      trailing={
        <div className="hidden items-center gap-2 sm:flex">
          <PersonAvatar
            id={req.requester.id}
            name={req.requester.name}
            avatarUrl={req.requester.avatar_url}
            size="sm"
          />
          {req.is_cross_team ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-medium text-primary">
              <Sparkles className="h-3 w-3" strokeWidth={1.75} />
              Cross-team
            </span>
          ) : null}
        </div>
      }
    />
  );
}

function ActionItemRow({ item }: { item: DossierItem }) {
  const meta = `Open · ${formatRelativeWeeks(item.created_at)}`;
  return (
    <Row
      icon={CheckSquare}
      tone="emerald"
      title={item.description}
      meta={meta}
      cta="Bekijken"
      href="/actiepunten"
    />
  );
}
