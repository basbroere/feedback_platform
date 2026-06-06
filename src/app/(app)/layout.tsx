import { listTeamsWithMembers, requirePersona } from "@/lib/persona/server";
import { AppSidebar } from "@/components/app/sidebar";
import { MobileBottomNav } from "@/components/app/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const persona = await requirePersona();
  const teams = await listTeamsWithMembers();

  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar persona={persona} teams={teams} />
      <main className="flex min-h-svh flex-1 flex-col">
        <div className="w-full px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+88px)] md:px-10 md:py-12 md:pb-12">
          {children}
        </div>
      </main>
      <MobileBottomNav persona={persona} teams={teams} />
    </div>
  );
}
