export type Tone =
  | "blue"
  | "emerald"
  | "amber"
  | "violet"
  | "primary"
  | "rose"
  | "sky"
  | "slate";

export const TONE_BG: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
  emerald:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
  amber:
    "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
  violet:
    "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
  primary: "bg-primary/10 text-primary",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300",
  slate:
    "bg-slate-100 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300",
};

export const TONE_SOFT_BG: Record<Tone, string> = {
  blue: "bg-blue-50/70 dark:bg-blue-950/20",
  emerald: "bg-emerald-50/70 dark:bg-emerald-950/20",
  amber: "bg-amber-50/70 dark:bg-amber-950/20",
  violet: "bg-violet-50/70 dark:bg-violet-950/20",
  primary: "bg-primary/5",
  rose: "bg-rose-50/70 dark:bg-rose-950/20",
  sky: "bg-sky-50/70 dark:bg-sky-950/20",
  slate: "bg-slate-50 dark:bg-slate-900/30",
};

export const TONE_RING: Record<Tone, string> = {
  blue: "ring-blue-200/60 dark:ring-blue-900/40",
  emerald: "ring-emerald-200/60 dark:ring-emerald-900/40",
  amber: "ring-amber-200/60 dark:ring-amber-900/40",
  violet: "ring-violet-200/60 dark:ring-violet-900/40",
  primary: "ring-primary/20",
  rose: "ring-rose-200/60 dark:ring-rose-900/40",
  sky: "ring-sky-200/60 dark:ring-sky-900/40",
  slate: "ring-slate-200/60 dark:ring-slate-700/40",
};

export const TONE_ACCENT: Record<Tone, string> = {
  blue: "text-blue-600 dark:text-blue-300",
  emerald: "text-emerald-600 dark:text-emerald-300",
  amber: "text-amber-600 dark:text-amber-300",
  violet: "text-violet-600 dark:text-violet-300",
  primary: "text-primary",
  rose: "text-rose-600 dark:text-rose-300",
  sky: "text-sky-600 dark:text-sky-300",
  slate: "text-slate-600 dark:text-slate-300",
};

export const CATEGORY_TONE = {
  oneOnOne: "blue",
  actionItem: "emerald",
  feedback: "primary",
  performanceReview: "amber",
  team: "violet",
  templates: "sky",
  beheer: "rose",
} as const satisfies Record<string, Tone>;
