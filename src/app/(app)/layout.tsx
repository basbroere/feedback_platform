import { listTeamsWithMembers, requirePersona } from "@/lib/persona/server";
import { AppSidebar } from "@/components/app/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const persona = await requirePersona();
  const teams = await listTeamsWithMembers();

  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar persona={persona} teams={teams} />
      <main className="flex min-h-svh flex-1 flex-col">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-12 md:py-14">{children}</div>
      </main>
    </div>
  );
}
