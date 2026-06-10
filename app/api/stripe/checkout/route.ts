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
      const customer = await stripe.customers.create(
        {
          email: user.email ?? undefined,
          metadata: { supabase_user_id: user.id },
        },
        { idempotencyKey: `create-customer-${user.id}` }
      );
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
  } catch (e) {
    console.error("[stripe/checkout]", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "checkout failed" }, { status: 500 });
  }
}
