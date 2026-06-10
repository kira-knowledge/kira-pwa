# KIRA Stripe Paywall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing `/upgrade` and `/subscription` stub screens to real Stripe (test mode): hosted Checkout for the $2/month "KIRA Pro" subscription, instant `plan → pro` flip on return, Customer Portal cancel, and a webhook that downgrades on cancellation.

**Architecture:** All changes live in kira-pwa (Next.js 14 app router). Five new API routes under `app/api/stripe/*` reuse the iteration-7 fail-closed auth patterns (`requireSession()` → 401). Pure decision logic (status→plan mapping, session validation, date shaping) lives in small tested libs; Stripe/Supabase I/O lives in thin route handlers. `profiles.plan` in Supabase stays the single source of truth for gating; Stripe events only write to it via a service-role client. The Go Deeper gate (free → `/upgrade`, pro → Exa) is already shipped and is NOT touched.

**Tech Stack:** Next.js 14.2.5, `stripe` npm (v22), `@supabase/supabase-js` (service role), Supabase MCP for the migration, vitest, Vercel CLI for deploy.

**Spec:** `docs/superpowers/specs/2026-06-10-kira-stripe-paywall-design.md`

**Working directory:** `/root/hackathon/kira-pwa` (all paths below are relative to it).

---

## File structure

| File | Responsibility |
|---|---|
| `lib/env.ts` (+test) | `requiredEnv(name)` guard — throw clear error when an env var is missing |
| `lib/billing.ts` (+test) | Pure billing logic: status→plan, checkout-session validation, id extraction, renewal-date extraction, date formatting |
| `lib/stripeEvents.ts` (+test) | Pure webhook event→plan-write mapping, against a narrow `PlanStore` interface |
| `lib/webhookSignature.test.ts` | Offline proof that Stripe signature verification accepts good / rejects tampered payloads |
| `lib/stripe.ts` | Stripe SDK singleton (`getStripe()`) |
| `lib/supabase/admin.ts` | Service-role Supabase client + the real `PlanStore` implementation |
| `app/api/stripe/checkout/route.ts` | POST: create-or-reuse customer, create Checkout Session, return `{url}` |
| `app/api/stripe/confirm/route.ts` | POST: verify returned session (paid + owned), flip plan→pro |
| `app/api/stripe/portal/route.ts` | POST: create Billing Portal session, return `{url}` |
| `app/api/stripe/webhook/route.ts` | POST: verify signature, dispatch to `handleStripeEvent` |
| `app/api/stripe/subscription/route.ts` | GET: real plan/price/dates for the subscription page |
| `app/upgrade/page.tsx` (modify) | Wire CTA → checkout redirect; loading/error states; pro → `/subscription` |
| `app/upgrade/success/page.tsx` + `success.module.css` (new) | Confirm session, "You're PRO 🎉" moment |
| `app/subscription/page.tsx` (modify) | Real subscription data; cancel → portal; free → `/upgrade` |
| `scripts/setup-stripe.mjs` | Idempotent: create product/price/webhook/portal-config in Stripe, print env values |
| `scripts/reset-demo.mjs` | Idempotent: cancel free@kira.demo's test subscription + reset plan→free |
| `supabase/schema.sql` (modify) | Document the two new profile columns |

**House rules that apply to every task:** never put real keys in code, tests, or commits — env vars only. Don't commit `next-env.d.ts` (pre-existing dirty file). Commit messages: conventional commits. `cookies()` is sync in Next 14.2.5. Run commands from `/root/hackathon/kira-pwa`.

---

### Task 1: Stripe dependency + `requiredEnv` guard

**Files:**
- Modify: `package.json` (via npm)
- Create: `lib/env.ts`
- Test: `lib/env.test.ts`

- [ ] **Step 1: Install the Stripe SDK**

Run: `npm install stripe`
Expected: `stripe@^22` appears in `package.json` dependencies, install succeeds.

- [ ] **Step 2: Write the failing test**

Create `lib/env.test.ts`:

```ts
import { describe, it, expect, afterEach } from "vitest";
import { requiredEnv } from "./env";

describe("requiredEnv", () => {
  afterEach(() => {
    delete process.env.KIRA_TEST_VAR;
  });

  it("returns the value when set", () => {
    process.env.KIRA_TEST_VAR = "hello";
    expect(requiredEnv("KIRA_TEST_VAR")).toBe("hello");
  });

  it("throws a clear error when missing or empty", () => {
    expect(() => requiredEnv("KIRA_TEST_VAR")).toThrow(
      "KIRA_TEST_VAR not configured"
    );
    process.env.KIRA_TEST_VAR = "";
    expect(() => requiredEnv("KIRA_TEST_VAR")).toThrow(
      "KIRA_TEST_VAR not configured"
    );
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/env.test.ts`
Expected: FAIL — `Cannot find module './env'` (or similar).

- [ ] **Step 4: Write minimal implementation**

Create `lib/env.ts`:

