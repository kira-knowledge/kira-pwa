# KIRA Stripe Paywall — Design Spec

**Date:** 2026-06-10
**Iteration:** 12 (builds on iteration 7 auth foundation + iteration 10 upgrade/subscription screens)
**Goal:** Make the FREE→PRO upgrade real with Stripe (test mode), demo-ready for the SuperAI 2026 pitch.

## Summary

Wire the existing `/upgrade` and `/subscription` stub screens to real Stripe:
hosted Stripe Checkout (test mode, $2/month subscription), instant plan flip to
PRO on return, Stripe Customer Portal for cancellation, and a webhook that keeps
`profiles.plan` truthful (downgrades on cancel). The only feature gate remains
**Go Deeper** (free → `/upgrade`, pro → Exa web search) — unchanged logic, real
payoff after payment.

## Locked decisions

1. **Hosted Stripe Checkout, test mode** — server creates the Checkout Session
   and redirects to its URL; pay with test card `4242 4242 4242 4242`. No
   Stripe.js / publishable key needed.
2. **Free limits: Go Deeper only.** No save caps, no chat caps. The existing
   gate (free → `/upgrade`) is the single paywall touchpoint.
3. **Cancel via Stripe Customer Portal** (hosted). No in-app cancel logic.
4. **Plan sync: redirect-verify + webhook.** Success redirect verifies the
   session and flips `plan → pro` instantly (demo speed); the webhook is the
   source of truth for cancellations/renewals (`plan → free` on subscription
   deletion).
5. **Stripe account:** user-provided test-mode secret key, account
   `acct_1SV6niIo0vIVRU0c` (US/USD, clean slate). Key lives ONLY in env vars
   (`.env.local` + Vercel), never in code or docs. **Rotate after the demo**
   (it was shared in chat).
6. **Price:** $2.00/month USD — matches the shipped `/subscription` Figma UI.
7. Orchestrator, `items.json`, Dify, S3: **untouched.** Everything ships in
   kira-pwa.

## Stripe-side setup (done programmatically via API, not the dashboard)

- Product **"KIRA Pro"** + recurring price **$2.00/month USD**. Price id goes
  into env as `STRIPE_PRICE_ID` (env, not hardcoded).
- **Webhook endpoint** `https://kira-pwa-rho.vercel.app/api/stripe/webhook`
  subscribed to: `checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted`. Signing
  secret → `STRIPE_WEBHOOK_SECRET`.
- **Customer Portal configuration:** cancellation enabled (at period end),
  no plan switching (single price), headline/branding defaults.

User prep in Stripe: none beyond the key already provided.

## Data model

One Supabase migration on `public.profiles` (project `njopgaaoazucrpwvdzre`):

```sql
alter table public.profiles
  add column stripe_customer_id text,
  add column stripe_subscription_id text;
```

- Both nullable; no RLS change needed (own-row read policy already exists;
  writes happen server-side via service role only).
- `plan` (`free|pro`) remains the **single source of truth for gating**. Stripe
  events only write to it; UI and API gates keep reading it as today.

## API routes (kira-pwa, Next.js 14 app router)

All routes use the existing fail-closed patterns from iteration 7
(`requireSession()` → 401; try/catch → error response, never silently open).
Stripe SDK: official `stripe` npm package, secret key from
`process.env.STRIPE_SECRET_KEY` (throw at module init if missing).

### `POST /api/stripe/checkout`
- Requires session. Loads the caller's profile.
- If `plan === 'pro'` → 409 (client routes to `/subscription`).
- Create-or-reuse Stripe customer: if `stripe_customer_id` is null, create a
  customer (email = user email, metadata `supabase_user_id`) and persist the id
  on the profile (service role).
