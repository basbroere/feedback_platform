import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { ReactivateUserButton } from "@/components/hr/reactivate-user-button";
import { DossierConversationsTable } from "@/components/hr/dossier-conversations-table";
import { getOffboardingDossier } from "@/lib/hr/offboarding-queries";
import { formatDate } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/hr/roles";

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

  const { user, oneOnOnes, performanceReviews, evaluations } = dossier;

  return (
    <div className="space-y-8">
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

        <p className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
          Klik op een gesprek om de gedeelde samenvatting en voorbereiding in te
          zien. Privé-notities van managers blijven buiten beeld. Actiepunten en
          peer-feedback blijven tussen medewerker en manager en komen pas weer
          beschikbaar als de medewerker opnieuw geactiveerd wordt.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-[16px] font-semibold tracking-tight">
          Gespreksgeschiedenis
        </h2>
        <DossierConversationsTable
          oneOnOnes={oneOnOnes}
          performanceReviews={performanceReviews}
          evaluations={evaluations}
        />
      </section>
    </div>
  );
}
