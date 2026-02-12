import Stripe from 'stripe';

/**
 * Lazy-initialized Stripe client singleton.
 * Uses API version pinned by SDK v20.3.1 (2026-01-28.clover).
 * Lazy initialization avoids build-time errors when env vars are not set.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

// Re-export for convenience as named export
export { Stripe };
