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
  } catch (e) {
    console.error("[stripe/confirm]", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "confirm failed" }, { status: 500 });
  }
}
