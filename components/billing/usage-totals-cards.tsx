'use client';

import { DollarSign, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatBRL } from '@/types/billing';

interface UsageTotalsCardsProps {
  totals: { total_credits: number; total_brl: number; calls: number };
  period: number;
}

/**
 * Cards com totais de consumo
 */
export function UsageTotalsCards({ totals, period }: UsageTotalsCardsProps) {
  // Calcula média diária
  const avgDaily = period > 0 ? totals.total_brl / period : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Consumido */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Consumido</p>
              <p className="text-2xl font-bold">{formatBRL(totals.total_brl)}</p>
              <p className="text-xs text-muted-foreground">
                {totals.total_credits.toLocaleString('pt-BR')} créditos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total de Chamadas */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/10">
              <Zap className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chamadas de IA</p>
              <p className="text-2xl font-bold">
                {totals.calls.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground">
                nos últimos {period} dias
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Média Diária */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Média Diária</p>
              <p className="text-2xl font-bold">{formatBRL(avgDaily)}</p>
              <p className="text-xs text-muted-foreground">
                {(totals.calls / period).toFixed(1)} chamadas/dia
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
