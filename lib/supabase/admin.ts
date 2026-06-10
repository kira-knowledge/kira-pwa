import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requiredEnv } from "../env";
import type { PlanStore } from "../stripeEvents";

// Service-role client — server-only (route handlers). Bypasses RLS, which is
// exactly why plan writes go through here and never through the anon client.
export function createAdminClient() {
  return createSupabaseClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// The real PlanStore. Throws on Supabase errors so webhook calls return 500
// and Stripe retries (never silently drop a plan change).
export function planStore(admin = createAdminClient()): PlanStore {
  return {
    async setPlanByUserId(userId, patch) {
      const { error } = await admin
        .from("profiles")
        .update(patch)
        .eq("id", userId);
      if (error) throw new Error(`profiles update failed: ${error.message}`);
    },
    async setPlanByCustomerId(customerId, patch) {
      const { error } = await admin
        .from("profiles")
        .update(patch)
        .eq("stripe_customer_id", customerId);
      if (error) throw new Error(`profiles update failed: ${error.message}`);
    },
  };
}
