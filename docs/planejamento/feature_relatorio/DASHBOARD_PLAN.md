# Planejamento: Dashboard de Métricas LIVIA

## 1. Visão Geral

### Objetivo
Criar uma página de dashboard com métricas e gráficos de conversas e mensagens, seguindo os padrões do projeto LIVIA (Next.js 15, Supabase, shadcn/ui).

### Escopo MVP
- KPIs básicos (total conversas, mensagens, média de interações, pico de conversas)
- Gráfico combo: Conversas ativas + Média de mensagens por conversa
- Gráfico de conversas por tags (stacked bar)
- Heatmap: Volume de conversas por hora/dia da semana
- Filtros de período: Hoje, 7 dias, 15 dias, 30 dias

### Stack
- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL)
- **UI:** shadcn/ui + Tailwind CSS
- **Charts:** Recharts (leve, integra bem com shadcn, ideal para MVP)
- **Tipos:** TypeScript

---

## 2. Estrutura de Arquivos

```
app/
├── (dashboard)/
│   └── dashboard/
│       ├── page.tsx              # Server Component - carrega dados iniciais
│       └── loading.tsx           # Loading state

components/
└── dashboard/
    ├── dashboard-header.tsx      # Client - Título + filtros de período
    ├── kpi-cards.tsx            # Client - Cards de KPIs
    ├── conversations-chart.tsx   # Client - Combo chart (conversas + média)
    ├── tags-chart.tsx           # Client - Stacked bar (conversas por tag)
    ├── heatmap-chart.tsx        # Client - Heatmap horário
    └── dashboard-container.tsx   # Client - Container principal com estado

lib/
├── queries/
│   └── dashboard.ts             # Queries Supabase para dashboard
└── utils/
    └── dashboard-helpers.ts     # Helpers (calcular KPIs, formatar dados)

types/
└── dashboard.ts                 # Tipos específicos do dashboard
```

---

## 3. Biblioteca de Gráficos: Recharts

### Por que Recharts?

✅ **Vantagens para o MVP:**
- Leve (~50kb gzipped)
- Componentes React nativos
- Integração perfeita com shadcn/ui
- Documentação excelente
- Suporta todos os tipos de gráficos necessários
- Responsivo por padrão
- Customização via props (não precisa CSS complexo)

✅ **Alternativas consideradas:**
- ApexCharts: Mais pesado, baseado em jQuery
- Chart.js: Precisa de wrapper React, menos declarativo
- Visx: Muito low-level para MVP

### Instalação
```bash
npm install recharts
npm install --save-dev @types/recharts
```

---

## 4. Modelagem de Dados

### 4.1. Query SQL Otimizada

Criar uma function no Supabase ou usar queries diretas:

