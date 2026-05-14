export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_BG_PALETTE = [
  "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
  "bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200",
  "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  "bg-violet-100 text-violet-900 dark:bg-violet-950/60 dark:text-violet-200",
  "bg-teal-100 text-teal-900 dark:bg-teal-950/60 dark:text-teal-200",
  "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200",
];

export function avatarBgClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_BG_PALETTE[Math.abs(hash) % AVATAR_BG_PALETTE.length];
}
