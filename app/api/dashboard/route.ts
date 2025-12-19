/**
 * Dashboard API Route
 * Handles dashboard data requests with dynamic filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDashboardData } from '@/lib/queries/dashboard';
import type { DashboardData } from '@/types/dashboard';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardAPIResponse {
  data: DashboardData | null;
  error: string | null;
}

// ============================================================================
// GET /api/dashboard
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
      return NextResponse.json<DashboardAPIResponse>(
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
      return NextResponse.json<DashboardAPIResponse>(
        { data: null, error: 'User tenant not found' },
        { status: 404 }
      );
    }

    const userTenantId = userData.tenant_id;

    // ========================================
    // 3. PARSE QUERY PARAMS
    // ========================================
    const searchParams = request.nextUrl.searchParams;

    // Validate tenant_id matches user's tenant (security check)
    const requestedTenantId = searchParams.get('tenantId');
    if (requestedTenantId && requestedTenantId !== userTenantId) {
      return NextResponse.json<DashboardAPIResponse>(
        { data: null, error: 'Forbidden: Tenant mismatch' },
        { status: 403 }
      );
    }

    const daysAgo = parseInt(searchParams.get('daysAgo') || '30', 10);
    const channelId = searchParams.get('channelId') || null;

    // Validate daysAgo
    if (isNaN(daysAgo) || daysAgo < 1 || daysAgo > 365) {
      return NextResponse.json<DashboardAPIResponse>(
        { data: null, error: 'Invalid daysAgo parameter (must be 1-365)' },
        { status: 400 }
      );
    }

    // ========================================
    // 4. FETCH DATA
    // ========================================
    const data = await getDashboardData({
      tenantId: userTenantId,
      daysAgo,
      channelId,
    });

    // ========================================
    // 5. RETURN SUCCESS
    // ========================================
    return NextResponse.json<DashboardAPIResponse>(
      { data, error: null },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        },
      }
    );
  } catch (error: any) {
    console.error('Dashboard API error:', error);

    // Determine error type and status code
    const isClientError =
      error.message?.includes('Invalid') ||
      error.message?.includes('Missing') ||
      error.message?.includes('Forbidden');

    const statusCode = isClientError ? 400 : 500;
    const errorMessage = isClientError
      ? error.message
      : 'Internal server error. Please try again later.';

    return NextResponse.json<DashboardAPIResponse>(
      { data: null, error: errorMessage },
      { status: statusCode }
    );
  }
}

// ============================================================================
// OPTIONS (CORS)
// ============================================================================

export async function OPTIONS(_request: NextRequest) {
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
