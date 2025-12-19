# 📈 Relatório Principal - Especificação Detalhada

**Rota:** `/relatorios/principal`
**API:** `/api/relatorios/principal`
**Função SQL:** `get_relatorio_principal()`

**Versão:** 1.0
**Última atualização:** 2025-12-19

---

## 🎯 Objetivo

Fornecer uma **visão geral completa** das operações, com métricas de volume, satisfação, performance de IA, custos e distribuição por canal.

---

## 📊 KPIs - 8 Métricas Principais

### 1. Total de Conversas
**SQL:**
```sql
COUNT(DISTINCT c.id)
FROM conversations c
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
  AND c.created_at <= p_end_date
  AND (p_channel_id IS NULL OR c.channel_id = p_channel_id)
```

**Formato:** Número inteiro (ex: 1.234)
**Ícone:** `MessageSquare`
**Cor:** `--primary`

---

### 2. Total de Mensagens
**SQL:**
```sql
COUNT(m.id)
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.tenant_id = p_tenant_id
  AND m.created_at >= p_start_date
  AND m.created_at <= p_end_date
  AND (p_channel_id IS NULL OR c.channel_id = p_channel_id)
```

**Formato:** Número inteiro (ex: 5.678)
**Ícone:** `MessageCircle`
**Cor:** `--primary`

---

### 3. Taxa de Satisfação
**SQL:**
```sql
ROUND(
  COUNT(*) FILTER (WHERE f.feedback_type = 'like')::DECIMAL /
  NULLIF(COUNT(*), 0) * 100,
  1
) AS satisfaction_rate
FROM feedbacks f
JOIN conversations c ON c.id = f.conversation_id
WHERE c.tenant_id = p_tenant_id
  AND f.created_at >= p_start_date
  AND f.created_at <= p_end_date
```

**Formato:** Percentual (ex: 87.5%)
**Ícone:** `ThumbsUp`
**Cor:** `--success` se >80%, `--warning` se 60-80%, `--destructive` se <60%

---

### 4. Média Mensagens/Conversa
**SQL:**
```sql
ROUND(
  COUNT(m.id)::DECIMAL / NULLIF(COUNT(DISTINCT c.id), 0),
  1
) AS avg_messages_per_conversation
```

**Formato:** Decimal 1 casa (ex: 3.2)
**Ícone:** `TrendingUp`
**Cor:** `--primary`

---

### 5. % IA Ativa
**SQL:**
```sql
ROUND(
  COUNT(*) FILTER (WHERE c.ia_active = true)::DECIMAL /
  NULLIF(COUNT(*), 0) * 100,
  1
) AS ai_percentage
FROM conversations c
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
```

**Formato:** Percentual (ex: 65.0%)
**Ícone:** `Bot`
**Cor:** `--primary`

---

### 6. Tempo Médio de Resposta
**SQL:**
```sql
ROUND(
  AVG(
    EXTRACT(EPOCH FROM (
      MIN(m.timestamp) FILTER (WHERE m.sender_type IN ('ai', 'attendant')) -
      c.created_at
    ))
  )
) AS avg_first_response_seconds
```

**Formato:** Tempo legível (ex: 2m 30s, 45s, 1h 15m)
**Ícone:** `Clock`
**Cor:** `--success` se <5min, `--warning` se 5-15min, `--destructive` se >15min

**Helper:**
```typescript
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
```

---

### 7. Custo Total (USD)
**SQL:**
```sql
ROUND(
  (SUM(u.input_tokens) * 3.0 / 1000000.0) +
  (SUM(u.output_tokens) * 15.0 / 1000000.0),
  2
) AS total_cost_usd
FROM usages u
JOIN conversations c ON c.id = u.id_conversation
WHERE c.tenant_id = p_tenant_id
  AND u.created_at >= p_start_date
```

**Formato:** Moeda USD (ex: $12.50)
**Ícone:** `DollarSign`
**Cor:** `--primary`

**Pricing (Claude Sonnet 4.5):**
- Input: $3.00 / 1M tokens
- Output: $15.00 / 1M tokens

---

### 8. Taxa de Resolução
**SQL:**
```sql
ROUND(
  COUNT(*) FILTER (WHERE c.status = 'closed')::DECIMAL /
  NULLIF(COUNT(*), 0) * 100,
  1
) AS resolution_rate
FROM conversations c
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
```

**Formato:** Percentual (ex: 92.0%)
**Ícone:** `CheckCircle`
**Cor:** `--success` se >80%, `--warning` se 60-80%, `--destructive` se <60%

---

