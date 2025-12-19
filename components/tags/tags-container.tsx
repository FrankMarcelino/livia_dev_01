'use client';

import { useState } from 'react';
import { useTagsData } from '@/hooks/use-tags-data';
import type { TimeFilter } from '@/types/dashboard';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { TagsKPICards } from './tags-kpi-cards';
import { TopTagsChart } from './charts/top-tags-chart';
import { TagPerformanceTable } from './charts/tag-performance-table';
import { TagsDistributionChart } from './charts/tags-distribution-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface TagsContainerProps {
  tenantId: string;
}

export function TagsContainer({ tenantId }: TagsContainerProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30days');
  const [channelId, setChannelId] = useState<string | null>(null);

  const { data, isLoading, isRefetching, refetch } = useTagsData({
    tenantId,
    timeFilter,
    channelId,
  });

  if (isLoading && !data) {
    return <TagsLoadingSkeleton />;
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

      <TagsKPICards kpis={data.kpis} />

      {/* Row 1: TOP 10 Tags e Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopTagsChart data={data.topTags} />
        <TagsDistributionChart data={data.tagsDistribution} />
      </div>

      {/* Row 2: Tabela de Performance */}
      <TagPerformanceTable data={data.tagPerformance} />

      {/* Row 3: Tags Não Utilizadas */}
      {data.unusedTags && data.unusedTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Tags Não Utilizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Tags criadas mas sem conversas associadas no período selecionado:
            </p>
            <div className="flex flex-wrap gap-2">
              {data.unusedTags.map((tag) => (
                <span
                  key={tag.tagId}
                  className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm"
                >
                  {tag.tagName}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TagsLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>

      <Skeleton className="h-[400px]" />
    </div>
  );
}
