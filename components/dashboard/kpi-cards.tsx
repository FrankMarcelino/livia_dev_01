'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageSquare,
  MessageCircle,
  TrendingUp,
} from 'lucide-react';
import type { DashboardKPIs } from '@/types/dashboard';
import { formatCompactNumber } from '@/lib/utils/dashboard-helpers';

interface KPICardsProps {
  kpis: DashboardKPIs;
}

export function KPICards({ kpis }: KPICardsProps) {
  const cards = [
    {
      title: 'Total de Conversas',
      value: formatCompactNumber(kpis.totalConversations),
      icon: MessageSquare,
      description: 'Conversas no período',
    },
    {
      title: 'Total de Mensagens',
      value: formatCompactNumber(kpis.totalMessages),
      icon: MessageCircle,
      description: 'Mensagens trocadas',
    },
    {
      title: 'Média Msgs/Conversa',
      value: kpis.avgMessagesPerConversation?.toFixed(1) ?? '0.0',
      icon: TrendingUp,
      description: 'Engajamento médio',
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
              <div className="text-2xl font-bold text-foreground">
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