```ts
// Fail-fast guard for server-only configuration. Routes call this at request
// time (not module load) so a missing var produces a clear 500, not a crash
// at build time.
export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} not configured`);
  }
  return value;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/env.test.ts`
Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/env.ts lib/env.test.ts
git commit -m "feat: add stripe sdk and requiredEnv guard"
```

---

### Task 2: Supabase migration — Stripe columns on profiles

**Files:**
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Apply the migration to project `njopgaaoazucrpwvdzre`**

Use the Supabase MCP tool `mcp__supabase__apply_migration` with name `add_stripe_columns` and query:

```sql
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;
```

(If MCP is unavailable, run the same SQL in the Supabase dashboard SQL editor — `apply_migration` is preferred because it also reloads the PostgREST schema cache; remember the iteration-7 `PGRST205` gotcha.)

- [ ] **Step 2: Verify the columns exist**

Use MCP `mcp__supabase__execute_sql` with:

```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by column_name;
```

Expected: rows include `stripe_customer_id` and `stripe_subscription_id` (plus the existing `id`, `email`, `plan`, `created_at`).

- [ ] **Step 3: Document in schema.sql**

Append to `supabase/schema.sql`:

```sql
-- Iteration 12 (Stripe paywall): link profiles to Stripe. plan stays the
-- single source of truth for gating; these are written server-side only
-- (service role) — RLS still blocks client writes.
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;
```

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add stripe customer/subscription columns to profiles"
```

---

### Task 3: Stripe-side setup script (product, price, webhook, portal)

**Files:**
- Create: `scripts/setup-stripe.mjs`
- Modify: `.env.local` (NOT committed — it is untracked)

Prereq: `.env.local` must contain `STRIPE_SECRET_KEY=<the user's sk_test_… key>` and `NEXT_PUBLIC_APP_URL=https://kira-pwa-rho.vercel.app`. Add those two lines first (ask the user for the key if it's not already in the session).

- [ ] **Step 1: Write the setup script**

Create `scripts/setup-stripe.mjs`:

```js
// One-time, idempotent Stripe (test mode) setup for the KIRA Pro paywall.
// Run locally (NOT deployed):
//   node --env-file=.env.local scripts/setup-stripe.mjs
// Requires STRIPE_SECRET_KEY and NEXT_PUBLIC_APP_URL in the env.
// Prints the env lines to copy into .env.local / Vercel.
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
if (!key || !appUrl) {
  console.error("Missing STRIPE_SECRET_KEY or NEXT_PUBLIC_APP_URL");
  process.exit(1);
}
const stripe = new Stripe(key);

// 1. Product + $2/month price (idempotent via lookup_key).
const found = await stripe.prices.list({
  lookup_keys: ["kira_pro_monthly"],
  limit: 1,
});
let price = found.data[0];
if (!price) {
  const product = await stripe.products.create({ name: "KIRA Pro" });
  price = await stripe.prices.create({
    product: product.id,
    unit_amount: 200,
    currency: "usd",
    recurring: { interval: "month" },
    lookup_key: "kira_pro_monthly",
  });
  console.log("Created product + price.");
} else {
  console.log("Price already exists, reusing.");
}

// 2. Webhook endpoint (idempotent by URL). The signing secret is only
// returned at creation time.
const webhookUrl = `${appUrl}/api/stripe/webhook`;
const hooks = await stripe.webhookEndpoints.list({ limit: 100 });
let hook = hooks.data.find((h) => h.url === webhookUrl);
let webhookSecret;
if (!hook) {
  hook = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: [
      "checkout.session.completed",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ],
  });
  webhookSecret = hook.secret;
  console.log("Created webhook endpoint.");
} else {
  console.log(
    "Webhook endpoint already exists — secret was printed when first created (roll it in the Stripe dashboard if lost)."
  );
}

// 3. Customer Portal configuration (cancel at period end).
const configs = await stripe.billingPortal.configurations.list({ limit: 1 });
if (!configs.data.length) {
  await stripe.billingPortal.configurations.create({
    business_profile: { headline: "KIRA Pro" },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
    },
    default_return_url: `${appUrl}/subscription`,
  });
  console.log("Created portal configuration.");
} else {
  console.log("Portal configuration already exists.");
}

console.log("\nAdd these to .env.local AND Vercel:");
console.log(`STRIPE_PRICE_ID=${price.id}`);
if (webhookSecret) console.log(`STRIPE_WEBHOOK_SECRET=${webhookSecret}`);
```

- [ ] **Step 2: Run it**

Run: `node --env-file=.env.local scripts/setup-stripe.mjs`
Expected: "Created product + price." / "Created webhook endpoint." / "Created portal configuration." and two env lines printed.

- [ ] **Step 3: Save the printed values**

Append the printed `STRIPE_PRICE_ID=…` and `STRIPE_WEBHOOK_SECRET=…` lines to `.env.local`. Do NOT commit them anywhere.

- [ ] **Step 4: Verify idempotency**

Run: `node --env-file=.env.local scripts/setup-stripe.mjs`
Expected: all three "already exists" messages; no duplicates created.

- [ ] **Step 5: Commit**

