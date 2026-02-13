'use client';

import { TrendingDown, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatBRL } from '@/types/billing';

interface BalanceForecastCardProps {
  availableCredits: number;
  dailyAvgCredits: number;
  dailyAvgBrl: number;
}

function getGaugeColor(days: number): string {
  if (days <= 7) return 'text-red-600';
  if (days <= 14) return 'text-yellow-600';
  return 'text-green-600';
}

function getProgressColor(days: number): string {
  if (days <= 7) return '[&>div]:bg-red-500';
  if (days <= 14) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-green-500';
}

export function BalanceForecastCard({
  availableCredits,
  dailyAvgCredits,
  dailyAvgBrl,
}: BalanceForecastCardProps) {
  const estimatedDays = dailyAvgCredits > 0
    ? Math.floor(availableCredits / dailyAvgCredits)
    : null;

  // Gauge: 30 days = 100%
  const gaugePercent = estimatedDays !== null
    ? Math.min(100, (estimatedDays / 30) * 100)
    : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Previsão de Saldo
        </CardTitle>
        <CardDescription>Baseado no consumo dos últimos 7 dias</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {estimatedDays !== null ? (
          <>
            {/* Gauge visual */}
            <div className="text-center space-y-2">
              <p className={`text-4xl font-bold ${getGaugeColor(estimatedDays)}`}>
                {estimatedDays}
              </p>
              <p className="text-sm text-muted-foreground">
                dia{estimatedDays !== 1 ? 's' : ''} restante{estimatedDays !== 1 ? 's' : ''}
              </p>
              <Progress
                value={gaugePercent}
                className={`h-2 ${getProgressColor(estimatedDays)}`}
              />
            </div>

            {/* Média diária */}
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Média diária
              </span>
              <span className="font-medium">{formatBRL(dailyAvgBrl)}/dia</span>
            </div>

            {/* Alerta < 7 dias */}
            {estimatedDays <= 7 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">Saldo baixo</p>
                  <p className="text-red-700">
                    Seu saldo pode acabar em {estimatedDays} dia{estimatedDays !== 1 ? 's' : ''}.
                    Recarregue para evitar interrupções.
                  </p>
                </div>
              </div>
            )}

            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/financeiro/recarregar" className="flex items-center gap-2">
                Recarregar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sem dados suficientes para previsão</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
