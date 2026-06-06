/**
 * Eenmalig: voegt de upward-feedback template "Manager Strengths & Support"
 * toe aan de templates-tabel. Idempotent op naam + type.
 *
 * Run: npx tsx scripts/add-upward-template-strengths.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Mis NEXT_PUBLIC_SUPABASE_URL of NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEMPLATE = {
  type: "upward_feedback",
  name: "Manager Strengths & Support",
  is_active: true,
  questions: [
    {
      id: "top-strengths",
      label: "What are your manager's top strengths as a manager?",
      kind: "open",
    },
    {
      id: "continue-doing",
      label:
        "What is one thing your manager currently does that you would like them to continue doing?",
      kind: "open",
    },
    {
      id: "support-growth",
      label:
        "What is one thing your manager could do more of to better support your growth and development?",
      kind: "open",
    },
    {
      id: "do-differently",
      label:
        "What is one thing your manager could do differently to help you be more effective in your role?",
      kind: "open",
      hint: "Think in terms of start doing, stop doing, or do differently.",
    },
    {
      id: "manager-impact",
      label:
        "In what ways has your manager supported your success, growth and development during the past six months, and where would you have liked more support?",
      kind: "open",
    },
    {
      id: "strengthen-collaboration",
      label:
        "Is there anything else you would like to share that could strengthen the collaboration between you and your manager?",
      kind: "open",
    },
  ],
};

async function main() {
  const { data: existing, error: selErr } = await supabase
    .from("templates")
    .select("id")
    .eq("type", TEMPLATE.type)
    .eq("name", TEMPLATE.name)
    .maybeSingle();

  if (selErr) {
    console.error("Select-fout:", selErr.message);
    process.exit(1);
  }

  if (existing) {
    const { error: updErr } = await supabase
      .from("templates")
      .update({
        questions: TEMPLATE.questions,
        is_active: TEMPLATE.is_active,
      })
      .eq("id", existing.id);
    if (updErr) {
      console.error("Update-fout:", updErr.message);
      process.exit(1);
    }
    console.log(`Bijgewerkt: ${TEMPLATE.name} (${existing.id})`);
    return;
  }

  const { data: inserted, error: insErr } = await supabase
    .from("templates")
    .insert(TEMPLATE)
    .select("id")
    .single();
  if (insErr) {
    console.error("Insert-fout:", insErr.message);
    process.exit(1);
  }
  console.log(`Toegevoegd: ${TEMPLATE.name} (${inserted.id})`);
}

main();
