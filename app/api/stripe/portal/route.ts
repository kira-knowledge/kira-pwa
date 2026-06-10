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
  } catch (e) {
    console.error("[stripe/portal]", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "portal failed" }, { status: 500 });
  }
}
