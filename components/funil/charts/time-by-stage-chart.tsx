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
import { formatDuration } from '@/lib/utils/dashboard-helpers';

interface TimeByStageChartProps {
  avgTimeToPause: number;
  avgTimeToClose: number;
}

export function TimeByStageChart({
  avgTimeToPause,
  avgTimeToClose,
}: TimeByStageChartProps) {
  const data = [
    {
      stage: 'Até Pausa',
      seconds: avgTimeToPause,
      label: formatDuration(avgTimeToPause).display,
      color: '#eab308',
    },
    {
      stage: 'Até Fechamento',
      seconds: avgTimeToClose,
      label: formatDuration(avgTimeToClose).display,
      color: '#3b82f6',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tempo Médio por Etapa</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => formatDuration(value).display}
            />
            <YAxis
              type="category"
              dataKey="stage"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value) => {
                if (value === undefined || value === null) return ['0s', 'Tempo'];
                let numValue: number;
                if (typeof value === 'string') {
                  numValue = parseFloat(value);
                } else if (typeof value === 'number') {
                  numValue = value;
                } else {
                  return ['0s', 'Tempo'];
                }
                return [formatDuration(numValue).display, 'Tempo'];
              }}
            />
            <Bar dataKey="seconds" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-yellow-500" />
              <span>Tempo até Pausa</span>
            </div>
            <span className="font-medium">{formatDuration(avgTimeToPause).display}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span>Tempo até Fechamento</span>
            </div>
            <span className="font-medium">{formatDuration(avgTimeToClose).display}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}








