"use client";

import { cn } from "@/lib/utils";

export type InlineTabOption<T extends string> = {
  key: T;
  label: string;
  count: number;
};

export function InlineTabs<T extends string>({
  value,
  onChange,
  options,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: InlineTabOption<T>[];
  size?: "sm" | "md";
}) {
  const textCls = size === "sm" ? "text-[12.5px]" : "text-[13px]";
  const gapCls = size === "sm" ? "gap-x-4" : "gap-x-5";
  return (
    <div className={cn("flex flex-wrap items-center gap-y-2", gapCls)}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "relative -mb-px inline-flex items-center gap-1.5 pb-2 font-medium transition-colors outline-none focus-visible:text-foreground",
              textCls,
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={active}
          >
            {opt.label}
            <span
              className={cn(
                "rounded text-[10.5px] font-medium tabular-nums leading-none",
                active ? "text-primary" : "text-muted-foreground/60",
              )}
            >
              {opt.count}
            </span>
            {active ? (
              <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
