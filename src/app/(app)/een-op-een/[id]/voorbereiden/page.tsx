import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import {
  getActiveActionItemsForEmployeeWithManager,
  getOneOnOneForEmployee,
} from "@/lib/one-on-ones/queries";
import { getTemplateById } from "@/lib/one-on-ones/template";
import { PreparationForm } from "@/components/one-on-one/preparation-form";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { formatDateTime } from "@/lib/format";

export default async function VoorbereidenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const persona = await requirePersona();

  const one = await getOneOnOneForEmployee(id, persona.id);
  if (!one) notFound();
  if (one.completed_at) redirect(`/een-op-een/${id}`);

  const [template, activeItems] = await Promise.all([
    one.template_id ? getTemplateById(one.template_id) : Promise.resolve(null),
    getActiveActionItemsForEmployeeWithManager(persona.id, one.manager_id),
  ]);
  // Beperk tot eerdere bronnen, niet deze 1-op-1 zelf.
  const previous = activeItems.filter((it) => it.source_id !== one.id);

  return (
    <div className="space-y-8">
      <Link
        href={`/een-op-een/${id}`}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Terug
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <PersonAvatar
          id={one.manager.id}
          name={one.manager.name}
          avatarUrl={one.manager.avatar_url}
          size="lg"
        />
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
            {one.subject}
          </h1>
          <p className="text-[14px] text-muted-foreground">
            Voorbereiden 1-op-1 met {one.manager.name} · {formatDateTime(one.scheduled_at)}
          </p>
        </div>
      </header>

      <PreparationForm
        oneOnOneId={one.id}
        template={template}
        initialAnswers={one.employee_preparation ?? {}}
        previousActionItems={previous}
        redirectTo={`/een-op-een/${id}`}
      />
    </div>
  );
}
