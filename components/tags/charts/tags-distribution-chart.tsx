'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { TagDistributionData } from '@/types/dashboard';
import { formatPercentage } from '@/lib/utils/dashboard-helpers';

interface TagsDistributionChartProps {
  data: TagDistributionData[];
}

const COLORS = [
  '#3b82f6', '#60a5fa', '#93c5fd', '#10b981', '#34d399',
  '#6ee7b7', '#f59e0b', '#fbbf24', '#fcd34d', '#ef4444',
];

export function TagsDistributionChart({ data }: TagsDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Sem dados para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Tags</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data as any}
              dataKey="count"
              nameKey="tagName"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={(props: any) => 
                `${props.tagName}: ${formatPercentage(props.percentage)}`
              }
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value, name, props) => {
                const percentage = props.payload?.percentage ?? 0;
                return [`${value} (${formatPercentage(percentage)})`, name];
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}





