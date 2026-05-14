const DATE_FMT = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_TIME_FMT = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const TIME_FMT = new Intl.DateTimeFormat("nl-NL", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return DATE_FMT.format(d);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return DATE_TIME_FMT.format(d);
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return TIME_FMT.format(d);
}

export function formatRelativeWeeks(
  value: string | Date | null | undefined,
  now: Date = new Date(),
): string {
  if (!value) return "Nog geen";
  const d = typeof value === "string" ? new Date(value) : value;
  const diffMs = now.getTime() - d.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) {
    const future = -days;
    if (future === 0) return "vandaag";
    if (future === 1) return "morgen";
    if (future < 7) return `over ${future} dagen`;
    const weeks = Math.round(future / 7);
    return weeks === 1 ? "over 1 week" : `over ${weeks} weken`;
  }
  if (days === 0) return "vandaag";
  if (days === 1) return "gisteren";
  if (days < 7) return `${days} dagen geleden`;
  const weeks = Math.round(days / 7);
  if (weeks === 1) return "1 week geleden";
  if (weeks < 9) return `${weeks} weken geleden`;
  const months = Math.round(days / 30);
  if (months === 1) return "1 maand geleden";
  return `${months} maanden geleden`;
}