- Creates a Checkout Session: `mode: 'subscription'`, the $2 price,
  `client_reference_id: <supabase user id>`,
  `success_url: <APP_URL>/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
  `cancel_url: <APP_URL>/upgrade`.
- Returns `{ url }`; client redirects with `window.location.assign`.

### `POST /api/stripe/confirm`
- Requires session. Body: `{ sessionId }` (validated non-empty string).
- Retrieves the Checkout Session from Stripe. Valid only if:
  `payment_status === 'paid'` (or `status === 'complete'`) AND
  `client_reference_id` equals the caller's user id. Otherwise 400/403.
- On valid: service-role update `plan = 'pro'`,
  `stripe_subscription_id = session.subscription`. Idempotent (re-confirming an
  already-pro user is a no-op success).
- Returns `{ plan: 'pro' }`.

### `POST /api/stripe/portal`
- Requires session. 400 if the profile has no `stripe_customer_id`.
- Creates a Billing Portal session (`return_url: <APP_URL>/subscription`),
  returns `{ url }`.

### `POST /api/stripe/webhook`
- **No session** (Stripe calls it). Verifies the `stripe-signature` header
  against `STRIPE_WEBHOOK_SECRET` using the raw request body
  (`await req.text()` before any JSON parse); 400 on bad signature.
- `customer.subscription.deleted` → find profile by `stripe_customer_id`,
  set `plan = 'free'`, clear `stripe_subscription_id`.
- `customer.subscription.updated` → sync: status in
  `{active, trialing}` → `pro`; status in `{canceled, unpaid,
  incomplete_expired}` → `free`. (`cancel_at_period_end = true` with an active
  status stays `pro` until the deletion event — honest "at period end"
  behavior.)
- `checkout.session.completed` → same flip as confirm (covers the case where
  the user never returns to the success page).
- Unknown event types → 200 (ack, ignore). All handlers idempotent. Returns
  200 quickly; Supabase errors → 500 so Stripe retries.

### `GET /api/stripe/subscription`
- Requires session. For free users / no subscription → `{ plan: 'free' }`.
- For pro: retrieves the subscription from Stripe and returns
  `{ plan: 'pro', priceUsd: 2, startDate, nextRenewal, cancelAtPeriodEnd,
  status }` (dates ISO; client formats for display).

## Pages

### `/upgrade` (existing, wire the stub)
- CTA (`startCheckout`) → `POST /api/stripe/checkout` → redirect to `url`.
- Loading state on the button ("Redirecting…", disabled); error state shows a
  small inline message ("Couldn't start checkout — try again.").
- If the viewer is already pro (via existing `usePlan`) → replace CTA behavior
  with navigation to `/subscription`.
- Visuals unchanged (Figma-locked).

### `/upgrade/success` (new)
- Reads `session_id` from the query, calls `POST /api/stripe/confirm` on mount
  (guard against StrictMode double-invoke — same `useRef` pattern as the
  splash).
- Success: celebratory "You're PRO 🎉 / Welcome to KIRA Pro" moment in the
  app's visual language + a "Start exploring" button → `/`. TopBar badge reads
  PRO on arrival (plan re-fetched).
- Failure (invalid/foreign/unpaid session): plain error + link back to
  `/upgrade`. No plan change.
- Missing `session_id` → redirect to `/upgrade`.

### `/subscription` (existing, make it real)
- On load fetch `GET /api/stripe/subscription`; replace the hardcoded rows
  (Plan "Monthly plan", start date, next renewal, "$2") with real values.
- Free users → client-redirect to `/upgrade`.
- "Cancel Subscription" → `POST /api/stripe/portal` → redirect to portal.
  If `cancelAtPeriodEnd`, show a "Cancels on <date>" note instead of the
  cancel button being the primary affordance.
- Loading skeleton: keep the card layout, dim placeholder values.

### Untouched
- Go Deeper gating (free → `/upgrade`, pro → Exa) — already shipped, already
  correct; it becomes the demo's before/after moment with zero changes.
- Login, signup, profile, home, chat, ingest paths.

## Environment

| Var | Where | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | `.env.local` + Vercel | server-only; never `NEXT_PUBLIC` |
| `STRIPE_WEBHOOK_SECRET` | `.env.local` + Vercel | from the created webhook endpoint; local testing uses the Stripe CLI's own secret |
| `STRIPE_PRICE_ID` | `.env.local` + Vercel | the $2/month price |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` (already) + **Vercel (new)** | needed server-side for plan writes from confirm/webhook |
| `NEXT_PUBLIC_APP_URL` | `.env.local` + Vercel | base for success/cancel/return URLs (`https://kira-pwa-rho.vercel.app` in prod) |

All routes throw a clear startup error if their required vars are missing.

## Demo script (~90s) + repeatability

1. Logged in as `free@kira.demo` — FREE badge visible.
2. Chat over saves → tap **Go Deeper** → paywall (`/upgrade`).
3. Tap upgrade → Stripe Checkout → `4242 4242 4242 4242`, any future expiry,
   any CVC → pay $2.
4. Land on `/upgrade/success` → "You're PRO 🎉" → home shows **PRO** badge.
5. Go Deeper again → live "FROM THE WEB" Exa results.
6. `/subscription` shows the real renewal date; optional encore: cancel in the
   Stripe portal → webhook downgrades to FREE.

**`scripts/reset-demo.mjs`** (local, service-role + Stripe key from env):
cancels any active test subscription on `free@kira.demo`'s Stripe customer
(immediate cancel) and resets `plan = 'free'`, clearing
`stripe_subscription_id`. Idempotent; makes the full payment flow infinitely
rehearsable. `pro@kira.demo` stays a permanently-pro fallback account in case
of stage-day disaster.

## Error handling & security

- Webhook: signature verification mandatory; reject (400) on failure.
- Confirm: session must be paid AND owned (`client_reference_id` match) — no
  upgrading by replaying someone else's session id.
- All other routes behind `requireSession()`; everything fails closed.
- No secrets in client bundles, code, or this spec. Stripe test key rotated
  after the demo (along with the already-flagged Supabase + Figma PATs).
- Plan writes only via the server-side service-role client; RLS still blocks
  client-side writes to `profiles`.

## Testing

- **Vitest units** (house pattern, pure logic): subscription-status → plan
  mapping; checkout-session validation predicate (paid + owner match); date
  formatting for the subscription rows; env-var guard helpers.
- **Webhook handler test** using `stripe.webhooks.generateTestHeaderString`
  to construct signed payloads (valid event → plan change called; bad
  signature → 400; unknown event → 200).
- **Live verification (the real gate):** on the deployed app, complete an
  actual end-to-end test checkout in the browser (Playwright through Stripe's
  hosted test checkout), confirm PRO badge + Go Deeper unlock + real
  `/subscription` data, run a portal cancel, watch the webhook downgrade, then
  run `reset-demo.mjs` and verify the flow again from scratch.

## Out of scope

- Save/chat limits for free users; proration/plan tiers; live-mode payments;
  invoices/receipts UI; signup-time checkout; orchestrator changes.