```bash
git add scripts/setup-stripe.mjs
git commit -m "feat: add idempotent stripe setup script (product, webhook, portal)"
```

---

### Task 4: Pure billing logic (`lib/billing.ts`)

**Files:**
- Create: `lib/billing.ts`
- Test: `lib/billing.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/billing.test.ts`:

```ts
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
    expect(toIso(1782000000)).toBe("2026-06-21T01:20:00.000Z");
    expect(toIso(null)).toBe(null);
    expect(toIso(undefined)).toBe(null);
  });
  it("formatDateLong renders '21 June 2026' style, em-dash for empty/junk", () => {
    expect(formatDateLong("2026-06-21T01:20:00.000Z")).toBe("21 June 2026");
    expect(formatDateLong(null)).toBe("—");
    expect(formatDateLong("not-a-date")).toBe("—");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/billing.test.ts`
Expected: FAIL — module `./billing` not found.

- [ ] **Step 3: Write the implementation**

Create `lib/billing.ts`:

```ts
import type { Plan } from "./auth";

// Pure billing logic for the Stripe paywall. No I/O — the routes own that.

export function planFromSubscriptionStatus(
  status: string | null | undefined
): Plan {
  return status === "active" || status === "trialing" ? "pro" : "free";
}

export type CheckoutSessionLike = {
  payment_status?: string | null;
  client_reference_id?: string | null;
  subscription?: string | { id: string } | null;
  customer?: string | { id: string } | null;
} | null;

// A returned checkout session may flip the caller to pro only when Stripe
// says it's paid AND it was created for this exact user — no replaying
// someone else's session_id.
export function isConfirmableSession(
  session: CheckoutSessionLike,
  userId: string | null | undefined
): boolean {
  return (
    !!session &&
    !!userId &&
    session.payment_status === "paid" &&
    session.client_reference_id === userId
  );
}

export function subscriptionIdOf(session: CheckoutSessionLike): string | null {
  const sub = session?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

export function customerIdOf(
  obj: { customer?: string | { id: string } | null } | null | undefined
): string | null {
  const c = obj?.customer;
  if (!c) return null;
  return typeof c === "string" ? c : c.id;
}

export type SubscriptionLike = {
  status?: string;
  start_date?: number;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  items?: { data?: Array<{ current_period_end?: number }> };
};

// Stripe moved current_period_end from the subscription to its items in
// newer API versions — check the item first, fall back to the legacy field.
export function renewalUnix(sub: SubscriptionLike): number | null {
  return (
    sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end ?? null
  );
}

export function toIso(unixSeconds: number | null | undefined): string | null {
  return typeof unixSeconds === "number"
    ? new Date(unixSeconds * 1000).toISOString()
    : null;
}

// "21 June 2026" — matches the shipped Figma subscription rows.
export function formatDateLong(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/billing.test.ts`
Expected: all passed. (If the `toIso` expected string is off, recompute with `node -e "console.log(new Date(1782000000*1000).toISOString())"` and fix the TEST, not the code.)

- [ ] **Step 5: Commit**

```bash
git add lib/billing.ts lib/billing.test.ts
git commit -m "feat: add pure billing logic (status mapping, session validation, dates)"
```

---

### Task 5: Webhook event handling (`lib/stripeEvents.ts`)

**Files:**
- Create: `lib/stripeEvents.ts`
- Test: `lib/stripeEvents.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/stripeEvents.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/stripeEvents.test.ts`
Expected: FAIL — module `./stripeEvents` not found.

- [ ] **Step 3: Write the implementation**

Create `lib/stripeEvents.ts`:

```ts
import {
  planFromSubscriptionStatus,
  subscriptionIdOf,
  customerIdOf,
} from "./billing";

// Narrow write interface so this stays pure and testable; the real
// implementation (service-role Supabase) lives in lib/supabase/admin.ts.
export type PlanStore = {
  setPlanByUserId(
    userId: string,
    patch: Record<string, unknown>
  ): Promise<void>;
  setPlanByCustomerId(
    customerId: string,
    patch: Record<string, unknown>
  ): Promise<void>;
};

export type StripeEventLike = {
  type: string;
  data: { object: any };
};

// Maps a verified Stripe event to a profiles write. Idempotent: every write
// sets absolute values, so redelivery is harmless. Unknown events are acked.
export async function handleStripeEvent(
  event: StripeEventLike,
  store: PlanStore
): Promise<void> {
  const obj = event.data.object;
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/stripeEvents.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Add the offline signature-verification test**

Create `lib/webhookSignature.test.ts` (no network, no real key — proves the verification we rely on in the route accepts good signatures and rejects tampering):

```ts
import { describe, it, expect } from "vitest";
import Stripe from "stripe";

