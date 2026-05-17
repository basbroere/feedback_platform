"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  CheckSquare,
  ClipboardCheck,
  LayoutGrid,
  LogOut,
  MessageCircle,
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

type NavSection = {
  title: string;
  items: NavItem[];
};

function navSections(role: Persona["role"]): NavSection[] {
  const home: NavItem = { href: "/dashboard", label: "Home", icon: LayoutGrid };
  const team: NavItem = { href: "/team", label: "Team", icon: UsersRound };
  const actiepunten: NavItem = {
    href: "/actiepunten",
    label: "Actiepunten",
    icon: CheckSquare,
  };
  const feedback: NavItem = {
    href: "/feedback",
    label: "Feedback",
    icon: MessageCircle,
  };
  const eenOpEen: NavItem = {
    href: "/een-op-een",
    label: "1-op-1",
    icon: MessageSquareText,
  };
  const functioneringsgesprek: NavItem = {
    href: "/functioneringsgesprek",
    label: "Functionering",
    icon: ClipboardCheck,
  };

  if (role === "hr") {
    return [{ title: "Menu", items: [home, team] }];
  }
  if (role === "manager") {
    return [
      { title: "Menu", items: [home, actiepunten, feedback, team] },
      { title: "Gesprekken", items: [eenOpEen, functioneringsgesprek] },
    ];
  }
  return [
    { title: "Menu", items: [home, actiepunten, feedback] },
    { title: "Gesprekken", items: [eenOpEen, functioneringsgesprek] },
  ];
}

export function AppSidebar({
  persona,
  teams,
}: {
  persona: Persona;
  teams: TeamWithMembers[];
}) {
  const pathname = usePathname();
  const sections = navSections(persona.role);
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

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href || pathname?.startsWith(`${item.href}/`);
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
                          active
                            ? "text-primary"
                            : "text-foreground/50 group-hover:text-foreground/75",
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
        ))}
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
