'use client';

import { useState } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UsageChart } from './usage-chart';
import { UsageByProviderTable } from './usage-by-provider-table';
import { UsageTotalsCards } from './usage-totals-cards';
import { CostProjectionCard } from './cost-projection-card';
import type { UsageDailySummary, UsageSummary } from '@/types/billing';

interface UsageDashboardProps {
  tenantId: string;
  initialUsageDaily: UsageDailySummary[];
  initialUsageSummary: UsageSummary[];
  initialUsageTotals: { total_credits: number; total_brl: number; calls: number };
  initialPreviousTotals?: { total_credits: number; total_brl: number; calls: number } | null;
}

type PeriodOption = '7' | '15' | '30';

export function UsageDashboard({
  tenantId,
  initialUsageDaily,
  initialUsageSummary,
  initialUsageTotals,
  initialPreviousTotals = null,
}: UsageDashboardProps) {
  const [period, setPeriod] = useState<PeriodOption>('30');
  const [isLoading, setIsLoading] = useState(false);
  const [usageDaily, setUsageDaily] = useState(initialUsageDaily);
  const [usageSummary, setUsageSummary] = useState(initialUsageSummary);
  const [usageTotals, setUsageTotals] = useState(initialUsageTotals);
  const [previousTotals, setPreviousTotals] = useState(initialPreviousTotals);

  const filteredDaily = usageDaily.slice(-parseInt(period));

  const fetchData = async (days: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/billing/usage?tenantId=${tenantId}&days=${days}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.usageDaily) setUsageDaily(data.usageDaily);
        if (data.usageSummary) setUsageSummary(data.usageSummary);
        if (data.usageTotals) setUsageTotals(data.usageTotals);
        if (data.previousTotals !== undefined) setPreviousTotals(data.previousTotals);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (value: PeriodOption) => {
    setPeriod(value);
    fetchData(parseInt(value));
  };

  const handleRefresh = () => {
    fetchData(parseInt(period));
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-8">
      <div className="container max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-8 w-8" />
              Consumo
            </h1>
            <p className="text-muted-foreground">
              Analise seu consumo de créditos e uso de IA
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Atualizar
            </Button>
          </div>
        </div>

        <Separator />

        {/* Cards de Totais + Projeção */}
        <UsageTotalsCards
          totals={usageTotals}
          previousTotals={previousTotals}
          period={parseInt(period)}
        />

        {/* Layout: Gráfico + Projeção */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UsageChart data={filteredDaily} isLoading={isLoading} />
          </div>
          <div>
            <CostProjectionCard
              totalBrl={usageTotals.total_brl}
              period={parseInt(period)}
            />
          </div>
        </div>

        {/* Tabela por Provider */}
        <UsageByProviderTable data={usageSummary} isLoading={isLoading} />
      </div>
    </div>
  );
}
