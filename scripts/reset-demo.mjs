// Reset the demo account so the full pay-flow can be rehearsed repeatedly.
// Cancels any live test subscription on free@kira.demo's Stripe customer
// (immediately) and resets the profile to plan=free. Idempotent.
// Run locally (NOT deployed):
//   node --env-file=.env.local scripts/reset-demo.mjs
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!url || !serviceKey || !stripeKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or STRIPE_SECRET_KEY"
  );
  process.exit(1);
}

if (!stripeKey.startsWith("sk_test_")) {
  console.error(
    "STOP: STRIPE_SECRET_KEY does not look like a test key. Refusing to run."
  );
  process.exit(1);
}

const DEMO_EMAIL = "free@kira.demo";
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const stripe = new Stripe(stripeKey);

try {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) throw new Error(`listUsers failed: ${listErr.message}`);
  const user = list?.users?.find((u) => u.email === DEMO_EMAIL);
  if (!user) throw new Error(`No auth user found for ${DEMO_EMAIL}`);

  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("plan, stripe_customer_id")
    .eq("id", user.id)
    .single();
  if (profErr) throw new Error(`profile read failed: ${profErr.message}`);

  if (profile.stripe_customer_id) {
    const subs = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "all",
      limit: 100,
    });
    const live = subs.data.filter((s) =>
      ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(
        s.status
      )
    );
    for (const s of live) {
      await stripe.subscriptions.cancel(s.id);
      console.log(`Cancelled subscription ${s.id} (was ${s.status}).`);
    }
    if (!live.length) console.log("No live subscriptions to cancel.");
  } else {
    console.log("No Stripe customer on the demo profile yet.");
  }

  const { error: updErr } = await admin
    .from("profiles")
    .update({ plan: "free", stripe_subscription_id: null })
    .eq("id", user.id);
  if (updErr) throw new Error(`profile reset failed: ${updErr.message}`);
  console.log(
    `${DEMO_EMAIL} reset: plan=free, subscription cleared. Demo is rearmed.`
  );
} catch (err) {
  console.error("Demo reset failed:", err?.message ?? err);
  process.exit(1);
}
