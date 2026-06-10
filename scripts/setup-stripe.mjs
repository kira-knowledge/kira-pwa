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