```sql
-- Função Postgres para buscar dados do dashboard
CREATE OR REPLACE FUNCTION get_dashboard_data(
  p_tenant_id UUID,
  p_days_ago INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  start_date TIMESTAMP := CURRENT_DATE - (p_days_ago || ' days')::INTERVAL;
  result JSON;
BEGIN
  SELECT json_build_object(
    -- KPIs totais
    'total_conversations', (
      SELECT COUNT(DISTINCT c.id)
      FROM conversations c
      WHERE c.tenant_id = p_tenant_id
        AND c.created_at >= start_date
    ),

    'total_messages', (
      SELECT COUNT(m.id)
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE c.tenant_id = p_tenant_id
        AND m.created_at >= start_date
    ),

    -- Conversas por dia (para gráfico combo)
    'daily_conversations', (
      SELECT json_agg(
        json_build_object(
          'date', date,
          'total', total_conversations,
          'avg_messages', ROUND(avg_messages_per_conversation, 1)
        ) ORDER BY date
      )
      FROM (
        SELECT
          DATE(c.created_at) as date,
          COUNT(DISTINCT c.id) as total_conversations,
          AVG(msg_count.count) as avg_messages_per_conversation
        FROM conversations c
        LEFT JOIN (
          SELECT conversation_id, COUNT(*) as count
          FROM messages
          GROUP BY conversation_id
        ) msg_count ON msg_count.conversation_id = c.id
        WHERE c.tenant_id = p_tenant_id
          AND c.created_at >= start_date
        GROUP BY DATE(c.created_at)
        ORDER BY date
      ) daily
    ),

    -- Conversas por tag por dia (stacked bar)
    'daily_conversations_by_tag', (
      SELECT json_agg(
        json_build_object(
          'date', date,
          'tag_name', tag_name,
          'count', count
        ) ORDER BY date, tag_name
      )
      FROM (
        SELECT
          DATE(c.created_at) as date,
          COALESCE(t.name, 'Sem Tag') as tag_name,
          COUNT(DISTINCT c.id) as count
        FROM conversations c
        LEFT JOIN conversation_tags ct ON ct.conversation_id = c.id
        LEFT JOIN tags t ON t.id = ct.tag_id
        WHERE c.tenant_id = p_tenant_id
          AND c.created_at >= start_date
        GROUP BY DATE(c.created_at), t.name
        ORDER BY date, tag_name
      ) tags_daily
    ),

    -- Heatmap (hora x dia da semana)
    'heatmap', (
      SELECT json_agg(
        json_build_object(
          'day_of_week', day_of_week,
          'hour', hour,
          'count', count
        ) ORDER BY day_of_week, hour
      )
      FROM (
        SELECT
          EXTRACT(DOW FROM c.created_at)::INTEGER as day_of_week,
          EXTRACT(HOUR FROM c.created_at)::INTEGER as hour,
          COUNT(c.id) as count
        FROM conversations c
        WHERE c.tenant_id = p_tenant_id
          AND c.created_at >= start_date
        GROUP BY day_of_week, hour
        ORDER BY day_of_week, hour
      ) heatmap_data
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### 4.2. Query TypeScript (Alternativa sem Function)

Se preferir não criar function no DB:

```typescript
// lib/queries/dashboard.ts
export async function getDashboardData(tenantId: string, daysAgo: number = 30) {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  // Query 1: KPIs totais
  const { count: totalConversations } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', startDate.toISOString());

  // Query 2: Total de mensagens
  const { data: messages } = await supabase
    .from('messages')
    .select('id, conversation_id')
    .gte('created_at', startDate.toISOString());

  // Filtrar apenas mensagens de conversas do tenant (RLS)
  const totalMessages = messages?.length || 0;

  // Query 3: Conversas por dia com média de mensagens
  // (Fazer agregação no client - simplifica para MVP)
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, created_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  // Query 4: Tags das conversas
  const { data: conversationTags } = await supabase
    .from('conversation_tags')
    .select(`
      conversation_id,
      tag:tags(id, name)
    `);

  return {
    totalConversations: totalConversations || 0,
    totalMessages,
    conversations: conversations || [],
    conversationTags: conversationTags || [],
    messages: messages || [],
  };
}
```

---

## 5. Tipos TypeScript

```typescript
// types/dashboard.ts

export type TimeFilter = 'today' | '7days' | '15days' | '30days';

export interface DashboardKPIs {
  totalConversations: number;
  totalMessages: number;
  avgInteractions: number;
  peakDay: {
    date: string;
    count: number;
  };
}

export interface DailyConversationData {
  date: string;
  total: number;
  avgMessages: number;
}

export interface ConversationsByTag {
  date: string;
  [tagName: string]: string | number; // dynamic keys for each tag
}

export interface HeatmapData {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  count: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  dailyConversations: DailyConversationData[];
  conversationsByTag: ConversationsByTag[];
  heatmap: HeatmapData[];
}
```

---

## 6. Componentes

### 6.1. Page (Server Component)

```typescript
// app/(dashboard)/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDashboardData } from '@/lib/queries/dashboard';
import { DashboardContainer } from '@/components/dashboard/dashboard-container';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', authData.user.id)
    .single();

  const tenantId = userData?.tenant_id;

  if (!tenantId) {
    return <div>Erro: Usuário sem tenant associado</div>;
  }

  // Carregar dados iniciais (30 dias)
  const initialData = await getDashboardData(tenantId, 30);

  return <DashboardContainer initialData={initialData} tenantId={tenantId} />;
}
```

### 6.2. Dashboard Container (Client Component)

```typescript
// components/dashboard/dashboard-container.tsx
'use client';

import { useState } from 'react';
import { DashboardHeader } from './dashboard-header';
import { KPICards } from './kpi-cards';
import { ConversationsChart } from './conversations-chart';
import { TagsChart } from './tags-chart';
import { HeatmapChart } from './heatmap-chart';
import type { TimeFilter } from '@/types/dashboard';

interface DashboardContainerProps {
  initialData: any;
  tenantId: string;
}

