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
  manager: "bg-primary/10 text-primary ring-primary/15",
  hr: "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900/60",
  employee: "bg-muted text-muted-foreground ring-border",
};

export function PersonaPicker({
  teams,
  currentId,
}: {
  teams: TeamWithMembers[];
  currentId: string | null;
}) {
  return (
    <div className="mt-12 space-y-10">
      {teams.map((team) => (
        <div key={team.id}>
          <div className="flex items-baseline justify-between border-b border-border pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {team.name}
            </h2>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {team.members.length} personen
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {team.members.map((m) => {
              const isCurrent = m.id === currentId;
              return (
                <form key={m.id} action={selectPersonaForm}>
                  <input type="hidden" name="userId" value={m.id} />
                  <button
                    type="submit"
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-left transition-all",
                      "hover:border-foreground/15 hover:bg-accent/40",
                      isCurrent && "border-primary/40 ring-2 ring-primary/10",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold",
                        avatarBgClass(m.id),
                      )}
                    >
                      {getInitials(m.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ring-1 ring-inset",
                            ROLE_TONE[m.role] ?? ROLE_TONE.employee,
                          )}
                        >
                          {ROLE_LABEL[m.role] ?? m.role}
                        </span>
                      </p>
                    </div>
                    {isCurrent ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/0 transition-opacity group-hover:text-muted-foreground">
                        kies
                      </span>
                    )}
                  </button>
                </form>
              );
            })}
          </div>
        </div>
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
