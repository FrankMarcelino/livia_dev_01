import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSubscriptionPlans, getTenantSubscription } from '@/lib/queries/stripe';
import type { SubscriptionDataResponse, StripeErrorResponse } from '@/types/stripe';

/**
 * GET /api/stripe/subscription
 *
 * Returns subscription data + available plans for the authenticated tenant.
 */
export async function GET() {
  try {
    // 1. AUTH
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<StripeErrorResponse>(
        { error: 'Unauthorized', code: 'unauthorized' },
        { status: 401 }
      );
    }

    // 2. GET TENANT
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.tenant_id) {
      return NextResponse.json<StripeErrorResponse>(
        { error: 'Tenant not found', code: 'tenant_not_found' },
        { status: 404 }
      );
    }

    // 3. FETCH DATA
    const [subscription, plans] = await Promise.all([
      getTenantSubscription(userData.tenant_id),
      getSubscriptionPlans(),
    ]);

    return NextResponse.json<SubscriptionDataResponse>(
      { subscription, plans, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json<StripeErrorResponse>(
      { error: 'Erro interno. Tente novamente.', code: 'internal_error' },
      { status: 500 }
    );
  }
}
