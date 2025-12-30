'use client';

import { useState } from 'react';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import type { DashboardData, TimeFilter } from '@/types/dashboard';
import { DashboardHeader } from './dashboard-header';
import { KPICards } from './kpi-cards';
import { ConversationsChart } from './charts/conversations-chart';
import { HeatmapChart } from './charts/heatmap-chart';
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
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  const handleCustomDateChange = (startDate: Date | undefined, endDate: Date | undefined) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };

  const { data, isLoading, isRefetching, refetch } = useDashboardData({
    tenantId,
    timeFilter,
    channelId,
    customStartDate,
    customEndDate,
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
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={handleCustomDateChange}
      />

      <KPICards kpis={data.kpis} />

      {/* Conversas ao Longo do Tempo - Largura Total */}
      <div className="grid grid-cols-1 gap-6">
        <ConversationsChart data={data.dailyConversations} />
      </div>

      {/* Heatmap - Largura Total */}
      <div className="grid grid-cols-1 gap-6">
        <HeatmapChart data={data.heatmap} />
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

      {/* KPI Cards - 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      {/* Conversas ao Longo do Tempo */}
      <div className="grid grid-cols-1 gap-6">
        <Skeleton className="h-96" />
      </div>

      {/* Heatmap */}
      <div className="grid grid-cols-1 gap-6">
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
