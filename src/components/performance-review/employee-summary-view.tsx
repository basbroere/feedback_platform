import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleCheck,
  Clock3,
  MessageSquareText,
  Sparkles,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type {
  ActionItem,
  TemplateQuestion,
} from "@/lib/one-on-ones/types";
import type {
  CycleInputs,
  DossierActionItem,
  PerformanceReviewForEmployee,
} from "@/lib/performance-reviews/types";
import type { FeedbackWithSource } from "@/lib/feedback/types";
import { ActionItemList } from "@/components/one-on-one/action-item-list";
import { MemberFeedbackTable } from "@/components/team/member-feedback-table";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";
import { TemplateAnswers } from "./template-answers";

export function PerformanceReviewEmployeeSummaryView({
  review,
  selfQuestions,
  peerQuestions,
  managerQuestions,
  actionItems,
  cycleInputs,
  dossierActionItems,
  dossierFeedback,
  windowStart,
  windowEnd,
}: {
  review: PerformanceReviewForEmployee;
  selfQuestions: TemplateQuestion[];
  peerQuestions: TemplateQuestion[];
  managerQuestions: TemplateQuestion[];
  actionItems: ActionItem[];
  cycleInputs: CycleInputs;
  dossierActionItems: DossierActionItem[];
  dossierFeedback: FeedbackWithSource[];
  windowStart: string;
  windowEnd: string;
}) {
  const isCompleted = Boolean(review.completed_at);
  const hasSelfEval = Object.values(review.employee_self_evaluation).some(
    (v) => typeof v === "string" && v.trim().length > 0,
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <PersonAvatar
            id={review.manager.id}
            name={review.manager.name}
            avatarUrl={review.manager.avatar_url}
            size="lg"
          />
          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-tight">
              360 functioneringsgesprek met {review.manager.name}
            </h1>
            <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              {isCompleted ? (
                <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <CalendarClock className="h-3.5 w-3.5 text-blue-500" />
              )}
              Cyclus gestart op {formatDate(review.cycle_started_at)}
              {review.template?.name ? ` · ${review.template.name}` : ""}
              {isCompleted ? " · afgerond" : " · in voorbereiding"}
            </p>
          </div>
        </div>
      </header>

      <CycleStatusGridForEmployee
        managerName={review.manager.name}
        hasSelfEval={hasSelfEval}
        cycleInputs={cycleInputs}
      />

      {!isCompleted ? (
        <Card>
          <CardHeader>
            <CardTitle>Voorbereiden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Twee stappen aan jouw kant: kies een collega voor 360 feedback en
              vul je eigen zelfreflectie in. Vragen zijn suggesties.
            </p>
            <Link
              href={`/functioneringsgesprek/${review.id}/voorbereiden`}
              className={cn(buttonVariants({ size: "sm" }), "w-fit")}
            >
              {hasSelfEval || cycleInputs.peer
                ? "Voorbereiding bijwerken"
                : "Start voorbereiding"}
              <ArrowRight className="h-3.5 w-3.5" data-icon="inline-end" />
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {isCompleted && review.shared_summary ? (
        <Card>
          <CardHeader>
            <CardTitle>Gedeelde samenvatting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed">
              {review.shared_summary}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {isCompleted && cycleInputs.peer && cycleInputs.peer.status === "submitted" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Peer-feedback van {cycleInputs.peer.author.name}
              {cycleInputs.peer.is_cross_team ? (
                <span className="ml-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                  cross-team
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateAnswers
              questions={peerQuestions}
              answers={cycleInputs.peer.responses}
            />
          </CardContent>
        </Card>
      ) : null}

      {isCompleted && cycleInputs.manager && cycleInputs.manager.status === "submitted" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-blue-500" />
              Feedback van {cycleInputs.manager.author.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateAnswers
              questions={managerQuestions}
              answers={cycleInputs.manager.responses}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Actiepunten</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionItemList
            items={actionItems}
            emptyLabel="Geen actiepunten uit dit gesprek."
            readOnly={false}
          />
        </CardContent>
      </Card>

      {hasSelfEval ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-blue-500" />
              Je zelfreflectie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateAnswers
              questions={selfQuestions}
              answers={review.employee_self_evaluation}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <CardTitle className="flex items-center gap-1.5">
              Dossier afgelopen half jaar
              <InfoTooltip label="Uitleg dossier">
                We tonen alles uit de zes maanden voor de start van deze cyclus,
                zodat jij en je manager met dezelfde context het gesprek
                ingaan.
              </InfoTooltip>
            </CardTitle>
            <span className="text-[12px] text-muted-foreground">
              {formatDate(windowStart)} tot {formatDate(windowEnd)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <h3 className="font-heading text-[14px] font-medium text-muted-foreground">
              Voltooide actiepunten ({dossierActionItems.length})
            </h3>
            {dossierActionItems.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
                Geen voltooide actiepunten in deze periode.
              </p>
            ) : (
              <ul className="space-y-2">
                {dossierActionItems.map((it) => (
                  <li
                    key={it.id}
                    className="rounded-xl bg-card px-4 py-3 shadow-sm"
                  >
                    <p className="text-[14px] leading-snug">{it.description}</p>
                    {it.notes ? (
                      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-snug text-muted-foreground">
                        {it.notes}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                      {it.source_href ? (
                        <Link
                          href={it.source_href}
                          className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/75 transition-colors hover:bg-muted/80"
                        >
                          <MessageSquareText className="h-3 w-3" strokeWidth={1.75} />
                          {it.source_label}
                          {it.source_date ? ` · ${formatDate(it.source_date)}` : ""}
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/75">
                          {it.source_label}
                        </span>
                      )}
                      {it.completed_at ? (
                        <span>Afgerond op {formatDate(it.completed_at)}</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="font-heading text-[14px] font-medium text-muted-foreground">
              Ontvangen feedback ({dossierFeedback.length})
            </h3>
            {dossierFeedback.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
                Geen ontvangen feedback in deze periode.
              </p>
            ) : (
              <MemberFeedbackTable items={dossierFeedback} hideToolbar />
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function CycleStatusGridForEmployee({
  managerName,
  hasSelfEval,
  cycleInputs,
}: {
  managerName: string;
  hasSelfEval: boolean;
  cycleInputs: CycleInputs;
}) {
  const managerFirst = managerName.split(" ")[0];
  const peer = cycleInputs.peer;
  const manager = cycleInputs.manager;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <StatusCard
        icon={<UserCircle2 className="h-4 w-4" />}
        title="Jouw zelfreflectie"
        status={hasSelfEval ? "done" : "waiting"}
        line={hasSelfEval ? "Ingevuld" : "Nog leeg"}
      />
      <StatusCard
        icon={<Users className="h-4 w-4" />}
        title="Peer-feedback"
        info="De inhoud van de peer-feedback lees je samen met de manager-feedback, nadat het gesprek is afgerond. Zo blijft je eigen zelfreflectie bias-vrij."
        status={
          peer
            ? peer.status === "submitted"
              ? "done"
              : peer.status === "declined"
                ? "skipped"
                : "waiting"
            : "empty"
        }
        line={
          peer
            ? peer.status === "submitted"
              ? `${peer.author.name} heeft gegeven`
              : peer.status === "declined"
                ? `${peer.author.name} ziet af`
                : `Wacht op ${peer.author.name}`
            : "Kies nog een collega"
        }
      />
      <StatusCard
        icon={<MessageSquareText className="h-4 w-4" />}
        title="Feedback van je manager"
        info={`Wat ${managerFirst} schrijft lees je samen met de peer-feedback nadat het gesprek is afgerond.`}
        status={
          manager && manager.status === "submitted" ? "done" : "waiting"
        }
        line={
          manager && manager.status === "submitted"
            ? `${manager.author.name} heeft gegeven`
            : `Wacht op ${managerFirst}`
        }
      />
    </div>
  );
}

function StatusCard({
  icon,
  title,
  status,
  line,
  info,
}: {
  icon: React.ReactNode;
  title: string;
  status: "done" | "waiting" | "empty" | "skipped";
  line: string;
  info?: string;
}) {
  const palette = {
    done: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
    waiting: "border-amber-200 bg-amber-50/60 text-amber-700",
    empty: "border-border bg-card text-muted-foreground",
    skipped: "border-border bg-card text-muted-foreground",
  }[status];
  const dot = {
    done: <CheckCircle2 className="h-3.5 w-3.5" />,
    waiting: <Clock3 className="h-3.5 w-3.5" />,
    empty: <Sparkles className="h-3.5 w-3.5" />,
    skipped: <X className="h-3.5 w-3.5" />,
  }[status];
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 font-heading text-[13.5px] font-semibold text-muted-foreground">
          {icon}
          {title}
          {info ? (
            <InfoTooltip label={`Uitleg ${title}`}>{info}</InfoTooltip>
          ) : null}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            palette,
          )}
        >
          {dot}
          {status === "done"
            ? "klaar"
            : status === "waiting"
              ? "wacht"
              : status === "skipped"
                ? "afgezien"
                : "nog niet"}
        </span>
      </div>
      <p className="mt-2 text-[13.5px] text-foreground/85">{line}</p>
    </div>
  );
}
