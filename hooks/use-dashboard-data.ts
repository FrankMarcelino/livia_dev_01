/**
 * Dashboard Data Hook
 * Manages dashboard data fetching, caching, and state with TanStack Query
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { DashboardData, TimeFilter } from '@/types/dashboard';
import { getTimeFilterDays } from '@/lib/queries/dashboard';

// ============================================================================
// TYPES
// ============================================================================

interface UseDashboardDataOptions {
  tenantId: string;
  timeFilter: TimeFilter;
  channelId?: string | null;
  enabled?: boolean;
}

interface DashboardDataResponse {
  data: DashboardData | null;
  error: Error | null;
}

// ============================================================================
// FETCH FUNCTION
// ============================================================================

async function fetchDashboardData(
  tenantId: string,
  timeFilter: TimeFilter,
  channelId: string | null = null
): Promise<DashboardData> {
  const daysAgo = getTimeFilterDays(timeFilter);

  // Build query params
  const params = new URLSearchParams({
    tenantId,
    daysAgo: daysAgo.toString(),
  });

  if (channelId) {
    params.append('channelId', channelId);
  }

  // Call API route
  const response = await fetch(`/api/dashboard?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch dashboard data');
  }

  const result: DashboardDataResponse = await response.json();

  if (result.error) {
    throw new Error(result.error.message || 'Failed to fetch dashboard data');
  }

  if (!result.data) {
    throw new Error('No data returned from API');
  }

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
  enabled = true,
}: UseDashboardDataOptions): UseQueryResult<DashboardData, Error> {
  return useQuery({
    queryKey: ['dashboard', tenantId, timeFilter, channelId],
    queryFn: () => fetchDashboardData(tenantId, timeFilter, channelId),
    enabled: enabled && Boolean(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (previously cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

/**
 * Factory to generate consistent query keys
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  lists: () => [...dashboardKeys.all, 'list'] as const,
  list: (tenantId: string, filters: Partial<UseDashboardDataOptions>) =>
    [...dashboardKeys.lists(), tenantId, filters] as const,
  details: () => [...dashboardKeys.all, 'detail'] as const,
  detail: (tenantId: string, timeFilter: TimeFilter, channelId?: string | null) =>
    [...dashboardKeys.details(), tenantId, timeFilter, channelId] as const,
};

// ============================================================================
// PREFETCH HELPER
// ============================================================================

/**
 * Prefetch dashboard data (for server components)
 */
export async function prefetchDashboardData(
  queryClient: any,
  options: UseDashboardDataOptions
) {
  await queryClient.prefetchQuery({
    queryKey: dashboardKeys.detail(
      options.tenantId,
      options.timeFilter,
      options.channelId
    ),
    queryFn: () =>
      fetchDashboardData(options.tenantId, options.timeFilter, options.channelId),
    staleTime: 5 * 60 * 1000,
  });
}