// Offline: constructEvent/generateTestHeaderString never call the network,
// and the dummy key is never used for an API request.
const stripe = new Stripe("sk_test_offline_dummy_key_for_signature_test");
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
});
```

- [ ] **Step 6: Run the full suite**

Run: `npx vitest run`
Expected: all existing tests (82+) plus the new ones pass, none broken.

- [ ] **Step 7: Commit**

```bash
git add lib/stripeEvents.ts lib/stripeEvents.test.ts lib/webhookSignature.test.ts
git commit -m "feat: add stripe event-to-plan mapping and offline signature tests"
```

---

### Task 6: Stripe + service-role Supabase clients

**Files:**
- Create: `lib/stripe.ts`
- Create: `lib/supabase/admin.ts`

These are thin I/O wrappers — no unit tests (house pattern: pure logic is tested, I/O is live-verified). Type-check is the gate.

- [ ] **Step 1: Create `lib/stripe.ts`**

```ts
import Stripe from "stripe";
import { requiredEnv } from "./env";

// Server-only Stripe client. Lazy so builds don't require the key.
let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(requiredEnv("STRIPE_SECRET_KEY"));
  }
  return stripe;
}
```

- [ ] **Step 2: Create `lib/supabase/admin.ts`**

```ts
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
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/stripe.ts lib/supabase/admin.ts
git commit -m "feat: add stripe client and service-role plan store"
```

---

### Task 7: `POST /api/stripe/checkout`

**Files:**
- Create: `app/api/stripe/checkout/route.ts`

- [ ] **Step 1: Write the route**

Create `app/api/stripe/checkout/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireSession } from "../../../../lib/apiAuth";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getStripe } from "../../../../lib/stripe";
import { requiredEnv } from "../../../../lib/env";
import { planFromProfile } from "../../../../lib/auth";

export async function POST() {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, stripe_customer_id")
      .eq("id", user.id)
      .single();
    if (planFromProfile(profile) === "pro") {
      return NextResponse.json({ error: "already pro" }, { status: 409 });
    }

    const stripe = getStripe();
    let customerId = profile?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      const admin = createAdminClient();
      const { error } = await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
      if (error) throw new Error(`profiles update failed: ${error.message}`);
    }

    const appUrl = requiredEnv("NEXT_PUBLIC_APP_URL");
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: requiredEnv("STRIPE_PRICE_ID"), quantity: 1 }],
      client_reference_id: user.id,
      success_url: `${appUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/upgrade`,
    });
    if (!session.url) throw new Error("checkout session has no url");
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "checkout failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify the auth gate locally**

Run (dev server: `npm run dev` in tmux/background if not already running; note local `.env.local` must have the Stripe vars from Task 3):

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/stripe/checkout
```

Expected: `401` (logged-out callers are rejected; the happy path is verified in the live sweep, Task 14).

- [ ] **Step 4: Commit**

```bash
git add app/api/stripe/checkout/route.ts
git commit -m "feat: add stripe checkout session route"
```

---

### Task 8: `POST /api/stripe/confirm` and `POST /api/stripe/webhook`

**Files:**
- Create: `app/api/stripe/confirm/route.ts`
- Create: `app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Write the confirm route**

Create `app/api/stripe/confirm/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireSession } from "../../../../lib/apiAuth";
import { createClient } from "../../../../lib/supabase/server";
import { planStore } from "../../../../lib/supabase/admin";
import { getStripe } from "../../../../lib/stripe";
import {
  isConfirmableSession,
  subscriptionIdOf,
  customerIdOf,
} from "../../../../lib/billing";

// Instant path: the success redirect hands us a session_id; verify it with
// Stripe (paid + created for THIS user) before flipping plan -> pro.
// Idempotent — re-confirming is a no-op success.
export async function POST(req: Request) {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const body = await req.json().catch(() => null);
    const sessionId =
      typeof body?.sessionId === "string" ? body.sessionId : "";
    if (!sessionId) {
      return NextResponse.json({ error: "missing sessionId" }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (!isConfirmableSession(session, user.id)) {
      return NextResponse.json({ error: "not confirmable" }, { status: 403 });
    }

    await planStore().setPlanByUserId(user.id, {
      plan: "pro",
      stripe_customer_id: customerIdOf(session),
      stripe_subscription_id: subscriptionIdOf(session),
    });
    return NextResponse.json({ plan: "pro" });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "confirm failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Write the webhook route**

Create `app/api/stripe/webhook/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getStripe } from "../../../../lib/stripe";
import { requiredEnv } from "../../../../lib/env";
import { planStore } from "../../../../lib/supabase/admin";
import { handleStripeEvent } from "../../../../lib/stripeEvents";

