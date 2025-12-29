/**
 * Tags Queries for LIVIA
 * Handles all Supabase interactions for tags data
 */

import { createClient } from '@/lib/supabase/server';
import type { TagsData, TagsKPIs } from '@/types/dashboard';

// ============================================================================
// TYPES
// ============================================================================

interface GetTagsDataParams {
  tenantId: string;
  daysAgo?: number;
  channelId?: string | null;
  startDate?: string;
  endDate?: string;
}

interface RawTagsResponse {
  kpis: TagsKPIs;
  topTags: Array<{
    tagId: string;
    tagName: string;
    count: number;
    percentage: number;
  }>;
  tagPerformance: Array<{
    tagId: string;
    tagName: string;
    totalConversations: number;
    avgMessages: number;
    avgResponseTime: number | null;
    aiActivePercent: number;
    closedPercent: number;
  }>;
  tagsDistribution: Array<{
    tagName: string;
    count: number;
    percentage: number;
  }>;
  conversationsByTag: Array<{
    date: string;
    tagName: string;
    count: number;
  }>;
  unusedTags: Array<{
    tagId: string;
    tagName: string;
    createdAt: string;
  }>;
}

// ============================================================================
// MAIN QUERY
// ============================================================================

/**
 * Fetch tags data using optimized Postgres function
 */
export async function getTagsData({
  tenantId,
  daysAgo = 30,
  channelId = null,
  startDate,
  endDate,
}: GetTagsDataParams): Promise<TagsData> {
  const supabase = await createClient();

  try {
    // Call Postgres function via RPC
    const rpcParams: Record<string, unknown> = {
      p_tenant_id: tenantId,
      p_channel_id: channelId,
    };

    // Use custom date range if provided, otherwise use daysAgo
    if (startDate && endDate) {
      rpcParams.p_start_date = startDate;
      rpcParams.p_end_date = endDate;
    } else {
      rpcParams.p_days_ago = daysAgo;
    }

    const { data, error } = await supabase.rpc('get_tags_data', rpcParams as any);

    if (error) {
      console.error('Error fetching tags data:', error);
      throw new Error(`Tags query failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from tags query');
    }

    // Parse and return response
    const rawData = data as unknown as RawTagsResponse;

    // Provide default KPIs if missing
    const defaultKPIs: TagsKPIs = {
      totalActiveTags: 0,
      conversationsWithTags: 0,
      conversationsWithoutTags: 0,
      categorizationRate: 0,
    };

    return {
      kpis: rawData.kpis || defaultKPIs,
      topTags: rawData.topTags || [],
      tagPerformance: rawData.tagPerformance || [],
      tagsDistribution: rawData.tagsDistribution || [],
      conversationsByTag: rawData.conversationsByTag || [],
      unusedTags: rawData.unusedTags || [],
    };
  } catch (error) {
    console.error('getTagsData error:', error);
    throw error;
  }
}


