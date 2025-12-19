/**
 * AI vs Human Chart
 * Comparative bar chart showing metrics comparison between AI and human attendants
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import type { AIvsHumanData } from '@/types/dashboard';
import { formatDuration } from '@/lib/utils/dashboard-helpers';

// ============================================================================
// TYPES
// ============================================================================

interface AIvsHumanChartProps {
  data: AIvsHumanData[];
  loading?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  AI: 'hsl(var(--chart-1))',
  Human: 'hsl(var(--chart-2))',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function AIvsHumanChart({ data, loading }: AIvsHumanChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI vs Humano</CardTitle>
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
          <CardTitle>AI vs Humano</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI vs Humano - Comparativo</CardTitle>
        <p className="text-sm text-muted-foreground">
          Volume, tempo de resposta e satisfação
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Volume */}
          <div>
            <h4 className="text-sm font-medium mb-2">Volume de Conversas</h4>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="type" width={80} />
                <Tooltip
                  formatter={(value: number | undefined) => [value?.toLocaleString() ?? '0', 'Conversas']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                  {data.map((entry) => (
                    <Cell key={entry.type} fill={COLORS[entry.type]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Response Time */}
          <div>
            <h4 className="text-sm font-medium mb-2">Tempo Médio de Resposta</h4>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={data.filter((d) => d.avgResponseTime !== null)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="type" width={80} />
                <Tooltip
                  formatter={(value: number | undefined) => [value !== undefined ? formatDuration(value).display : 'N/A', 'Tempo']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="avgResponseTime" radius={[0, 4, 4, 0]}>
                  {data.map((entry) => (
                    <Cell key={entry.type} fill={COLORS[entry.type]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Satisfaction */}
          <div>
            <h4 className="text-sm font-medium mb-2">Taxa de Satisfação (%)</h4>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={data.filter((d) => d.satisfaction !== null)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="type" width={80} />
                <Tooltip
                  formatter={(value: number | undefined) => [`${value?.toFixed(1) ?? '0'}%`, 'Satisfação']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="satisfaction" radius={[0, 4, 4, 0]}>
                  {data.map((entry) => (
                    <Cell key={entry.type} fill={COLORS[entry.type]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
