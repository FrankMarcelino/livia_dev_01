import { getStripe } from './client';
import { createAdminClient } from '@/lib/supabase/admin';
import { logStripeEvent, logStripeError } from './logger';
import type { AutoRechargeConfig } from '@/types/billing';

/**
 * Process auto-recharge for a tenant if balance is below threshold.
 * Called after each usage debit or on a schedule.
 */
export async function processAutoRecharge(
  tenantId: string,
  currentBalanceCredits: number
): Promise<{ triggered: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Fetch auto-recharge config
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: config, error: configError } = await (supabase as any)
    .from('auto_recharge_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_enabled', true)
    .single();

  if (configError || !config) {
    return { triggered: false };
  }

  const autoConfig = config as AutoRechargeConfig;

  // Check if balance is below threshold
  if (currentBalanceCredits > autoConfig.threshold_credits) {
    return { triggered: false };
  }

  // Prevent rapid re-triggering (min 5 min between charges)
  if (autoConfig.last_triggered_at) {
    const lastTriggered = new Date(autoConfig.last_triggered_at);
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (lastTriggered > fiveMinAgo) {
      return { triggered: false };
    }
  }

  try {
    // Get customer ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tenant } = await (supabase as any)
      .from('tenants')
      .select('stripe_customer_id')
      .eq('id', tenantId)
      .single();

    if (!tenant?.stripe_customer_id) {
      throw new Error('Tenant has no Stripe customer ID');
    }

    // Create PaymentIntent with saved payment method
    const credits = autoConfig.recharge_amount_cents; // 1 crédito = R$ 0,01
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: autoConfig.recharge_amount_cents,
      currency: 'brl',
      customer: tenant.stripe_customer_id,
      payment_method: autoConfig.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      metadata: {
        tenant_id: tenantId,
        type: 'auto_recharge',
        credits: String(credits),
        auto_recharge_config_id: autoConfig.id,
      },
    });

    // Update last triggered
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('auto_recharge_configs')
      .update({
        last_triggered_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', autoConfig.id);

    logStripeEvent('auto_recharge.triggered', paymentIntent.id, tenantId, 'success');

    return { triggered: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update config with error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('auto_recharge_configs')
      .update({
        last_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', autoConfig.id);

    logStripeError('processAutoRecharge', error, { tenantId });

    return { triggered: false, error: errorMessage };
  }
}
