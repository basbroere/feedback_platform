import type { Persona } from "@/lib/persona/types";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";

export function DashboardGreeting({
  persona,
  subtitle,
}: {
  persona: Persona;
  subtitle?: string | null;
}) {
  const firstName = persona.name.split(" ")[0];
  return (
    <header className="flex items-center gap-4">
      <PersonAvatar
        id={persona.id}
        name={persona.name}
        avatarUrl={persona.avatar_url}
        size="lg"
      />
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight md:text-[32px]">
          Hi {firstName}
        </h1>
        {subtitle ? (
          <p className="truncate text-[14px] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
    </header>
  );
}
