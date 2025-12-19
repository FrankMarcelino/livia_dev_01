# Dashboard LIVIA - Arquitetura Completa v2.0

## 🎯 Objetivo

Criar um dashboard de alta performance com insights profundos para gestão de canais de comunicação, incluindo:
- **Performance operacional** (volume, eficiência, SLA)
- **Qualidade de atendimento** (satisfação, resolução, tempo de resposta)
- **Análise financeira** (custos de tokens, ROI de IA)
- **Inteligência de canal** (distribuição, performance por canal)
- **Performance de agentes** (IA vs humano, produtividade)

---

## 📊 KPIs Expandidos (15 métricas principais)

### 1. Volume & Engajamento
- ✅ Total de conversas (período)
- ✅ Total de mensagens (período)
- ✅ Média de mensagens por conversa
- ✅ Pico de conversas (dia + quantidade)
- ✅ Taxa de conversas ativas (open vs total)

### 2. Qualidade & Satisfação
- ✅ Taxa de satisfação (likes / total feedbacks)
- ✅ NPS Score (Net Promoter Score baseado em feedbacks)
- ✅ Conversas com feedback negativo
- ✅ Taxa de resolução (conversas fechadas / total)

### 3. Eficiência Operacional
- ✅ Tempo médio de primeira resposta
- ✅ Tempo médio de resolução (abertura → fechamento)
- ✅ Taxa de reativação de conversas
- ✅ Conversas pausadas (tempo médio em pausa)

### 4. Performance de IA
- ✅ % Conversas atendidas por IA vs Humano
- ✅ Taxa de transferência IA → Humano
- ✅ Satisfação IA vs Humano (comparativo)
- ✅ Economia de tempo com IA

### 5. Custos & ROI
- ✅ Total de tokens consumidos
- ✅ Custo estimado (baseado em pricing de modelo)
- ✅ Custo médio por conversa
- ✅ ROI de IA (economia vs custo)

### 6. Canais de Comunicação
- ✅ Conversas por canal (WhatsApp, Telegram, etc)
- ✅ Performance por canal (tempo de resposta, satisfação)
- ✅ Taxa de conversão por canal
- ✅ Distribuição de volume por canal

---

## 🏗️ Arquitetura de Dados

### Opção 1: Materialized View (RECOMENDADO para alta escala)

**Vantagens:**
- Cache pré-calculado de métricas
- Refresh incremental a cada 5-15min
- Performance constante independente do volume
- Zero impacto em queries de escrita

**Desvantagens:**
- Dados com delay de até 15min
- Espaço adicional no banco

```sql
-- Materialized View com refresh automático
CREATE MATERIALIZED VIEW dashboard_metrics_cache AS
SELECT ... (queries otimizadas)
WITH DATA;

-- Index para performance
CREATE UNIQUE INDEX ON dashboard_metrics_cache (tenant_id, date);

-- Refresh automático (pg_cron ou trigger)
SELECT cron.schedule('refresh-dashboard', '*/15 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics_cache'
);
```

### Opção 2: Postgres Function (RECOMENDADO para MVP)

**Vantagens:**
- Dados em tempo real
- Queries otimizadas com CTEs
- Fácil manutenção e debugging
- Sem infraestrutura adicional

**Desvantagens:**
- Performance depende do volume de dados
- Pode ser lento com +100k conversas

```sql
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  p_tenant_id UUID,
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP,
  p_channel_id UUID DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
-- Queries otimizadas com indexes
$$ LANGUAGE plpgsql;
```

### Opção 3: Híbrida (RECOMENDADO para produção)

**Melhor dos dois mundos:**
- Materialized View para dados históricos (>7 dias)
- Query real-time para últimos 7 dias
- Union dos resultados

---

## 📐 Schema da Materialized View