## 📊 Gráficos - 5 Visualizações

### 1. Conversas ao Longo do Tempo (Combo Chart)

**Tipo:** `ComposedChart` (Recharts)
**Componente:** `ConversationsOverTimeChart.tsx`

**Dados:**
```typescript
interface ConversationTimeSeriesData {
  date: string;           // '2025-12-19' (ou hora '2025-12-19 14:00')
  total: number;          // Total conversas
  avgMessages: number;    // Média mensagens/conversa
}
```

**SQL:**
```sql
SELECT
  -- Granularidade dinâmica baseada em p_granularity
  CASE
    WHEN p_granularity = 'hour' THEN
      TO_CHAR(c.created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD HH24:00')
    WHEN p_granularity = 'day' THEN
      DATE(c.created_at AT TIME ZONE 'America/Sao_Paulo')::TEXT
    WHEN p_granularity = 'week' THEN
      DATE_TRUNC('week', c.created_at AT TIME ZONE 'America/Sao_Paulo')::TEXT
    WHEN p_granularity = 'month' THEN
      TO_CHAR(c.created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM')
    ELSE DATE(c.created_at AT TIME ZONE 'America/Sao_Paulo')::TEXT
  END AS date,
  COUNT(DISTINCT c.id) AS total,
  ROUND(AVG(msg_count.count), 1) AS avgMessages
FROM conversations c
LEFT JOIN (
  SELECT conversation_id, COUNT(*) as count
  FROM messages
  GROUP BY conversation_id
) msg_count ON msg_count.conversation_id = c.id
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
  AND c.created_at <= p_end_date
GROUP BY 1
ORDER BY 1
```

**Implementação:**
```tsx
<ComposedChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis yAxisId="left" />
  <YAxis yAxisId="right" orientation="right" />
  <Tooltip />
  <Legend />
  <Bar
    yAxisId="left"
    dataKey="total"
    fill="hsl(var(--primary))"
    name="Total Conversas"
  />
  <Line
    yAxisId="right"
    type="monotone"
    dataKey="avgMessages"
    stroke="hsl(var(--destructive))"
    name="Média Msgs/Conv"
  />
</ComposedChart>
```

---

### 2. Heatmap de Volume (Dia × Hora)

**Tipo:** Grid customizado (não Recharts)
**Componente:** `VolumeHeatmapChart.tsx`

**Dados:**
```typescript
interface HeatmapData {
  dayOfWeek: number;  // 0=Dom, 1=Seg, ..., 6=Sáb
  hour: number;       // 0-23
  count: number;      // Volume de conversas
}
```

**SQL:**
```sql
SELECT
  EXTRACT(DOW FROM (c.created_at AT TIME ZONE 'America/Sao_Paulo'))::INT AS dayOfWeek,
  EXTRACT(HOUR FROM (c.created_at AT TIME ZONE 'America/Sao_Paulo'))::INT AS hour,
  COUNT(*) AS count
FROM conversations c
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
  AND c.created_at <= p_end_date
GROUP BY 1, 2
ORDER BY 1, 2
```

**Implementação:**
```tsx
// Criar matriz 7 dias × 24 horas
const matrix: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));

data.forEach(({ dayOfWeek, hour, count }) => {
  matrix[dayOfWeek][hour] = count;
});

const maxCount = Math.max(...data.map(d => d.count), 1);

return (
  <div className="grid grid-cols-25 gap-px">
    {/* Header: horas */}
    <div />
    {[...Array(24)].map((_, h) => (
      <div key={h} className="text-xs text-center">{h}h</div>
    ))}

    {/* Linhas: dias da semana */}
    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, d) => (
      <Fragment key={d}>
        <div className="text-sm">{day}</div>
        {matrix[d].map((count, h) => {
          const intensity = count / maxCount;
          return (
            <div
              key={h}
              className="h-8 border cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: `hsl(var(--primary) / ${intensity})`,
              }}
              title={`${day} ${h}h: ${count} conversas`}
            />
          );
        })}
      </Fragment>
    ))}
  </div>
);
```

---

### 3. Distribuição por Canal (Donut Chart)

**Tipo:** `PieChart` (Recharts)
**Componente:** `ChannelDistributionChart.tsx`

**Dados:**
```typescript
interface ChannelDistribution {
  channelName: string;  // 'WhatsApp', 'Telegram', etc
  total: number;        // Total conversas
  percentage: number;   // % do total
}
```

