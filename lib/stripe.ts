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
