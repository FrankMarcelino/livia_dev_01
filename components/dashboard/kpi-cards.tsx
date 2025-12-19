'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageSquare,
  MessageCircle,
  ThumbsUp,
  TrendingUp,
  Bot,
  Clock,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import type { DashboardKPIs } from '@/types/dashboard';
import {
  formatCompactNumber,
  formatPercentage,
  formatDuration,
  formatCostUSD,
} from '@/lib/utils/dashboard-helpers';

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
      title: 'Taxa de Satisfação',
      value: formatPercentage(kpis.satisfactionRate ?? 0),
      icon: ThumbsUp,
      description: 'Feedbacks positivos',
      color: getSatisfactionColor(kpis.satisfactionRate),
    },
    {
      title: 'Média Msgs/Conversa',
      value: kpis.avgMessagesPerConversation?.toFixed(1) ?? '0.0',
      icon: TrendingUp,
      description: 'Engajamento médio',
    },
    {
      title: '% IA Ativa',
      value: formatPercentage(kpis.aiPercentage ?? 0),
      icon: Bot,
      description: 'Conversas com IA',
    },
    {
      title: 'Tempo Médio Resposta',
      value: formatDuration(kpis.avgFirstResponseTimeSeconds ?? 0).display,
      icon: Clock,
      description: 'Primeira resposta',
    },
    {
      title: 'Custo Total',
      value: formatCostUSD(kpis.estimatedCostUsd ?? 0),
      icon: DollarSign,
      description: 'Tokens consumidos',
    },
    {
      title: 'Taxa de Resolução',
      value: formatPercentage((kpis.conversationsClosed / Math.max(kpis.totalConversations, 1)) * 100),
      icon: CheckCircle,
      description: 'Conversas fechadas',
      color: getResolutionColor((kpis.conversationsClosed / Math.max(kpis.totalConversations, 1)) * 100),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

function getSatisfactionColor(rate: number | null): string {
  if (rate === null) return 'text-muted-foreground';
  if (rate >= 80) return 'text-green-600 dark:text-green-400';
  if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getResolutionColor(rate: number | null): string {
  if (rate === null) return 'text-muted-foreground';
  if (rate >= 75) return 'text-green-600 dark:text-green-400';
  if (rate >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}
