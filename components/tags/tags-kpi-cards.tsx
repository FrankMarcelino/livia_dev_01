'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckSquare,
  XSquare,
  TrendingUp,
} from 'lucide-react';
import type { TagsKPIs } from '@/types/dashboard';
import {
  formatCompactNumber,
  formatPercentage,
} from '@/lib/utils/dashboard-helpers';

interface TagsKPICardsProps {
  kpis: TagsKPIs;
}

export function TagsKPICards({ kpis }: TagsKPICardsProps) {
  const cards = [
    {
      title: 'Conversas com Tag',
      value: formatCompactNumber(kpis.conversationsWithTags),
      icon: CheckSquare,
      description: 'Categorizadas',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Conversas sem Tag',
      value: formatCompactNumber(kpis.conversationsWithoutTags),
      icon: XSquare,
      description: 'Não categorizadas',
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Taxa de Categorização',
      value: formatPercentage(kpis.categorizationRate ?? 0),
      icon: TrendingUp,
      description: '% com tags',
      color: getCategorizationColor(kpis.categorizationRate),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

function getCategorizationColor(rate: number | null): string {
  if (rate === null) return 'text-muted-foreground';
  if (rate >= 80) return 'text-green-600 dark:text-green-400';
  if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}






