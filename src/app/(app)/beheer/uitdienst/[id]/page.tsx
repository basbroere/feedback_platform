import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Clock3 } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import { Badge } from "@/components/ui/badge";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { ReactivateUserButton } from "@/components/hr/reactivate-user-button";
import {
  DossierExpandable,
  type ExpandableActionItem,
  type ExpandableField,
} from "@/components/hr/dossier-expandable";
import { PeerFeedbackCard } from "@/components/hr/peer-feedback-card";
import {
  getOffboardingDossier,
  type DossierActionItem,
  type TemplateInfo,
} from "@/lib/hr/offboarding-queries";
import { formatDate } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/hr/roles";

const STATUS_LABEL: Record<string, string> = {
  draft: "Concept",
  scheduled: "Ingepland",
  collecting_input: "Input ophalen",
  ready_for_meeting: "Klaar voor gesprek",
  completed: "Afgerond",
  cancelled: "Geannuleerd",
};

const ACTION_STATUS_LABEL: Record<string, string> = {
  open: "Openstaand",
  completed: "Afgerond",
  expired: "Vervallen",
};

function buildAnswerFields(
  template: TemplateInfo | null,
  answers: Record<string, string | string[]>,
): ExpandableField[] {
  if (!template) {
    return Object.entries(answers).map(([id, value]) => ({
      label: id,
      value,
    }));
  }
  return template.questions.map((q) => ({
    label: q.label,
    value: answers[q.id] ?? null,
  }));
}

function relatedActionItemsFor(
  sourceType: "one_on_one" | "performance_review" | "evaluation",
  sourceId: string,
  items: DossierActionItem[],
): ExpandableActionItem[] {
  return items
    .filter((i) => i.source_type === sourceType && i.source_id === sourceId)
    .map((i) => ({
      id: i.id,
      description: i.description,
      status: i.status,
      target_date: i.target_date,
      completed_at: i.completed_at,
    }));
}

