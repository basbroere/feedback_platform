import { BIcon } from "./b-icon";
import { parseRating } from "@/lib/templates/rating";

// Read-only weergave van een rating_b_1_5 antwoord. Toont 5 B's met de
// gekozen score gevuld, plus de toelichting eronder als die er is.
export function RatingDisplay({ value }: { value: string | undefined }) {
  const { rating, comment } = parseRating(value);
  if (rating === null && !comment.trim()) {
    return (
      <span className="text-muted-foreground italic text-sm">
        Niets ingevuld.
      </span>
    );
  }
  return (
    <div className="space-y-1.5">
      {rating !== null ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <BIcon key={n} active={n <= rating} className="h-4 w-4" />
            ))}
          </div>
          <span className="text-[12.5px] text-muted-foreground">
            {rating}/5
          </span>
        </div>
      ) : null}
      {comment.trim() ? (
        <p className="whitespace-pre-wrap text-[14px] text-foreground/90">
          {comment}
        </p>
      ) : null}
    </div>
  );
}
