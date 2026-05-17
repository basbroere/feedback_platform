import { Check } from "lucide-react";
import { selectPersona } from "@/lib/persona/actions";
import type { TeamWithMembers } from "@/lib/persona/server";
import { avatarBgClass, getInitials } from "@/lib/persona/initials";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  hr: "HR",
  manager: "Manager",
  employee: "Medewerker",
};

const ROLE_TONE: Record<string, string> = {
  manager: "bg-primary/10 text-primary",
  hr: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  employee: "bg-muted text-muted-foreground",
};

export function PersonaPicker({
  teams,
  currentId,
}: {
  teams: TeamWithMembers[];
  currentId: string | null;
}) {
  return (
    <div className="mt-7 space-y-5">
      {teams.map((team) => (
        <section key={team.id}>
          <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {team.name}
          </h2>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {team.members.map((m) => {
              const isCurrent = m.id === currentId;
              return (
                <form key={m.id} action={selectPersonaForm}>
                  <input type="hidden" name="userId" value={m.id} />
                  <button
                    type="submit"
                    className={cn(
                      "group flex w-full items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-2 text-left transition-colors",
                      "hover:border-foreground/15 hover:bg-accent/40",
                      isCurrent && "border-primary/40 ring-2 ring-primary/10",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11.5px] font-semibold",
                        avatarBgClass(m.id),
                      )}
                    >
                      {getInitials(m.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium leading-tight">
                        {m.name}
                      </p>
                      <span
                        className={cn(
                          "mt-0.5 inline-flex items-center rounded px-1 py-px text-[9.5px] font-semibold uppercase tracking-[0.1em]",
                          ROLE_TONE[m.role] ?? ROLE_TONE.employee,
                        )}
                      >
                        {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                    </div>
                    {isCurrent ? (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                    ) : null}
                  </button>
                </form>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

async function selectPersonaForm(formData: FormData) {
  "use server";
  const userId = formData.get("userId");
  if (typeof userId === "string" && userId.length > 0) {
    await selectPersona(userId);
  }
}
