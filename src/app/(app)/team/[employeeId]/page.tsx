import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveActionItemsForEmployeeWithManager,
  getTeamMembers,
  listOneOnOnesForPair,
} from "@/lib/one-on-ones/queries";
import { HistoryTable } from "@/components/one-on-one/history-table";
import { ActionItemList } from "@/components/one-on-one/action-item-list";
import { ScheduleDialog } from "@/components/one-on-one/schedule-dialog";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const persona = await requirePersona();
  if (persona.role === "employee") redirect("/dashboard");

  const members = await getTeamMembers(persona.id);
  const member = members.find((m) => m.id === employeeId);
  if (!member) {
    // Probeer fallback: misschien is het iemand uit een ander team.
    // Voor demo: simpel 404.
    const supabase = await createClient();
    const { data: lookup } = await supabase
      .from("users")
      .select("id, name, avatar_url")
      .eq("id", employeeId)
      .maybeSingle();
    if (!lookup) notFound();
    redirect("/team");
  }

  const [items, actionItems] = await Promise.all([
    listOneOnOnesForPair(persona.id, employeeId),
    getActiveActionItemsForEmployeeWithManager(employeeId, persona.id),
  ]);
  const openActionItems = actionItems.filter((i) => i.status === "open");

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/team"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Terug naar team
        </Link>
      </div>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <PersonAvatar
            id={member.id}
            name={member.name}
            avatarUrl={member.avatar_url}
            size="lg"
          />
          <div>
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
              {member.name}
            </h1>
            <p className="text-[14px] text-muted-foreground">
              1-op-1&apos;s tussen jullie
            </p>
          </div>
        </div>
        <ScheduleDialog
          employeeId={member.id}
          employeeName={member.name}
          triggerLabel="Nieuwe 1-op-1 inplannen"
          triggerVariant="default"
        />
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-3">
          <h2 className="text-[15px] font-semibold tracking-tight">
            1-op-1&apos;s
          </h2>
          <HistoryTable
            items={items}
            emptyLabel="Plan jullie eerste 1-op-1 in."
          />
        </section>

        <aside className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Open actiepunten
            </h2>
            {openActionItems.length > 0 ? (
              <span className="text-[12.5px] text-muted-foreground">
                {openActionItems.length}
              </span>
            ) : null}
          </div>
          <ActionItemList
            items={openActionItems}
            emptyLabel="Geen open actiepunten uit jullie 1-op-1's."
          />
        </aside>
      </div>
    </div>
  );
}
