import { createClient } from "@/lib/supabase/server";
import type { ActionItem, PersonRef } from "@/lib/one-on-ones/types";

const PERSON_COLS = "id, name, avatar_url";
const ITEM_COLS = `id, owner_id, description, status, target_date, notes, source_type, source_id, created_at, completed_at, owner:users!action_items_owner_id_fkey(${PERSON_COLS})`;

export type DossierSource = {
  kind: "one_on_one" | "performance_review" | "evaluation" | "personal";
  label: string;
  href: string | null;
  date: string | null;
  with: PersonRef | null;
};

export type DossierItem = ActionItem & {
  source: DossierSource | null;
};

export type DossierStats = {
  openTotal: number;
  completedLast30Days: number;
  avgDurationDays: number | null;
  openOver4Weeks: number;
};

export type Dossier = {
  open: DossierItem[];
  completed: DossierItem[];
  stats: DossierStats;
};

const TWELVE_MONTHS_DAYS = 365;
const FOUR_WEEKS_MS = 4 * 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function getDossierForEmployee(
  employeeId: string,
): Promise<Dossier> {
  const supabase = await createClient();
  const cutoff = isoDaysAgo(TWELVE_MONTHS_DAYS);

  const [openRes, completedRes] = await Promise.all([
    supabase
      .from("action_items")
      .select(ITEM_COLS)
      .eq("owner_id", employeeId)
      .eq("status", "open")
      .order("created_at", { ascending: false }),
    supabase
      .from("action_items")
      .select(ITEM_COLS)
      .eq("owner_id", employeeId)
      .in("status", ["completed", "expired"])
      .gte("completed_at", cutoff)
      .order("completed_at", { ascending: false }),
  ]);

  const openItems = (openRes.data ?? []) as unknown as ActionItem[];
  const completedItems = (completedRes.data ?? []) as unknown as ActionItem[];

  const oneOnOneIds = Array.from(
    new Set(
      [...openItems, ...completedItems]
        .filter(
          (i): i is ActionItem & { source_id: string } =>
            i.source_type === "one_on_one" && i.source_id !== null,
        )
        .map((i) => i.source_id),
    ),
  );

  const oneOnOneSourceById = new Map<string, DossierSource>();
  if (oneOnOneIds.length) {
    const { data } = await supabase
      .from("one_on_ones")
      .select(
        `id, subject, scheduled_at, completed_at, manager:users!one_on_ones_manager_id_fkey(${PERSON_COLS})`,
      )
      .in("id", oneOnOneIds);
    type Row = {
      id: string;
      subject: string;
      scheduled_at: string | null;
      completed_at: string | null;
      manager: PersonRef | null;
    };
    for (const raw of (data ?? []) as unknown as Row[]) {
      const date = raw.completed_at ?? raw.scheduled_at;
      oneOnOneSourceById.set(raw.id, {
        kind: "one_on_one",
        label: raw.subject || "1-op-1",
        href: `/een-op-een/${raw.id}`,
        date,
        with: raw.manager ?? null,
      });
    }
  }

  const decorate = (it: ActionItem): DossierItem => {
    let source: DossierSource | null = null;
    if (it.source_type === "one_on_one") {
      source = (it.source_id ? oneOnOneSourceById.get(it.source_id) : null) ?? {
        kind: "one_on_one",
        label: "1-op-1",
        href: null,
        date: null,
        with: null,
      };
    } else if (it.source_type === "performance_review") {
      source = {
        kind: "performance_review",
        label: "Functioneringsgesprek",
        href: null,
        date: null,
        with: null,
      };
    } else if (it.source_type === "evaluation") {
      source = {
        kind: "evaluation",
        label: "Beoordelingsgesprek",
        href: null,
        date: null,
        with: null,
      };
    } else if (it.source_type === "personal") {
      source = {
        kind: "personal",
        label: "Persoonlijk",
        href: null,
        date: null,
        with: null,
      };
    }
    return { ...it, source };
  };

  const open = openItems.map(decorate);
  const completed = completedItems.map(decorate);

  const now = Date.now();
  const completedLast30Days = completed.filter((c) => {
    if (c.status !== "completed" || !c.completed_at) return false;
    return now - new Date(c.completed_at).getTime() <= THIRTY_DAYS_MS;
  }).length;

  const durations = completed
    .filter((c) => c.status === "completed" && c.completed_at)
    .map((c) => {
      const created = new Date(c.created_at).getTime();
      const done = new Date(c.completed_at as string).getTime();
      return Math.max(0, (done - created) / (1000 * 60 * 60 * 24));
    });
  const avgDurationDays = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  const openOver4Weeks = open.filter(
    (o) => now - new Date(o.created_at).getTime() > FOUR_WEEKS_MS,
  ).length;

  return {
    open,
    completed,
    stats: {
      openTotal: open.length,
      completedLast30Days,
      avgDurationDays,
      openOver4Weeks,
    },
  };
}
