import { redirect } from "next/navigation";
import {
  getCurrentPersona,
  getCurrentPersonaId,
  listTeamsWithMembers,
} from "@/lib/persona/server";
import { PersonaPicker } from "@/components/persona/persona-picker";
import { Logo } from "@/components/app/logo";

export const dynamic = "force-dynamic";

export default async function StartScreen({
  searchParams,
}: {
  searchParams: Promise<{ wissel?: string }>;
}) {
  const params = await searchParams;
  const currentId = await getCurrentPersonaId();
  if (currentId && params.wissel !== "1") {
    const persona = await getCurrentPersona();
    if (persona) {
      redirect("/dashboard");
    }
    // Cookie wijst naar een niet-bestaande user. We tonen de picker; de
    // volgende selectPersona-action overschrijft de oude cookie.
  }

  const teams = await listTeamsWithMembers();

  return (
    <main className="flex min-h-svh flex-col bg-background">
      <div className="mx-auto w-full max-w-5xl px-6 pt-8 pb-10">
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <Logo size="sm" />
          <h1 className="text-[20px] font-semibold tracking-tight md:text-[22px]">
            Kies een persona
          </h1>
        </header>

        <PersonaPicker teams={teams} currentId={currentId} />
      </div>
    </main>
  );
}