```sql
CREATE TABLE IF NOT EXISTS dashboard_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  date DATE NOT NULL,
  channel_id UUID REFERENCES channels(id),

  -- Volume metrics
  total_conversations INT DEFAULT 0,
  total_messages INT DEFAULT 0,
  avg_messages_per_conversation DECIMAL(10,2) DEFAULT 0,
  active_conversations INT DEFAULT 0,

  -- Status breakdown
  conversations_open INT DEFAULT 0,
  conversations_paused INT DEFAULT 0,
  conversations_closed INT DEFAULT 0,
  conversations_reactivated INT DEFAULT 0,

  -- AI vs Human
  conversations_with_ai INT DEFAULT 0,
  conversations_human_only INT DEFAULT 0,
  messages_from_ai INT DEFAULT 0,
  messages_from_human INT DEFAULT 0,
  messages_from_customer INT DEFAULT 0,

  -- Quality metrics
  total_feedbacks INT DEFAULT 0,
  positive_feedbacks INT DEFAULT 0,
  negative_feedbacks INT DEFAULT 0,
  satisfaction_rate DECIMAL(5,2) DEFAULT 0, -- %

  -- Efficiency metrics
  avg_first_response_time_seconds INT DEFAULT 0,
  avg_resolution_time_seconds INT DEFAULT 0,
  avg_pause_duration_seconds INT DEFAULT 0,

  -- Cost metrics
  total_tokens_input INT DEFAULT 0,
  total_tokens_output INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  estimated_cost_usd DECIMAL(10,4) DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(tenant_id, date, channel_id)
);

-- Indexes para performance
CREATE INDEX idx_dashboard_metrics_tenant_date
  ON dashboard_metrics_daily(tenant_id, date DESC);
CREATE INDEX idx_dashboard_metrics_channel
  ON dashboard_metrics_daily(channel_id, date DESC);
CREATE INDEX idx_dashboard_metrics_date
  ON dashboard_metrics_daily(date DESC);
```

---

## 🚀 Implementação de Queries Otimizadas

### Query Principal: get_dashboard_data()

