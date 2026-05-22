"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BIcon } from "./b-icon";
import {
  parseRating,
  serializeRating,
  type RatingValue,
} from "@/lib/templates/rating";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const BUCKET_LABELS: Record<number, string> = {
  1: "Nog vroeg",
  2: "In ontwikkeling",
  3: "Op niveau",
  4: "Sterk",
  5: "Uitmuntend",
};

export function RatingBInput({
  id,
  value,
  onChange,
  disabled,
  placeholder,
}: Props) {
  const parsed = parseRating(value);

  function update(next: Partial<RatingValue>) {
    onChange(
      serializeRating({
        rating: next.rating !== undefined ? next.rating : parsed.rating,
        comment: next.comment !== undefined ? next.comment : parsed.comment,
      }),
    );
  }

  return (
    <div className="space-y-3">
      <div
        id={id}
        role="radiogroup"
        aria-label="Kies een score van 1 tot 5"
        className="flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const selected = parsed.rating !== null && n <= parsed.rating;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={parsed.rating === n}
                aria-label={`${n} van 5`}
                disabled={disabled}
                onClick={() =>
                  update({ rating: parsed.rating === n ? null : n })
                }
                className={cn(
                  "rounded-full p-1 transition-transform outline-none hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                <BIcon active={selected} />
              </button>
            );
          })}
        </div>
        {parsed.rating ? (
          <span className="text-[12.5px] text-muted-foreground">
            {BUCKET_LABELS[parsed.rating]} ({parsed.rating}/5)
          </span>
        ) : (
          <span className="text-[12.5px] text-muted-foreground">
            Nog geen score
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor={`${id}-comment`}
          className="text-[12.5px] text-muted-foreground"
        >
          Waarom deze score?
        </Label>
        <Textarea
          id={`${id}-comment`}
          rows={3}
          value={parsed.comment}
          disabled={disabled}
          onChange={(e) => update({ comment: e.target.value })}
          placeholder={
            placeholder ?? "Een concreet voorbeeld helpt het bespreekbaar te maken."
          }
        />
      </div>
    </div>
  );
}
