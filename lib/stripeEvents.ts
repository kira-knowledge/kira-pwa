import {
  planFromSubscriptionStatus,
  subscriptionIdOf,
  customerIdOf,
} from "./billing";

// Only these columns may ever be written by billing flows — keeps a future
// handler from spreading an untrusted Stripe object into the update.
export type ProfilePatch = Partial<{
  plan: "free" | "pro";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}>;

// Narrow write interface so this stays pure and testable; the real
// implementation (service-role Supabase) lives in lib/supabase/admin.ts.
export type PlanStore = {
  setPlanByUserId(userId: string, patch: ProfilePatch): Promise<void>;
  setPlanByCustomerId(customerId: string, patch: ProfilePatch): Promise<void>;
};

export type StripeEventLike = {
  type: string;
  data?: { object: any };
};

// Maps a verified Stripe event to a profiles write. Idempotent: every write
// sets absolute values, so redelivery is harmless. Unknown events are acked.
export async function handleStripeEvent(
  event: StripeEventLike,
  store: PlanStore
): Promise<void> {
  const obj = event.data?.object;
  switch (event.type) {
    case "checkout.session.completed": {
      if (obj?.payment_status === "paid" && obj?.client_reference_id) {
        await store.setPlanByUserId(obj.client_reference_id, {
          plan: "pro",
          stripe_customer_id: customerIdOf(obj),
          stripe_subscription_id: subscriptionIdOf(obj),
        });
      }
      return;
    }
    case "customer.subscription.updated": {
      const customerId = customerIdOf(obj);
      if (customerId) {
        await store.setPlanByCustomerId(customerId, {
          plan: planFromSubscriptionStatus(obj?.status),
        });
      }
      return;
    }
    case "customer.subscription.deleted": {
      const customerId = customerIdOf(obj);
      if (customerId) {
        await store.setPlanByCustomerId(customerId, {
          plan: "free",
          stripe_subscription_id: null,
        });
      }
      return;
    }
    default:
      return;
  }
}
