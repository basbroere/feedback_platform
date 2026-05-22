// Het rating_b_1_5 vraagtype heeft een rating (1-5) en een optionele
// toelichting. We slaan beide samen op in één antwoord-string zodat het
// schema (Record<string, string>) niet hoeft te veranderen.
//
// Serialisatie: "<rating>|<toelichting>". Beide delen optioneel.
//
//   "4|Doet veel inhoudelijke kennis op."
//   "3"             // alleen rating
//   "|Toelichting"  // alleen tekst
//   ""              // niets ingevuld

export type RatingValue = {
  rating: number | null;
  comment: string;
};

export function parseRating(raw: string | undefined | null): RatingValue {
  if (!raw) return { rating: null, comment: "" };
  const idx = raw.indexOf("|");
  if (idx === -1) {
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 1 && n <= 5) {
      return { rating: n, comment: "" };
    }
    return { rating: null, comment: raw };
  }
  const head = raw.slice(0, idx);
  const tail = raw.slice(idx + 1);
  const n = Number(head);
  return {
    rating: Number.isInteger(n) && n >= 1 && n <= 5 ? n : null,
    comment: tail,
  };
}

export function serializeRating(value: RatingValue): string {
  const ratingStr = value.rating ? String(value.rating) : "";
  const comment = value.comment ?? "";
  if (!ratingStr && !comment) return "";
  return `${ratingStr}|${comment}`;
}
