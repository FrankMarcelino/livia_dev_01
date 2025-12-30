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
import type { ConversationsByTagData } from '@/types/dashboard';
import { formatChartDate } from '@/lib/utils/dashboard-helpers';

interface TagsOverTimeChartProps {
  data: ConversationsByTagData[];
}

/**
 * Mapeia o nome da tag para uma cor específica
 */
function getTagColor(tagName: string): string {
  const lowerTagName = tagName.toLowerCase().trim();

  // Cores específicas para tags conhecidas
  if (lowerTagName.includes('presencial')) {
    return '#60a5fa'; // Azul claro (blue-400)
  }

  if (lowerTagName.includes('teoria') && lowerTagName.includes('estagio')) {
    return '#a855f7'; // Roxo (purple-500)
  }

  if (lowerTagName.includes('teoria') && lowerTagName.includes('apenas')) {
    return '#fbbf24'; // Amarelo (amber-400)
  }

  // Cores padrão para outras tags (caso existam)
  const defaultColors = [
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
  ];

  // Usar hash simples do nome da tag para escolher uma cor consistente
  const hash = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return defaultColors[hash % defaultColors.length] || '#6b7280'; // gray-500 como fallback
}

export function TagsOverTimeChart({ data }: TagsOverTimeChartProps) {
  // Transform ConversationsByTagData[] into format for stacked bar chart
  // Group by date and pivot tags
  const dateMap = new Map<string, Record<string, string | number>>();
  const tagNamesSet = new Set<string>();

  data.forEach(({ date, tagName, count }) => {
    tagNamesSet.add(tagName);
    if (!dateMap.has(date)) {
      dateMap.set(date, { date });
    }
    const dateEntry = dateMap.get(date)!;
    dateEntry[tagName] = count;
  });

  // Convert to array and sort by date
  const chartData = Array.from(dateMap.values()).sort((a, b) => {
    const dateA = typeof a.date === 'string' ? a.date : '';
    const dateB = typeof b.date === 'string' ? b.date : '';
    return dateA.localeCompare(dateB);
  });

  // Format dates for display
  const formattedChartData = chartData.map((item) => {
    const dateStr = typeof item.date === 'string' ? item.date : '';
    return {
      ...item,
      date: formatChartDate(dateStr),
    };
  });

  const tagNames = Array.from(tagNamesSet);

  if (tagNames.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversas por Tag ao Longo do Tempo</CardTitle>
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
        <CardTitle>Conversas por Tag ao Longo do Tempo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={formattedChartData}>
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
            />
            <Legend />
            {tagNames.map((tagName) => (
              <Bar
                key={tagName}
                dataKey={tagName}
                stackId="a"
                fill={getTagColor(tagName)}
                name={tagName}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
