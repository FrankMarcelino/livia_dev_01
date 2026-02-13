import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSetupIntent } from '@/lib/stripe/setup-intent';
import { getStripe } from '@/lib/stripe/client';
import type { AutoRechargeConfig } from '@/types/billing';

const upsertSchema = z.object({
  threshold_credits: z
    .number()
    .int()
    .min(1000, 'Mínimo: 1.000 créditos (R$ 10,00)')
    .max(500000, 'Máximo: 500.000 créditos (R$ 5.000,00)'),
  recharge_amount_cents: z
    .number()
    .int()
    .min(500, 'Mínimo: R$ 5,00')
    .max(500000, 'Máximo: R$ 5.000,00'),
  stripe_payment_method_id: z.string().min(1),
  card_last4: z.string().length(4).optional(),
  card_brand: z.string().optional(),
});

async function getTenantId(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  return userData?.tenant_id || null;
}

/**
 * GET /api/billing/auto-recharge
 * Returns current auto-recharge config + setup intent for card saving
 */
export async function GET(request: NextRequest) {
  const tenantId = await getTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: config } = await (supabaseAdmin as any)
    .from('auto_recharge_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  // Create setup intent for potential card saving
  const searchParams = request.nextUrl.searchParams;
  const needsSetupIntent = searchParams.get('setupIntent') === 'true';

  let setupIntent = null;
  if (needsSetupIntent) {
    try {
      setupIntent = await createSetupIntent(tenantId);
    } catch (error) {
      console.error('Failed to create setup intent:', error);
    }
  }

  return NextResponse.json({
    config: (config as AutoRechargeConfig) || null,
    setupIntent,
  });
}

/**
 * POST /api/billing/auto-recharge
 * Create or update auto-recharge config
 */
export async function POST(request: NextRequest) {
  const tenantId = await getTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = upsertSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Fetch card details from Stripe if not provided by client
  let cardLast4 = parsed.data.card_last4 || null;
  let cardBrand = parsed.data.card_brand || null;

  if (!cardLast4) {
    try {
      const pm = await getStripe().paymentMethods.retrieve(
        parsed.data.stripe_payment_method_id
      );
      cardLast4 = pm.card?.last4 || null;
      cardBrand = pm.card?.brand || null;
    } catch (pmError) {
      console.error('Failed to retrieve payment method details:', pmError);
    }
  }

  const supabaseAdmin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseAdmin as any)
    .from('auto_recharge_configs')
    .upsert(
      {
        tenant_id: tenantId,
        is_enabled: true,
        threshold_credits: parsed.data.threshold_credits,
        recharge_amount_cents: parsed.data.recharge_amount_cents,
        stripe_payment_method_id: parsed.data.stripe_payment_method_id,
        card_last4: cardLast4,
        card_brand: cardBrand,
        last_error: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Failed to save auto-recharge config:', error);
    return NextResponse.json(
      { error: `Falha ao salvar configuração: ${error.message || error.code || 'erro desconhecido'}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ config: data as AutoRechargeConfig });
}

/**
 * DELETE /api/billing/auto-recharge
 * Disable auto-recharge
 */
export async function DELETE(request: NextRequest) {
  const tenantId = await getTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin as any)
    .from('auto_recharge_configs')
    .update({
      is_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId);

  return NextResponse.json({ success: true });
}