```sql
CREATE OR REPLACE FUNCTION get_dashboard_data(
  p_tenant_id UUID,
  p_days_ago INTEGER DEFAULT 30,
  p_channel_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_start_date TIMESTAMP := CURRENT_TIMESTAMP - (p_days_ago || ' days')::INTERVAL;
  v_time_zone TEXT := 'America/Sao_Paulo';
  v_result JSON;
BEGIN
  WITH

  -- Base conversations with all needed joins
  base_conversations AS (
    SELECT
      c.id,
      c.tenant_id,
      c.contact_id,
      c.channel_id,
      c.status,
      c.ia_active,
      c.created_at,
      c.updated_at,
      c.last_message_at,
      c.pause_reason_id,
      c.closure_reason_id,
      ch.identification_number AS channel_name,
      EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) AS duration_seconds
    FROM conversations c
    LEFT JOIN channels ch ON ch.id = c.channel_id
    WHERE c.tenant_id = p_tenant_id
      AND c.created_at >= v_start_date
      AND (p_channel_id IS NULL OR c.channel_id = p_channel_id)
  ),

  -- Messages aggregated
  messages_agg AS (
    SELECT
      m.conversation_id,
      COUNT(*) AS total_messages,
      COUNT(*) FILTER (WHERE m.sender_type = 'ai') AS ai_messages,
      COUNT(*) FILTER (WHERE m.sender_type = 'attendant') AS human_messages,
      COUNT(*) FILTER (WHERE m.sender_type = 'customer') AS customer_messages,
      MIN(m.timestamp) FILTER (WHERE m.sender_type IN ('ai', 'attendant')) AS first_response_time,
      MAX(m.timestamp) AS last_message_time
    FROM messages m
    JOIN base_conversations bc ON bc.id = m.conversation_id
    WHERE m.timestamp >= v_start_date
    GROUP BY m.conversation_id
  ),

  -- Feedbacks aggregated
  feedbacks_agg AS (
    SELECT
      f.conversation_id,
      COUNT(*) AS total_feedbacks,
      COUNT(*) FILTER (WHERE f.feedback_type = 'like') AS positive_feedbacks,
      COUNT(*) FILTER (WHERE f.feedback_type = 'dislike') AS negative_feedbacks
    FROM feedbacks f
    JOIN base_conversations bc ON bc.id = f.conversation_id
    WHERE f.created_at >= v_start_date
    GROUP BY f.conversation_id
  ),

  -- Usage (tokens) aggregated
  usage_agg AS (
    SELECT
      u.id_conversation,
      SUM(u.input_tokens) AS total_input_tokens,
      SUM(u.output_tokens) AS total_output_tokens,
      SUM(u.total_tokens) AS total_tokens
    FROM usages u
    JOIN base_conversations bc ON bc.id = u.id_conversation
    WHERE u.created_at >= v_start_date
    GROUP BY u.id_conversation
  ),

  -- Enriched conversations
  enriched_conversations AS (
    SELECT
      bc.*,
      COALESCE(ma.total_messages, 0) AS total_messages,
      COALESCE(ma.ai_messages, 0) AS ai_messages,
      COALESCE(ma.human_messages, 0) AS human_messages,
      COALESCE(ma.customer_messages, 0) AS customer_messages,
      COALESCE(fa.total_feedbacks, 0) AS total_feedbacks,
      COALESCE(fa.positive_feedbacks, 0) AS positive_feedbacks,
      COALESCE(fa.negative_feedbacks, 0) AS negative_feedbacks,
      COALESCE(ua.total_tokens, 0) AS total_tokens,
      COALESCE(ua.total_input_tokens, 0) AS input_tokens,
      COALESCE(ua.total_output_tokens, 0) AS output_tokens,
      CASE
        WHEN ma.first_response_time IS NOT NULL THEN
          EXTRACT(EPOCH FROM (ma.first_response_time - bc.created_at))
        ELSE NULL
      END AS first_response_time_seconds
    FROM base_conversations bc
    LEFT JOIN messages_agg ma ON ma.conversation_id = bc.id
    LEFT JOIN feedbacks_agg fa ON fa.conversation_id = bc.id
    LEFT JOIN usage_agg ua ON ua.id_conversation = bc.id
  ),

  -- KPIs calculation
  kpis AS (
    SELECT
      -- Volume
      COUNT(*) AS total_conversations,
      SUM(total_messages) AS total_messages,
      ROUND(AVG(total_messages), 1) AS avg_messages_per_conversation,
      COUNT(*) FILTER (WHERE status = 'open') AS active_conversations,

      -- Status breakdown
      COUNT(*) FILTER (WHERE status = 'open') AS conversations_open,
      COUNT(*) FILTER (WHERE status = 'paused') AS conversations_paused,
      COUNT(*) FILTER (WHERE status = 'closed') AS conversations_closed,

      -- AI vs Human
      COUNT(*) FILTER (WHERE ia_active = true) AS conversations_with_ai,
      COUNT(*) FILTER (WHERE ia_active = false OR ia_active IS NULL) AS conversations_human_only,
      ROUND(
        COUNT(*) FILTER (WHERE ia_active = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100,
        1
      ) AS ai_percentage,

      -- Quality
      SUM(total_feedbacks) AS total_feedbacks,
      SUM(positive_feedbacks) AS positive_feedbacks,
      SUM(negative_feedbacks) AS negative_feedbacks,
      ROUND(
        SUM(positive_feedbacks)::DECIMAL / NULLIF(SUM(total_feedbacks), 0) * 100,
        1
      ) AS satisfaction_rate,

      -- Efficiency
      ROUND(AVG(first_response_time_seconds)) AS avg_first_response_time_seconds,
      ROUND(AVG(duration_seconds) FILTER (WHERE status = 'closed')) AS avg_resolution_time_seconds,

      -- Costs
      SUM(total_tokens) AS total_tokens,
      SUM(input_tokens) AS total_input_tokens,
      SUM(output_tokens) AS total_output_tokens,
      -- Pricing: Claude Sonnet 4.5 - $3/1M input, $15/1M output
      ROUND(
        (SUM(input_tokens) * 3.0 / 1000000.0) +
        (SUM(output_tokens) * 15.0 / 1000000.0),
        4
      ) AS estimated_cost_usd,

      -- Peak day
      (
        SELECT json_build_object(
          'date', date,
          'count', count
        )
        FROM (
          SELECT
            DATE(created_at AT TIME ZONE v_time_zone) AS date,
            COUNT(*) AS count
          FROM enriched_conversations
          GROUP BY 1
          ORDER BY 2 DESC
          LIMIT 1
        ) peak
      ) AS peak_day
    FROM enriched_conversations
  ),

  -- Daily conversations with avg messages (for combo chart)
  daily_conversations AS (
    SELECT json_agg(
      json_build_object(
        'date', date,
        'total', total,
        'avgMessages', avg_messages,
        'withAI', with_ai,
        'humanOnly', human_only
      ) ORDER BY date
    ) AS data
    FROM (
      SELECT
        DATE(created_at AT TIME ZONE v_time_zone) AS date,
        COUNT(*) AS total,
        ROUND(AVG(total_messages), 1) AS avg_messages,
        COUNT(*) FILTER (WHERE ia_active = true) AS with_ai,
        COUNT(*) FILTER (WHERE ia_active = false OR ia_active IS NULL) AS human_only
      FROM enriched_conversations
      GROUP BY 1
      ORDER BY 1
    ) daily
  ),

  -- Conversations by tag (stacked bar)
  conversations_by_tag AS (
    SELECT json_agg(
      json_build_object(
        'date', date,
        'tag', tag_name,
        'count', count
      ) ORDER BY date, tag_name
    ) AS data
    FROM (
      SELECT
        DATE(ec.created_at AT TIME ZONE v_time_zone) AS date,
        COALESCE(t.tag_name, 'Sem Tag') AS tag_name,
        COUNT(*) AS count
      FROM enriched_conversations ec
      LEFT JOIN conversation_tags ct ON ct.conversation_id = ec.id
      LEFT JOIN tags t ON t.id = ct.tag_id
      GROUP BY 1, 2
      ORDER BY 1, 2
    ) tags
  ),

  -- Heatmap (day of week + hour)
  heatmap AS (
    SELECT json_agg(
      json_build_object(
        'dayOfWeek', day_of_week,
        'hour', hour,
        'count', count
      )
    ) AS data
    FROM (
      SELECT
        EXTRACT(DOW FROM (created_at AT TIME ZONE v_time_zone))::INT AS day_of_week,
        EXTRACT(HOUR FROM (created_at AT TIME ZONE v_time_zone))::INT AS hour,
        COUNT(*) AS count
      FROM enriched_conversations
      GROUP BY 1, 2
      ORDER BY 1, 2
    ) heatmap_data
  ),

  -- Conversations by channel
  by_channel AS (
    SELECT json_agg(
      json_build_object(
        'channel', channel_name,
        'total', total,
        'avgMessages', avg_messages,
        'satisfaction', satisfaction_rate
      ) ORDER BY total DESC
    ) AS data
    FROM (
      SELECT
        COALESCE(channel_name, 'Sem Canal') AS channel_name,
        COUNT(*) AS total,
        ROUND(AVG(total_messages), 1) AS avg_messages,
        ROUND(
          SUM(positive_feedbacks)::DECIMAL / NULLIF(SUM(total_feedbacks), 0) * 100,
          1
        ) AS satisfaction_rate
      FROM enriched_conversations
      GROUP BY 1
    ) channels
  ),

  -- Satisfaction over time
  satisfaction_over_time AS (
    SELECT json_agg(
      json_build_object(
        'date', date,
        'satisfactionRate', satisfaction_rate,
        'totalFeedbacks', total_feedbacks
      ) ORDER BY date
    ) AS data
    FROM (
      SELECT
        DATE(created_at AT TIME ZONE v_time_zone) AS date,
        ROUND(
          SUM(positive_feedbacks)::DECIMAL / NULLIF(SUM(total_feedbacks), 0) * 100,
          1
        ) AS satisfaction_rate,
        SUM(total_feedbacks) AS total_feedbacks
      FROM enriched_conversations
      WHERE total_feedbacks > 0
      GROUP BY 1
      HAVING SUM(total_feedbacks) > 0
      ORDER BY 1
    ) satisfaction
  ),

  -- Cost over time
  cost_over_time AS (
    SELECT json_agg(
      json_build_object(
        'date', date,
        'tokens', total_tokens,
        'cost', cost_usd
      ) ORDER BY date
    ) AS data
    FROM (
      SELECT
        DATE(created_at AT TIME ZONE v_time_zone) AS date,
        SUM(total_tokens) AS total_tokens,
        ROUND(
          (SUM(input_tokens) * 3.0 / 1000000.0) +
          (SUM(output_tokens) * 15.0 / 1000000.0),
          4
        ) AS cost_usd
      FROM enriched_conversations
      GROUP BY 1
      ORDER BY 1
    ) costs
  ),

  -- Funnel (status transitions)
  funnel AS (
    SELECT json_build_object(
      'open', conversations_open,
      'paused', conversations_paused,
      'closed', conversations_closed
    ) AS data
    FROM kpis
  )

  -- Final result
  SELECT json_build_object(
    'kpis', (SELECT row_to_json(kpis.*) FROM kpis),
    'dailyConversations', (SELECT COALESCE(data, '[]'::json) FROM daily_conversations),
    'conversationsByTag', (SELECT COALESCE(data, '[]'::json) FROM conversations_by_tag),
    'heatmap', (SELECT COALESCE(data, '[]'::json) FROM heatmap),
    'byChannel', (SELECT COALESCE(data, '[]'::json) FROM by_channel),
    'satisfactionOverTime', (SELECT COALESCE(data, '[]'::json) FROM satisfaction_over_time),
    'costOverTime', (SELECT COALESCE(data, '[]'::json) FROM cost_over_time),
    'funnel', (SELECT data FROM funnel)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

---

## 📈 Gráficos Propostos (12 visualizações)

### 1. KPI Cards (Grid 4x2)
**Componente:** `KPICards.tsx`
- Total de Conversas
- Total de Mensagens
- Taxa de Satisfação
- Média de Mensagens/Conversa
- % Atendimentos com IA
- Tempo Médio de Resposta
- Custo Total (USD)
- Taxa de Resolução

### 2. Conversas Ativas (Combo: Bar + Line)
**Componente:** `ConversationsChart.tsx`
- Barras: Total de conversas por dia
- Linha 1: Média de mensagens
- Linha 2: Conversas com IA (%)

### 3. Conversas por Tag (Stacked Bar)
**Componente:** `TagsChart.tsx`
- Barras empilhadas por tag
- Cores dinâmicas baseadas em `tags.color`

### 4. Heatmap de Volume (Grid)
**Componente:** `HeatmapChart.tsx`
- Dia da semana (Y) x Hora (X)
- Intensidade de cor baseada em volume

### 5. Funil de Status (Funnel Chart)
**Componente:** `StatusFunnelChart.tsx`
- Open → Paused → Closed
- % em cada estágio

### 6. Distribuição por Canal (Pie/Donut)
**Componente:** `ChannelDistributionChart.tsx`
- % de conversas por canal
- Hover: total + média de mensagens

### 7. Satisfação ao Longo do Tempo (Area Chart)
**Componente:** `SatisfactionChart.tsx`
- Taxa de satisfação diária
- Área sombreada

### 8. AI vs Humano (Comparative Bar)
**Componente:** `AIvsHumanChart.tsx`
- Comparativo lado a lado
- Métricas: Volume, Tempo de Resposta, Satisfação

### 9. Custos de Operação (Combo: Bar + Line)
**Componente:** `CostAnalysisChart.tsx`
- Barras: Tokens consumidos
- Linha: Custo em USD
- Meta: Custo por conversa

### 10. Performance por Canal (Table)
**Componente:** `ChannelPerformanceTable.tsx`
- Tabela com: Canal, Volume, Tempo Médio, Satisfação, Custo

### 11. Top Tags (Horizontal Bar)
**Componente:** `TopTagsChart.tsx`
- Top 10 tags mais usadas
- Ordenado por volume

### 12. Tempo de Resposta (Box Plot ou Histogram)
**Componente:** `ResponseTimeChart.tsx`
- Distribuição de tempos de primeira resposta
- Mediana, percentis (P50, P90, P95)

---

## 🎨 Layout Proposto

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard                    [Hoje] [7d] [15d] [30d] [Canal]│
├─────────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │Conv  │ │Msg   │ │Satisf│ │Avg/M │ │%IA   │ │T.Resp│     │
│ │ 150  │ │ 450  │ │ 85%  │ │ 3.2  │ │ 60%  │ │ 2.5m │     │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
│ ┌──────┐ ┌──────┐                                           │
│ │Custo │ │Resolv│                                           │
│ │$12.50│ │ 92%  │                                           │
│ └──────┘ └──────┘                                           │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────┐            │
│ │ Conversas Ativas    │ │ Conversas por Tag   │            │
│ │ (Combo: Bar+Line)   │ │ (Stacked Bar)       │            │
│ │                     │ │                     │            │
│ │      📊             │ │      📊             │            │
│ └─────────────────────┘ └─────────────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Heatmap de Volume (Dia x Hora)                        │  │
│ │      Dom Seg Ter Qua Qui Sex Sab                      │  │
│ │  0h  ░░░ ▓▓▓ ▓▓▓ ▓▓▓ ▓▓▓ ▓▓▓ ░░░                      │  │
│ │  9h  ▓▓▓ ███ ███ ███ ███ ███ ▓▓▓                      │  │
│ │ 18h  ▓▓▓ ███ ███ ███ ███ ███ ▓▓▓                      │  │
│ └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────┐            │
│ │ Funil de Status     │ │ Dist. por Canal     │            │
│ │ (Funnel)            │ │ (Donut)             │            │
│ │                     │ │                     │            │
│ │   Open    ████      │ │    WhatsApp 60%     │            │
│ │   Paused   ███      │ │    Telegram 25%     │            │
│ │   Closed    ██      │ │    Email 15%        │            │
│ └─────────────────────┘ └─────────────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────┐            │
│ │ Satisfação          │ │ AI vs Humano        │            │
│ │ (Area Chart)        │ │ (Comparative Bar)   │            │
│ │                     │ │                     │            │
│ │      📈             │ │      📊             │            │
│ └─────────────────────┘ └─────────────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Performance por Canal (Table)                         │  │
│ │ Canal      │ Volume │ Tempo Médio │ Satisfação │ Custo│  │
│ │ WhatsApp   │   90   │    2.3m     │    87%     │ $8   │  │
│ │ Telegram   │   40   │    3.1m     │    82%     │ $3   │  │
│ │ Email      │   20   │    45m      │    90%     │ $1   │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Stack Técnica Final

### Backend
- **Postgres Function** `get_dashboard_data()` - Query principal
- **Materialized View** (opcional, para escala) - Cache diário
- **Indexes** otimizados em `conversations`, `messages`, `feedbacks`, `usages`

### Frontend
- **Next.js 15** (App Router) - Server/Client Components
- **Recharts** - Biblioteca de gráficos
- **shadcn/ui** - Componentes base (Card, Button, Table, Select)
- **TanStack Query** (React Query) - Cache e fetching
- **date-fns** - Manipulação de datas

### API
- **Route Handler** `/api/dashboard` - Endpoint para filtros dinâmicos
- **Supabase RPC** - Chamar função `get_dashboard_data()`

---

## 🚀 Performance & Otimizações

### 1. Indexes Críticos

```sql
-- Conversas
CREATE INDEX CONCURRENTLY idx_conversations_tenant_created
  ON conversations(tenant_id, created_at DESC)
  WHERE created_at >= NOW() - INTERVAL '90 days';

