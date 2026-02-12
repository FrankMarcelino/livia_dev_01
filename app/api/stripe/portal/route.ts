import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createPortalSession } from '@/lib/stripe/helpers';
import type { StripeErrorResponse } from '@/types/stripe';

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Customer Portal session.
 * Auth → Tenant → Create portal session → Return URL
 */
export async function POST(request: NextRequest) {
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

    // 3. CREATE PORTAL SESSION
    const origin = request.nextUrl.origin;
    const returnUrl = `${origin}/financeiro/recarregar`;

    const url = await createPortalSession(userData.tenant_id, returnUrl);

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe Portal error:', error.type, error.message);
      return NextResponse.json<StripeErrorResponse>(
        { error: error.message, code: `stripe_${error.type}` },
        { status: 500 }
      );
    }

    console.error('Portal API error:', error);
    return NextResponse.json<StripeErrorResponse>(
      { error: 'Erro interno. Tente novamente.', code: 'internal_error' },
      { status: 500 }
    );
  }
}
