"use client";

import { Check } from "lucide-react";
import {
  PERFORMANCE_REVIEW_SECTION_KEYS,
  PERFORMANCE_REVIEW_SECTION_LABEL,
  type PerformanceReviewSectionKey,
} from "@/lib/templates/types";
import { cn } from "@/lib/utils";

export type SectionFilledMap = Record<PerformanceReviewSectionKey, boolean>;

export function TemplateSectionStepper({
  active,
  filled,
  onSelect,
}: {
  active: PerformanceReviewSectionKey;
  filled: SectionFilledMap;
  onSelect: (key: PerformanceReviewSectionKey) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {PERFORMANCE_REVIEW_SECTION_KEYS.map((key, idx) => {
        const isActive = key === active;
        const isFilled = filled[key];
        return (
          <div key={key} className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                "group flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  isActive
                    ? "bg-background text-foreground"
                    : isFilled
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isFilled && !isActive ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : (
                  idx + 1
                )}
              </span>
              {PERFORMANCE_REVIEW_SECTION_LABEL[key]}
            </button>
            {idx < PERFORMANCE_REVIEW_SECTION_KEYS.length - 1 ? (
              <div className="h-px w-4 bg-border" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