// Stripe calls this — no user session. Authentication is the signature
// check against the raw body (read text BEFORE any JSON parsing).
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }
  const rawBody = await req.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      requiredEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    await handleStripeEvent(event, planStore());
    return NextResponse.json({ received: true });
  } catch (e: any) {
    // 500 so Stripe retries — a plan change must never be silently dropped.
    return NextResponse.json(
      { error: e?.message ?? "webhook failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Type-check and run the suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no type errors, all tests pass.

- [ ] **Step 4: Verify gates locally**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/stripe/confirm
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/stripe/webhook -d '{}'
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/stripe/webhook -H "stripe-signature: t=1,v1=bogus" -d '{}'
```

Expected: `401` (confirm, logged out), `400` (webhook, missing signature), `400` (webhook, invalid signature).

- [ ] **Step 5: Commit**

```bash
git add app/api/stripe/confirm/route.ts app/api/stripe/webhook/route.ts
git commit -m "feat: add stripe confirm and signature-verified webhook routes"
```

---

### Task 9: `POST /api/stripe/portal` and `GET /api/stripe/subscription`

**Files:**
- Create: `app/api/stripe/portal/route.ts`
- Create: `app/api/stripe/subscription/route.ts`

- [ ] **Step 1: Write the portal route**

Create `app/api/stripe/portal/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireSession } from "../../../../lib/apiAuth";
import { createClient } from "../../../../lib/supabase/server";
import { getStripe } from "../../../../lib/stripe";
import { requiredEnv } from "../../../../lib/env";

export async function POST() {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();
    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "no billing account" }, { status: 400 });
    }
    const portal = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${requiredEnv("NEXT_PUBLIC_APP_URL")}/subscription`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "portal failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Write the subscription route**

Create `app/api/stripe/subscription/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireSession } from "../../../../lib/apiAuth";
import { createClient } from "../../../../lib/supabase/server";
import { getStripe } from "../../../../lib/stripe";
import { planFromProfile } from "../../../../lib/auth";
import { renewalUnix, toIso } from "../../../../lib/billing";

