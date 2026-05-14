import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ShortcutTone =
  | "blue"
  | "amber"
  | "emerald"
  | "violet"
  | "primary"
  | "teal"
  | "neutral";

const TONE_STYLES: Record<ShortcutTone, string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
  primary: "bg-primary/10 text-primary",
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300",
  neutral: "bg-muted text-foreground/70",
};

export type ShortcutCardProps = {
  icon: LucideIcon;
  tone?: ShortcutTone;
  title: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
  onClick?: () => void;
};

export function ShortcutCard({
  icon: Icon,
  tone = "neutral",
  title,
  description,
  href,
  comingSoon,
  onClick,
}: ShortcutCardProps) {
  const interactive = Boolean(href || onClick) && !comingSoon;

  const inner = (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        interactive && "transition-colors hover:border-foreground/15 hover:bg-accent/40",
        comingSoon && "opacity-90",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          TONE_STYLES[tone],
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[15px] font-semibold tracking-tight">{title}</h3>
          {comingSoon && (
            <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Binnenkort
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  if (href && !comingSoon) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  if (onClick && !comingSoon) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left">
        {inner}
      </button>
    );
  }
  return inner;
}
