'use client';

import { DollarSign, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatBRL } from '@/types/billing';

interface UsageTotalsCardsProps {
  totals: { total_credits: number; total_brl: number; calls: number };
  previousTotals?: { total_credits: number; total_brl: number; calls: number } | null;
  period: number;
}

function ComparisonBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;

  const pctChange = ((current - previous) / previous) * 100;
  const isUp = pctChange > 0;
  const isFlat = Math.abs(pctChange) < 1;

  if (isFlat) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        estável
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-1 text-xs ${isUp ? 'text-red-600' : 'text-green-600'}`}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pctChange).toFixed(0)}% vs anterior
    </span>
  );
}

export function UsageTotalsCards({ totals, previousTotals, period }: UsageTotalsCardsProps) {
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
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {totals.total_credits.toLocaleString('pt-BR')} créditos
                </p>
                {previousTotals && (
                  <ComparisonBadge
                    current={totals.total_brl}
                    previous={previousTotals.total_brl}
                  />
                )}
              </div>
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
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  nos últimos {period} dias
                </p>
                {previousTotals && (
                  <ComparisonBadge
                    current={totals.calls}
                    previous={previousTotals.calls}
                  />
                )}
              </div>
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
                {period > 0 ? (totals.calls / period).toFixed(1) : '0'} chamadas/dia
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