**SQL:**
```sql
WITH totals AS (
  SELECT COUNT(*) AS total_conversations
  FROM conversations c
  WHERE c.tenant_id = p_tenant_id
    AND c.created_at >= p_start_date
)
SELECT
  COALESCE(ch.name, 'Sem Canal') AS channelName,
  COUNT(*) AS total,
  ROUND(COUNT(*)::DECIMAL / (SELECT total_conversations FROM totals) * 100, 1) AS percentage
FROM conversations c
LEFT JOIN channels ch ON ch.id = c.channel_id
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
GROUP BY ch.name
ORDER BY total DESC
```

**Implementação:**
```tsx
<PieChart>
  <Pie
    data={data}
    dataKey="total"
    nameKey="channelName"
    cx="50%"
    cy="50%"
    innerRadius={60}
    outerRadius={80}
    label={({ percentage }) => `${percentage}%`}
  >
    {data.map((entry, index) => (
      <Cell key={index} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
  <Tooltip />
  <Legend />
</PieChart>
```

---

### 4. AI vs Humano (Comparative Bar)

**Tipo:** `BarChart` (Recharts)
**Componente:** `AIvsHumanChart.tsx`

**Dados:**
```typescript
interface AIvsHumanMetrics {
  metric: string;      // 'Volume', 'Tempo Médio Resposta', 'Satisfação'
  ai: number;          // Valor para IA
  human: number;       // Valor para Humano
}
```

**SQL:**
```sql
-- Volume
SELECT
  'Volume' AS metric,
  COUNT(*) FILTER (WHERE c.ia_active = true) AS ai,
  COUNT(*) FILTER (WHERE c.ia_active = false OR c.ia_active IS NULL) AS human
FROM conversations c
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date

UNION ALL

-- Tempo Médio de Resposta (segundos)
SELECT
  'Tempo Resposta (s)' AS metric,
  AVG(...) FILTER (WHERE ia_active = true) AS ai,
  AVG(...) FILTER (WHERE ia_active = false) AS human
FROM ...

UNION ALL

-- Satisfação (%)
SELECT
  'Satisfação (%)' AS metric,
  ROUND(...) FILTER (WHERE ia_active = true) AS ai,
  ROUND(...) FILTER (WHERE ia_active = false) AS human
FROM ...
```

**Implementação:**
```tsx
<BarChart data={data} layout="horizontal">
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis type="number" />
  <YAxis type="category" dataKey="metric" />
  <Tooltip />
  <Legend />
  <Bar dataKey="ai" fill="hsl(var(--chart-1))" name="IA" />
  <Bar dataKey="human" fill="hsl(var(--chart-2))" name="Humano" />
</BarChart>
```

---

### 5. Análise de Custos (Combo Chart)

**Tipo:** `ComposedChart` (Recharts)
**Componente:** `CostAnalysisChart.tsx`

**Dados:**
```typescript
interface CostTimeSeriesData {
  date: string;        // Baseado em granularidade
  tokens: number;      // Total tokens consumidos
  costUSD: number;     // Custo em USD
}
```

**SQL:**
```sql
SELECT
  CASE
    WHEN p_granularity = 'day' THEN
      DATE(u.created_at AT TIME ZONE 'America/Sao_Paulo')::TEXT
    WHEN p_granularity = 'month' THEN
      TO_CHAR(u.created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM')
    ELSE DATE(u.created_at AT TIME ZONE 'America/Sao_Paulo')::TEXT
  END AS date,
  SUM(u.total_tokens) AS tokens,
  ROUND(
    (SUM(u.input_tokens) * 3.0 / 1000000.0) +
    (SUM(u.output_tokens) * 15.0 / 1000000.0),
    2
  ) AS costUSD
FROM usages u
JOIN conversations c ON c.id = u.id_conversation
WHERE c.tenant_id = p_tenant_id
  AND u.created_at >= p_start_date
GROUP BY 1
ORDER BY 1
```

**Implementação:**
```tsx
<ComposedChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis yAxisId="left" />
  <YAxis yAxisId="right" orientation="right" />
  <Tooltip
    formatter={(value, name) =>
      name === 'costUSD' ? `$${value}` : value
    }
  />
  <Legend />
  <Bar
    yAxisId="left"
    dataKey="tokens"
    fill="hsl(var(--chart-3))"
    name="Tokens"
  />
  <Line
    yAxisId="right"
    type="monotone"
    dataKey="costUSD"
    stroke="hsl(var(--chart-4))"
    name="Custo (USD)"
  />
</ComposedChart>
```

---

## 🎨 Layout da Página

