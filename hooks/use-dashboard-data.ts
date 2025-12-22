/**
 * Dashboard Data Hook
 * Manages dashboard data fetching, caching, and state with TanStack Query
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { DashboardData, TimeFilter } from '@/types/dashboard';

// ============================================================================
// HELPERS
// ============================================================================

function getTimeFilterDays(filter: TimeFilter): number {
  const mapping: Record<TimeFilter, number> = {
    today: 1,
    '7days': 7,
    '15days': 15,
    '30days': 30,
    custom: 30, // default for custom
  };

  return mapping[filter] || 30;
}

// ============================================================================
// TYPES
// ============================================================================

interface UseDashboardDataOptions {
  tenantId: string;
  timeFilter: TimeFilter;
  channelId?: string | null;
  customStartDate?: Date;
  customEndDate?: Date;
  enabled?: boolean;
}

interface DashboardDataResponse {
  data: DashboardData | null;
  error: string | null;
}

// ============================================================================
// FETCH FUNCTION
// ============================================================================

async function fetchDashboardData(
  tenantId: string,
  timeFilter: TimeFilter,
  channelId: string | null = null,
  customStartDate?: Date,
  customEndDate?: Date
): Promise<DashboardData> {
  // Build query params
  const params = new URLSearchParams({
    tenantId,
  });

  // For custom date range, send dates instead of daysAgo
  if (timeFilter === 'custom' && customStartDate && customEndDate) {
    params.append('startDate', customStartDate.toISOString());
    params.append('endDate', customEndDate.toISOString());
    console.log('📅 Fetching custom date range:', {
      startDate: customStartDate.toISOString(),
      endDate: customEndDate.toISOString(),
    });
  } else {
    const daysAgo = getTimeFilterDays(timeFilter);
    params.append('daysAgo', daysAgo.toString());
    console.log('📅 Fetching daysAgo:', daysAgo);
  }

  if (channelId) {
    params.append('channelId', channelId);
  }

  console.log('🔍 API URL:', `/api/dashboard?${params.toString()}`);

  // Call API route
  const response = await fetch(`/api/dashboard?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('❌ API Error:', error);
    throw new Error(error.error || 'Failed to fetch dashboard data');
  }

  const result: DashboardDataResponse = await response.json();

  if (result.error) {
    console.error('❌ Data Error:', result.error);
    throw new Error(result.error || 'Failed to fetch dashboard data');
  }

  if (!result.data) {
    console.error('❌ No data returned');
    throw new Error('No data returned from API');
  }

  console.log('✅ Data fetched successfully:', {
    totalConversations: result.data.kpis?.totalConversations,
    dailyDataPoints: result.data.dailyConversations?.length,
    hasKpis: !!result.data.kpis,
  });

  return result.data;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to fetch and cache dashboard data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useDashboardData({
 *   tenantId: 'abc-123',
 *   timeFilter: '30days',
 *   channelId: null,
 * });
 * ```
 */
export function useDashboardData({
  tenantId,
  timeFilter,
  channelId = null,
  customStartDate,
  customEndDate,
  enabled = true,
}: UseDashboardDataOptions): UseQueryResult<DashboardData, Error> {
  return useQuery({
    queryKey: ['dashboard', tenantId, timeFilter, channelId, customStartDate?.toISOString(), customEndDate?.toISOString()],
    queryFn: () => fetchDashboardData(tenantId, timeFilter, channelId, customStartDate, customEndDate),
    enabled: enabled && Boolean(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (previously cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Note: Query key factory and prefetch helpers removed
// These are client-side only hooks that don't need server-side utilities