CREATE INDEX CONCURRENTLY idx_conversations_channel_created
  ON conversations(channel_id, created_at DESC)
  WHERE created_at >= NOW() - INTERVAL '90 days';

-- Mensagens
CREATE INDEX CONCURRENTLY idx_messages_conversation_timestamp
  ON messages(conversation_id, timestamp DESC);

CREATE INDEX CONCURRENTLY idx_messages_sender_type
  ON messages(sender_type, timestamp DESC);

-- Feedbacks
CREATE INDEX CONCURRENTLY idx_feedbacks_conversation_type
  ON feedbacks(conversation_id, feedback_type);

-- Usage (tokens)
CREATE INDEX CONCURRENTLY idx_usages_conversation
  ON usages(id_conversation, created_at DESC);
```

### 2. Caching Strategy

**TanStack Query (React Query)**
```typescript
// Cache de 5 minutos para dados do dashboard
const { data, isLoading } = useQuery({
  queryKey: ['dashboard', tenantId, filter, channelId],
  queryFn: () => fetchDashboardData(tenantId, filter, channelId),
  staleTime: 5 * 60 * 1000, // 5 minutos
  cacheTime: 30 * 60 * 1000, // 30 minutos
  refetchOnWindowFocus: false,
});
```

### 3. Partial Hydration

```typescript
// Server Component carrega KPIs principais
// Client Components carregam gráficos sob demanda
<Suspense fallback={<KPIsSkeleton />}>
  <KPICards tenantId={tenantId} />
