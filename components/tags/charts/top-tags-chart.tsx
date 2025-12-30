'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { TopTagData } from '@/types/dashboard';
import { formatPercentage } from '@/lib/utils/dashboard-helpers';

interface TopTagsChartProps {
  data: TopTagData[];
}

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

export function TopTagsChart({ data }: TopTagsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>TOP 10 Tags Mais Usadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Sem dados para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>TOP 10 Tags Mais Usadas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" tick={{ fill: 'currentColor' }} />
            <YAxis
              type="category"
              dataKey="tagName"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              width={110}
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
                padding: '4px 0',
                fontSize: '13px',
                fontWeight: 600,
              }}
              formatter={(value, _name, props) => {
                const percentage = props.payload?.percentage ?? 0;
                return [`${value} (${formatPercentage(percentage)})`, 'Conversas'];
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {sortedData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}








