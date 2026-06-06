import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function main() {
  const { data, error } = await supabase
    .from("templates")
    .select("id, type, name, questions, is_active")
    .order("type")
    .order("name");

  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}
main();