</Suspense>

<Suspense fallback={<ChartSkeleton />}>
  <ConversationsChart tenantId={tenantId} />
</Suspense>
```

### 4. Progressive Enhancement

```typescript
// Carregar primeiro KPIs + gráfico principal
// Depois carregar gráficos secundários
useEffect(() => {
  // Delay de 500ms para carregar gráficos secundários
  const timer = setTimeout(() => {
    setShowSecondaryCharts(true);
  }, 500);

  return () => clearTimeout(timer);
}, []);
```

---

## 📁 Estrutura de Arquivos

```
app/
├── (dashboard)/
│   └── dashboard/
│       ├── page.tsx                    # Server Component
│       ├── loading.tsx                 # Loading state
│       └── error.tsx                   # Error boundary

components/
└── dashboard/
    ├── dashboard-container.tsx         # Client - Container principal
    ├── dashboard-header.tsx            # Client - Filtros
    ├── kpi-cards.tsx                   # Client - Cards de KPIs
    ├── charts/
    │   ├── conversations-chart.tsx     # Conversas ativas
    │   ├── tags-chart.tsx              # Conversas por tag
    │   ├── heatmap-chart.tsx           # Heatmap de volume
    │   ├── status-funnel-chart.tsx     # Funil de status
    │   ├── channel-distribution.tsx    # Distribuição por canal
    │   ├── satisfaction-chart.tsx      # Satisfação ao longo do tempo
    │   ├── ai-vs-human-chart.tsx       # AI vs Humano
    │   ├── cost-analysis-chart.tsx     # Análise de custos
    │   ├── channel-performance.tsx     # Performance por canal
    │   ├── top-tags-chart.tsx          # Top tags
    │   └── response-time-chart.tsx     # Tempo de resposta
    └── skeletons/
        ├── kpi-skeleton.tsx
        └── chart-skeleton.tsx