export default async function UitDienstDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const persona = await requirePersona();
  if (!persona.is_admin) redirect("/dashboard");

  const { id } = await params;
  const dossier = await getOffboardingDossier(id);
  if (!dossier) notFound();

  const { user, oneOnOnes, performanceReviews, evaluations, actionItems, peerFeedback } =
    dossier;

  const orphanActionItems = actionItems.filter((i) => {
    if (i.source_type === "personal") return true;
    if (i.source_type === "one_on_one") {
      return !oneOnOnes.some((o) => o.id === i.source_id);
    }
    if (i.source_type === "performance_review") {
      return !performanceReviews.some((p) => p.id === i.source_id);
    }
    return !evaluations.some((e) => e.id === i.source_id);
  });

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <Link
          href="/beheer/uitdienst"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Terug naar uit dienst
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <PersonAvatar
              id={user.id}
              name={user.name}
              avatarUrl={user.avatar_url}
              size="lg"
            />
            <div className="space-y-1">
              <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
                {user.name}
              </h1>
              <p className="text-[13.5px] text-muted-foreground">
                {ROLE_LABEL[user.role]}
                {user.team_name ? ` · ${user.team_name}` : ""}
                {" · "}uit dienst sinds {formatDate(user.left_at)}
              </p>
            </div>
          </div>

          <ReactivateUserButton userId={user.id} userName={user.name} />
        </div>
      </header>

      <DossierSection
        title="1-op-1's"
        empty="Geen 1-op-1's gevoerd"
        count={oneOnOnes.length}
      >
        {oneOnOnes.map((row) => {
          const stamp = row.completed_at ?? row.scheduled_at;
          return (
            <DossierExpandable
              key={row.id}
              title={row.subject || "1-op-1"}
              meta={[
                stamp ? formatDate(stamp) : "Geen datum",
                row.counterpart
                  ? `${row.counterpart_role === "manager" ? "Met" : "Voor"} ${row.counterpart.name}`
                  : null,
                row.completed_at ? null : "Niet afgerond",
              ]}
              sharedSummary={row.shared_summary}
              sections={[
                {
                  heading: "Voorbereiding medewerker",
                  fields: buildAnswerFields(row.template, row.employee_preparation),
                },
              ]}
              relatedActionItems={relatedActionItemsFor(
                "one_on_one",
                row.id,
                actionItems,
              )}
            />
          );
        })}
      </DossierSection>

      <DossierSection
        title="Functionerings- en beoordelingsgesprekken"
        empty="Geen functionerings- of beoordelingsgesprekken in deze periode"
        count={performanceReviews.length + evaluations.length}
      >
        {performanceReviews.map((row) => (
          <DossierExpandable
            key={`pr-${row.id}`}
            title="Functioneringsgesprek"
            badge={STATUS_LABEL[row.status] ?? row.status}
            badgeTone={
              row.status === "completed"
                ? "emerald"
                : row.status === "cancelled"
                  ? "muted"
                  : "amber"
            }
            meta={[
              `Cyclus ${formatDate(row.cycle_started_at)}`,
              row.completed_at ? `Afgerond ${formatDate(row.completed_at)}` : null,
              row.counterpart ? `Met ${row.counterpart.name}` : null,
            ]}
            sharedSummary={row.shared_summary}
            sections={[
              {
                heading: "Zelfevaluatie medewerker",
                fields: buildAnswerFields(
                  row.template,
                  row.employee_self_evaluation,
                ),
              },
            ]}
            relatedActionItems={relatedActionItemsFor(
              "performance_review",
              row.id,
              actionItems,
            )}
          />
        ))}
        {evaluations.map((row) => {
          const stamp = row.completed_at ?? row.scheduled_at;
          const assessmentFields: ExpandableField[] = Object.entries(
            row.manager_assessments,
          ).map(([key, value]) => {
            if (typeof value === "string") {
              return { label: key, value };
            }
            const rating = value?.rating ?? "";
            const notes = value?.notes ?? "";
            const combined = [rating, notes].filter(Boolean).join(" · ");
            return { label: key, value: combined };
          });
          return (
            <DossierExpandable
              key={`ev-${row.id}`}
              title="Beoordelingsgesprek"
              badge={row.completed_at ? "Afgerond" : "Niet afgerond"}
              badgeTone={row.completed_at ? "emerald" : "muted"}
              meta={[
                stamp ? formatDate(stamp) : null,
                row.counterpart ? `Met ${row.counterpart.name}` : null,
              ]}
              sharedSummary={row.shared_summary}
              sections={[
                {
                  heading: "Zelfreflectie medewerker",
                  fields: buildAnswerFields(
                    row.template,
                    row.employee_self_reflection,
                  ),
                },
                {
                  heading: "Beoordeling per punt",
                  fields: assessmentFields,
                },
              ]}
              relatedActionItems={relatedActionItemsFor(
                "evaluation",
                row.id,
                actionItems,
              )}
            />
          );
        })}
      </DossierSection>

      <DossierSection
        title="Actiepunten"
        empty="Geen actiepunten in het dossier"
        count={actionItems.length}
      >
        <p className="text-[12px] text-muted-foreground">
          Per gesprek zie je de bijbehorende actiepunten als je het gesprek
          uitklapt. Hieronder staan losse of niet gekoppelde actiepunten.
        </p>
        <div className="space-y-1.5">
          {(orphanActionItems.length > 0 ? orphanActionItems : actionItems).map(
            (item) => {
              const Icon =
                item.status === "completed"
                  ? CheckCircle2
                  : item.status === "expired"
                    ? Clock3
                    : Circle;
              const tone =
                item.status === "completed"
                  ? "text-emerald-600"
                  : item.status === "expired"
                    ? "text-muted-foreground"
                    : "text-amber-600";
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3"
                >
                  <Icon
                    className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`}
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[14px] leading-snug text-foreground">
                      {item.description}
                    </p>
                    <p className="text-[11.5px] text-muted-foreground">
                      {ACTION_STATUS_LABEL[item.status]} ·{" "}
                      {item.source_type === "one_on_one"
                        ? "Uit 1-op-1"
                        : item.source_type === "performance_review"
                          ? "Uit functioneringsgesprek"
                          : item.source_type === "evaluation"
                            ? "Uit beoordelingsgesprek"
                            : "Persoonlijk"}
                      {item.target_date
                        ? ` · richtdatum ${formatDate(item.target_date)}`
                        : ""}
                      {item.completed_at
                        ? ` · afgesloten ${formatDate(item.completed_at)}`
                        : ""}
                    </p>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </DossierSection>

      <DossierSection
        title="Ontvangen peer-feedback"
        empty="Geen peer-feedback ontvangen"
        count={peerFeedback.length}
      >
        {peerFeedback.map((row) => (
          <PeerFeedbackCard key={row.id} feedback={row} />
        ))}
      </DossierSection>
    </div>
  );
}

function DossierSection({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header className="flex items-center gap-2">
        <h2 className="text-[16px] font-semibold tracking-tight">{title}</h2>
        <Badge variant="outline" className="ml-1">
          {count}
        </Badge>
      </header>
      {count === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-5 py-4 text-[13px] text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}
