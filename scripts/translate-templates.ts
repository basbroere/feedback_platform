/**
 * Eenmalig: vertaalt alle bestaande templates in de live DB van NL naar EN.
 * Slaat templates over die al Engels zijn (op naam).
 *
 * Run: npx tsx scripts/translate-templates.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Q = {
  id: string;
  label: string;
  kind: string;
  hint?: string;
  required?: boolean;
  options?: string[];
};

type Update = {
  id: string;
  name: string;
  questions: Q[];
};

const UPDATES: Update[] = [
  {
    id: "0c262c6c-d876-4308-907d-159aeba924a6",
    name: "1-on-1 after a major project",
    questions: [
      { id: "trots", kind: "open", label: "What are you proud of?" },
      {
        id: "leerpunten",
        kind: "open",
        label: "What would you do differently next time?",
      },
      {
        id: "samenwerking",
        kind: "open",
        label: "How did the collaboration go?",
      },
      {
        id: "vervolg",
        kind: "open",
        label: "What's the logical next step for you?",
      },
    ],
  },
  {
    id: "c8d3123a-c6f0-4789-9a08-57a7476b6b84",
    name: "First 1-on-1 after onboarding",
    questions: [
      {
        id: "landing",
        kind: "open",
        label: "How have you settled into your role?",
      },
      {
        id: "verrassing",
        kind: "open",
        label: "What positively surprised you? What disappointed you?",
      },
      {
        id: "blokkades",
        kind: "open",
        label: "Are you running into anything during your onboarding?",
      },
      {
        id: "hulp",
        kind: "open",
        label: "What would help you most right now?",
      },
    ],
  },
  {
    id: "20b706b5-3ab2-4f7e-a514-099dcda522b8",
    name: "Regular 1-on-1",
    questions: [
      { id: "wins", kind: "open", label: "How have the past 2 weeks been?" },
      {
        id: "help",
        kind: "open",
        label: "Where would you like help or input?",
      },
      { id: "agenda", kind: "open", label: "What's on your agenda?" },
      {
        id: "vrij",
        kind: "open",
        label: "Anything else you want to discuss?",
      },
    ],
  },
  {
    id: "3f6bf7c4-be0f-4d8c-9317-a234a8baea1e",
    name: "Annual evaluation",
    questions: [
      {
        id: "bereikt",
        kind: "open",
        label: "What did you achieve over the past year?",
      },
      { id: "tegen", kind: "open", label: "What did you run into?" },
      {
        id: "anders",
        kind: "open",
        label: "What would you do differently now?",
      },
      { id: "trots", kind: "open", label: "What are you most proud of?" },
    ],
  },
  {
    id: "08681eba-01d8-4bcc-8646-a4bd6adf4e7f",
    name: "Performance review 360",
    questions: [
      {
        id: "vakmanschap",
        kind: "rating_b_1_5",
        label: "Craft and expertise",
        hint: "How strong is this person on the substance of their work?",
        required: true,
      },
      {
        id: "samenwerking",
        kind: "rating_b_1_5",
        label: "Collaboration",
        hint: "How well does working together go, inside and outside the team?",
        required: true,
      },
      {
        id: "eigenaarschap",
        kind: "rating_b_1_5",
        label: "Ownership and initiative",
        hint: "Does this person pick things up themselves and notice what needs doing?",
        required: true,
      },
      {
        id: "communicatie",
        kind: "rating_b_1_5",
        label: "Communication",
        hint: "Clear, timely, and in the right tone, both written and verbal.",
        required: true,
      },
      {
        id: "ontwikkeling",
        kind: "rating_b_1_5",
        label: "Learning and development",
        hint: "How openly and deliberately does this person learn from feedback and experience?",
      },
      {
        id: "open",
        kind: "open",
        label: "Anything else you'd like to add?",
        hint: "A general point, a compliment, or something that falls outside the ratings.",
      },
    ],
  },
  {
    id: "19200d27-3a09-4984-b94b-f1a2ee86b41c",
    name: "Peer - work",
    questions: [
      {
        id: "motivatie",
        kind: "rating_b_1_5",
        label: "Motivation",
        hint: "How motivated would you say I am, on a scale of 1 to 5?",
      },
      {
        id: "communicatie",
        kind: "open",
        label: "Communication",
        hint: "Do you have feedback on the way I communicate?",
      },
      {
        id: "werkzaamheden",
        kind: "open",
        label: "Work",
        hint: "Do you have feedback on the work I do?",
      },
      {
        id: "verbeterpunten",
        kind: "open",
        label: "Areas for improvement",
        hint: "What are some areas for improvement you'd recommend to me?",
      },
    ],
  },
];

async function main() {
  for (const u of UPDATES) {
    const { error } = await supabase
      .from("templates")
      .update({ name: u.name, questions: u.questions })
      .eq("id", u.id);
    if (error) {
      console.error(`Update ${u.id} (${u.name}) failed: ${error.message}`);
      process.exit(1);
    }
    console.log(`Vertaald: ${u.id} -> ${u.name}`);
  }
}

main();
