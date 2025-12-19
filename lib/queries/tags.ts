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
}: GetTagsDataParams): Promise<TagsData> {
  const supabase = await createClient();

  try {
    // Call Postgres function via RPC
    // @ts-expect-error - Function will be created by running sql/dashboard/04_function_tags.sql
    const { data, error } = await supabase.rpc('get_tags_data', {
      p_tenant_id: tenantId,
      p_days_ago: daysAgo,
      p_channel_id: channelId,
    });

    if (error) {
      console.error('Error fetching tags data:', error);
      throw new Error(`Tags query failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from tags query');
    }

    // Parse and return response
    const rawData = data as unknown as RawTagsResponse;

    return {
      kpis: rawData.kpis,
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
