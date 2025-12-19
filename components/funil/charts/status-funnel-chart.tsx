'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FunnelKPIs } from '@/types/dashboard';
import { formatCompactNumber, formatPercentage } from '@/lib/utils/dashboard-helpers';

interface StatusFunnelChartProps {
  data: FunnelKPIs;
}

export function StatusFunnelChart({ data }: StatusFunnelChartProps) {
  const total = data.conversationsOpen + data.conversationsPaused + data.conversationsClosed;
  
  const stages = [
    {
      label: 'Abertas',
      value: data.conversationsOpen,
      color: 'bg-green-500',
      percentage: total > 0 ? (data.conversationsOpen / total) * 100 : 0,
    },
    {
      label: 'Pausadas',
      value: data.conversationsPaused,
      color: 'bg-yellow-500',
      percentage: total > 0 ? (data.conversationsPaused / total) * 100 : 0,
    },
    {
      label: 'Fechadas',
      value: data.conversationsClosed,
      color: 'bg-blue-500',
      percentage: total > 0 ? (data.conversationsClosed / total) * 100 : 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const maxWidth = 100 - (index * 10); // Decrease width for funnel effect
            
            return (
              <div key={stage.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.label}</span>
                  <span className="text-muted-foreground">
                    {formatCompactNumber(stage.value)} ({formatPercentage(stage.percentage)})
                  </span>
                </div>
                <div className="relative h-16 flex items-center justify-center">
                  <div
                    className={`${stage.color} rounded-md flex items-center justify-center text-white font-bold transition-all duration-300`}
                    style={{
                      width: `${maxWidth}%`,
                      height: '100%',
                    }}
                  >
                    <span>{formatCompactNumber(stage.value)}</span>
                  </div>
                </div>
                {index < stages.length - 1 && (
                  <div className="flex items-center justify-center">
                    <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-muted" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Taxa de Conversão</span>
            <span className="text-lg font-bold text-primary">
              {formatPercentage(data.conversionRate)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Percentual de conversas que chegaram ao fechamento
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
