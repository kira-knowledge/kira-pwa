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
    const item = sub.items?.data?.[0];
    const unitAmount = item?.price?.unit_amount;
    return NextResponse.json({
      plan: "pro",
      status: sub.status,
      startDate: toIso(sub.start_date ?? null),
      nextRenewal: toIso(renewalUnix(sub)),
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      priceUsd: typeof unitAmount === "number" ? unitAmount / 100 : 2,
    });
  } catch (e) {
    // Stale subscription id (e.g. cancelled + cleared out-of-band) must not
    // 500 the page — degrade to the no-dates payload instead.
    if ((e as { code?: string })?.code === "resource_missing") {
      return NextResponse.json({
        plan: "pro",
        startDate: null,
        nextRenewal: null,
        cancelAtPeriodEnd: false,
        priceUsd: 2,
      });
    }
    console.error(
      "[stripe/subscription]",
      e instanceof Error ? e.message : String(e)
    );
    return NextResponse.json(
      { error: "subscription lookup failed" },
      { status: 500 }
    );
  }
}