// Real data for the /subscription page. Pro users without a Stripe
// subscription (the seeded pro@kira.demo) get plan:'pro' with null dates —
// the page renders em-dashes for those.
export async function GET() {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, stripe_subscription_id")
      .eq("id", user.id)
      .single();
    const plan = planFromProfile(profile);
    if (plan !== "pro" || !profile?.stripe_subscription_id) {
      return NextResponse.json({
        plan,
        startDate: null,
        nextRenewal: null,
        cancelAtPeriodEnd: false,
        priceUsd: 2,
      });
    }
    const sub = await getStripe().subscriptions.retrieve(
      profile.stripe_subscription_id
    );
    const item = (sub as any).items?.data?.[0];
    const unitAmount = item?.price?.unit_amount;
    return NextResponse.json({
      plan: "pro",
      status: sub.status,
      startDate: toIso((sub as any).start_date ?? null),
      nextRenewal: toIso(renewalUnix(sub as any)),
      cancelAtPeriodEnd: Boolean((sub as any).cancel_at_period_end),
      priceUsd: typeof unitAmount === "number" ? unitAmount / 100 : 2,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "subscription lookup failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Type-check and verify gates**

Run: `npx tsc --noEmit` — expected: no errors. Then:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/stripe/portal
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/stripe/subscription
```

Expected: `401` and `401`.

- [ ] **Step 4: Commit**

```bash
git add app/api/stripe/portal/route.ts app/api/stripe/subscription/route.ts
git commit -m "feat: add stripe portal and subscription detail routes"
```

---

### Task 10: Wire the `/upgrade` CTA

**Files:**
- Modify: `app/upgrade/page.tsx`
- Modify: `app/upgrade/upgrade.module.css` (append one class)

- [ ] **Step 1: Rewrite `app/upgrade/page.tsx`**

Replace the whole file with (visuals unchanged — only the stub `startCheckout` and CTA wiring change):

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlan } from "../../lib/usePlan";
import styles from "./upgrade.module.css";

const FEATURES: Array<[string, string]> = [
  ["Enhancement", "Find more suggestions similar to your saves"],
  ["Verification", "Validate content shared by creators online"],
  ["Brief BuilderAuto", "Generates a structured brief from all saves on a topic"],
  ["Knowledge Gaps", "Shows what you haven't saved, the blind spots in your topics"],
  ["Trend Alerts", "Notifies you when a topic in your KB is spiking online (via Exa)"],
  ["Stale Content Flag", "Marks saves that are outdated based on newer web info"],
];

export default function UpgradePage() {
  const router = useRouter();
  const { plan } = usePlan();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (plan === "pro") {
      router.push("/subscription");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/stripe/checkout", { method: "POST" });
      if (r.status === 409) {
        router.push("/subscription");
        return;
      }
      const data = await r.json().catch(() => null);
      if (!r.ok || !data?.url) {
        throw new Error(data?.error ?? "checkout failed");
      }
      window.location.assign(data.url);
    } catch {
      setError("Couldn't start checkout — try again.");
      setBusy(false);
    }
  }

  return (
    <main className={styles.wrap}>
      <button className={styles.back} onClick={() => router.back()} aria-label="Back">‹</button>
      <h1 className={styles.title}>Upgrade your KIRA</h1>
      <h2 className={styles.subtitle}>Want more from what you save?</h2>
      <p className={styles.lead}>
        Upgrade your KIRA to get advanced search and unlock all our features!
      </p>
      <ul className={styles.list}>
        {FEATURES.map(([k, v]) => (
          <li key={k} className={styles.item}>
            <span className={styles.check} aria-hidden="true">✓</span>
            <span><strong>{k}</strong> - {v}</span>
          </li>
        ))}
      </ul>
      <button className={styles.cta} onClick={startCheckout} disabled={busy}>
        {busy ? "Redirecting…" : plan === "pro" ? "Manage Subscription" : "Sign Up"}
      </button>
      {error && (
        <p className={styles.error} role="alert">{error}</p>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Append the error style**

Append to `app/upgrade/upgrade.module.css`:

```css
.error {
  margin-top: 10px;
  text-align: center;
  font-size: 13px;
  color: #d4332b;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke (logged in as free@kira.demo on localhost:3000)**

Visit `/upgrade`, tap "Sign Up" — expected: button shows "Redirecting…", then the browser lands on `checkout.stripe.com` showing **KIRA Pro, $2.00 per month**. Do NOT pay yet (the full flow is Task 14). Navigate back.

- [ ] **Step 5: Commit**

```bash
git add app/upgrade/page.tsx app/upgrade/upgrade.module.css
git commit -m "feat: wire upgrade CTA to stripe checkout"
```

---

### Task 11: `/upgrade/success` page

**Files:**
- Create: `app/upgrade/success/page.tsx`
- Create: `app/upgrade/success/success.module.css`

- [ ] **Step 1: Create the page**

Create `app/upgrade/success/page.tsx`:

```tsx
"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./success.module.css";

type State = "confirming" | "pro" | "error";

function SuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const ran = useRef(false); // StrictMode double-invoke guard (same pattern as the splash)
  const [state, setState] = useState<State>("confirming");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!sessionId) {
      router.replace("/upgrade");
      return;
    }
    (async () => {
      try {
        const r = await fetch("/api/stripe/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        setState(r.ok ? "pro" : "error");
      } catch {
        setState("error");
      }
    })();
  }, [sessionId, router]);

  if (state === "confirming") {
    return (
      <main className={styles.wrap}>
        <p className={styles.confirming}>Confirming your payment…</p>
      </main>
    );
  }
  if (state === "error") {
    return (
      <main className={styles.wrap}>
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.lead}>
          We couldn&apos;t confirm your payment. If you were charged, your plan
          will update automatically in a moment.
        </p>
        <button className={styles.cta} onClick={() => router.push("/upgrade")}>
          Back to Upgrade
        </button>
      </main>
    );
  }
  return (
    <main className={styles.wrap}>
      <div className={styles.party} aria-hidden="true">🎉</div>
      <h1 className={styles.title}>You&apos;re PRO</h1>
      <p className={styles.lead}>
        Welcome to KIRA Pro — Go Deeper, trend alerts and the whole toolkit are
        unlocked.
      </p>
      <button className={styles.cta} onClick={() => router.push("/")}>
        Start exploring
      </button>
    </main>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  );
}
```

- [ ] **Step 2: Create the styles**

Create `app/upgrade/success/success.module.css` (matches the upgrade screen's language — gradient comes from the global body styles):

```css
.wrap {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}

.party {
  font-size: 56px;
  margin-bottom: 12px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #101a24;
  margin: 0 0 10px;
}

.lead {
  font-size: 15px;
  line-height: 1.5;
  color: #3a4654;
  max-width: 320px;
  margin: 0 0 24px;
}

.confirming {
  font-size: 15px;
  color: #3a4654;
}

.cta {
  appearance: none;
  border: 0;
  border-radius: 999px;
  padding: 14px 36px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: #d4332b;
  cursor: pointer;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Smoke the guard paths locally**

Visit `http://localhost:3000/upgrade/success` (no `session_id`, logged in) — expected: immediate redirect to `/upgrade`. Visit `http://localhost:3000/upgrade/success?session_id=cs_test_bogus` — expected: the error state renders (confirm returns 4xx/5xx), no plan change.

- [ ] **Step 5: Commit**

```bash
git add app/upgrade/success/
git commit -m "feat: add upgrade success page with session confirm"
```

---

### Task 12: Real data on `/subscription`

**Files:**
- Modify: `app/subscription/page.tsx`
- Modify: `app/subscription/subscription.module.css` (append two classes)

- [ ] **Step 1: Rewrite `app/subscription/page.tsx`**

Replace the whole file with (same layout/classes; hardcoded rows become fetched values):

```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "../../components/TopBar";
import BottomNav from "../../components/BottomNav";
import { formatDateLong } from "../../lib/billing";
import styles from "./subscription.module.css";

type SubView = {
  plan: "free" | "pro";
  priceUsd?: number;
  startDate?: string | null;
  nextRenewal?: string | null;
  cancelAtPeriodEnd?: boolean;
};

export default function SubscriptionPage() {
  const router = useRouter();
  const [sub, setSub] = useState<SubView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await fetch("/api/stripe/subscription", { cache: "no-store" });
        if (!r.ok) throw new Error("fetch failed");
        const data: SubView = await r.json();
        if (!active) return;
        if (data.plan !== "pro") {
          router.replace("/upgrade");
          return;
        }
        setSub(data);
      } catch {
        if (active) setError("Couldn't load your subscription.");
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  async function cancelSubscription() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await r.json().catch(() => null);
      if (!r.ok || !data?.url) throw new Error(data?.error ?? "portal failed");
      window.location.assign(data.url);
    } catch {
      setError("Couldn't open the billing portal — try again.");
      setBusy(false);
    }
  }

  const price = sub ? `$${sub.priceUsd ?? 2}` : "—";
  const details: Array<[string, string]> = [
    ["Plan", "Monthly plan"],
    ["Start Date", sub ? formatDateLong(sub.startDate) : "—"],
    ["Next Renewal", sub ? formatDateLong(sub.nextRenewal) : "—"],
    ["Amount Paid", price],
  ];

  return (
    <main className={styles.wrap}>
      <TopBar />
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.back()} aria-label="Back">‹</button>
        <h1 className={styles.title}>Subscription Details</h1>
      </header>

      <section className={styles.planCard}>
        <div>
          <div className={styles.planName}>Your plan</div>
          <div className={styles.planSub}>Monthly payment</div>
        </div>
        <div className={styles.planPrice}>{price}</div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHead}>Subscription Details</div>
        {details.map(([k, v]) => (
          <div key={k} className={styles.row}>
            <span className={styles.rowLabel}>{k}</span>
            <span className={styles.rowValue}>{v}</span>
          </div>
        ))}
      </section>

      <p className={styles.disclaimer}>Disclaimer: All plans can be cancelled at any time.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.primary} onClick={() => router.push("/")}>Return Home</button>
      {sub?.cancelAtPeriodEnd ? (
        <p className={styles.cancelNote}>
          Cancels on {formatDateLong(sub.nextRenewal)}
        </p>
      ) : (
        <button className={styles.cancel} onClick={cancelSubscription} disabled={busy || !sub}>
          {busy ? "Opening portal…" : "Cancel Subscription"}
        </button>
      )}
      <BottomNav />
    </main>
  );
}
```

- [ ] **Step 2: Append styles**

Append to `app/subscription/subscription.module.css`:

```css
.error {
  text-align: center;
  font-size: 13px;
  color: #d4332b;
  margin: 8px 0 0;
}

.cancelNote {
  text-align: center;
  font-size: 14px;
  color: #3a4654;
  margin: 12px 0 0;
}
```

- [ ] **Step 3: Type-check and full suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: clean.

- [ ] **Step 4: Smoke locally**

Logged in as `free@kira.demo`, visit `/subscription` — expected: redirect to `/upgrade`. Logged in as `pro@kira.demo` (no Stripe sub), visit `/subscription` — expected: page renders with `$2`, em-dash dates, cancel button present (portal will 400 for them — acceptable: seeded account, not in the demo path).

- [ ] **Step 5: Commit**

```bash
git add app/subscription/page.tsx app/subscription/subscription.module.css
git commit -m "feat: show real stripe subscription data and portal cancel"
```

---

### Task 13: `scripts/reset-demo.mjs`

**Files:**
- Create: `scripts/reset-demo.mjs`

- [ ] **Step 1: Write the script**

Create `scripts/reset-demo.mjs`:

```js
// Reset the demo account so the full pay-flow can be rehearsed repeatedly.
// Cancels any active test subscription on free@kira.demo's Stripe customer
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

const DEMO_EMAIL = "free@kira.demo";
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const stripe = new Stripe(stripeKey);

const { data: list, error: listErr } = await admin.auth.admin.listUsers();
if (listErr) {
  console.error("listUsers failed:", listErr.message);
  process.exit(1);
}
const user = list?.users?.find((u) => u.email === DEMO_EMAIL);
if (!user) {
  console.error(`No auth user found for ${DEMO_EMAIL}`);
  process.exit(1);
}

const { data: profile, error: profErr } = await admin
  .from("profiles")
  .select("plan, stripe_customer_id")
  .eq("id", user.id)
  .single();
if (profErr) {
  console.error("profile read failed:", profErr.message);
  process.exit(1);
}

if (profile.stripe_customer_id) {
  const subs = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    status: "all",
    limit: 100,
  });
  const live = subs.data.filter((s) =>
    ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(s.status)
  );
  for (const s of live) {
    await stripe.subscriptions.cancel(s.id);
    console.log(`Cancelled subscription ${s.id} (${s.status}).`);
  }
  if (!live.length) console.log("No live subscriptions to cancel.");
} else {
  console.log("No Stripe customer on the demo profile yet.");
}

const { error: updErr } = await admin
  .from("profiles")
  .update({ plan: "free", stripe_subscription_id: null })
  .eq("id", user.id);
if (updErr) {
  console.error("profile reset failed:", updErr.message);
  process.exit(1);
}
console.log(`${DEMO_EMAIL} reset: plan=free, subscription cleared. Demo is rearmed.`);
```

- [ ] **Step 2: Run it (pre-payment state — proves idempotency on a clean slate)**

Run: `node --env-file=.env.local scripts/reset-demo.mjs`
Expected: "No Stripe customer on the demo profile yet." (or "No live subscriptions to cancel.") then "free@kira.demo reset: plan=free… Demo is rearmed." Exit code 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/reset-demo.mjs
git commit -m "feat: add demo reset script (cancel sub, plan back to free)"
```

---

### Task 14: Vercel env, deploy, full live verification

**Files:** none (operations).

- [ ] **Step 1: Add the new env vars to Vercel production**

For each of `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL` (values from `.env.local`; `NEXT_PUBLIC_APP_URL=https://kira-pwa-rho.vercel.app`):

```bash
grep '^STRIPE_SECRET_KEY=' .env.local | cut -d= -f2- | tr -d '\n' | npx vercel env add STRIPE_SECRET_KEY production
grep '^STRIPE_WEBHOOK_SECRET=' .env.local | cut -d= -f2- | tr -d '\n' | npx vercel env add STRIPE_WEBHOOK_SECRET production
grep '^STRIPE_PRICE_ID=' .env.local | cut -d= -f2- | tr -d '\n' | npx vercel env add STRIPE_PRICE_ID production
grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2- | tr -d '\n' | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
printf 'https://kira-pwa-rho.vercel.app' | npx vercel env add NEXT_PUBLIC_APP_URL production
```

Expected: each prints "Added Environment Variable". (If one already exists, `npx vercel env rm <NAME> production -y` first.)

- [ ] **Step 2: Build locally, then deploy**

```bash
npm run build && npx vercel --prod
```

Expected: build clean; deploy returns the production URL (kira-pwa-rho.vercel.app).

- [ ] **Step 3: Live sweep — the full demo flow (Playwright MCP browser, 390px viewport)**

1. Run `node --env-file=.env.local scripts/reset-demo.mjs` (re-arm).
2. Log in at kira-pwa-rho.vercel.app as `free@kira.demo` / the seed password → FREE badge visible.
3. Open chat, tap **Go Deeper • Get it with PRO** → lands on `/upgrade`.
4. Tap **Sign Up** → redirects to `checkout.stripe.com` showing KIRA Pro $2.00/month.
5. Fill the test card: `4242 4242 4242 4242`, expiry `12/34`, CVC `123`, any name/postcode → Pay.
6. Lands on `/upgrade/success` → "You're PRO 🎉" → tap **Start exploring** → home shows **PRO** badge.
7. Tap Go Deeper in chat → real "FROM THE WEB" Exa results render (note: requires the orchestrator tunnel to be up — see the iteration-3 resume checklist if it isn't).
8. Visit `/subscription` → real Start Date (today) and Next Renewal (one month out), `$2`.
9. Tap **Cancel Subscription** → Stripe billing portal opens → confirm cancel (at period end) → return → `/subscription` shows "Cancels on <date>".
10. Webhook check: in Stripe, the endpoint shows recent `200`s (`curl -s -u "$STRIPE_SECRET_KEY:" "https://api.stripe.com/v1/events?limit=5"` to list recent events; the Supabase profile should still be plan=pro because at-period-end cancel only fires `subscription.updated` with status active).
11. Hard downgrade proof: run `node --env-file=.env.local scripts/reset-demo.mjs` — this cancels immediately, which fires `customer.subscription.deleted` → verify via MCP `execute_sql`: `select plan, stripe_subscription_id from public.profiles where email = 'free@kira.demo';` — expected `free`, `null` (the script also forces these — to isolate the webhook, check Stripe's webhook delivery log for a 200 on the deleted event).
12. Repeat steps 2–6 once more end-to-end to prove the demo is re-armable.

Expected: every step passes; screenshots captured for the record.

- [ ] **Step 4: Commit any fixes, then merge/push checkpoint**

If the sweep forced fixes, commit them individually (`fix: …`). Then confirm with the user before pushing to GitHub (house habit: push after live verification).

---

### Task 15: Docs + memory

**Files:**
- Modify: `docs/superpowers/specs/2026-06-10-kira-stripe-paywall-design.md` (only if reality diverged)
- Memory: `/root/.claude/projects/-root-hackathon/memory/`

- [ ] **Step 1: Reconcile the spec** — if any decision changed during implementation (env names, portal config, page copy), update the spec so it stays the source of truth, and commit with `docs: reconcile stripe paywall spec with implementation`.

- [ ] **Step 2: Write the iteration memory** — new memory file `kira-iteration12-stripe-paywall.md` (+ MEMORY.md index line): what shipped, env var list (names only, no values), the reset-demo script, demo script steps, gotchas found, and the post-demo rotation list (Stripe test key — it was shared in chat — plus the already-flagged Supabase + Figma PATs).

---

## Demo-day quick reference (put in the memory file too)

- Re-arm: `node --env-file=.env.local scripts/reset-demo.mjs`
- Account: `free@kira.demo` (password = seed password from iteration 7)
- Test card: `4242 4242 4242 4242`, `12/34`, `123`
- Fallback if anything breaks live: log in as `pro@kira.demo` (permanently pro)
- After the demo: rotate the Stripe test key, Supabase PAT, Figma PAT
