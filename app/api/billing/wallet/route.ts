/**
 * Billing Wallet API Route
 * Retorna dados da carteira e resumo de consumo
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getWallet,
  getUsageSummaryByProvider,
  getUsageTotals,
} from '@/lib/queries/billing';
import type { WalletWithComputed, UsageSummary } from '@/types/billing';

// ============================================================================
// TYPES
// ============================================================================

interface WalletAPIResponse {
  wallet: WalletWithComputed | null;
  usageSummary: UsageSummary[];
  usageTotals: { total_credits: number; total_brl: number; calls: number };
  error: string | null;
}

// ============================================================================
// GET /api/billing/wallet
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
      return NextResponse.json<WalletAPIResponse>(
        {
          wallet: null,
          usageSummary: [],
          usageTotals: { total_credits: 0, total_brl: 0, calls: 0 },
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
      return NextResponse.json<WalletAPIResponse>(
        {
          wallet: null,
          usageSummary: [],
          usageTotals: { total_credits: 0, total_brl: 0, calls: 0 },
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

    // Security: only allow access to own tenant
    if (requestedTenantId && requestedTenantId !== userTenantId) {
      return NextResponse.json<WalletAPIResponse>(
        {
          wallet: null,
          usageSummary: [],
          usageTotals: { total_credits: 0, total_brl: 0, calls: 0 },
          error: 'Forbidden: Tenant mismatch',
        },
        { status: 403 }
      );
    }

    // ========================================
    // 4. PARSE PARAMS
    // ========================================
    const days = parseInt(searchParams.get('days') || '7', 10);

    // ========================================
    // 5. FETCH DATA
    // ========================================
    const [wallet, usageSummary, usageTotals] = await Promise.all([
      getWallet(userTenantId),
      getUsageSummaryByProvider(userTenantId, days),
      getUsageTotals(userTenantId, days),
    ]);

    // ========================================
    // 6. RETURN SUCCESS
    // ========================================
    return NextResponse.json<WalletAPIResponse>(
      {
        wallet,
        usageSummary,
        usageTotals,
        error: null,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60', // Cache for 1 minute
        },
      }
    );
  } catch (error: unknown) {
    console.error('Billing Wallet API error:', error);

    return NextResponse.json<WalletAPIResponse>(
      {
        wallet: null,
        usageSummary: [],
        usageTotals: { total_credits: 0, total_brl: 0, calls: 0 },
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