```tsx
// components/relatorios/principal/principal-container.tsx

export function PrincipalContainer() {
  const [filters, setFilters] = useState({
    period: 'last_30_days',
    granularity: 'day',
    channelId: null,
  });

  const { data, isLoading, refetch, isRefetching } = useRelatorioPrincipal(filters);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header com filtros */}
      <RelatorioHeader
        title="Relatório Principal"
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={refetch}
        isRefreshing={isRefetching}
      />

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Conversas"
          value={data?.kpis.totalConversations}
          icon={MessageSquare}
          loading={isLoading}
        />
        {/* ... outros 7 cards ... */}
      </div>

      {/* Gráfico: Conversas ao Longo do Tempo */}
      <Card>
        <CardHeader>
          <CardTitle>Conversas ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <ConversationsOverTimeChart
            data={data?.timeSeriesData}
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Grid 2 colunas: Heatmap + Distribuição Canal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Heatmap de Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <VolumeHeatmapChart
              data={data?.heatmapData}
              loading={isLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChannelDistributionChart
              data={data?.channelData}
              loading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Grid 2 colunas: AI vs Humano + Custos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI vs Humano</CardTitle>
          </CardHeader>
          <CardContent>
            <AIvsHumanChart
              data={data?.aiVsHumanData}
              loading={isLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <CostAnalysisChart
              data={data?.costData}
              loading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 🔧 Função SQL Completa

```sql
-- sql/relatorios/02_function_relatorio_principal.sql

CREATE OR REPLACE FUNCTION get_relatorio_principal(
  p_tenant_id UUID,
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP,
  p_channel_id UUID DEFAULT NULL,
  p_granularity TEXT DEFAULT 'day'
)
RETURNS JSON AS $$
DECLARE
  v_time_zone TEXT := 'America/Sao_Paulo';
  v_result JSON;
BEGIN
  WITH

  -- Base conversations
  base_conversations AS (
    SELECT
      c.id,
      c.channel_id,
      c.ia_active,
      c.status,
      c.created_at
    FROM conversations c
    WHERE c.tenant_id = p_tenant_id
      AND c.created_at >= p_start_date
      AND c.created_at <= p_end_date
      AND (p_channel_id IS NULL OR c.channel_id = p_channel_id)
  ),

  -- KPIs calculation
  kpis AS (
    SELECT
      COUNT(DISTINCT bc.id) AS totalConversations,
      (SELECT COUNT(*) FROM messages m
       JOIN base_conversations bc2 ON bc2.id = m.conversation_id
       WHERE m.created_at >= p_start_date
         AND m.created_at <= p_end_date
      ) AS totalMessages,
      -- ... outros KPIs ...
    FROM base_conversations bc
  ),

  -- Time series data
  time_series AS (
    -- SQL do gráfico 1
  ),

  -- Heatmap data
  heatmap AS (
    -- SQL do gráfico 2
  ),

  -- Channel distribution
  channel_dist AS (
    -- SQL do gráfico 3
  ),

  -- AI vs Human
  ai_vs_human AS (
    -- SQL do gráfico 4
  ),

  -- Cost analysis
  cost_analysis AS (
    -- SQL do gráfico 5
  )

  SELECT json_build_object(
    'kpis', (SELECT row_to_json(kpis.*) FROM kpis),
    'timeSeriesData', (SELECT json_agg(time_series.*) FROM time_series),
    'heatmapData', (SELECT json_agg(heatmap.*) FROM heatmap),
    'channelData', (SELECT json_agg(channel_dist.*) FROM channel_dist),
    'aiVsHumanData', (SELECT json_agg(ai_vs_human.*) FROM ai_vs_human),
    'costData', (SELECT json_agg(cost_analysis.*) FROM cost_analysis)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

---

## ✅ Checklist de Implementação

### Backend
- [ ] Criar função `get_relatorio_principal()` no Supabase
- [ ] Testar função com dados reais
- [ ] Criar API Route `/api/relatorios/principal`
- [ ] Validar segurança (tenant isolation)

### Frontend
- [ ] Criar tipos TypeScript em `types/relatorio-principal.ts`
- [ ] Criar hook `use-relatorio-principal.ts`
- [ ] Criar container `principal-container.tsx`
- [ ] Implementar 8 KPI cards
- [ ] Implementar 5 gráficos
- [ ] Testar filtros e atualização manual

### Testes
- [ ] Testar com diferentes períodos
- [ ] Validar cálculos de KPIs manualmente
- [ ] Testar performance com volume alto
- [ ] Validar responsividade

---

**Tempo Estimado:** 6-8 horas
**Prioridade:** 🔴 ALTA (base para outros relatórios)
**Status:** 📋 Especificação completa
