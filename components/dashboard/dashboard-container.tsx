'use client';

import { useState } from 'react';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import type { DashboardData, TimeFilter } from '@/types/dashboard';
import { DashboardHeader } from './dashboard-header';
import { KPICards } from './kpi-cards';
import { ConversationsChart } from './charts/conversations-chart';
import { TagsChart } from './charts/tags-chart';
import { HeatmapChart } from './charts/heatmap-chart';
import { ChannelDistribution } from './charts/channel-distribution';
import { AIvsHumanChart } from './charts/ai-vs-human-chart';
import { CostAnalysisChart } from './charts/cost-analysis-chart';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardContainerProps {
  initialData: DashboardData | null;
  tenantId: string;
}

export function DashboardContainer({
  tenantId,
}: DashboardContainerProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30days');
  const [channelId, setChannelId] = useState<string | null>(null);

  const { data, isLoading, isRefetching, refetch } = useDashboardData({
    tenantId,
    timeFilter,
    channelId,
  });

  if (isLoading && !data) {
    return <DashboardLoadingSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardHeader
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        channelId={channelId}
        onChannelChange={setChannelId}
        onRefresh={() => refetch()}
        isRefreshing={isRefetching}
      />

      <KPICards kpis={data.kpis} />

      {/* Row 1: Conversas e Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConversationsChart data={data.dailyConversations} />
        <TagsChart data={data.conversationsByTag} />
      </div>

      {/* Row 2: Canal e AI vs Humano */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChannelDistribution data={data.byChannel} />
        <AIvsHumanChart data={data.aiVsHuman} />
      </div>

      {/* Row 3: Heatmap */}
      <div className="grid grid-cols-1 gap-6">
        <HeatmapChart data={data.heatmap} />
      </div>

      {/* Row 4: Análise de Custos */}
      <div className="grid grid-cols-1 gap-6">
        <CostAnalysisChart data={data.costOverTime} />
      </div>
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-40" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 gap-6">
        <Skeleton className="h-96" />
      </div>

      {/* Charts Row 4 */}
      <div className="grid grid-cols-1 gap-6">
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
