'use client';

import { RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { WalletBalanceCard } from './wallet-balance-card';
import { BalanceForecastCard } from './balance-forecast-card';
import { UsageSummaryMiniCards } from './usage-summary-mini-cards';
import { AutoRechargeConfigCard } from './auto-recharge-config';
import type { WalletWithComputed, UsageSummary } from '@/types/billing';

interface WalletDashboardProps {
  tenantId: string;
  initialWallet: WalletWithComputed | null;
  initialUsageSummary: UsageSummary[];
  initialUsageTotals: { total_credits: number; total_brl: number; calls: number };
}

interface WalletApiResponse {
  wallet: WalletWithComputed | null;
  usageSummary: UsageSummary[];
  usageTotals: { total_credits: number; total_brl: number; calls: number };
}

async function fetchWalletData(tenantId: string): Promise<WalletApiResponse> {
  const res = await fetch(`/api/billing/wallet?tenantId=${tenantId}`);
  if (!res.ok) throw new Error('Falha ao carregar dados');
  return res.json();
}

export function WalletDashboard({
  tenantId,
  initialWallet,
  initialUsageSummary,
  initialUsageTotals,
}: WalletDashboardProps) {
  const { data, isRefetching, refetch } = useQuery({
    queryKey: ['wallet-dashboard', tenantId],
    queryFn: () => fetchWalletData(tenantId),
    initialData: {
      wallet: initialWallet,
      usageSummary: initialUsageSummary,
      usageTotals: initialUsageTotals,
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const wallet = data.wallet;
  const usageSummary = data.usageSummary;
  const usageTotals = data.usageTotals;

  // Calcular média diária (7 dias)
  const dailyAvgCredits = usageTotals.calls > 0
    ? Math.round(usageTotals.total_credits / 7)
    : 0;
  const dailyAvgBrl = dailyAvgCredits / 100;

  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-8">
      <div className="container max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Saldo & Créditos</h1>
            <p className="text-muted-foreground">
              Acompanhe seu saldo e consumo de créditos
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <Separator />

        {/* Layout 2 colunas */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Coluna principal (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            <WalletBalanceCard wallet={wallet} dailyAvgCredits={dailyAvgCredits} />
            <UsageSummaryMiniCards
              usageSummary={usageSummary}
              usageTotals={usageTotals}
              days={7}
            />
          </div>

          {/* Coluna lateral (2/5) */}
          <div className="lg:col-span-2 space-y-6">
            <BalanceForecastCard
              availableCredits={wallet?.available_credits || 0}
              dailyAvgCredits={dailyAvgCredits}
              dailyAvgBrl={dailyAvgBrl}
            />
            <AutoRechargeConfigCard />
          </div>
        </div>
      </div>
    </div>
  );
}
