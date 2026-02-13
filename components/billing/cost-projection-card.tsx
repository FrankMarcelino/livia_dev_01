'use client';

import { Calculator, TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatBRL } from '@/types/billing';

interface CostProjectionCardProps {
  totalBrl: number;
  period: number;
}

export function CostProjectionCard({ totalBrl, period }: CostProjectionCardProps) {
  if (period <= 0 || totalBrl <= 0) return null;

  const dailyAvg = totalBrl / period;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const remainingDays = daysInMonth - dayOfMonth;
  const projectedMonthly = dailyAvg * daysInMonth;
  const projectedRemaining = dailyAvg * remainingDays;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Projeção Mensal
        </CardTitle>
        <CardDescription>
          Baseado na média de {formatBRL(dailyAvg)}/dia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Projeção para o mês</p>
          <p className="text-3xl font-bold flex items-center justify-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            {formatBRL(projectedMonthly)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Gasto até agora</p>
            <p className="text-lg font-semibold">{formatBRL(dailyAvg * dayOfMonth)}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Estimativa restante</p>
            <p className="text-lg font-semibold">{formatBRL(projectedRemaining)}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {remainingDays} dia{remainingDays !== 1 ? 's' : ''} restante{remainingDays !== 1 ? 's' : ''} no mês
        </p>
      </CardContent>
    </Card>
  );
}
