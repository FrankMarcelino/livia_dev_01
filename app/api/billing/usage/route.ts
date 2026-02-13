/**
 * Billing Usage API Route
 * Retorna dados de consumo para gráficos e análises
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getUsageDaily,
  getUsageSummaryByProvider,
  getUsageTotals,
} from '@/lib/queries/billing';
import type { UsageDailySummary, UsageSummary } from '@/types/billing';

// ============================================================================
// TYPES
// ============================================================================

interface UsageAPIResponse {
  usageDaily: UsageDailySummary[];
  usageSummary: UsageSummary[];
  usageTotals: { total_credits: number; total_brl: number; calls: number };
  previousTotals: { total_credits: number; total_brl: number; calls: number } | null;
  error: string | null;
}

// ============================================================================
// GET /api/billing/usage
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // ========================================
    // 1. AUTH CHECK
    // ========================================
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<UsageAPIResponse>(
        {
          usageDaily: [],
          usageSummary: [],
          usageTotals: { total_credits: 0, total_brl: 0, calls: 0 },
          previousTotals: null,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // ========================================
    // 2. GET USER TENANT
    // ========================================
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.tenant_id) {
      return NextResponse.json<UsageAPIResponse>(
        {
          usageDaily: [],
          usageSummary: [],
          usageTotals: { total_credits: 0, total_brl: 0, calls: 0 },
          previousTotals: null,
          error: 'User tenant not found',
        },
        { status: 404 }
      );
    }

    const userTenantId = userData.tenant_id;

    // ========================================
    // 3. VALIDATE TENANT ID
    // ========================================
    const searchParams = request.nextUrl.searchParams;
    const requestedTenantId = searchParams.get('tenantId');

    if (requestedTenantId && requestedTenantId !== userTenantId) {
      return NextResponse.json<UsageAPIResponse>(
        {
          usageDaily: [],
          usageSummary: [],
          usageTotals: { total_credits: 0, total_brl: 0, calls: 0 },
          previousTotals: null,
          error: 'Forbidden: Tenant mismatch',
        },
        { status: 403 }
      );
    }

    // ========================================
    // 4. PARSE PARAMS
    // ========================================
    const days = Math.min(parseInt(searchParams.get('days') || '30', 10), 90);

    // ========================================
    // 5. FETCH DATA
    // ========================================
    const [usageDaily, usageSummary, usageTotals, previousTotals] = await Promise.all([
      getUsageDaily(userTenantId, days),
      getUsageSummaryByProvider(userTenantId, days),
      getUsageTotals(userTenantId, days),
      getUsageTotals(userTenantId, days, days),
    ]);

    // ========================================
    // 6. RETURN SUCCESS
    // ========================================
    return NextResponse.json<UsageAPIResponse>(
      {
        usageDaily,
        usageSummary,
        usageTotals,
        previousTotals,
        error: null,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60',
        },
      }
    );
  } catch (error: unknown) {
    console.error('Billing Usage API error:', error);

    return NextResponse.json<UsageAPIResponse>(
      {
        usageDaily: [],
        usageSummary: [],
        usageTotals: { total_credits: 0, total_brl: 0, calls: 0 },
        previousTotals: null,
        error: 'Internal server error. Please try again later.',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS (CORS)
// ============================================================================

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
