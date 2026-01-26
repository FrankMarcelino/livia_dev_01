'use client';

import Link from 'next/link';
import { Activity, Zap, DollarSign, ArrowRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { UsageSummary } from '@/types/billing';
import { formatBRL } from '@/types/billing';

interface UsageSummaryMiniCardsProps {
  usageSummary: UsageSummary[];
  usageTotals: { total_credits: number; total_brl: number; calls: number };
  days: number;
}

/**
 * Ícone do provider
 */
function getProviderIcon(provider: string) {
  // Pode ser expandido para ícones específicos por provider
  switch (provider.toLowerCase()) {
    case 'openai':
      return Zap;
    case 'elevenlabs':
      return Activity;
    default:
      return Activity;
  }
}

/**
 * Mini Cards de Resumo de Consumo
 *
 * Exibe:
 * - Total consumido no período
 * - Número de chamadas
 * - Top 3 providers/SKUs por consumo
 */
export function UsageSummaryMiniCards({
  usageSummary,
  usageTotals,
  days,
}: UsageSummaryMiniCardsProps) {
  // Pega top 3 para exibição
  const topProviders = usageSummary.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Consumo dos últimos {days} dias
        </CardTitle>
        <CardDescription>
          Resumo de uso de IA e serviços
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cards de Totais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Total Consumido</span>
            </div>
            <p className="text-2xl font-bold">{formatBRL(usageTotals.total_brl)}</p>
          </div>

          <div className="rounded-lg border p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span className="text-xs font-medium">Chamadas de IA</span>
            </div>
            <p className="text-2xl font-bold">
              {usageTotals.calls.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Lista de Providers */}
        {topProviders.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Principais serviços
            </p>
            <div className="space-y-2">
              {topProviders.map((item) => {
                const Icon = getProviderIcon(item.provider);
                return (
                  <div
                    key={`${item.provider}-${item.sku}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-background">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {item.provider}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatBRL(item.debited_brl)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.calls} chamadas
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum consumo registrado no período</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <Button variant="ghost" asChild className="w-full">
          <Link href="/financeiro/extrato" className="flex items-center gap-2">
            Ver extrato completo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
