/**
 * Tags API Route
 * Handles tags data requests with dynamic filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTagsData } from '@/lib/queries/tags';
import type { TagsData } from '@/types/dashboard';

// ============================================================================
// TYPES
// ============================================================================

interface TagsAPIResponse {
  data: TagsData | null;
  error: string | null;
}

// ============================================================================
// GET /api/tags
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
      return NextResponse.json<TagsAPIResponse>(
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
      return NextResponse.json<TagsAPIResponse>(
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
      return NextResponse.json<TagsAPIResponse>(
        { data: null, error: 'Forbidden: Tenant mismatch' },
        { status: 403 }
      );
    }

    const channelId = searchParams.get('channelId') || null;

    // Check if custom date range is provided
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let daysAgo: number | undefined;
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (startDateParam && endDateParam) {
      // Custom date range mode
      startDate = startDateParam;
      endDate = endDateParam;

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json<TagsAPIResponse>(
          { data: null, error: 'Invalid date format' },
          { status: 400 }
        );
      }

      if (start > end) {
        return NextResponse.json<TagsAPIResponse>(
          { data: null, error: 'Start date must be before end date' },
          { status: 400 }
        );
      }
    } else {
      // daysAgo mode (default)
      daysAgo = parseInt(searchParams.get('daysAgo') || '30', 10);

      // Validate daysAgo
      if (isNaN(daysAgo) || daysAgo < 1 || daysAgo > 365) {
        return NextResponse.json<TagsAPIResponse>(
          { data: null, error: 'Invalid daysAgo parameter (must be 1-365)' },
          { status: 400 }
        );
      }
    }

    // ========================================
    // 4. FETCH DATA
    // ========================================
    const data = await getTagsData({
      tenantId: userTenantId,
      daysAgo,
      channelId,
      startDate,
      endDate,
    });

    // ========================================
    // 5. RETURN SUCCESS
    // ========================================
    return NextResponse.json<TagsAPIResponse>(
      { data, error: null },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        },
      }
    );
  } catch (error: unknown) {
    console.error('Tags API error:', error);

    // Determine error type and status code
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isClientError =
      errorMessage?.includes('Invalid') ||
      errorMessage?.includes('Missing') ||
      errorMessage?.includes('Forbidden');

    const statusCode = isClientError ? 400 : 500;
    const responseMessage = isClientError
      ? errorMessage
      : 'Internal server error. Please try again later.';

    return NextResponse.json<TagsAPIResponse>(
      { data: null, error: responseMessage },
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

