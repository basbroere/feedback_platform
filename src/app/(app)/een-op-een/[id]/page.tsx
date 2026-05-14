import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import {
  getActionItemsBySource,
  getActiveActionItemsForEmployeeWithManager,
  getOneOnOneForEmployee,
  getOneOnOneForManager,
} from "@/lib/one-on-ones/queries";
import { getTemplateById } from "@/lib/one-on-ones/template";
import { MeetingView } from "@/components/one-on-one/meeting-view";
import { EmployeeSummaryView } from "@/components/one-on-one/employee-summary-view";

export default async function OneOnOneDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const persona = await requirePersona();

  // Eerst proberen als manager. Dan als medewerker.
  const managerView = await getOneOnOneForManager(id, persona.id);
  if (managerView) {
    const template = managerView.template_id
      ? await getTemplateById(managerView.template_id)
      : null;
    const questions = managerView.template?.questions ?? template?.questions ?? [];

    const itemsFromThis = await getActionItemsBySource("one_on_one", managerView.id);
    const activeFromOtherSessions = await getActiveActionItemsForEmployeeWithManager(
      managerView.employee_id,
      managerView.manager_id,
    );
    // Vorige = open + recent voltooid uit eerdere 1-op-1's (niet deze).
    const previous = activeFromOtherSessions.filter(
      (it) => it.source_id !== managerView.id,
    );
    const newFromThis = itemsFromThis;

    return (
      <div className="space-y-6">
        <Link
          href={`/team/${managerView.employee.id}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Terug
        </Link>
        <MeetingView
          oneOnOne={managerView}
          questions={questions}
          previousActionItems={previous}
          newActionItems={newFromThis}
        />
      </div>
    );
  }

  const employeeView = await getOneOnOneForEmployee(id, persona.id);
  if (!employeeView) notFound();

  const template = employeeView.template_id
    ? await getTemplateById(employeeView.template_id)
    : null;
  const questions = employeeView.template?.questions ?? template?.questions ?? [];
  const actionItems = await getActionItemsBySource("one_on_one", employeeView.id);

  return (
    <div className="space-y-6">
      <Link
        href="/een-op-een"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Terug
      </Link>
      <EmployeeSummaryView
        oneOnOne={employeeView}
        questions={questions}
        actionItems={actionItems}
      />
    </div>
  );
}
