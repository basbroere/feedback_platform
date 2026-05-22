"use client";

import { ChevronsUpDown, LogOut, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { clearPersona, selectPersona } from "@/lib/persona/actions";
import { avatarBgClass, getInitials } from "@/lib/persona/initials";
import type { Persona } from "@/lib/persona/types";
import type { TeamWithMembers } from "@/lib/persona/server";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_LABEL: Record<Persona["role"], string> = {
  hr: "HR",
  manager: "Manager",
  team_lead: "Team-lead",
  employee: "Medewerker",
};

export function PersonaSwitcher({
  current,
  teams,
}: {
  current: Persona;
  teams: TeamWithMembers[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border border-border bg-card px-2.5 py-2 text-left transition-colors",
          "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold",
            avatarBgClass(current.id),
          )}
        >
          {getInitials(current.name)}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13px] font-semibold">{current.name}</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {ROLE_LABEL[current.role]}
          </span>
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" sideOffset={8} className="w-72 p-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 pb-1 pt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
            Wissel persona
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <div className="max-h-80 overflow-y-auto pr-1">
          {teams.map((team) => (
            <DropdownMenuGroup key={team.id} className="mb-1.5">
              <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                {team.name}
              </DropdownMenuLabel>
              {team.members.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5",
                    m.id === current.id && "bg-accent",
                  )}
                  onClick={() =>
                    startTransition(async () => {
                      await selectPersona(m.id, "/dashboard");
                    })
                  }
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-semibold",
                      avatarBgClass(m.id),
                    )}
                  >
                    {getInitials(m.name)}
                  </span>
                  <span className="flex flex-1 flex-col text-sm leading-tight">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-[11px] text-muted-foreground">{ROLE_LABEL[m.role]}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          ))}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer rounded-lg"
          onClick={() => router.push("/?wissel=1")}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Volledig startscherm
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-muted-foreground"
          onClick={() =>
            startTransition(async () => {
              await clearPersona();
            })
          }
        >
          <LogOut className="mr-2 h-4 w-4" />
          Persona vergeten
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
