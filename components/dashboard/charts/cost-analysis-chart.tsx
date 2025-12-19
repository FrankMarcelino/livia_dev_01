/**
 * Cost Analysis Chart
 * Combo chart showing tokens (bars) and cost in USD (line)
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { CostOverTimeData } from '@/types/dashboard';

// ============================================================================
// TYPES
// ============================================================================

interface CostAnalysisChartProps {
  data: CostOverTimeData[];
  loading?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTokens(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CostAnalysisChart({ data, loading }: CostAnalysisChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Custos</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Custos</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalTokens = data.reduce((sum, item) => sum + item.tokens, 0);
  const totalCost = data.reduce((sum, item) => sum + item.cost, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Custos - Tokens e USD</CardTitle>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span>
            Total Tokens: <strong className="text-foreground">{formatTokens(totalTokens)}</strong>
          </span>
          <span>
            Total USD: <strong className="text-foreground">{formatCurrency(totalCost)}</strong>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                })
              }
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatTokens}
              label={{
                value: 'Tokens',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle' },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              label={{
                value: 'Custo (USD)',
                angle: 90,
                position: 'insideRight',
                style: { textAnchor: 'middle' },
              }}
            />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
              formatter={(value: number | undefined, name: string | undefined) => {
                if (!value || !name) return ['0', 'N/A'];
                if (name === 'tokens') {
                  return [formatTokens(value), 'Tokens'];
                }
                if (name === 'cost') {
                  return [formatCurrency(value), 'Custo'];
                }
                return [value.toString(), name];
              }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend
              formatter={(value) => {
                if (value === 'tokens') return 'Tokens Utilizados';
                if (value === 'cost') return 'Custo (USD)';
                return value;
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="tokens"
              fill="hsl(var(--chart-1))"
              name="tokens"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cost"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              name="cost"
              dot={{ fill: 'hsl(var(--chart-3))', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
