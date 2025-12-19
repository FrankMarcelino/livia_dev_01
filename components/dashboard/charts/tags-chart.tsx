'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ConversationsByTag } from '@/types/dashboard';
import {
  formatChartDate,
  extractTagNames,
  getChartColor,
} from '@/lib/utils/dashboard-helpers';

interface TagsChartProps {
  data: ConversationsByTag[];
}

export function TagsChart({ data }: TagsChartProps) {
  // Extrair nomes únicos de tags
  const tagNames = extractTagNames(data);

  // Formatar dados para o gráfico
  const chartData = data.map((item) => {
    const { date, ...tags } = item;
    return {
      date: formatChartDate(date),
      ...tags,
    };
  });

  if (tagNames.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversas por Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            Nenhuma tag encontrada no período
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversas por Tag</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            {tagNames.map((tagName, index) => (
              <Bar
                key={tagName}
                dataKey={tagName}
                stackId="a"
                fill={getChartColor(index)}
                name={tagName}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
