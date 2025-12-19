// Dashboard Types for LIVIA MVP
// Generated: 2025-12-19

// ============================================================================
// FILTERS
// ============================================================================

export type TimeFilter = 'today' | '7days' | '15days' | '30days' | 'custom';

export interface DashboardFilters {
  timeFilter: TimeFilter;
  startDate?: Date;
  endDate?: Date;
  channelId?: string | null;
  agentId?: string | null;
  status?: 'open' | 'paused' | 'closed' | null;
}

// ============================================================================
// KPIs
// ============================================================================

export interface DashboardKPIs {
  // Volume metrics
  totalConversations: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
  activeConversations: number;

  // Status breakdown
  conversationsOpen: number;
  conversationsPaused: number;
  conversationsClosed: number;

  // AI vs Human
  conversationsWithAi: number;
  conversationsHumanOnly: number;
  aiPercentage: number;

  // Quality metrics
  totalFeedbacks: number;
  positiveFeedbacks: number;
  negativeFeedbacks: number;
  satisfactionRate: number; // 0-100

  // Efficiency metrics
  avgFirstResponseTimeSeconds: number | null;
  avgResolutionTimeSeconds: number | null;

  // Cost metrics
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;

  // Peak day
  peakDay: {
    date: string;
    count: number;
  } | null;
}

// ============================================================================
// CHART DATA TYPES
// ============================================================================

/**
 * Daily conversation data for combo chart (bar + lines)
 */
export interface DailyConversationData {
  date: string; // ISO date string
  total: number;
  avgMessages: number;
  withAI: number;
  humanOnly: number;
}

/**
 * Conversations by tag (for stacked bar chart)
 * Dynamic keys for each tag name
 */
export interface ConversationsByTag {
  date: string;
  [tagName: string]: string | number; // date is string, counts are numbers
}

/**
 * Heatmap data (day of week x hour)
 */
export interface HeatmapData {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  count: number;
}

/**
 * Status funnel data
 */
export interface StatusFunnelData {
  open: number;
  paused: number;
  closed: number;
}

/**
 * Channel distribution data
 */
export interface ChannelData {
  channel: string;
  total: number;
  avgMessages: number;
  satisfaction: number | null; // 0-100 or null if no feedbacks
}

/**
 * Satisfaction over time
 */
export interface SatisfactionOverTimeData {
  date: string;
  satisfactionRate: number; // 0-100
  totalFeedbacks: number;
}

/**
 * Cost over time
 */
export interface CostOverTimeData {
  date: string;
  tokens: number;
  cost: number; // USD
}

/**
 * AI vs Human comparison
 */
export interface AIvsHumanData {
  type: 'AI' | 'Human';
  volume: number;
  avgResponseTime: number | null; // seconds
  satisfaction: number | null; // 0-100
}

/**
 * Channel performance (for table)
 */
export interface ChannelPerformance {
  channelId: string;
  channelName: string;
  volume: number;
  avgMessages: number;
  avgResponseTime: number | null; // seconds
  satisfaction: number | null; // 0-100
  totalCost: number; // USD
}

/**
 * Top tags data
 */
export interface TopTagData {
  tagName: string;
  count: number;
  percentage: number; // % of total
}

/**
 * Response time distribution (for histogram)
 */
export interface ResponseTimeDistribution {
  bucket: string; // e.g., "0-30s", "30s-1m", "1m-5m"
  count: number;
}

// ============================================================================
// MAIN DASHBOARD DATA
// ============================================================================

export interface DashboardData {
  kpis: DashboardKPIs;
  dailyConversations: DailyConversationData[];
  conversationsByTag: ConversationsByTag[];
  heatmap: HeatmapData[];
  funnel: StatusFunnelData;
  byChannel: ChannelData[];
  satisfactionOverTime: SatisfactionOverTimeData[];
  costOverTime: CostOverTimeData[];
  aiVsHuman: AIvsHumanData[];
  channelPerformance: ChannelPerformance[];
  topTags: TopTagData[];
  responseTimeDistribution: ResponseTimeDistribution[];
}

// ============================================================================
// API RESPONSE
// ============================================================================