export function DashboardContainer({ initialData, tenantId }: DashboardContainerProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30days');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(initialData);

  const handleFilterChange = async (filter: TimeFilter) => {
    setTimeFilter(filter);
    setLoading(true);

    try {
      // Chamar API para buscar dados filtrados
      const response = await fetch(`/api/dashboard?filter=${filter}&tenantId=${tenantId}`);
      const newData = await response.json();
      setData(newData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardHeader
        currentFilter={timeFilter}
        onFilterChange={handleFilterChange}
      />

      <KPICards data={data.kpis} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConversationsChart data={data.dailyConversations} loading={loading} />
        <TagsChart data={data.conversationsByTag} loading={loading} />
      </div>

      <HeatmapChart data={data.heatmap} loading={loading} />
    </div>
  );
}
```

### 6.3. Dashboard Header

```typescript
// components/dashboard/dashboard-header.tsx
'use client';

import { Button } from '@/components/ui/button';
import type { TimeFilter } from '@/types/dashboard';

interface DashboardHeaderProps {
  currentFilter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
}

const filters: { label: string; value: TimeFilter }[] = [
  { label: 'Hoje', value: 'today' },
  { label: '7 Dias', value: '7days' },
  { label: '15 Dias', value: '15days' },
  { label: '30 Dias', value: '30days' },
];

export function DashboardHeader({ currentFilter, onFilterChange }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="flex gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={currentFilter === filter.value ? 'default' : 'outline'}
            onClick={() => onFilterChange(filter.value)}
            size="sm"
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

### 6.4. KPI Cards

```typescript
// components/dashboard/kpi-cards.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/card';
import { MessageSquare, TrendingUp, Activity, Calendar } from 'lucide-react';
import type { DashboardKPIs } from '@/types/dashboard';

interface KPICardsProps {
  data: DashboardKPIs;
  loading?: boolean;
}

export function KPICards({ data, loading }: KPICardsProps) {
  const kpis = [
    {
      title: 'Total Conversas',
      value: data.totalConversations,
      icon: MessageSquare,
    },
    {
      title: 'Total Mensagens',
      value: data.totalMessages,
      icon: Activity,
    },
    {
      title: 'Média Interações',
      value: data.avgInteractions.toFixed(1),
      icon: TrendingUp,
    },
    {
      title: 'Pico de Conversas',
      value: data.peakDay.count,
      subtitle: data.peakDay.date,
      icon: Calendar,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {kpi.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

### 6.5. Conversations Chart (Combo: Bar + Line)

```typescript
// components/dashboard/conversations-chart.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { DailyConversationData } from '@/types/dashboard';

interface ConversationsChartProps {
  data: DailyConversationData[];
  loading?: boolean;
}

export function ConversationsChart({ data, loading }: ConversationsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversas Ativas</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversas Ativas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="total"
              fill="hsl(var(--primary))"
              name="Conversas"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgMessages"
              stroke="hsl(var(--destructive))"
              name="Média Mensagens"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### 6.6. Tags Chart (Stacked Bar)

```typescript
// components/dashboard/tags-chart.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ConversationsByTag } from '@/types/dashboard';

interface TagsChartProps {
  data: ConversationsByTag[];
  loading?: boolean;
}

// Cores para as tags (pode vir do banco futuramente)
const TAG_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function TagsChart({ data, loading }: TagsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversas por Tag</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  // Extrair nomes das tags dinamicamente
  const tagNames = data.length > 0
    ? Object.keys(data[0]).filter(key => key !== 'date')
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversas por Tag</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
            />
            <Legend />
            {tagNames.map((tagName, index) => (
              <Bar
                key={tagName}
                dataKey={tagName}
                stackId="tags"
                fill={TAG_COLORS[index % TAG_COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### 6.7. Heatmap Chart

```typescript
// components/dashboard/heatmap-chart.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { HeatmapData } from '@/types/dashboard';

interface HeatmapChartProps {
  data: HeatmapData[];
  loading?: boolean;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function HeatmapChart({ data, loading }: HeatmapChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Calor - Conversas por Horário</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  // Encontrar o valor máximo para normalizar cores
  const maxCount = Math.max(...data.map(d => d.count), 1);

  // Criar matriz [dia][hora]
  const matrix: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );

  data.forEach(({ dayOfWeek, hour, count }) => {
    matrix[dayOfWeek][hour] = count;
  });

  // Calcular intensidade da cor (0-1)
  const getIntensity = (count: number) => count / maxCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Calor - Conversas por Horário</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header com horas */}
            <div className="flex">
              <div className="w-12" /> {/* Espaço para labels dos dias */}
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs text-muted-foreground min-w-[2rem]"
                >
                  {hour}h
                </div>
              ))}
            </div>

            {/* Linhas do heatmap */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center">
                <div className="w-12 text-sm text-muted-foreground">{day}</div>
                {HOURS.map(hour => {
                  const count = matrix[dayIndex][hour];
                  const intensity = getIntensity(count);

                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className="flex-1 min-w-[2rem] h-8 border border-border cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: `hsl(var(--primary) / ${intensity})`,
                      }}
                      title={`${day} ${hour}h: ${count} conversas`}
                    />
                  );
                })}
              </div>
            ))}

            {/* Legenda */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
              <span>Menos</span>
              <div className="flex gap-1">
                {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
                  <div
                    key={intensity}
                    className="w-4 h-4 border border-border"
                    style={{
                      backgroundColor: `hsl(var(--primary) / ${intensity})`,
                    }}
                  />
                ))}
              </div>
              <span>Mais</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 7. API Route (Filtros Dinâmicos)

