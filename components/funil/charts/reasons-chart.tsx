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
import type { ReasonData } from '@/types/dashboard';
import { formatPercentage } from '@/lib/utils/dashboard-helpers';

interface ReasonsChartProps {
  data: ReasonData[];
  title: string;
  type: 'pause' | 'closure';
}

export function ReasonsChart({ data, title, type }: ReasonsChartProps) {
  const color = type === 'pause' ? '#eab308' : '#3b82f6';
  const colorLight = type === 'pause' ? '#fef08a' : '#93c5fd';

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Sem dados para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by count descending and take top 10
  const sortedData = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      fill: index % 2 === 0 ? color : colorLight,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              type="category"
              dataKey="reason"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              width={140}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value, _name, props) => {
                if (value === undefined) return ['0', 'Quantidade'];
                const percentage = props.payload?.percentage ?? 0;
                return [
                  `${value} (${formatPercentage(percentage)})`,
                  'Quantidade',
                ];
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-1">
          {sortedData.slice(0, 5).map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm py-1"
            >
              <span className="text-muted-foreground truncate flex-1">
                {item.reason}
              </span>
              <span className="font-medium ml-2">
                {item.count} ({formatPercentage(item.percentage)})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
