import Image from "next/image";
import { redirect } from "next/navigation";
import {
  getCurrentPersona,
  getCurrentPersonaId,
  listTeamsWithMembers,
} from "@/lib/persona/server";
import { PersonaPicker } from "@/components/persona/persona-picker";

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
      <header className="mx-auto w-full max-w-5xl px-6 pt-10 md:pt-14">
        <Image
          src="https://cdn.homerun.co/59203/logo-bambelo1630332176logo.png"
          alt="Bambelo"
          width={280}
          height={280}
          priority
          unoptimized
          className="h-8 w-auto object-contain"
        />
      </header>

      <section className="mx-auto w-full max-w-5xl flex-1 px-6 pb-20 pt-14">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Demo-modus
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            Kies een persona en kijk rond.
          </h1>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Geen administratielast, geen harde deadlines. Wel een rustige rode draad door je
            1-op-1&apos;s, functioneringsgesprekken en beoordelingen.
          </p>
        </div>

        <PersonaPicker teams={teams} currentId={currentId} />
      </section>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-8 text-[11px] text-muted-foreground">
        Bambelo, 2026, scriptie-demo
      </footer>
    </main>
  );
}
