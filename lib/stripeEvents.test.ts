import { describe, it, expect } from "vitest";
import { handleStripeEvent, type PlanStore } from "./stripeEvents";

function fakeStore() {
  const calls: Array<{ method: string; key: string; patch: any }> = [];
  const store: PlanStore = {
    async setPlanByUserId(userId, patch) {
      calls.push({ method: "byUser", key: userId, patch });
    },
    async setPlanByCustomerId(customerId, patch) {
      calls.push({ method: "byCustomer", key: customerId, patch });
    },
  };
  return { store, calls };
}

function event(type: string, object: any) {
  return { type, data: { object } };
}

describe("handleStripeEvent", () => {
  it("checkout.session.completed (paid) → pro by user id with stripe ids", async () => {
    const { store, calls } = fakeStore();
    await handleStripeEvent(
      event("checkout.session.completed", {
        payment_status: "paid",
        client_reference_id: "user-1",
        customer: "cus_1",
        subscription: "sub_1",
      }),
      store
    );
    expect(calls).toEqual([
      {
        method: "byUser",
        key: "user-1",
        patch: {
          plan: "pro",
          stripe_customer_id: "cus_1",
          stripe_subscription_id: "sub_1",
        },
      },
    ]);
  });

  it("checkout.session.completed unpaid or anonymous → no write", async () => {
    const { store, calls } = fakeStore();
    await handleStripeEvent(
      event("checkout.session.completed", {
        payment_status: "unpaid",
        client_reference_id: "user-1",
      }),
      store
    );
    await handleStripeEvent(
      event("checkout.session.completed", {
        payment_status: "paid",
        client_reference_id: null,
      }),
      store
    );
    expect(calls).toEqual([]);
  });

  it("subscription.updated syncs plan from status by customer id", async () => {
    const { store, calls } = fakeStore();
    await handleStripeEvent(
      event("customer.subscription.updated", {
        customer: "cus_1",
        status: "active",
      }),
      store
    );
    await handleStripeEvent(
      event("customer.subscription.updated", {
        customer: "cus_1",
        status: "unpaid",
      }),
      store
    );
    expect(calls).toEqual([
      { method: "byCustomer", key: "cus_1", patch: { plan: "pro" } },
      { method: "byCustomer", key: "cus_1", patch: { plan: "free" } },
    ]);
  });

  it("subscription.deleted → free and clears the subscription id", async () => {
    const { store, calls } = fakeStore();
    await handleStripeEvent(
      event("customer.subscription.deleted", { customer: "cus_1" }),
      store
    );
    expect(calls).toEqual([
      {
        method: "byCustomer",
        key: "cus_1",
        patch: { plan: "free", stripe_subscription_id: null },
      },
    ]);
  });

  it("unknown event types are acked without writes", async () => {
    const { store, calls } = fakeStore();
    await handleStripeEvent(event("invoice.paid", { id: "in_1" }), store);
    expect(calls).toEqual([]);
  });

  it("checkout.session.completed with no_payment_required → no write", async () => {
    const { store, calls } = fakeStore();
    await handleStripeEvent(
      event("checkout.session.completed", {
        payment_status: "no_payment_required",
        client_reference_id: "user-1",
      }),
      store
    );
    expect(calls).toEqual([]);
  });

  it("subscription events without a customer id → no write, no throw", async () => {
    const { store, calls } = fakeStore();
    await handleStripeEvent(
      event("customer.subscription.updated", { customer: null, status: "active" }),
      store
    );
    await handleStripeEvent(
      event("customer.subscription.deleted", {}),
      store
    );
    expect(calls).toEqual([]);
  });

  it("malformed event without data → no write, no throw", async () => {
    const { store, calls } = fakeStore();
    await handleStripeEvent({ type: "checkout.session.completed" } as any, store);
    expect(calls).toEqual([]);
  });
});
