/**
 * Billing Ledger API Route
 * Retorna extrato com filtros e paginação
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLedgerEntries } from '@/lib/queries/billing';
import type { LedgerPaginatedResult, LedgerFilters } from '@/types/billing';

// ============================================================================
// TYPES
// ============================================================================

interface LedgerAPIResponse {
  data: LedgerPaginatedResult | null;
  error: string | null;
}

// ============================================================================
// GET /api/billing/ledger
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
      return NextResponse.json<LedgerAPIResponse>(
        { data: null, error: 'Unauthorized' },
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
      return NextResponse.json<LedgerAPIResponse>(
        { data: null, error: 'User tenant not found' },
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
      return NextResponse.json<LedgerAPIResponse>(
        { data: null, error: 'Forbidden: Tenant mismatch' },
        { status: 403 }
      );
    }

    // ========================================
    // 4. PARSE FILTERS
    // ========================================
    const filters: LedgerFilters = {};

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const direction = searchParams.get('direction');
    const sourceType = searchParams.get('sourceType');

    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (direction && direction !== 'all') {
      filters.direction = direction as 'credit' | 'debit';
    }
    if (sourceType && sourceType !== 'all') {
      filters.sourceType = sourceType as 'purchase' | 'usage' | 'adjustment' | 'refund';
    }

    // ========================================
    // 5. PARSE PAGINATION
    // ========================================
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    // ========================================
    // 6. FETCH DATA
    // ========================================
    const data = await getLedgerEntries(userTenantId, filters, limit, page);

    // ========================================
    // 7. RETURN SUCCESS
    // ========================================
    return NextResponse.json<LedgerAPIResponse>(
      { data, error: null },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=30',
        },
      }
    );
  } catch (error: unknown) {
    console.error('Billing Ledger API error:', error);

    return NextResponse.json<LedgerAPIResponse>(
      { data: null, error: 'Internal server error. Please try again later.' },
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
