'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { WalletBalanceCard } from './wallet-balance-card';
import { UsageSummaryMiniCards } from './usage-summary-mini-cards';
import type { WalletWithComputed, UsageSummary } from '@/types/billing';

/**
 * Props do WalletDashboard
 */
interface WalletDashboardProps {
  tenantId: string;
  initialWallet: WalletWithComputed | null;
  initialUsageSummary: UsageSummary[];
  initialUsageTotals: { total_credits: number; total_brl: number; calls: number };
}

/**
 * Dashboard de Carteira - Container Client
 *
 * Princípios SOLID:
 * - Single Responsibility: Orquestra componentes de billing
 * - Open/Closed: Extensível para novos cards sem modificar existentes
 *
 * Recebe dados iniciais do Server Component e gerencia refresh.
 * Futuramente pode usar TanStack Query para cache e refetch.
 */
export function WalletDashboard({
  tenantId,
  initialWallet,
  initialUsageSummary,
  initialUsageTotals,
}: WalletDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wallet, setWallet] = useState(initialWallet);
  const [usageSummary, setUsageSummary] = useState(initialUsageSummary);
  const [usageTotals, setUsageTotals] = useState(initialUsageTotals);

  // Função para atualizar dados via API Route (a ser implementada)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/billing/wallet?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.wallet) setWallet(data.wallet);
        if (data.usageSummary) setUsageSummary(data.usageSummary);
        if (data.usageTotals) setUsageTotals(data.usageTotals);
      }
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-8">
      <div className="container max-w-4xl mx-auto space-y-6">
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
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <Separator />

        {/* Card Principal - Saldo */}
        <WalletBalanceCard wallet={wallet} />

        {/* Resumo de Consumo (7 dias) */}
        <UsageSummaryMiniCards
          usageSummary={usageSummary}
          usageTotals={usageTotals}
          days={7}
        />
      </div>
    </div>
  );
}
