import { describe, it, expect } from "vitest";
import Stripe from "stripe";

// Offline: constructEvent/generateTestHeaderString never call the network,
// and the dummy key is never used for an API request.
const stripe = new Stripe("sk_test_" + "OFFLINE_ONLY_no_network_calls_made");
const secret = "whsec_test_secret";

describe("stripe webhook signature verification (offline)", () => {
  const payload = JSON.stringify({
    id: "evt_1",
    object: "event",
    type: "customer.subscription.deleted",
    data: { object: { customer: "cus_1" } },
  });

  it("accepts a correctly signed payload", () => {
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    const event = stripe.webhooks.constructEvent(payload, header, secret);
    expect(event.type).toBe("customer.subscription.deleted");
  });

  it("rejects a tampered payload and a wrong secret", () => {
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    expect(() =>
      stripe.webhooks.constructEvent(payload + " ", header, secret)
    ).toThrow();
    expect(() =>
      stripe.webhooks.constructEvent(payload, header, "whsec_wrong")
    ).toThrow();
  });

  it("rejects a stale timestamp outside the default tolerance window", () => {
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
      timestamp: Math.floor(Date.now() / 1000) - 600,
    });
    expect(() =>
      stripe.webhooks.constructEvent(payload, header, secret)
    ).toThrow();
  });
});
