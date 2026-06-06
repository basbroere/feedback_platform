"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  CheckSquare,
  ClipboardCheck,
  LayoutGrid,
  Menu,
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TONE_BG, type Tone } from "@/lib/ui/tone";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
};

const ALL_ITEMS: Record<string, NavItem> = {
  home: { href: "/dashboard", label: "Home", icon: LayoutGrid, tone: "primary" },
  actiepunten: { href: "/actiepunten", label: "Actiepunten", icon: CheckSquare, tone: "emerald" },
  feedback: { href: "/feedback", label: "Feedback", icon: MessageCircle, tone: "primary" },
  eenOpEen: { href: "/een-op-een", label: "1-op-1", icon: MessageSquareText, tone: "blue" },
  team: { href: "/team", label: "Team", icon: UsersRound, tone: "violet" },
  kennisbank: { href: "/kennisbank", label: "Kennisbank", icon: BookOpen, tone: "sky" },
  functioneringsgesprek: {
    href: "/functioneringsgesprek",
    label: "Functionering",
    icon: ClipboardCheck,
    tone: "amber",
  },
  templates: { href: "/templates", label: "Templates", icon: Sliders, tone: "sky" },
  beheer: { href: "/beheer", label: "Beheer", icon: ShieldCheck, tone: "rose" },
};

function primaryItems(persona: Persona): NavItem[] {
  const items = [ALL_ITEMS.home, ALL_ITEMS.eenOpEen, ALL_ITEMS.actiepunten];
  items.push(persona.role === "manager" ? ALL_ITEMS.team : ALL_ITEMS.feedback);
  return items;
}

function overflowItems(persona: Persona): NavItem[] {
  const primary = new Set(primaryItems(persona).map((i) => i.href));
  const all: NavItem[] = [
    ALL_ITEMS.home,
    ALL_ITEMS.eenOpEen,
    ALL_ITEMS.functioneringsgesprek,
    ALL_ITEMS.actiepunten,
    ALL_ITEMS.feedback,
    ALL_ITEMS.kennisbank,
  ];
  if (persona.role === "manager") all.push(ALL_ITEMS.team);
  if (persona.is_admin) {
    all.push(ALL_ITEMS.templates, ALL_ITEMS.beheer);
  }
  return all.filter((item) => !primary.has(item.href));
}

export function MobileBottomNav({
  persona,
  teams,
}: {
  persona: Persona;
  teams: TeamWithMembers[];
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = primaryItems(persona);
  const overflow = overflowItems(persona);

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Hoofdnavigatie"
      >
        <ul className="grid grid-cols-5">
          {primary.map((item) => (
            <li key={item.href}>
              <NavLink item={item} active={isActive(item.href)} />
            </li>
          ))}
          <li>
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger
                render={
                  <button
                    type="button"
                    className="flex w-full flex-col items-center justify-center gap-1 py-2.5 text-[10.5px] font-medium text-foreground/65 hover:text-foreground"
                    aria-label="Meer"
                  />
                }
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md">
                  <Menu className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span>Meer</span>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="max-h-[85vh] rounded-t-2xl px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
              >
                <div className="space-y-5">
                  <ul className="grid grid-cols-3 gap-3">
                    {overflow.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setMoreOpen(false)}
                            className={cn(
                              "flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-[12px] font-medium transition-colors",
                              active
                                ? "border-primary/40 text-foreground"
                                : "text-foreground/70 hover:bg-accent/40",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg",
                                active ? TONE_BG[item.tone] : "bg-muted",
                              )}
                            >
                              <Icon className="h-4 w-4" strokeWidth={1.75} />
                            </span>
                            <span className="text-center leading-tight">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="border-t border-border pt-4">
                    <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                      Persona
                    </p>
                    <PersonaSwitcher current={persona} teams={teams} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
    </>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 py-2.5 text-[10.5px] font-medium transition-colors",
        active ? "text-foreground" : "text-foreground/65 hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          active ? TONE_BG[item.tone] : "",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span>{item.label}</span>
    </Link>
  );
}
