import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  MessageCircle,
  MessageSquareText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DashboardData } from "./dashboard-view-switcher";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { UpcomingCard } from "@/components/team/upcoming-card";
import { MemberActionItemsSection } from "@/components/team/member-action-items-section";
import { MemberFeedbackTable } from "@/components/team/member-feedback-table";
import type { Tone } from "@/lib/ui/tone";
import {
  formatDate,
  formatDateTime,
  formatRelativeWeeks,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type UpcomingItem = {
  key: string;
  href: string;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  meta: string;
  caption: string;
  cta: string;
};

function buildUpcoming(data: DashboardData): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  const isManager = data.persona.role === "manager";

  if (isManager) {
    const nextOneOnOne = data.managerUpcoming[0];
    if (nextOneOnOne) {
      items.push({
        key: `one-on-one-${nextOneOnOne.id}`,
        href: `/een-op-een/${nextOneOnOne.id}`,
        icon: MessageSquareText,
        tone: "blue",
        title: `1-op-1 met ${firstName(nextOneOnOne.employee.name)}`,
        meta: nextOneOnOne.scheduled_at
          ? formatDateTime(nextOneOnOne.scheduled_at)
          : "Nog niet ingepland",
        caption: nextOneOnOne.scheduled_at
          ? `Over ${formatRelativeWeeks(nextOneOnOne.scheduled_at)}`
          : "",
        cta: "Open gesprek",
      });
    }

    const nextReview = data.scheduledPerformanceReviews[0];
    if (nextReview) {
      items.push({
        key: `pr-${nextReview.id}`,
        href: `/functioneringsgesprek/${nextReview.id}`,
        icon: ClipboardCheck,
        tone: "amber",
        title: `Functioneringsgesprek met ${firstName(nextReview.employee.name)}`,
        meta: nextReview.scheduled_at
          ? formatDateTime(nextReview.scheduled_at)
          : `Gestart op ${formatDate(nextReview.cycle_started_at)}`,
        caption: nextReview.scheduled_at
          ? `Over ${formatRelativeWeeks(nextReview.scheduled_at)}`
          : "Cyclus loopt",
        cta: "Open cyclus",
      });
    }
  } else {
    if (data.upcoming) {
      items.push({
        key: `one-on-one-${data.upcoming.id}`,
        href: `/een-op-een/${data.upcoming.id}`,
        icon: MessageSquareText,
        tone: "blue",
        title: data.upcoming.subject || "1-op-1",
        meta: data.upcoming.scheduled_at
          ? formatDateTime(data.upcoming.scheduled_at)
          : "Datum nog niet bekend",
        caption: data.upcoming.scheduled_at
          ? `Over ${formatRelativeWeeks(data.upcoming.scheduled_at)}`
          : "",
        cta: "Open gesprek",
      });
    }

    const review = data.ownOpenPerformanceReview;
    if (review) {
      const caption = review.scheduled_at
        ? `Ingepland · ${formatRelativeWeeks(review.scheduled_at)}`
        : review.has_employee_input
          ? "Zelfevaluatie ingevuld"
          : "Zelfevaluatie nog leeg";
      items.push({
        key: `pr-${review.id}`,
        href: review.has_employee_input
          ? `/functioneringsgesprek/${review.id}`
          : `/functioneringsgesprek/${review.id}/voorbereiden`,
        icon: ClipboardCheck,
        tone: "amber",
        title: review.template_name ?? "Functioneringsgesprek",
        meta: `Met ${review.manager.name}`,
        caption,
        cta: review.has_employee_input ? "Open cyclus" : "Voorbereiden",
      });
    }
  }

  return items;
}

export function LayoutC({ data }: { data: DashboardData }) {
  const { persona, dossier, feedbackRequests, feedback } = data;
  const greeting = greetingFor(new Date());
  const first = firstName(persona.name);

  const upcoming = buildUpcoming(data);
  const isSingleUpcoming = upcoming.length === 1;

  const peerRequests = feedbackRequests.slice(0, 3);
  const remainingRequests = Math.max(0, feedbackRequests.length - peerRequests.length);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-[28px] font-semibold leading-tight tracking-tight md:text-[30px]">
          {greeting} {first}
        </h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {data.subtitle}
        </p>
      </header>

      {upcoming.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[15px] font-semibold tracking-tight">
            Opkomend
          </h2>
          <div
            className={cn(
              "grid gap-3",
              isSingleUpcoming ? "grid-cols-1" : "md:grid-cols-2",
            )}
          >
            {upcoming.map((item) => (
              <UpcomingCard
                key={item.key}
                href={item.href}
                icon={item.icon}
                tone={item.tone}
                title={item.title}
                meta={item.meta}
                caption={item.caption}
                cta={item.cta}
              />
            ))}
          </div>
        </section>
      ) : null}

      {peerRequests.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Aan jou gevraagd
            </h2>
            {remainingRequests > 0 ? (
              <Link
                href="/feedback"
                className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Bekijk alles
              </Link>
            ) : null}
          </div>
          <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {peerRequests.map((req) => (
              <PeerRequestRow key={req.feedback_id} request={req} />
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
        <section className="min-w-0 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Recente feedback
            </h2>
            {feedback.length > 4 ? (
              <Link
                href="/feedback"
                className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Alles bekijken
              </Link>
            ) : null}
          </div>
          <MemberFeedbackTable items={feedback.slice(0, 4)} hideToolbar />
        </section>

        <aside className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Actiepunten
            </h2>
            <Link
              href="/actiepunten"
              className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Alles bekijken
            </Link>
          </div>
          <MemberActionItemsSection
            open={dossier.open}
            completed={dossier.completed}
            hideTabs
          />
        </aside>
      </div>
    </div>
  );
}

function PeerRequestRow({
  request,
}: {
  request: DashboardData["feedbackRequests"][number];
}) {
  return (
    <li className="border-b border-border/60 last:border-b-0">
      <Link
        href={`/feedback-verzoek/${request.feedback_id}`}
        className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/30"
      >
        <PersonAvatar
          id={request.requester.id}
          name={request.requester.name}
          avatarUrl={request.requester.avatar_url}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium leading-tight">
            <span className="font-semibold">{request.requester.name}</span>
            <span className="text-muted-foreground"> wil je feedback</span>
          </p>
          <p className="truncate text-[12px] text-muted-foreground">
            {request.template?.name ?? "Peer feedback"}
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            {formatRelativeWeeks(request.requested_at ?? request.created_at)}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-foreground/60 transition-colors group-hover:text-primary">
          <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
          Invullen
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </li>
  );
}

function firstName(full: string): string {
  return full.split(" ")[0] ?? full;
}

function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 6) return "Vroege vogel";
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}
