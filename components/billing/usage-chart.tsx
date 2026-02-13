'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UsageDailySummary } from '@/types/billing';

interface UsageChartProps {
  data: UsageDailySummary[];
  isLoading: boolean;
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; payload: { chamadas: number } }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  const value = payload[0]?.value || 0;
  const calls = payload[0]?.payload?.chamadas || 0;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-primary font-semibold">
        R$ {value.toFixed(2)}
      </p>
      <p className="text-xs text-muted-foreground">
        {calls} chamada{calls !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

export function UsageChart({ data, isLoading }: UsageChartProps) {
  const chartData = data.map((item) => ({
    date: formatDateShort(item.date),
    valor: item.total_brl,
    chamadas: item.calls,
  }));

  // Calcular média
  const avgValue = data.length > 0
    ? data.reduce((sum, d) => sum + d.total_brl, 0) / data.length
    : 0;

  if (isLoading && data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Consumo Diário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Consumo Diário
          </CardTitle>
          <CardDescription>Valor consumido por dia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum consumo registrado no período</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Consumo Diário
        </CardTitle>
        <CardDescription>
          Valor consumido por dia (em R$) — Média: R$ {avgValue.toFixed(2)}/dia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${value}`}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              {avgValue > 0 && (
                <ReferenceLine
                  y={avgValue}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                  label={{
                    value: `Média`,
                    position: 'right',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 11,
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="valor"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorValor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