lib/
├── supabase/
│   ├── client.ts
│   └── server.ts
├── queries/
│   └── dashboard.ts                    # Queries Supabase
└── utils/
    ├── dashboard-helpers.ts            # Helpers de cálculo
    └── chart-formatters.ts             # Formatters para gráficos

types/
├── dashboard.ts                        # Tipos do dashboard
└── metrics.ts                          # Tipos de métricas

hooks/
└── use-dashboard-data.ts               # Hook com TanStack Query

app/api/
└── dashboard/
    └── route.ts                        # API Route para filtros
```

---

## 📝 Próximos Passos de Implementação

### Fase 1: Setup Backend (Estimativa: 2-3h)
1. ✅ Criar migrations para indexes
2. ✅ Implementar função `get_dashboard_data()` no Postgres
3. ✅ Testar função com dados reais
4. ✅ Criar API Route `/api/dashboard`

### Fase 2: Tipos e Queries (Estimativa: 1h)
1. ✅ Definir tipos TypeScript em `types/dashboard.ts`
2. ✅ Criar query helpers em `lib/queries/dashboard.ts`
3. ✅ Implementar hook `use-dashboard-data.ts` com TanStack Query

### Fase 3: Componentes Base (Estimativa: 2-3h)
1. ✅ `dashboard-header.tsx` com filtros
2. ✅ `kpi-cards.tsx` com 8 KPIs
3. ✅ Skeletons de loading

### Fase 4: Gráficos Principais (Estimativa: 4-5h)
1. ✅ `conversations-chart.tsx` (combo)
2. ✅ `tags-chart.tsx` (stacked bar)
3. ✅ `heatmap-chart.tsx` (grid)
4. ✅ `status-funnel-chart.tsx` (funnel)

### Fase 5: Gráficos Avançados (Estimativa: 4-5h)
1. ✅ `channel-distribution.tsx` (donut)
2. ✅ `satisfaction-chart.tsx` (area)
3. ✅ `ai-vs-human-chart.tsx` (comparative bar)
4. ✅ `cost-analysis-chart.tsx` (combo)

### Fase 6: Tabelas e Extras (Estimativa: 2-3h)
1. ✅ `channel-performance.tsx` (table)
2. ✅ `top-tags-chart.tsx` (horizontal bar)
3. ✅ `response-time-chart.tsx` (histogram)

### Fase 7: Integração e Refinamento (Estimativa: 2-3h)
1. ✅ Integrar todos componentes no container
2. ✅ Implementar filtros dinâmicos
3. ✅ Testar responsividade
4. ✅ Otimizar performance
5. ✅ Tratamento de erros

### Fase 8: Testes e Validação (Estimativa: 2-3h)
1. ✅ Testar com dados reais
2. ✅ Validar cálculos de KPIs
3. ✅ Verificar performance com volume alto
4. ✅ Ajustar UX conforme feedback

**Total estimado: 18-24 horas de desenvolvimento**

---

## 🎯 Métricas de Sucesso

Considerar implementação bem-sucedida se:

- ✅ Dashboard carrega em < 2 segundos (dados iniciais)
- ✅ Filtros respondem em < 1 segundo
- ✅ KPIs são precisos (validados com queries manuais)
- ✅ Gráficos são responsivos (mobile, tablet, desktop)
- ✅ Zero erros no console
- ✅ Performance aceitável com 10k+ conversas
- ✅ UX intuitiva (feedback positivo de usuários)
- ✅ Código mantível (bem documentado, tipado)

---

## 🔮 Roadmap Futuro (Pós-MVP)

### v2.1 - Realtime Updates
- Supabase Realtime subscriptions
- Auto-refresh de KPIs a cada 30s
- Notificações de picos de volume

### v2.2 - Exportação
- Exportar dados (CSV, Excel, PDF)
- Relatórios agendados
- Email com resumo semanal

### v2.3 - Filtros Avançados
- Comparação de períodos (vs semana anterior)
- Filtros por agente específico
- Filtros por tipo de conversa
- Drill-down em gráficos

### v2.4 - Previsões
- ML para prever volume de conversas
- Alertas de anomalias
- Recomendações de otimização

### v2.5 - Mobile App
- Dashboard nativo iOS/Android
- Push notifications
- Widgets

---

## 📚 Referências

- **Recharts Docs:** https://recharts.org/
- **TanStack Query:** https://tanstack.com/query/latest
- **Supabase Functions:** https://supabase.com/docs/guides/database/functions
- **Postgres CTEs:** https://www.postgresql.org/docs/current/queries-with.html
- **Materialized Views:** https://www.postgresql.org/docs/current/rules-materializedviews.html

---

**Última atualização:** 2025-12-19
**Versão:** 2.0
**Status:** 🟢 Pronto para implementação
