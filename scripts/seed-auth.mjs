// Seed the 2 demo accounts. Run locally (NOT deployed):
//   node --env-file=.env.local scripts/seed-auth.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
// SEED_PASSWORD in the env. Idempotent: re-running updates the plan.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_PASSWORD;
if (!url || !serviceKey || !password) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SEED_PASSWORD");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const accounts = [
  { email: "free@kira.demo", plan: "free" },
  { email: "pro@kira.demo", plan: "pro" },
];

for (const acct of accounts) {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: acct.email,
    password,
    email_confirm: true,
  });
  let userId = created?.user?.id;
  if (createErr && !/already/i.test(createErr.message)) {
    console.error(`createUser failed for ${acct.email}:`, createErr.message);
    process.exit(1);
  }
  if (!userId) {
    const { data: list } = await admin.auth.admin.listUsers();
    userId = list?.users?.find((u) => u.email === acct.email)?.id;
  }
  if (!userId) {
    console.error(`Could not resolve user id for ${acct.email}`);
    process.exit(1);
  }
  const { error: upsertErr } = await admin
    .from("profiles")
    .upsert({ id: userId, email: acct.email, plan: acct.plan }, { onConflict: "id" });
  if (upsertErr) {
    console.error(`profile upsert failed for ${acct.email}:`, upsertErr.message);
    process.exit(1);
  }
  console.log(`seeded ${acct.email} -> ${acct.plan}`);
}
console.log("done");
