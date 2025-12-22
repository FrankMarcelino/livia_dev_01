/**
 * Dashboard Queries for LIVIA MVP
 * Handles all Supabase interactions for dashboard data
 */

import { createClient } from '@/lib/supabase/server';
import type {
  DashboardData,
  DashboardKPIs,
  TimeFilter,
  ResponseTimeDistribution,
} from '@/types/dashboard';

// ============================================================================
// TYPES
// ============================================================================

interface GetDashboardDataParams {
  tenantId: string;
  daysAgo?: number;
  channelId?: string | null;
  startDate?: string;
  endDate?: string;
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
  startDate,
  endDate,
}: GetDashboardDataParams): Promise<DashboardData> {
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

    const { data, error } = await supabase.rpc('get_dashboard_data', rpcParams as {
      p_tenant_id: string;
      p_channel_id: string | null;
      p_days_ago?: number;
      p_start_date?: string;
      p_end_date?: string;
    });

    if (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error(`Dashboard query failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from dashboard query');
    }

    // Parse and transform response
    const rawData = data as unknown as RawDashboardResponse | any;

    // Transform old structure to new structure if needed
    let transformedData: RawDashboardResponse;
    if (rawData.summary && !rawData.kpis) {
      // Old structure detected - transform it
      const summary = rawData.summary;
      const funnel = rawData.funnel;
      const dailyTimeline = rawData.daily_timeline || [];
      const channelsDist = rawData.channels_distribution || [];
      const hourlyDist = rawData.hourly_distribution || [];
      
      transformedData = {
        kpis: {
          totalConversations: summary.total_conversations || 0,
          totalMessages: 0, // Not available in old structure
          avgMessagesPerConversation: 0, // Not available in old structure
          activeConversations: (funnel?.new?.total || 0) + (funnel?.finalized?.total || 0),
          conversationsOpen: funnel?.new?.total || 0,
          conversationsPaused: 0, // Not available in old structure
          conversationsClosed: funnel?.finalized?.total || 0,
          conversationsWithAi: funnel?.new?.with_ia || 0,
          conversationsHumanOnly: funnel?.new?.without_ia || 0,
          aiPercentage: funnel?.new?.total ? ((funnel.new.with_ia || 0) / funnel.new.total * 100) : 0,
          totalFeedbacks: 0,
          positiveFeedbacks: 0,
          negativeFeedbacks: 0,
          satisfactionRate: 0,
          avgFirstResponseTimeSeconds: null,
          avgResolutionTimeSeconds: summary.avg_duration_seconds || null,
          totalTokens: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          estimatedCostUsd: 0,
          peakDay: null,
        },
        dailyConversations: dailyTimeline.map((item: any) => ({
          date: item.date,
          total: item.conversation_count || 0,
          avgMessages: 0,
          withAI: 0,
          humanOnly: 0,
        })),
        conversationsByTag: [], // Not available in old structure
        heatmap: hourlyDist.map((item: any) => ({
          dayOfWeek: 0, // Not available in old structure
          hour: item.hour,
          count: item.conversation_count || 0,
        })),
        funnel: {
          open: funnel?.new?.total || 0,
          paused: 0,
          closed: funnel?.finalized?.total || 0,
        },
        byChannel: channelsDist.map((item: any) => ({
          channel: item.channel_name || '',
          total: item.conversation_count || 0,
          avgMessages: 0,
          satisfaction: null,
        })),
        satisfactionOverTime: [],
        costOverTime: [],
      };
    } else {
      // New structure - use as is
      transformedData = rawData as RawDashboardResponse;
    }

    // Transform conversationsByTag from long to wide format
    const conversationsByTag = transformTagsToWideFormat(transformedData.conversationsByTag || []);

    // Calculate additional metrics not in DB
    const aiVsHuman = calculateAIvsHuman(transformedData);
    const channelPerformance = transformChannelPerformance(transformedData.byChannel);
    const topTags = calculateTopTags(transformedData.conversationsByTag || []);
    const responseTimeDistribution: ResponseTimeDistribution[] = []; // TODO: Implement if needed

    const result = {
      kpis: transformedData.kpis || {
        totalConversations: 0,
        totalMessages: 0,
        avgMessagesPerConversation: 0,
        activeConversations: 0,
        conversationsOpen: 0,
        conversationsPaused: 0,
        conversationsClosed: 0,
        conversationsWithAi: 0,
        conversationsHumanOnly: 0,
        aiPercentage: 0,
        totalFeedbacks: 0,
        positiveFeedbacks: 0,
        negativeFeedbacks: 0,
        satisfactionRate: 0,
        avgFirstResponseTimeSeconds: null,
        avgResolutionTimeSeconds: null,
        totalTokens: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        estimatedCostUsd: 0,
        peakDay: null,
      },
      dailyConversations: transformedData.dailyConversations || [],
      conversationsByTag,
      heatmap: transformedData.heatmap || [],
      funnel: transformedData.funnel || { open: 0, paused: 0, closed: 0 },
      byChannel: transformedData.byChannel || [],
      satisfactionOverTime: transformedData.satisfactionOverTime || [],
      costOverTime: transformedData.costOverTime || [],
      aiVsHuman,
      channelPerformance,
      topTags,
      responseTimeDistribution,
    };

    return result;
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
): Array<{ date: string; [tagName: string]: string | number }> {
  const grouped = new Map<string, { date: string; [tagName: string]: string | number }>();

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
  const { kpis } = data || {};

  return [
    {
      type: 'AI' as const,
      volume: kpis?.conversationsWithAi || 0,
      avgResponseTime: null, // TODO: Calculate from messages if needed
      satisfaction: null, // TODO: Calculate from feedbacks filtered by AI
    },
    {
      type: 'Human' as const,
      volume: kpis?.conversationsHumanOnly || 0,
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
  if (!channels || !Array.isArray(channels)) {
    return [];
  }
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
      tagId: tagName, // Using tagName as temporary ID
      tagName,
      count,
      percentage: totalConversations > 0 ? (count / totalConversations) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10

  return topTags;
}
