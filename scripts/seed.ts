/**
 * Seed-script voor demo-data.
 * Draait via: npm run seed
 *
 * Idempotent: wist eerst alle rijen in de relevante tabellen,
 * vult dan teams, users en templates.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Mis NEXT_PUBLIC_SUPABASE_URL of NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type Role = "employee" | "manager" | "hr";

type SeedUser = {
  name: string;
  email: string;
  role: Role;
  teamName: string;
};

const TEAM_NAMES = [
  "Partner Happiness",
  "Consumer Happiness",
  "IT",
  "Marketing",
  "HR",
] as const;

const USERS: SeedUser[] = [
  // Partner Happiness
  { name: "Sanne de Vries", email: "sanne.devries@bambelo.nl", role: "manager", teamName: "Partner Happiness" },
  { name: "Mehmet Yilmaz", email: "mehmet.yilmaz@bambelo.nl", role: "employee", teamName: "Partner Happiness" },
  { name: "Laura Bakker", email: "laura.bakker@bambelo.nl", role: "employee", teamName: "Partner Happiness" },
  { name: "Carlos Fernandez", email: "carlos.fernandez@bambelo.nl", role: "employee", teamName: "Partner Happiness" },
  { name: "Anouk Janssen", email: "anouk.janssen@bambelo.nl", role: "employee", teamName: "Partner Happiness" },

  // Consumer Happiness
  { name: "Tom van der Berg", email: "tom.vandenberg@bambelo.nl", role: "manager", teamName: "Consumer Happiness" },
  { name: "Aisha El Amrani", email: "aisha.elamrani@bambelo.nl", role: "employee", teamName: "Consumer Happiness" },
  { name: "Pieter Hendriks", email: "pieter.hendriks@bambelo.nl", role: "employee", teamName: "Consumer Happiness" },
  { name: "Giulia Romano", email: "giulia.romano@bambelo.nl", role: "employee", teamName: "Consumer Happiness" },
  { name: "Daan Smit", email: "daan.smit@bambelo.nl", role: "employee", teamName: "Consumer Happiness" },

  // IT
  { name: "Lucas Mertens", email: "lucas.mertens@bambelo.nl", role: "manager", teamName: "IT" },
  { name: "Priya Patel", email: "priya.patel@bambelo.nl", role: "employee", teamName: "IT" },
  { name: "Joris van Dijk", email: "joris.vandijk@bambelo.nl", role: "employee", teamName: "IT" },
  { name: "Ivan Petrov", email: "ivan.petrov@bambelo.nl", role: "employee", teamName: "IT" },
  { name: "Femke de Jong", email: "femke.dejong@bambelo.nl", role: "employee", teamName: "IT" },

  // Marketing
  { name: "Eva Visser", email: "eva.visser@bambelo.nl", role: "manager", teamName: "Marketing" },
  { name: "Mark Hofstra", email: "mark.hofstra@bambelo.nl", role: "employee", teamName: "Marketing" },
  { name: "Yara Bouali", email: "yara.bouali@bambelo.nl", role: "employee", teamName: "Marketing" },
  { name: "Noah Klein", email: "noah.klein@bambelo.nl", role: "employee", teamName: "Marketing" },

  // HR
  { name: "Sofie van Dam", email: "sofie.vandam@bambelo.nl", role: "hr", teamName: "HR" },
  { name: "Bram Kuijpers", email: "bram.kuijpers@bambelo.nl", role: "employee", teamName: "HR" },
  { name: "Isabel Mendes", email: "isabel.mendes@bambelo.nl", role: "employee", teamName: "HR" },
];

type Question = {
  id: string;
  label: string;
  kind: "open" | "scale_1_5" | "choice_single" | "choice_multi";
  options?: string[];
  required?: boolean;
  hint?: string;
};

type SeedTemplate = {
  type: "one_on_one" | "performance_review" | "evaluation" | "peer_360";
  name: string;
  questions: Question[];
};

const TEMPLATES: SeedTemplate[] = [
  {
    type: "one_on_one",
    name: "Reguliere 1-op-1",
    questions: [
      { id: "wins", label: "Hoe ging de afgelopen 2 weken?", kind: "open" },
      { id: "help", label: "Waar wil je hulp of input bij?", kind: "open" },
      { id: "agenda", label: "Wat staat er op je agenda?", kind: "open" },
      { id: "vrij", label: "Iets anders wat je wil bespreken?", kind: "open" },
    ],
  },
  {
    type: "one_on_one",
    name: "Eerste 1-op-1 na onboarding",
    questions: [
      { id: "landing", label: "Hoe ben je geland in je rol?", kind: "open" },
      { id: "verrassing", label: "Wat heeft je positief verrast? Wat tegengevallen?", kind: "open" },
      { id: "blokkades", label: "Loop je ergens tegenaan in het onboarden?", kind: "open" },
      { id: "hulp", label: "Wat zou je nu het meeste helpen?", kind: "open" },
    ],
  },
  {
    type: "one_on_one",
    name: "1-op-1 na groot project",
    questions: [
      { id: "trots", label: "Waar ben je trots op?", kind: "open" },
      { id: "leerpunten", label: "Wat zou je een volgende keer anders doen?", kind: "open" },
      { id: "samenwerking", label: "Hoe verliep de samenwerking?", kind: "open" },
      { id: "vervolg", label: "Wat is de logische volgende stap voor jou?", kind: "open" },
    ],
  },
  {
    type: "performance_review",
    name: "Halfjaarlijks functioneringsgesprek",
    questions: [
      { id: "gevoel", label: "Hoe gaat het met je?", kind: "open" },
      { id: "ervaring", label: "Wat ervaar je in het werk, goed en minder goed?", kind: "open" },
      { id: "groei", label: "Waar wil je groeien de komende periode?", kind: "open" },
      { id: "team", label: "Hoe loopt de samenwerking met je team?", kind: "open" },
      { id: "ambitie", label: "Welke ambitie heb je voor het komende halfjaar?", kind: "open" },
    ],
  },
  {
    type: "performance_review",
    name: "Onboarding 6 maanden",
    questions: [
      { id: "landing", label: "Hoe heb je de eerste 6 maanden ervaren?", kind: "open" },
      { id: "rol", label: "Past je rol bij wat je verwachtte?", kind: "open" },
      { id: "kracht", label: "Waar voel je je krachtig in?", kind: "open" },
      { id: "ontwikkel", label: "Waar wil je nog ontwikkelen?", kind: "open" },
    ],
  },
  {
    type: "peer_360",
    name: "Algemene peer feedback",
    questions: [
      {
        id: "goed",
        label: "Wat doet deze collega goed?",
        kind: "open",
        required: true,
        hint: "Begin met een concrete situatie. Wat zag je gebeuren, en waarom werkte dat?",
      },
      {
        id: "beter",
        label: "Waar zie je een verbeterpunt?",
        kind: "open",
        required: true,
        hint: "Eén punt is genoeg. Een voorbeeld helpt het te laten landen.",
      },
      {
        id: "kans",
        label: "Waar kan deze collega de komende tijd op groeien?",
        kind: "open",
        hint: "Denk aan een vaardigheid, gewoonte of focuspunt waar je kansen ziet.",
      },
    ],
  },
  {
    type: "peer_360",
    name: "Cross-team samenwerking",
    questions: [
      {
        id: "context",
        label: "Hoe werken jullie samen vanuit jouw team?",
        kind: "open",
        required: true,
        hint: "Schets kort de context van jullie samenwerking. Waar raken jullie elkaar?",
      },
      {
        id: "toegevoegd",
        label: "Wat brengt deze collega mee dat jullie team helpt?",
        kind: "open",
        required: true,
        hint: "Een vaardigheid, houding of perspectief dat je waardeert.",
      },
      {
        id: "verbeter",
        label: "Waar loopt het tussen jullie teams nog niet soepel?",
        kind: "open",
        hint: "Een concreet voorbeeld maakt het bespreekbaar zonder oordeel.",
      },
      {
        id: "kans",
        label: "Wat zou de samenwerking nog beter maken?",
        kind: "open",
        hint: "Iets praktisch dat jullie vaker of anders zouden kunnen doen.",
      },
    ],
  },
  {
    type: "evaluation",
    name: "Jaarlijkse beoordeling",
    questions: [
      { id: "bereikt", label: "Wat heb je het afgelopen jaar bereikt?", kind: "open" },
      { id: "tegen", label: "Waar liep je tegenaan?", kind: "open" },
      { id: "anders", label: "Wat zou je nu anders doen?", kind: "open" },
      { id: "trots", label: "Waar ben je het meest trots op?", kind: "open" },
    ],
  },
];

async function wipe() {
  console.log("Wissen bestaande seed-rijen...");
  // Volgorde van foreign keys naar parents toe.
  const tables = [
    "notifications",
    "feedback",
    "feedback_requests",
    "action_items",
    "peer_feedback",
    "evaluations",
    "performance_reviews",
    "one_on_ones",
    "templates",
  ];
  for (const t of tables) {
    const { error } = await supabase.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(`Delete ${t} failed: ${error.message}`);
  }
  // teams.lead_user_id verwijst naar users; eerst lead op null zodat we users mogen verwijderen.
  const { error: clearLeads } = await supabase
    .from("teams")
    .update({ lead_user_id: null })
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (clearLeads) throw new Error(`Clear team leads failed: ${clearLeads.message}`);

  const { error: delUsers } = await supabase
    .from("users")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (delUsers) throw new Error(`Delete users failed: ${delUsers.message}`);

  const { error: delTeams } = await supabase
    .from("teams")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (delTeams) throw new Error(`Delete teams failed: ${delTeams.message}`);
}

async function seed() {
  await wipe();

  console.log("Teams aanmaken...");
  const { data: teams, error: teamErr } = await supabase
    .from("teams")
    .insert(TEAM_NAMES.map((name) => ({ name })))
    .select();
  if (teamErr || !teams) throw new Error(`Insert teams failed: ${teamErr?.message}`);

  const teamIdByName = new Map(teams.map((t) => [t.name, t.id]));

  console.log("Users aanmaken...");
  const userRows = USERS.map((u) => ({
    name: u.name,
    email: u.email,
    role: u.role,
    team_id: teamIdByName.get(u.teamName),
  }));
  const { data: users, error: userErr } = await supabase.from("users").insert(userRows).select();
  if (userErr || !users) throw new Error(`Insert users failed: ${userErr?.message}`);

  console.log("Team leads koppelen...");
  for (const teamName of TEAM_NAMES) {
    const manager = users.find(
      (u) => USERS.find((s) => s.email === u.email)?.teamName === teamName &&
        (u.role === "manager" || u.role === "hr"),
    );
    if (!manager) continue;
    const { error } = await supabase
      .from("teams")
      .update({ lead_user_id: manager.id })
      .eq("id", teamIdByName.get(teamName));
    if (error) throw new Error(`Update team lead ${teamName} failed: ${error.message}`);
  }

  console.log("Templates aanmaken...");
  const { data: insertedTemplates, error: tmplErr } = await supabase
    .from("templates")
    .insert(TEMPLATES)
    .select();
  if (tmplErr || !insertedTemplates) {
    throw new Error(`Insert templates failed: ${tmplErr?.message}`);
  }

  const regulierTemplate = insertedTemplates.find(
    (t) => t.type === "one_on_one" && t.name === "Reguliere 1-op-1",
  );
  if (!regulierTemplate) throw new Error("Standaard 1-op-1 template ontbreekt");

  console.log("1-op-1's en actiepunten aanmaken...");
  await seedOneOnOnes({
    users: users as SeedUserRow[],
    teamIdByName,
    templateId: regulierTemplate.id,
  });

  const peerTemplateAlgemeen = insertedTemplates.find(
    (t) => t.type === "peer_360" && t.name === "Algemene peer feedback",
  );
  const peerTemplateCross = insertedTemplates.find(
    (t) => t.type === "peer_360" && t.name === "Cross-team samenwerking",
  );
  if (peerTemplateAlgemeen && peerTemplateCross) {
    console.log("Peer feedback-aanvragen aanmaken...");
    await seedPeerFeedbackRequests({
      users: users as SeedUserRow[],
      teamIdByName,
      algemeenTemplate: {
        id: peerTemplateAlgemeen.id,
        questions: (peerTemplateAlgemeen.questions ?? []) as Question[],
      },
      crossTemplate: {
        id: peerTemplateCross.id,
        questions: (peerTemplateCross.questions ?? []) as Question[],
      },
    });
  }

  console.log("");
  console.log(
    `Klaar. ${teams.length} teams, ${users.length} users, ${TEMPLATES.length} templates ingeladen.`,
  );
}

type SeedUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  team_id: string | null;
};

const SUMMARIES = [
  "Energiek gesprek. Goede focus op klanttevredenheid, samen vervolgstappen afgesproken.",
  "Korte check-in. Loopt rustig, geen blokkades. Volgende keer wat dieper op ontwikkeling.",
  "Fijn bijgepraat. Een paar punten meegenomen voor het team-overleg van volgende week.",
];

const PRIVATE_NOTES = [
  "Lijkt vermoeider de laatste weken, kort houden de komende keer.",
  "Wil meer eigenaarschap, kijken of we daar in Q3 ruimte voor maken.",
  "Communiceert assertiever sinds laatste feedback, goed teken.",
];

const FEEDBACK_BODIES = [
  "Je rust en overzicht in lastige klantgesprekken viel me deze weken extra op. Houd dat vast. Een volgende stap zou zijn dat je dat ook expliciet maakt richting het team, zodat zij van je aanpak leren.",
  "Mooie groei in hoe je nu zelf het initiatief neemt om obstakels op tafel te leggen. Volgende keer mag je nog wat eerder aan de bel trekken; dan hebben we meer ruimte om er samen iets mee te doen.",
  "Wat goed dat je vorige week die kennissessie hebt opgepakt. Mensen reageren positief. Probeer dat soort momenten vaker te plannen, ik denk dat het bij je past.",
  "Ik waardeer je betrokkenheid bij het team. Aandachtspunt: probeer in vergaderingen ook ruimte te laten voor anderen, dan komen jouw punten nog scherper landen.",
];

const PREP_SAMPLES: Array<Record<string, string>> = [
  {
    wins: "Twee partner-cases afgerond, eentje bleef hangen op contractzaken.",
    help: "Tips voor het stevig houden van het tarief in onderhandeling.",
    agenda: "Volgende week intake met de nieuwe partner uit Eindhoven.",
    vrij: "Niets bijzonders.",
  },
  {
    wins: "Lekker ritme gehad, mailwerk lag op tijd weg.",
    help: "Twijfel over hoe ik het beste de nieuwe collega kan inwerken.",
    agenda: "Drukke week met campagne-deadlines.",
    vrij: "",
  },
  {
    wins: "Eindelijk weer ruimte voor diepere klantgesprekken.",
    help: "Hoe ga jij om met klanten die blijven uitstellen?",
    agenda: "Twee kennismakingsgesprekken en de maandafsluiting.",
    vrij: "Misschien even kort over vakantieplanning.",
  },
];

const ACTION_DRAFTS: string[][] = [
  [
    "Templates klantgesprekken een ronde door checken",
    "Korte werkinstructie maken voor onboarding nieuwe collega",
  ],
  [
    "Volgende keer cijfers van partnerportfolio meenemen",
    "Klantcase Eindhoven afronden",
  ],
  [
    "Tijd inplannen voor leerdoel rondom feedback geven",
  ],
  [
    "Met IT afstemmen over toegang nieuwe tool",
    "Korte voortgangsupdate sturen naar het hele team",
  ],
];

function daysAgo(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysFromNow(days: number, hour = 10, minute = 0): string {
  return daysAgo(-days, hour, minute);
}

function dateString(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function seedOneOnOnes({
  users,
  teamIdByName,
  templateId,
}: {
  users: SeedUserRow[];
  teamIdByName: Map<string, string>;
  templateId: string;
}) {
  type Pair = { manager: SeedUserRow; employee: SeedUserRow };
  const pairs: Pair[] = [];
  for (const team of teamIdByName.keys()) {
    const teamId = teamIdByName.get(team);
    if (!teamId) continue;
    const teamUsers = users.filter((u) => u.team_id === teamId);
    const manager = teamUsers.find(
      (u) => u.role === "manager" || u.role === "hr",
    );
    if (!manager) continue;
    for (const emp of teamUsers) {
      if (emp.id === manager.id) continue;
      if (emp.role !== "employee") continue;
      pairs.push({ manager, employee: emp });
    }
  }

  const SUBJECTS_COMPLETED = [
    "Workload en planning",
    "Klantfocus deze sprint",
    "Samenwerking met IT",
    "Voortgang ontwikkelpunten",
    "Project X check-in",
  ];
  const SUBJECTS_UPCOMING = [
    "Reguliere check-in",
    "Klantgesprekken nabespreken",
    "Persoonlijke ontwikkeling",
    "Workload bespreken",
  ];

  const oneOnOneRows: Array<{
    id?: string;
    manager_id: string;
    employee_id: string;
    template_id: string;
    subject: string;
    scheduled_at: string;
    completed_at: string | null;
    employee_preparation: Record<string, string>;
    manager_private_notes: string | null;
    shared_summary: string | null;
  }> = [];

  // Houd referentie naar de laatste afgeronde 1-op-1 per duo bij,
  // zodat we daar actiepunten aan kunnen koppelen na insert.
  type SeedPlan = {
    pair: Pair;
    completedSchedules: Array<{ scheduledAt: string; prepIdx: number; summaryIdx: number; privateIdx: number | null }>;
    upcoming: { scheduledAt: string } | null;
    actionsForLast: { drafts: string[] };
  };

  const plans: SeedPlan[] = pairs.map((pair, i) => ({
    pair,
    completedSchedules: [
      { scheduledAt: daysAgo(42, 10, 0), prepIdx: i % PREP_SAMPLES.length, summaryIdx: 0, privateIdx: null },
      { scheduledAt: daysAgo(28, 10, 30), prepIdx: (i + 1) % PREP_SAMPLES.length, summaryIdx: 1, privateIdx: i % PRIVATE_NOTES.length },
      { scheduledAt: daysAgo(14, 14, 0), prepIdx: (i + 2) % PREP_SAMPLES.length, summaryIdx: 2, privateIdx: null },
    ],
    upcoming: { scheduledAt: daysFromNow(3 + (i % 4), 10, 0) },
    actionsForLast: { drafts: ACTION_DRAFTS[i % ACTION_DRAFTS.length] },
  }));

  for (const [planIdx, plan] of plans.entries()) {
    plan.completedSchedules.forEach((c, idx) => {
      const completed = new Date(c.scheduledAt);
      completed.setMinutes(completed.getMinutes() + 30);
      oneOnOneRows.push({
        manager_id: plan.pair.manager.id,
        employee_id: plan.pair.employee.id,
        template_id: templateId,
        subject:
          SUBJECTS_COMPLETED[
            (planIdx + idx) % SUBJECTS_COMPLETED.length
          ],
        scheduled_at: c.scheduledAt,
        completed_at: completed.toISOString(),
        employee_preparation: PREP_SAMPLES[c.prepIdx],
        manager_private_notes:
          c.privateIdx === null ? null : PRIVATE_NOTES[c.privateIdx],
        shared_summary: SUMMARIES[c.summaryIdx],
      });
    });
    if (plan.upcoming) {
      oneOnOneRows.push({
        manager_id: plan.pair.manager.id,
        employee_id: plan.pair.employee.id,
        template_id: templateId,
        subject: SUBJECTS_UPCOMING[planIdx % SUBJECTS_UPCOMING.length],
        scheduled_at: plan.upcoming.scheduledAt,
        completed_at: null,
        employee_preparation: {},
        manager_private_notes: null,
        shared_summary: null,
      });
    }
  }

  const { data: insertedOnes, error: insErr } = await supabase
    .from("one_on_ones")
    .insert(oneOnOneRows)
    .select("id, manager_id, employee_id, scheduled_at, completed_at");
  if (insErr || !insertedOnes) {
    throw new Error(`Insert one_on_ones failed: ${insErr?.message}`);
  }

  // Per duo: bepaal de meest recente afgeronde 1-op-1 en koppel actiepunten daaraan.
  const actionRows: Array<{
    owner_id: string;
    description: string;
    status: "open" | "completed" | "expired";
    source_type: "one_on_one";
    source_id: string;
    target_date: string | null;
    created_at: string;
    completed_at: string | null;
  }> = [];

  for (const plan of plans) {
    const completed = insertedOnes
      .filter(
        (o) =>
          o.manager_id === plan.pair.manager.id &&
          o.employee_id === plan.pair.employee.id &&
          o.completed_at !== null,
      )
      .sort((a, b) =>
        (b.completed_at ?? "").localeCompare(a.completed_at ?? ""),
      );
    const latestCompleted = completed[0];
    if (!latestCompleted) continue;

    const drafts = plan.actionsForLast.drafts;
    drafts.forEach((description, idx) => {
      const isLast = idx === drafts.length - 1;
      actionRows.push({
        owner_id: plan.pair.employee.id,
        description,
        status: "open",
        source_type: "one_on_one",
        source_id: latestCompleted.id,
        // Een paar zonder richtdatum, een paar met.
        target_date: isLast ? null : dateString(7 + idx * 7),
        created_at: latestCompleted.completed_at ?? new Date().toISOString(),
        completed_at: null,
      });
    });

    // Een historisch afgerond actiepunt op een oudere 1-op-1.
    const older = completed[completed.length - 1];
    if (older) {
      actionRows.push({
        owner_id: plan.pair.employee.id,
        description: "Vorig leerdoel: feedback vragen aan team",
        status: "completed",
        source_type: "one_on_one",
        source_id: older.id,
        target_date: null,
        created_at: older.completed_at ?? new Date().toISOString(),
        completed_at: older.completed_at ?? new Date().toISOString(),
      });
    }
  }

  if (actionRows.length) {
    const { error: aiErr } = await supabase.from("action_items").insert(actionRows);
    if (aiErr) throw new Error(`Insert action_items failed: ${aiErr.message}`);
  }

  // Bij circa 40% van de afgeronde 1-op-1's krijgt de medewerker manager-feedback.
  const feedbackRows: Array<{
    recipient_id: string;
    author_id: string;
    source_type: "one_on_one";
    source_id: string;
    body: string;
    status: "submitted";
    submitted_at: string;
  }> = [];

  const completedOnes = insertedOnes.filter((o) => o.completed_at !== null);
  completedOnes.forEach((one, idx) => {
    if (idx % 5 < 2) {
      feedbackRows.push({
        recipient_id: one.employee_id,
        author_id: one.manager_id,
        source_type: "one_on_one",
        source_id: one.id,
        body: FEEDBACK_BODIES[idx % FEEDBACK_BODIES.length],
        status: "submitted",
        submitted_at: one.completed_at as string,
      });
    }
  });

  if (feedbackRows.length) {
    const { error: fbErr } = await supabase.from("feedback").insert(feedbackRows);
    if (fbErr) throw new Error(`Insert feedback failed: ${fbErr.message}`);
  }

  console.log(
    `  ${oneOnOneRows.length} 1-op-1's, ${actionRows.length} actiepunten en ${feedbackRows.length} feedback-items ingeladen.`,
  );
}

async function seedPeerFeedbackRequests({
  users,
  teamIdByName,
  algemeenTemplate,
  crossTemplate,
}: {
  users: SeedUserRow[];
  teamIdByName: Map<string, string>;
  algemeenTemplate: { id: string; questions: Question[] };
  crossTemplate: { id: string; questions: Question[] };
}) {
  // Twee aanvragers: een uit Partner Happiness en een uit Marketing.
  // Per aanvraag een mix van eigen team en cross-team peers, deels ingevuld.
  const partnerTeamId = teamIdByName.get("Partner Happiness");
  const itTeamId = teamIdByName.get("IT");
  const marketingTeamId = teamIdByName.get("Marketing");
  if (!partnerTeamId || !itTeamId || !marketingTeamId) return;

  type Plan = {
    requesterEmail: string;
    template: { id: string; questions: Question[] };
    prompt: string;
    peers: Array<{
      email: string;
      submitted?: Record<string, string>;
      declined?: boolean;
    }>;
  };

  const plans: Plan[] = [
    {
      requesterEmail: "laura.bakker@bambelo.nl",
      template: algemeenTemplate,
      prompt:
        "Ik werk de laatste weken bewuster aan rust en overzicht in mijn klantgesprekken. Hoe ervaar jij dat?",
      peers: [
        {
          email: "mehmet.yilmaz@bambelo.nl",
          submitted: {
            goed:
              "In bijna alle klantcalls die we samen doen laat je klanten echt uitpraten en blijf je rustig als een case complex wordt. Daardoor vatten ze hun eigen vraag scherper samen, en wij krijgen veel betere input om mee verder te werken.",
            beter:
              "Soms blijf je iets te lang in de luisterende rol. Een vraag stevig terugleggen helpt ons om sneller een afspraak te maken.",
            kans:
              "Probeer per gesprek bewust 1 concrete afspraak op tafel te krijgen.",
          },
        },
        {
          email: "joris.vandijk@bambelo.nl",
          submitted: {
            goed:
              "Toen we samen het portaal-issue met Acme oplosten legde je voor IT precies uit waar het pijnpunt zit zonder oordeel. Dat scheelt ons uren bug-jagen.",
            beter:
              "Een kort schermopname-moment vooraf zou nog meer context geven.",
            kans:
              "Je zou een 'partner-IT-bridge' rol kunnen claimen, daar zit duidelijk behoefte aan.",
          },
        },
        { email: "anouk.janssen@bambelo.nl" }, // open
      ],
    },
    {
      requesterEmail: "noah.klein@bambelo.nl",
      template: crossTemplate,
      prompt:
        "We hebben dit kwartaal vaker samengewerkt met Consumer Happiness en IT. Hoe loopt dat vanuit jouw kant?",
      peers: [
        {
          email: "aisha.elamrani@bambelo.nl",
          submitted: {
            context:
              "We werken samen aan de zomercampagne en de consumer-flow.",
            toegevoegd:
              "Je denkt met ons mee in de toon van klantmails, dat tilt het echt op.",
            verbeter:
              "Sneller op tafel leggen wanneer een briefing nog gaten heeft, scheelt iedereen werk.",
            kans:
              "Een gezamenlijke pre-launch check met Consumer Happiness zou veel ruis kunnen vangen.",
          },
        },
        {
          email: "priya.patel@bambelo.nl",
          declined: true,
        },
        { email: "mark.hofstra@bambelo.nl" }, // open, zelfde team
      ],
    },
  ];

  type RequestRow = {
    id: string;
    requester_id: string;
    template_id: string;
    prompt: string | null;
  };
  type FeedbackRow = {
    recipient_id: string;
    author_id: string;
    source_type: "peer_request";
    source_id: string;
    prompt: string | null;
    responses: Record<string, string>;
    status: "requested" | "submitted" | "declined";
    requested_at: string;
    submitted_at: string | null;
  };

  const requestInserts = plans
    .map((p) => {
      const requester = users.find((u) => u.email === p.requesterEmail);
      if (!requester) return null;
      return {
        requester_id: requester.id,
        template_id: p.template.id,
        prompt: p.prompt,
      };
    })
    .filter((r): r is { requester_id: string; template_id: string; prompt: string } => r !== null);

  const { data: insertedRequests, error: reqErr } = await supabase
    .from("feedback_requests")
    .insert(requestInserts)
    .select("id, requester_id, template_id, prompt");
  if (reqErr || !insertedRequests) {
    throw new Error(`Insert feedback_requests failed: ${reqErr?.message}`);
  }

  const requestByRequester = new Map<string, RequestRow>();
  for (const r of insertedRequests as RequestRow[]) {
    requestByRequester.set(r.requester_id, r);
  }

  const feedbackInserts: FeedbackRow[] = [];
  for (const plan of plans) {
    const requester = users.find((u) => u.email === plan.requesterEmail);
    if (!requester) continue;
    const request = requestByRequester.get(requester.id);
    if (!request) continue;

    plan.peers.forEach((peer, idx) => {
      const peerUser = users.find((u) => u.email === peer.email);
      if (!peerUser) return;
      const requestedAt = daysAgo(7 - idx, 9 + idx, 0);
      const status = peer.submitted
        ? "submitted"
        : peer.declined
          ? "declined"
          : "requested";
      feedbackInserts.push({
        recipient_id: requester.id,
        author_id: peerUser.id,
        source_type: "peer_request",
        source_id: request.id,
        prompt: plan.prompt,
        responses: peer.submitted ?? {},
        status,
        requested_at: requestedAt,
        submitted_at:
          status === "submitted" ? daysAgo(2 - idx, 11 + idx, 0) : null,
      });
    });
  }

  if (feedbackInserts.length) {
    const { error: fbErr } = await supabase
      .from("feedback")
      .insert(feedbackInserts);
    if (fbErr) throw new Error(`Insert peer feedback failed: ${fbErr.message}`);
  }

  console.log(
    `  ${insertedRequests.length} peer-aanvragen en ${feedbackInserts.length} peer-feedback rijen ingeladen.`,
  );
}

seed().catch((err) => {
  console.error("Seed mislukt:", err);
  process.exit(1);
});
