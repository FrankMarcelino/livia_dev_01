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
import type { UsageDailySummary, UsageSummary } from '@/types/billing';

interface UsageDashboardProps {
  tenantId: string;
  initialUsageDaily: UsageDailySummary[];
  initialUsageSummary: UsageSummary[];
  initialUsageTotals: { total_credits: number; total_brl: number; calls: number };
}

type PeriodOption = '7' | '15' | '30';

/**
 * Dashboard de Consumo com gráficos
 */
export function UsageDashboard({
  tenantId,
  initialUsageDaily,
  initialUsageSummary,
  initialUsageTotals,
}: UsageDashboardProps) {
  const [period, setPeriod] = useState<PeriodOption>('30');
  const [isLoading, setIsLoading] = useState(false);
  const [usageDaily, setUsageDaily] = useState(initialUsageDaily);
  const [usageSummary, setUsageSummary] = useState(initialUsageSummary);
  const [usageTotals, setUsageTotals] = useState(initialUsageTotals);

  // Filtra dados pelo período selecionado
  const filteredDaily = usageDaily.slice(-parseInt(period));

  // Busca dados atualizados
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
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para mudança de período
  const handlePeriodChange = (value: PeriodOption) => {
    setPeriod(value);
    fetchData(parseInt(value));
  };

  // Handler para refresh
  const handleRefresh = () => {
    fetchData(parseInt(period));
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-8">
      <div className="container max-w-6xl mx-auto space-y-6">
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

        {/* Cards de Totais */}
        <UsageTotalsCards totals={usageTotals} period={parseInt(period)} />

        {/* Gráfico de Consumo Diário */}
        <UsageChart data={filteredDaily} isLoading={isLoading} />

        {/* Tabela por Provider */}
        <UsageByProviderTable data={usageSummary} isLoading={isLoading} />
      </div>
    </div>
  );
}
