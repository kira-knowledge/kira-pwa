import type { Plan } from "./auth";

// Pure billing logic for the Stripe paywall. No I/O — the routes own that.

export function planFromSubscriptionStatus(
  status: string | null | undefined
): Plan {
  return status === "active" || status === "trialing" ? "pro" : "free";
}

// Wider than CheckoutSessionLike: customer also appears on subscription objects.

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

// Wider than CheckoutSessionLike: customer also appears on subscription objects.
export function customerIdOf(
  obj: { customer?: string | { id: string } | null } | null | undefined
): string | null {
  const c = obj?.customer;
  if (!c) return null;
  return typeof c === "string" ? c : c.id;
}

export type SubscriptionLike = {
  status?: string;
  // start_date + cancel_at_period_end are read by the subscription detail route.
  start_date?: number;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  items?: { data?: Array<{ current_period_end?: number }> };
};

// Stripe moved current_period_end from the subscription to its items in
// newer API versions — check the item first, fall back to the legacy field.
export function renewalUnix(
  sub: SubscriptionLike | null | undefined
): number | null {
  if (!sub) return null;
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
