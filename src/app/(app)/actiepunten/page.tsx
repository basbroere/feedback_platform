import { requirePersona } from "@/lib/persona/server";
import { getDossierForEmployee } from "@/lib/action-items/queries";
import { ActionItemsView } from "@/components/action-items/action-items-view";
import { ActionItemsHeader } from "@/components/action-items/action-items-header";

export default async function ActiepuntenPage() {
  const persona = await requirePersona();
  const dossier = await getDossierForEmployee(persona.id);

  return (
    <div className="space-y-8">
      <ActionItemsHeader
        openTotal={dossier.stats.openTotal}
        completedLast30Days={dossier.stats.completedLast30Days}
        openOver4Weeks={dossier.stats.openOver4Weeks}
      />

      <section>
        <ActionItemsView open={dossier.open} completed={dossier.completed} />
      </section>
    </div>
  );
}
