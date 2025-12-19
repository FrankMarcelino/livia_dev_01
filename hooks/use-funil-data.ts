/**
 * Funil (Funnel) Data Hook
 * Manages funil data fetching, caching, and state with TanStack Query
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { FunnelData, TimeFilter } from '@/types/dashboard';

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

interface UseFunilDataOptions {
  tenantId: string;
  timeFilter: TimeFilter;
  channelId?: string | null;
  enabled?: boolean;
}

interface FunilDataResponse {
  data: FunnelData | null;
  error: Error | null;
}

// ============================================================================
// FETCH FUNCTION
// ============================================================================

async function fetchFunilData(
  tenantId: string,
  timeFilter: TimeFilter,
  channelId: string | null = null
): Promise<FunnelData> {
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
  const response = await fetch(`/api/funil?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch funil data');
  }

  const result: FunilDataResponse = await response.json();

  if (result.error) {
    throw new Error(result.error.message || 'Failed to fetch funil data');
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
 * Hook to fetch and cache funil data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useFunilData({
 *   tenantId: 'abc-123',
 *   timeFilter: '30days',
 *   channelId: null,
 * });
 * ```
 */
export function useFunilData({
  tenantId,
  timeFilter,
  channelId = null,
  enabled = true,
}: UseFunilDataOptions): UseQueryResult<FunnelData, Error> {
  return useQuery({
    queryKey: ['funil-data', tenantId, timeFilter, channelId],
    queryFn: () => fetchFunilData(tenantId, timeFilter, channelId),
    enabled: enabled && Boolean(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (previously cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
