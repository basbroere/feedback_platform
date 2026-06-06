import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { TONE_BG, type Tone } from "@/lib/ui/tone";
import { cn } from "@/lib/utils";

export function UpcomingCard({
  href,
  icon: Icon,
  tone,
  title,
  meta,
  caption,
  cta,
}: {
  href: string;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  meta: string;
  caption: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent/30"
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          TONE_BG[tone],
        )}
      >
        <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-[14.5px] font-semibold leading-tight">
          {title}
        </p>
        <p className="text-[12.5px] text-muted-foreground">{meta}</p>
        <p className="text-[11.5px] text-muted-foreground/80">{caption}</p>
      </div>
      <span
        className={cn(
          buttonVariants({ size: "sm", variant: "ghost" }),
          "shrink-0",
        )}
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" data-icon="inline-end" />
      </span>
    </Link>
  );
}