```typescript
// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDashboardData } from '@/lib/queries/dashboard';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || '30days';
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    // Mapear filtro para número de dias
    const daysMap = {
      today: 1,
      '7days': 7,
      '15days': 15,
      '30days': 30,
    };

    const days = daysMap[filter as keyof typeof daysMap] || 30;

    const data = await getDashboardData(tenantId, days);

    return NextResponse.json(data);

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 8. Helpers

```typescript
// lib/utils/dashboard-helpers.ts

import type { DashboardKPIs, DailyConversationData, HeatmapData } from '@/types/dashboard';

/**
 * Calcular KPIs a partir de dados brutos
 */
export function calculateKPIs(
  conversations: any[],
  messages: any[]
): DashboardKPIs {
  const totalConversations = conversations.length;
  const totalMessages = messages.length;
  const avgInteractions = totalConversations > 0
    ? totalMessages / totalConversations
    : 0;

  // Agrupar conversas por dia para encontrar pico
  const conversationsByDay = conversations.reduce((acc, conv) => {
    const date = new Date(conv.created_at).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const peakDay = Object.entries(conversationsByDay)
    .sort(([, a], [, b]) => b - a)[0] || ['', 0];

  return {
    totalConversations,
    totalMessages,
    avgInteractions,
    peakDay: {
      date: peakDay[0],
      count: peakDay[1],
    },
  };
}

/**
 * Agrupar conversas por dia com média de mensagens
 */
export function groupConversationsByDay(
  conversations: any[],
  messages: any[]
): DailyConversationData[] {
  // Contar mensagens por conversa
  const messagesByConversation = messages.reduce((acc, msg) => {
    acc[msg.conversation_id] = (acc[msg.conversation_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Agrupar conversas por dia
  const dailyData = conversations.reduce((acc, conv) => {
    const date = new Date(conv.created_at).toISOString().split('T')[0];

    if (!acc[date]) {
      acc[date] = { total: 0, totalMessages: 0 };
    }

    acc[date].total += 1;
    acc[date].totalMessages += messagesByConversation[conv.id] || 0;

    return acc;
  }, {} as Record<string, { total: number; totalMessages: number }>);

  // Transformar em array
  return Object.entries(dailyData)
    .map(([date, stats]) => ({
      date,
      total: stats.total,
      avgMessages: stats.total > 0 ? stats.totalMessages / stats.total : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Formatar dados para heatmap
 */
export function formatHeatmapData(conversations: any[]): HeatmapData[] {
  const heatmapMap = conversations.reduce((acc, conv) => {
    const date = new Date(conv.created_at);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    const key = `${dayOfWeek}-${hour}`;

    acc[key] = (acc[key] || 0) + 1;

    return acc;
  }, {} as Record<string, number>);

  return Object.entries(heatmapMap).map(([key, count]) => {
    const [dayOfWeek, hour] = key.split('-').map(Number);
    return { dayOfWeek, hour, count };
  });
}
```

---

## 9. Passo a Passo de Implementação

### Fase 1: Setup Inicial
1. ✅ Instalar dependências
   ```bash
   npm install recharts
   npm install --save-dev @types/recharts
   ```

2. ✅ Adicionar variáveis CSS para cores dos gráficos (se necessário)
   ```css
   /* globals.css */
   :root {
     --chart-1: 220 70% 50%;
     --chart-2: 160 60% 45%;
     --chart-3: 30 80% 55%;
     --chart-4: 280 65% 60%;
     --chart-5: 340 75% 55%;
   }
   ```

### Fase 2: Tipos e Queries
3. ✅ Criar tipos em `types/dashboard.ts`
4. ✅ Criar queries em `lib/queries/dashboard.ts`
5. ✅ Criar helpers em `lib/utils/dashboard-helpers.ts`

### Fase 3: Componentes Base
6. ✅ Criar `components/dashboard/dashboard-header.tsx`
7. ✅ Criar `components/dashboard/kpi-cards.tsx`
8. ✅ Testar cards isoladamente

### Fase 4: Gráficos
9. ✅ Criar `components/dashboard/conversations-chart.tsx`
10. ✅ Criar `components/dashboard/tags-chart.tsx`
11. ✅ Criar `components/dashboard/heatmap-chart.tsx`

### Fase 5: Integração
12. ✅ Criar `components/dashboard/dashboard-container.tsx`
13. ✅ Criar `app/(dashboard)/dashboard/page.tsx`
14. ✅ Criar `app/(dashboard)/dashboard/loading.tsx`

### Fase 6: API e Filtros
15. ✅ Criar `app/api/dashboard/route.ts`
16. ✅ Conectar filtros ao container
17. ✅ Testar filtros dinâmicos

### Fase 7: Refinamentos
18. ✅ Adicionar skeleton loaders
19. ✅ Tratamento de erros
20. ✅ Validar responsividade
21. ✅ Testar com dados reais

---

## 10. Considerações Técnicas

### Performance
- ✅ Usar Server Components para carregar dados iniciais
- ✅ Client Components apenas onde necessário (filtros, gráficos)
- ✅ Considerar cache dos dados (React Query opcional)
- ⚠️ Se queries ficarem lentas, criar materialized view no Postgres

### Segurança
- ✅ Validar tenant_id em todas as queries
- ✅ RLS habilitado nas tabelas
- ✅ Autenticação obrigatória

### UX
- ✅ Loading states em todos os componentes
- ✅ Error boundaries (Next.js error.tsx)
- ✅ Feedback visual em filtros
- ✅ Tooltips informativos nos gráficos

### MVP vs Futuro
**MVP (Implementar agora):**
- Filtros básicos (hoje, 7, 15, 30 dias)
- 4 KPIs principais
- 3 gráficos (combo, stacked, heatmap)
- Dados estáticos ao trocar filtro

**Futuro (Não implementar agora):**
- Realtime updates (Supabase subscriptions)
- Exportar dados (CSV, PDF)
- Comparação de períodos
- Filtros avançados (por canal, agente, etc.)
- Drill-down nos gráficos

---

## 11. Checklist Final

### Validação de Código (OBRIGATÓRIO - Executar ANTES de marcar como concluído)

**⚠️ CRÍTICO:** Execute esta sequência SEMPRE após cada implementação:

```bash
npm run lint && npx tsc --noEmit && npm run build
```

- [ ] **`npm run lint`** - Passou sem erros
- [ ] **`npx tsc --noEmit`** - Passou sem erros de tipo
- [ ] **`npm run build`** - Build executou com sucesso

**❌ NÃO prossiga se algum comando falhar!**

---

### Funcionalidades e Qualidade

- [ ] Dados carregam corretamente do Supabase
- [ ] Filtros funcionam (hoje, 7, 15, 30 dias)
- [ ] KPIs calculam corretamente
- [ ] Gráfico combo renderiza (conversas + média)
- [ ] Gráfico de tags empilhado funciona
- [ ] Heatmap renderiza com cores corretas
- [ ] Loading states funcionam
- [ ] Responsivo em mobile, tablet, desktop
- [ ] Sem erros no console
- [ ] Tenant_id validado em todas queries
- [ ] Tratamento de erro implementado
- [ ] Performance aceitável (< 2s carregamento inicial)

---

## 12. Estimativa de Complexidade

**Baixa complexidade:**
- KPI Cards
- Dashboard Header
- Tipos TypeScript

**Média complexidade:**
- Queries Supabase
- Conversations Chart
- Tags Chart
- API Route

**Alta complexidade:**
- Heatmap Chart (renderização customizada)
- Helpers de agregação de dados
- Tratamento de casos edge (sem dados, tags dinâmicas)

**Total estimado:** ~8-12 horas de desenvolvimento para MVP completo

---

## 13. Próximos Passos

1. Revisar este planejamento
2. Ajustar se necessário
3. Começar implementação pela Fase 1
4. **Implementar incrementalmente:**
   - Implementar componente/feature
   - **SEMPRE executar:** `npm run lint && npx tsc --noEmit && npm run build`
   - Só prosseguir se todos os testes passarem
   - Testar funcionalidade
   - Commit
5. Integrar tudo no final
6. Testar com dados reais
7. Refinar UX conforme feedback

**⚠️ REGRA FUNDAMENTAL:** Após CADA implementação, executar validação completa (lint + types + build)

---

**Observações Finais:**

- Este plano segue os padrões LIVIA (Next.js 15, Supabase, shadcn/ui)
- Recharts foi escolhido por ser leve e adequado para MVP
- Foco em simplicidade: evitar over-engineering
- Queries podem ser otimizadas depois (function Postgres, materialized views)
- Realtime não é necessário para MVP (adicionar depois se necessário)
