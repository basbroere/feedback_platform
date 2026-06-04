"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CheckSquare,
  ClipboardCheck,
  LayoutGrid,
  MessageCircle,
  MessageSquareText,
  ShieldCheck,
  Sliders,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Persona } from "@/lib/persona/types";
import type { TeamWithMembers } from "@/lib/persona/server";
import { PersonaSwitcher } from "./persona-switcher";
import { TONE_BG, type Tone } from "@/lib/ui/tone";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

function navSections(persona: Persona): NavSection[] {
  const home: NavItem = { href: "/dashboard", label: "Home", icon: LayoutGrid, tone: "primary" };
  const team: NavItem = { href: "/team", label: "Team", icon: UsersRound, tone: "violet" };
  const actiepunten: NavItem = { href: "/actiepunten", label: "Actiepunten", icon: CheckSquare, tone: "emerald" };
  const feedback: NavItem = { href: "/feedback", label: "Feedback", icon: MessageCircle, tone: "primary" };
  const kennisbank: NavItem = { href: "/kennisbank", label: "Kennisbank", icon: BookOpen, tone: "sky" };
  const eenOpEen: NavItem = { href: "/een-op-een", label: "1-op-1", icon: MessageSquareText, tone: "blue" };
  const functioneringsgesprek: NavItem = { href: "/functioneringsgesprek", label: "Functionering", icon: ClipboardCheck, tone: "amber" };
  const templates: NavItem = { href: "/templates", label: "Templates", icon: Sliders, tone: "sky" };
  const beheer: NavItem = { href: "/beheer", label: "Beheer", icon: ShieldCheck, tone: "rose" };

  const sections: NavSection[] =
    persona.role === "manager"
      ? [
          { title: "Menu", items: [home, actiepunten, feedback, kennisbank, team] },
          { title: "Gesprekken", items: [eenOpEen, functioneringsgesprek] },
        ]
      : [
          { title: "Menu", items: [home, actiepunten, feedback, kennisbank] },
          { title: "Gesprekken", items: [eenOpEen, functioneringsgesprek] },
        ];

  if (persona.is_admin) {
    sections.push({ title: "Beheer", items: [templates, beheer] });
  }

  return sections;
}

export function AppSidebar({
  persona,
  teams,
}: {
  persona: Persona;
  teams: TeamWithMembers[];
}) {
  const pathname = usePathname();
  const sections = navSections(persona);

  return (
    <aside className="sticky top-0 hidden h-svh w-[244px] shrink-0 flex-col bg-sidebar shadow-[1px_0_12px_0_rgba(0,0,0,0.06)] md:flex">
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
                        "group flex items-center gap-3 rounded-lg px-2 py-1.5 text-[14px] font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-foreground"
                          : "text-foreground/65 hover:bg-sidebar-accent/60 hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
                          active
                            ? TONE_BG[item.tone]
                            : "text-foreground/55 group-hover:text-foreground/80",
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-sidebar-border/40 px-4 py-4">
        <PersonaSwitcher current={persona} teams={teams} />
      </div>
    </aside>
  );
}
