import { requirePersona } from "@/lib/persona/server";
import { getDossierForEmployee } from "@/lib/action-items/queries";
import { StatsCards } from "@/components/dossier/stats-cards";
import { DossierView } from "@/components/dossier/dossier-view";

export default async function DossierPage() {
  const persona = await requirePersona();
  const dossier = await getDossierForEmployee(persona.id);

  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight md:text-[32px]">
          Dossier
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Alles wat je hebt opgepakt en nog oppakt, op één plek. De afgeronde
          punten van het afgelopen jaar zitten erbij.
        </p>
      </header>

      <StatsCards stats={dossier.stats} />

      <section>
        <DossierView open={dossier.open} completed={dossier.completed} />
      </section>
    </div>
  );
}
