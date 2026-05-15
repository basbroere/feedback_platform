"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  ClipboardList,
  LayoutGrid,
  LogOut,
  MessageSquareText,
  Settings,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { clearPersona } from "@/lib/persona/actions";
import type { Persona } from "@/lib/persona/types";
import type { TeamWithMembers } from "@/lib/persona/server";
import { PersonaSwitcher } from "./persona-switcher";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

function navItems(role: Persona["role"]): NavItem[] {
  const home: NavItem = { href: "/dashboard", label: "Home", icon: LayoutGrid };
  const team: NavItem = { href: "/team", label: "Team", icon: UsersRound };
  const eenOpEen: NavItem = {
    href: "/een-op-een",
    label: "Mijn 1-op-1's",
    icon: MessageSquareText,
  };
  const dossier: NavItem = {
    href: "/dossier",
    label: "Dossier",
    icon: ClipboardList,
  };
  if (role === "hr") return [home, team];
  if (role === "manager") return [home, team, eenOpEen, dossier];
  return [home, eenOpEen, dossier];
}

export function AppSidebar({
  persona,
  teams,
}: {
  persona: Persona;
  teams: TeamWithMembers[];
}) {
  const pathname = usePathname();
  const items = navItems(persona.role);
  const [isPending, startTransition] = useTransition();

  return (
    <aside className="sticky top-0 hidden h-svh w-[244px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="px-5 pt-7 pb-8">
        <Link href="/dashboard" className="inline-flex items-center" aria-label="Bambelo">
          <Image
            src="https://cdn.homerun.co/59203/logo-bambelo1630332176logo.png"
            alt="Bambelo"
            width={240}
            height={240}
            priority
            unoptimized
            className="h-8 w-auto object-contain"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-4">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
          Menu
        </p>
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] font-medium transition-colors",
                    active
                      ? "bg-primary/8 text-primary"
                      : "text-foreground/65 hover:bg-sidebar-accent hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      active ? "text-primary" : "text-foreground/50 group-hover:text-foreground/75",
                    )}
                    strokeWidth={1.75}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-3 border-t border-sidebar-border/80 px-4 py-4">
        <PersonaSwitcher current={persona} teams={teams} />
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] font-medium text-foreground/40"
              title="Volgt later"
            >
              <Settings className="h-[18px] w-[18px] shrink-0 text-foreground/40" strokeWidth={1.75} />
              <span>Instellingen</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => startTransition(() => clearPersona())}
              disabled={isPending}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] font-medium text-destructive transition-colors hover:bg-destructive/8 disabled:opacity-60"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              <span>Verlaat persona</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