export interface DashboardResponse {
  data: DashboardData | null;
  error: string | null;
  loading: boolean;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface DashboardContainerProps {
  initialData: DashboardData;
  tenantId: string;
}

export interface DashboardHeaderProps {
  currentFilter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
  onChannelChange: (channelId: string | null) => void;
  channels: Array<{ id: string; name: string }>;
  selectedChannelId: string | null;
}

export interface KPICardsProps {
  data: DashboardKPIs;
  loading?: boolean;
}

export interface BaseChartProps {
  loading?: boolean;
}

export interface ConversationsChartProps extends BaseChartProps {
  data: DailyConversationData[];
}

export interface TagsChartProps extends BaseChartProps {
  data: ConversationsByTag[];
}

export interface HeatmapChartProps extends BaseChartProps {
  data: HeatmapData[];
}

export interface StatusFunnelChartProps extends BaseChartProps {
  data: StatusFunnelData;
}

export interface ChannelDistributionChartProps extends BaseChartProps {
  data: ChannelData[];
}

export interface SatisfactionChartProps extends BaseChartProps {
  data: SatisfactionOverTimeData[];
}

export interface AIvsHumanChartProps extends BaseChartProps {
  data: AIvsHumanData[];
}

export interface CostAnalysisChartProps extends BaseChartProps {
  data: CostOverTimeData[];
}

export interface ChannelPerformanceTableProps extends BaseChartProps {
  data: ChannelPerformance[];
}

export interface TopTagsChartProps extends BaseChartProps {
  data: TopTagData[];
}

export interface ResponseTimeChartProps extends BaseChartProps {
  data: ResponseTimeDistribution[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Helper to format time duration
 */
export interface FormattedDuration {
  value: number;
  unit: 's' | 'm' | 'h' | 'd';
  display: string; // e.g., "2.5m", "45s", "3.2h"
}

/**
 * Helper to format currency
 */
export interface FormattedCurrency {
  value: number;
  currency: 'USD' | 'BRL';
  display: string; // e.g., "$12.50", "R$ 62.50"
}

/**
 * Date range helper
 */
export interface DateRange {
  start: Date;
  end: Date;
  label: string; // e.g., "Last 7 days", "Today"
}

// ============================================================================
// FUNIL (FUNNEL) TYPES
// ============================================================================

/**
 * Funil KPIs - metrics specific to funnel analysis
 */
export interface FunnelKPIs {
  conversationsOpen: number;
  conversationsPaused: number;
  conversationsClosed: number;
  conversionRate: number; // 0-100
  avgTimeToPauseSeconds: number;
  avgTimeToCloseSeconds: number;
}

/**
 * Status evolution over time - for stacked area chart
 */
export interface StatusEvolutionData {
  date: string; // ISO date
  open: number;
  paused: number;
  closed: number;
}

/**
 * Reason data (pause/closure reasons)
 */
export interface ReasonData {
  reason: string;
  count: number;
  percentage: number;
}

/**
 * Complete Funil Data structure
 */
export interface FunnelData {
  kpis: FunnelKPIs;
  statusEvolution: StatusEvolutionData[];
  pauseReasons: ReasonData[];
  closureReasons: ReasonData[];
  reactivationRate: number;
}

/**
 * Funil API Response
 */
export interface FunnelResponse {
  data: FunnelData | null;
  error: string | null;
  loading: boolean;
}

/**
 * Funil Component Props
 */
export interface FunnelContainerProps {
  tenantId: string;
}

export interface FunnelKPICardsProps {
  kpis: FunnelKPIs;
  loading?: boolean;
}

export interface StatusFunnelVisualizationProps extends BaseChartProps {
  data: FunnelKPIs;
}

export interface StatusEvolutionChartProps extends BaseChartProps {
  data: StatusEvolutionData[];
}

export interface TimeByStageChartProps extends BaseChartProps {
  avgTimeToPause: number;
  avgTimeToClose: number;
}

export interface ReasonsChartProps extends BaseChartProps {
  data: ReasonData[];
  title: string;
  type: 'pause' | 'closure';
}
