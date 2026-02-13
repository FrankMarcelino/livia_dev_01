import { getStripe } from './client';
import { getOrCreateStripeCustomer } from './helpers';

/**
 * Creates a Stripe SetupIntent for saving a payment method.
 * Returns client_secret for use with Stripe.js on the frontend.
 */
export async function createSetupIntent(
  tenantId: string
): Promise<{ clientSecret: string; customerId: string }> {
  const customerId = await getOrCreateStripeCustomer(tenantId);

  const setupIntent = await getStripe().setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    metadata: {
      tenant_id: tenantId,
      purpose: 'auto_recharge',
    },
  });

  if (!setupIntent.client_secret) {
    throw new Error('Stripe did not return a client_secret');
  }

  return {
    clientSecret: setupIntent.client_secret,
    customerId,
  };
}
