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
  // App Router gives us the raw body via req.text() — no Pages-style
  // bodyParser config needed (adding one would break signature verification).
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
  } catch (e) {
    // 500 so Stripe retries — a plan change must never be silently dropped.
    console.error("[stripe/webhook]", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "webhook failed" }, { status: 500 });
  }
}
