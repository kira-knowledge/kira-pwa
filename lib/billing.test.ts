import { describe, it, expect } from "vitest";
import {
  planFromSubscriptionStatus,
  isConfirmableSession,
  subscriptionIdOf,
  customerIdOf,
  renewalUnix,
  toIso,
  formatDateLong,
} from "./billing";

describe("planFromSubscriptionStatus", () => {
  it("maps active/trialing to pro", () => {
    expect(planFromSubscriptionStatus("active")).toBe("pro");
    expect(planFromSubscriptionStatus("trialing")).toBe("pro");
  });
  it("maps everything else (incl. junk) to free", () => {
    expect(planFromSubscriptionStatus("canceled")).toBe("free");
    expect(planFromSubscriptionStatus("unpaid")).toBe("free");
    expect(planFromSubscriptionStatus("incomplete_expired")).toBe("free");
    expect(planFromSubscriptionStatus(undefined)).toBe("free");
    expect(planFromSubscriptionStatus(null)).toBe("free");
  });
});

describe("isConfirmableSession", () => {
  const paid = { payment_status: "paid", client_reference_id: "user-1" };
  it("accepts a paid session owned by the caller", () => {
    expect(isConfirmableSession(paid, "user-1")).toBe(true);
  });
  it("rejects unpaid, foreign, null session, or missing user", () => {
    expect(
      isConfirmableSession({ ...paid, payment_status: "unpaid" }, "user-1")
    ).toBe(false);
    expect(isConfirmableSession(paid, "user-2")).toBe(false);
    expect(isConfirmableSession(null, "user-1")).toBe(false);
    expect(isConfirmableSession(paid, "")).toBe(false);
  });
});

describe("id extraction", () => {
  it("handles string and expanded-object subscription/customer", () => {
    expect(subscriptionIdOf({ subscription: "sub_1" })).toBe("sub_1");
    expect(subscriptionIdOf({ subscription: { id: "sub_2" } })).toBe("sub_2");
    expect(subscriptionIdOf({ subscription: null })).toBe(null);
    expect(subscriptionIdOf(null)).toBe(null);
    expect(customerIdOf({ customer: "cus_1" })).toBe("cus_1");
    expect(customerIdOf({ customer: { id: "cus_2" } })).toBe("cus_2");
    expect(customerIdOf({})).toBe(null);
  });
});

describe("renewalUnix", () => {
  it("prefers the subscription item period end (newer Stripe API shape)", () => {
    expect(
      renewalUnix({ items: { data: [{ current_period_end: 200 }] } })
    ).toBe(200);
  });
  it("falls back to the top-level field (older API shape), else null", () => {
    expect(renewalUnix({ current_period_end: 100 })).toBe(100);
    expect(renewalUnix({})).toBe(null);
  });
});

describe("dates", () => {
  it("toIso converts unix seconds, null-safe", () => {
    expect(toIso(1782000000)).toBe("2026-06-21T00:00:00.000Z");
    expect(toIso(null)).toBe(null);
    expect(toIso(undefined)).toBe(null);
  });
  it("formatDateLong renders '21 June 2026' style, em-dash for empty/junk", () => {
    expect(formatDateLong("2026-06-21T00:00:00.000Z")).toBe("21 June 2026");
    expect(formatDateLong(null)).toBe("—");
    expect(formatDateLong("not-a-date")).toBe("—");
  });
});
