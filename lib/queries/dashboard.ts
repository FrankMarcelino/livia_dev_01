/**
 * Dashboard Queries for LIVIA MVP
 * Handles all Supabase interactions for dashboard data
 */

import { createClient } from '@/lib/supabase/server';
import type {
  DashboardData,
  DashboardKPIs,
  TimeFilter,
} from '@/types/dashboard';

// ============================================================================
// TYPES
// ============================================================================

interface GetDashboardDataParams {
  tenantId: string;
  daysAgo?: number;
  channelId?: string | null;
}

interface RawDashboardResponse {
  kpis: DashboardKPIs;
  dailyConversations: Array<{
    date: string;
    total: number;
    avgMessages: number;
    withAI: number;
    humanOnly: number;
  }>;
  conversationsByTag: Array<{
    date: string;
    tag: string;
    count: number;
  }>;
  heatmap: Array<{
    dayOfWeek: number;
    hour: number;
    count: number;
  }>;
  funnel: {
    open: number;
    paused: number;
    closed: number;
  };
  byChannel: Array<{
    channel: string;
    total: number;
    avgMessages: number;
    satisfaction: number | null;
  }>;
  satisfactionOverTime: Array<{
    date: string;
    satisfactionRate: number;
    totalFeedbacks: number;
  }>;
  costOverTime: Array<{
    date: string;
    tokens: number;
    cost: number;
  }>;
}

// ============================================================================
// TIME FILTER MAPPING
// ============================================================================

export function getTimeFilterDays(filter: TimeFilter): number {
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
// MAIN QUERY
// ============================================================================

/**
 * Fetch dashboard data using optimized Postgres function
 */
export async function getDashboardData({
  tenantId,
  daysAgo = 30,
  channelId = null,
}: GetDashboardDataParams): Promise<DashboardData> {
  const supabase = await createClient();

  try {
    // Call Postgres function via RPC
    const { data, error } = await supabase.rpc('get_dashboard_data', {
      p_tenant_id: tenantId,
      p_days_ago: daysAgo,
      p_channel_id: channelId,
    });

    if (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error(`Dashboard query failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from dashboard query');
    }

    // Parse and transform response
    const rawData = data as RawDashboardResponse;

    // Transform conversationsByTag from long to wide format
    const conversationsByTag = transformTagsToWideFormat(rawData.conversationsByTag);

    // Calculate additional metrics not in DB
    const aiVsHuman = calculateAIvsHuman(rawData);
    const channelPerformance = transformChannelPerformance(rawData.byChannel);
    const topTags = calculateTopTags(rawData.conversationsByTag);
    const responseTimeDistribution = [] as any[]; // TODO: Implement if needed

    return {
      kpis: rawData.kpis,
      dailyConversations: rawData.dailyConversations,
      conversationsByTag,
      heatmap: rawData.heatmap,
      funnel: rawData.funnel,
      byChannel: rawData.byChannel,
      satisfactionOverTime: rawData.satisfactionOverTime,
      costOverTime: rawData.costOverTime,
      aiVsHuman,
      channelPerformance,
      topTags,
      responseTimeDistribution,
    };
  } catch (error) {
    console.error('getDashboardData error:', error);
    throw error;
  }
}

// ============================================================================
// GET CHANNELS FOR FILTER
// ============================================================================

export async function getChannelsForDashboard(
  tenantId: string
): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('channels')
    .select('id, identification_number')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('identification_number');

  if (error) {
    console.error('Error fetching channels:', error);
    return [];
  }

  return (
    data?.map((ch) => ({
      id: ch.id,
      name: ch.identification_number || 'Sem nome',
    })) || []
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform tags from long format (date, tag, count) to wide format (date, [tag]: count)
 */
function transformTagsToWideFormat(
  tags: Array<{ date: string; tag: string; count: number }>
) {
  const grouped = new Map<string, Record<string, number>>();

  for (const item of tags) {
    if (!grouped.has(item.date)) {
      grouped.set(item.date, { date: item.date });
    }
    const dateGroup = grouped.get(item.date)!;
    dateGroup[item.tag] = item.count;
  }

  return Array.from(grouped.values());
}

/**
 * Calculate AI vs Human metrics
 */
function calculateAIvsHuman(data: RawDashboardResponse) {
  const { kpis } = data;

  return [
    {
      type: 'AI' as const,
      volume: kpis.conversationsWithAi || 0,
      avgResponseTime: null, // TODO: Calculate from messages if needed
      satisfaction: null, // TODO: Calculate from feedbacks filtered by AI
    },
    {
      type: 'Human' as const,
      volume: kpis.conversationsHumanOnly || 0,
      avgResponseTime: null,
      satisfaction: null,
    },
  ];
}

/**
 * Transform channel data to performance table format
 */
function transformChannelPerformance(
  channels: RawDashboardResponse['byChannel']
) {
  return channels.map((ch) => ({
    channelId: '', // Not available from current query
    channelName: ch.channel || 'Sem canal',
    volume: ch.total || 0,
    avgMessages: ch.avgMessages || 0,
    avgResponseTime: null, // TODO: Add to query if needed
    satisfaction: ch.satisfaction,
    totalCost: 0, // TODO: Add to query if needed
  }));
}

/**
 * Calculate top tags from conversations by tag
 */
function calculateTopTags(
  tags: Array<{ date: string; tag: string; count: number }>
) {
  const tagTotals = new Map<string, number>();

  for (const item of tags) {
    const current = tagTotals.get(item.tag) || 0;
    tagTotals.set(item.tag, current + item.count);
  }

  const totalConversations = Array.from(tagTotals.values()).reduce(
    (sum, count) => sum + count,
    0
  );

  const topTags = Array.from(tagTotals.entries())
    .map(([tagName, count]) => ({
      tagName,
      count,
      percentage: totalConversations > 0 ? (count / totalConversations) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10

  return topTags;
}
