'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageSquare,
  Pause,
  CheckCircle2,
  TrendingUp,
  Clock,
  Timer,
} from 'lucide-react';
import type { FunnelKPIs } from '@/types/dashboard';
import {
  formatCompactNumber,
  formatPercentage,
  formatDuration,
} from '@/lib/utils/dashboard-helpers';

interface FunilKPICardsProps {
  kpis: FunnelKPIs;
}

export function FunilKPICards({ kpis }: FunilKPICardsProps) {
  const cards = [
    {
      title: 'Conversas Abertas',
      value: formatCompactNumber(kpis.conversationsOpen),
      icon: MessageSquare,
      description: 'Status: Open',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Conversas Pausadas',
      value: formatCompactNumber(kpis.conversationsPaused),
      icon: Pause,
      description: 'Status: Paused',
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Conversas Fechadas',
      value: formatCompactNumber(kpis.conversationsClosed),
      icon: CheckCircle2,
      description: 'Status: Closed',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Taxa de Conversão',
      value: formatPercentage(kpis.conversionRate ?? 0),
      icon: TrendingUp,
      description: 'Open → Closed',
      color: getConversionColor(kpis.conversionRate),
    },
    {
      title: 'Tempo até Pausa',
      value: formatDuration(kpis.avgTimeToPauseSeconds ?? 0).display,
      icon: Clock,
      description: 'Tempo médio',
    },
    {
      title: 'Tempo até Fechamento',
      value: formatDuration(kpis.avgTimeToCloseSeconds ?? 0).display,
      icon: Timer,
      description: 'Tempo médio',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${card.color || 'text-foreground'}`}
              >
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function getConversionColor(rate: number | null): string {
  if (rate === null) return 'text-muted-foreground';
  if (rate >= 70) return 'text-green-600 dark:text-green-400';
  if (rate >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}






