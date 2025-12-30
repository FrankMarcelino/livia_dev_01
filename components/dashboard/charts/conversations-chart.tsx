'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DailyConversationData } from '@/types/dashboard';
import { formatChartDate } from '@/lib/utils/dashboard-helpers';

interface ConversationsChartProps {
  data: DailyConversationData[];
}

export function ConversationsChart({ data }: ConversationsChartProps) {
  const chartData = data.map((item) => ({
    date: formatChartDate(item.date),
    total: item.total,
    avgMessages: item.avgMessages,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversas ao Longo do Tempo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              yAxisId="left"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '2px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '14px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                opacity: 1,
              }}
              labelStyle={{
                color: '#000000',
                fontWeight: 700,
                marginBottom: '8px',
                fontSize: '14px',
              }}
              itemStyle={{
                color: '#333333',
                padding: '4px 0',
                fontSize: '13px',
                fontWeight: 500,
              }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="total"
              fill="hsl(217, 91%, 60%)"
              name="Total de Conversas"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgMessages"
              stroke="hsl(142, 76%, 36%)"
              name="Média de Mensagens"
              strokeWidth={3}
              dot={{ r: 5, fill: 'hsl(142, 76%, 36%)', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 7 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
