/**
 * Tags Data Hook
 * Manages tags data fetching, caching, and state with TanStack Query
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { TagsData, TimeFilter } from '@/types/dashboard';

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

interface UseTagsDataOptions {
  tenantId: string;
  timeFilter: TimeFilter;
  channelId?: string | null;
  customStartDate?: Date;
  customEndDate?: Date;
  enabled?: boolean;
}

interface TagsDataResponse {
  data: TagsData | null;
  error: Error | null;
}

// ============================================================================
// FETCH FUNCTION
// ============================================================================

async function fetchTagsData(
  tenantId: string,
  timeFilter: TimeFilter,
  channelId: string | null = null,
  customStartDate?: Date,
  customEndDate?: Date
): Promise<TagsData> {
  // Build query params
  const params = new URLSearchParams({
    tenantId,
  });

  // For custom date range, send dates instead of daysAgo
  if (timeFilter === 'custom' && customStartDate && customEndDate) {
    params.append('startDate', customStartDate.toISOString());
    params.append('endDate', customEndDate.toISOString());
  } else {
    const daysAgo = getTimeFilterDays(timeFilter);
    params.append('daysAgo', daysAgo.toString());
  }

  if (channelId) {
    params.append('channelId', channelId);
  }

  // Call API route
  const response = await fetch(`/api/tags?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch tags data');
  }

  const result: TagsDataResponse = await response.json();

  if (result.error) {
    throw new Error(result.error.message || 'Failed to fetch tags data');
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
 * Hook to fetch and cache tags data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useTagsData({
 *   tenantId: 'abc-123',
 *   timeFilter: '30days',
 *   channelId: null,
 * });
 * ```
 */
export function useTagsData({
  tenantId,
  timeFilter,
  channelId = null,
  customStartDate,
  customEndDate,
  enabled = true,
}: UseTagsDataOptions): UseQueryResult<TagsData, Error> {
  return useQuery({
    queryKey: ['tags-data', tenantId, timeFilter, channelId, customStartDate?.toISOString(), customEndDate?.toISOString()],
    queryFn: () => fetchTagsData(tenantId, timeFilter, channelId, customStartDate, customEndDate),
    enabled: enabled && Boolean(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (previously cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}





