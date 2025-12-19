'use client';

import { useState } from 'react';
import { useFunilData } from '@/hooks/use-funil-data';
import type { TimeFilter } from '@/types/dashboard';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { FunilKPICards } from './funil-kpi-cards';
import { StatusFunnelChart } from './charts/status-funnel-chart';
import { StatusEvolutionChart } from './charts/status-evolution-chart';
import { TimeByStageChart } from './charts/time-by-stage-chart';
import { ReasonsChart } from './charts/reasons-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface FunilContainerProps {
  tenantId: string;
}

export function FunilContainer({ tenantId }: FunilContainerProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30days');
  const [channelId, setChannelId] = useState<string | null>(null);

  const { data, isLoading, isRefetching, refetch } = useFunilData({
    tenantId,
    timeFilter,
    channelId,
  });

  if (isLoading && !data) {
    return <FunilLoadingSkeleton />;
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

      <FunilKPICards kpis={data.kpis} />

      {/* Row 1: Funil Visual e Evolução */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusFunnelChart data={data.kpis} />
        <StatusEvolutionChart data={data.statusEvolution} />
      </div>

      {/* Row 2: Tempo por Etapa */}
      <TimeByStageChart
        avgTimeToPause={data.kpis.avgTimeToPauseSeconds}
        avgTimeToClose={data.kpis.avgTimeToCloseSeconds}
      />

      {/* Row 3: Motivos de Pausa e Fechamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReasonsChart
          data={data.pauseReasons}
          title="Top Motivos de Pausa"
          type="pause"
        />
        <ReasonsChart
          data={data.closureReasons}
          title="Top Motivos de Fechamento"
          type="closure"
        />
      </div>

      {/* Row 4: Taxa de Reativação */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Taxa de Reativação</h3>
              <p className="text-sm text-muted-foreground">
                Percentual de conversas que foram reativadas após pausa
              </p>
            </div>
            <div className="text-4xl font-bold text-primary">
              {data.reactivationRate.toFixed(1)}%
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FunilLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>

      <Skeleton className="h-[300px]" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  );
}
