# 🎯 Relatório Funil - Especificação Detalhada

**Rota:** `/relatorios/funil`
**API:** `/api/relatorios/funil`
**Função SQL:** `get_relatorio_funil()`

**Versão:** 1.0
**Última atualização:** 2025-12-19

---

## 🎯 Objetivo

Analisar a **jornada do cliente** através do funil de conversão, identificando gargalos, tempos médios em cada etapa e principais motivos de pausa/fechamento.

---

## 📊 KPIs - 6 Métricas de Conversão

### 1. Conversas Abertas
**SQL:**
```sql
COUNT(*) FILTER (WHERE c.status = 'open')
FROM conversations c
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
  AND c.created_at <= p_end_date
```

**Formato:** Número inteiro
**Ícone:** `CircleDot`
**Cor:** `--chart-1` (azul)

---

### 2. Conversas Pausadas
**SQL:**
```sql
COUNT(*) FILTER (WHERE c.status = 'paused')
FROM conversations c
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
```

**Formato:** Número inteiro
**Ícone:** `PauseCircle`
**Cor:** `--chart-3` (laranja)

---

### 3. Conversas Fechadas
**SQL:**
```sql
COUNT(*) FILTER (WHERE c.status = 'closed')
FROM conversations c
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
```

**Formato:** Número inteiro
**Ícone:** `CheckCircle`
**Cor:** `--chart-2` (verde)

---

### 4. Taxa de Conversão
**SQL:**
```sql
ROUND(
  COUNT(*) FILTER (WHERE c.status = 'closed')::DECIMAL /
  NULLIF(COUNT(*), 0) * 100,
  1
) AS conversion_rate
```

**Formato:** Percentual (ex: 82.5%)
**Ícone:** `TrendingUp`
**Cor:** `--success` se >75%, `--warning` se 50-75%, `--destructive` se <50%

---

### 5. Tempo Médio até Pausa
**SQL:**
```sql
-- Assumindo que conversations.updated_at reflete quando status mudou
ROUND(
  AVG(
    EXTRACT(EPOCH FROM (c.updated_at - c.created_at))
  ) FILTER (WHERE c.status = 'paused')
) AS avg_time_to_pause_seconds
```

**Formato:** Tempo legível (ex: 2h 30m, 45m)
**Ícone:** `Timer`
**Cor:** `--primary`

**Nota:** Idealmente, criar tabela `conversation_status_history` para rastrear transições precisas.

---

### 6. Tempo Médio até Fechamento
**SQL:**
```sql
ROUND(
  AVG(
    EXTRACT(EPOCH FROM (c.updated_at - c.created_at))
  ) FILTER (WHERE c.status = 'closed')
) AS avg_time_to_close_seconds
```

**Formato:** Tempo legível
**Ícone:** `Clock`
**Cor:** `--primary`

---

## 📊 Gráficos - 6 Visualizações

### 1. Funil de Status (Funnel Chart)

**Tipo:** Customizado (SVG ou Recharts customizado)
**Componente:** `StatusFunnelChart.tsx`

**Dados:**
```typescript
interface FunnelStageData {
  stage: string;       // 'Abertas', 'Pausadas', 'Fechadas'
  count: number;       // Total conversas
  percentage: number;  // % do total inicial
  color: string;       // Cor da etapa
}
```

**SQL:**
```sql
WITH totals AS (
  SELECT COUNT(*) AS total
  FROM conversations c
  WHERE c.tenant_id = p_tenant_id
    AND c.created_at >= p_start_date
)
SELECT
  'Abertas' AS stage,
  COUNT(*) FILTER (WHERE status = 'open') AS count,
  ROUND(COUNT(*) FILTER (WHERE status = 'open')::DECIMAL / (SELECT total FROM totals) * 100, 1) AS percentage,
  'hsl(var(--chart-1))' AS color
FROM conversations c
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date

UNION ALL

SELECT
  'Pausadas',
  COUNT(*) FILTER (WHERE status = 'paused'),
  ROUND(COUNT(*) FILTER (WHERE status = 'paused')::DECIMAL / (SELECT total FROM totals) * 100, 1),
  'hsl(var(--chart-3))'
FROM conversations c
WHERE c.tenant_id = p_tenant_id

UNION ALL

SELECT
  'Fechadas',
  COUNT(*) FILTER (WHERE status = 'closed'),
  ROUND(COUNT(*) FILTER (WHERE status = 'closed')::DECIMAL / (SELECT total FROM totals) * 100, 1),
  'hsl(var(--chart-2))'
FROM conversations c
WHERE c.tenant_id = p_tenant_id
```

**Implementação:**
```tsx
// Funil customizado com SVG
export function StatusFunnelChart({ data }: { data: FunnelStageData[] }) {
  const maxWidth = 400;
  const stages = data.sort((a, b) => b.count - a.count); // Decrescente

  return (
    <div className="flex flex-col gap-2">
      {stages.map((stage, index) => {
        const width = (stage.count / stages[0].count) * maxWidth;
        return (
          <div key={stage.stage} className="flex items-center gap-4">
            <div className="w-24 text-sm font-medium">{stage.stage}</div>
            <div
              className="h-16 flex items-center justify-between px-4 rounded"
              style={{
                width: `${width}px`,
                backgroundColor: stage.color,
              }}
            >
              <span className="text-white font-bold">{stage.count}</span>
              <span className="text-white text-sm">{stage.percentage}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

### 2. Evolução de Status ao Longo do Tempo (Stacked Area)

**Tipo:** `AreaChart` (Recharts)
**Componente:** `StatusEvolutionChart.tsx`

**Dados:**
```typescript
interface StatusTimeSeriesData {
  date: string;
  open: number;
  paused: number;
  closed: number;
}
```

**SQL:**
```sql
SELECT
  DATE(c.created_at AT TIME ZONE 'America/Sao_Paulo')::TEXT AS date,
  COUNT(*) FILTER (WHERE c.status = 'open') AS open,
  COUNT(*) FILTER (WHERE c.status = 'paused') AS paused,
  COUNT(*) FILTER (WHERE c.status = 'closed') AS closed
FROM conversations c
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
GROUP BY 1
ORDER BY 1
```

**Implementação:**
```tsx
<AreaChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Area
    type="monotone"
    dataKey="open"
    stackId="1"
    stroke="hsl(var(--chart-1))"
    fill="hsl(var(--chart-1))"
    name="Abertas"
  />
  <Area
    type="monotone"
    dataKey="paused"
    stackId="1"
    stroke="hsl(var(--chart-3))"
    fill="hsl(var(--chart-3))"
    name="Pausadas"
  />
  <Area
    type="monotone"
    dataKey="closed"
    stackId="1"
    stroke="hsl(var(--chart-2))"
    fill="hsl(var(--chart-2))"
    name="Fechadas"
  />
</AreaChart>
```

---

### 3. Tempo Médio por Etapa (Horizontal Bar)

**Tipo:** `BarChart` horizontal (Recharts)
**Componente:** `AverageTimeByStageChart.tsx`

**Dados:**
```typescript
interface TimeByStageData {
  stage: string;          // 'Primeira Resposta', 'Até Pausa', 'Até Fechamento'
  avgSeconds: number;     // Tempo médio em segundos
  avgFormatted: string;   // Tempo formatado (ex: '2h 30m')
}
```

**SQL:**
```sql
-- Tempo médio de primeira resposta
SELECT
  'Primeira Resposta' AS stage,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (
      MIN(m.timestamp) FILTER (WHERE m.sender_type IN ('ai', 'attendant')) -
      c.created_at
    ))
  )) AS avgSeconds
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
GROUP BY c.id

UNION ALL

-- Tempo médio até pausa
SELECT
  'Até Pausa',
  ROUND(AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at))))
FROM conversations c
WHERE c.tenant_id = p_tenant_id
  AND c.status = 'paused'

UNION ALL

-- Tempo médio até fechamento
SELECT
  'Até Fechamento',
  ROUND(AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at))))
FROM conversations c
WHERE c.tenant_id = p_tenant_id
  AND c.status = 'closed'
```

**Implementação:**
```tsx
<BarChart data={data} layout="horizontal">
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis type="number" />
  <YAxis type="category" dataKey="stage" width={150} />
  <Tooltip
    formatter={(value: number) => formatDuration(value)}
  />
  <Bar dataKey="avgSeconds" fill="hsl(var(--primary))">
    <LabelList
      dataKey="avgFormatted"
      position="right"
    />
  </Bar>
</BarChart>
```

---

### 4. Top Motivos de Pausa (Horizontal Bar)

**Tipo:** `BarChart` horizontal (Recharts)
**Componente:** `TopPauseReasonsChart.tsx`

**Dados:**
```typescript
interface PauseReasonData {
  reason: string;      // Descrição do motivo
  count: number;       // Quantidade de vezes usado
  percentage: number;  // % do total pausado
}
```

**SQL:**
```sql
WITH paused_total AS (
  SELECT COUNT(*) AS total
  FROM conversations c
  WHERE c.tenant_id = p_tenant_id
    AND c.status = 'paused'
    AND c.created_at >= p_start_date
)
SELECT
  COALESCE(r.description, 'Não especificado') AS reason,
  COUNT(*) AS count,
  ROUND(COUNT(*)::DECIMAL / (SELECT total FROM paused_total) * 100, 1) AS percentage
FROM conversations c
LEFT JOIN conversation_reasons_pauses_and_closures r
  ON r.id = c.conversation_pause_reason_id
WHERE c.tenant_id = p_tenant_id
  AND c.status = 'paused'
  AND c.created_at >= p_start_date
GROUP BY r.description
ORDER BY count DESC
LIMIT 10
```

**Implementação:**
```tsx
<BarChart data={data} layout="horizontal">
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis type="number" />
  <YAxis type="category" dataKey="reason" width={200} />
  <Tooltip />
  <Bar dataKey="count" fill="hsl(var(--chart-3))">
    <LabelList
      dataKey="percentage"
      position="right"
      formatter={(value: number) => `${value}%`}
    />
  </Bar>
</BarChart>
```

---

### 5. Top Motivos de Fechamento (Horizontal Bar)

**Tipo:** `BarChart` horizontal (Recharts)
**Componente:** `TopClosureReasonsChart.tsx`

**Dados:**
```typescript
interface ClosureReasonData {
  reason: string;
  count: number;
  percentage: number;
}
```

**SQL:**
```sql
WITH closed_total AS (
  SELECT COUNT(*) AS total
  FROM conversations c
  WHERE c.tenant_id = p_tenant_id
    AND c.status = 'closed'
    AND c.created_at >= p_start_date
)
SELECT
  COALESCE(r.description, 'Não especificado') AS reason,
  COUNT(*) AS count,
  ROUND(COUNT(*)::DECIMAL / (SELECT total FROM closed_total) * 100, 1) AS percentage
FROM conversations c
LEFT JOIN conversation_reasons_pauses_and_closures r
  ON r.id = c.conversation_closure_reason_id
WHERE c.tenant_id = p_tenant_id
  AND c.status = 'closed'
  AND c.created_at >= p_start_date
GROUP BY r.description
ORDER BY count DESC
LIMIT 10
```

**Implementação:** Idêntica ao gráfico anterior, mudando apenas cor para verde.

---

### 6. Taxa de Reativação (Metric Card + Trend)

**Tipo:** Card customizado com mini-gráfico
**Componente:** `ReactivationRateCard.tsx`

**Dados:**
```typescript
interface ReactivationData {
  totalReactivations: number;    // Conversas reativadas
  totalPaused: number;            // Total pausadas
  reactivationRate: number;       // % reativadas / pausadas
  trend: Array<{                  // Histórico para mini-gráfico
    date: string;
    rate: number;
  }>;
}
```

**SQL:**
```sql
-- NOTA: Requer rastreamento de mudanças de status
-- Por enquanto, estimativa baseada em:
-- Conversas que foram pausadas e depois tiveram novas mensagens

WITH paused_conversations AS (
  SELECT id, created_at, updated_at
  FROM conversations
  WHERE tenant_id = p_tenant_id
    AND status = 'paused'
    AND created_at >= p_start_date
),
reactivated AS (
  SELECT DISTINCT pc.id
  FROM paused_conversations pc
  JOIN messages m ON m.conversation_id = pc.id
  WHERE m.timestamp > pc.updated_at  -- Mensagem após pausar
)
SELECT
  COUNT(DISTINCT r.id) AS totalReactivations,
  COUNT(DISTINCT pc.id) AS totalPaused,
  ROUND(
    COUNT(DISTINCT r.id)::DECIMAL / NULLIF(COUNT(DISTINCT pc.id), 0) * 100,
    1
  ) AS reactivationRate
FROM paused_conversations pc
LEFT JOIN reactivated r ON r.id = pc.id
```

**Implementação:**
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="text-sm font-medium">Taxa de Reativação</CardTitle>
    <RefreshCcw className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{data.reactivationRate}%</div>
    <p className="text-xs text-muted-foreground">
      {data.totalReactivations} de {data.totalPaused} conversas pausadas
    </p>
    {/* Mini trend chart */}
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data.trend}>
        <Line
          type="monotone"
          dataKey="rate"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

---

## 🎨 Layout da Página

```tsx
// components/relatorios/funil/funil-container.tsx

export function FunilContainer() {
  const [filters, setFilters] = useState({
    period: 'last_30_days',
    granularity: 'day',
  });

  const { data, isLoading, refetch, isRefetching } = useRelatorioFunil(filters);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <RelatorioHeader
        title="Relatório Funil"
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={refetch}
        isRefreshing={isRefetching}
      />

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Abertas" value={data?.kpis.open} icon={CircleDot} />
        <KPICard title="Pausadas" value={data?.kpis.paused} icon={PauseCircle} />
        <KPICard title="Fechadas" value={data?.kpis.closed} icon={CheckCircle} />
        <KPICard title="Conversão" value={`${data?.kpis.conversionRate}%`} icon={TrendingUp} />
        <KPICard title="Tempo → Pausa" value={formatDuration(data?.kpis.avgTimeToPause)} icon={Timer} />
        <KPICard title="Tempo → Fechamento" value={formatDuration(data?.kpis.avgTimeToClose)} icon={Clock} />
      </div>

      {/* Funil */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusFunnelChart data={data?.funnelData} loading={isLoading} />
        </CardContent>
      </Card>

      {/* Evolução de Status */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Status ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusEvolutionChart data={data?.evolutionData} loading={isLoading} />
        </CardContent>
      </Card>

      {/* Grid 3 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tempo por Etapa */}
        <Card>
          <CardHeader>
            <CardTitle>Tempo Médio por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <AverageTimeByStageChart data={data?.timeByStage} />
          </CardContent>
        </Card>

        {/* Top Motivos Pausa */}
        <Card>
          <CardHeader>
            <CardTitle>Top Motivos de Pausa</CardTitle>
          </CardHeader>
          <CardContent>
            <TopPauseReasonsChart data={data?.pauseReasons} />
          </CardContent>
        </Card>

        {/* Top Motivos Fechamento */}
        <Card>
          <CardHeader>
            <CardTitle>Top Motivos de Fechamento</CardTitle>
          </CardHeader>
          <CardContent>
            <TopClosureReasonsChart data={data?.closureReasons} />
          </CardContent>
        </Card>
      </div>

      {/* Taxa de Reativação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReactivationRateCard data={data?.reactivationData} />
        {/* Pode adicionar mais cards aqui */}
      </div>
    </div>
  );
}
```

---

## 🔧 Função SQL Completa

```sql
-- sql/relatorios/03_function_relatorio_funil.sql

CREATE OR REPLACE FUNCTION get_relatorio_funil(
  p_tenant_id UUID,
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP,
  p_granularity TEXT DEFAULT 'day'
)
RETURNS JSON AS $$
DECLARE
  v_time_zone TEXT := 'America/Sao_Paulo';
  v_result JSON;
BEGIN
  WITH

  -- KPIs
  kpis AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'open') AS open,
      COUNT(*) FILTER (WHERE status = 'paused') AS paused,
      COUNT(*) FILTER (WHERE status = 'closed') AS closed,
      ROUND(
        COUNT(*) FILTER (WHERE status = 'closed')::DECIMAL /
        NULLIF(COUNT(*), 0) * 100,
        1
      ) AS conversionRate,
      ROUND(
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))
        FILTER (WHERE status = 'paused')
      ) AS avgTimeToPause,
      ROUND(
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))
        FILTER (WHERE status = 'closed')
      ) AS avgTimeToClose
    FROM conversations
    WHERE tenant_id = p_tenant_id
      AND created_at >= p_start_date
      AND created_at <= p_end_date
  ),

  -- Funil
  funnel AS (
    -- SQL do gráfico 1
  ),

  -- Evolução
  evolution AS (
    -- SQL do gráfico 2
  ),

  -- Tempo por etapa
  time_by_stage AS (
    -- SQL do gráfico 3
  ),

  -- Motivos pausa
  pause_reasons AS (
    -- SQL do gráfico 4
  ),

  -- Motivos fechamento
  closure_reasons AS (
    -- SQL do gráfico 5
  ),

  -- Reativação
  reactivation AS (
    -- SQL do gráfico 6
  )

  SELECT json_build_object(
    'kpis', (SELECT row_to_json(kpis.*) FROM kpis),
    'funnelData', (SELECT json_agg(funnel.*) FROM funnel),
    'evolutionData', (SELECT json_agg(evolution.*) FROM evolution),
    'timeByStage', (SELECT json_agg(time_by_stage.*) FROM time_by_stage),
    'pauseReasons', (SELECT json_agg(pause_reasons.*) FROM pause_reasons),
    'closureReasons', (SELECT json_agg(closure_reasons.*) FROM closure_reasons),
    'reactivationData', (SELECT row_to_json(reactivation.*) FROM reactivation)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

---

## 💡 Melhorias Futuras

### 1. Rastreamento de Transições de Status
Criar tabela para histórico preciso:

```sql
CREATE TABLE conversation_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  old_status conversation_status_enum,
  new_status conversation_status_enum NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  changed_by UUID REFERENCES users(id)
);
```

Isso permitiria:
- Tempo exato em cada etapa
- Cálculo preciso de reativações
- Análise de padrões de transição

### 2. Gráfico de Sankey (Fluxo de Status)
Visualização de transições:
- Open → Paused → Open → Closed
- Open → Closed (direto)
- Identificar ciclos e loops

---

## ✅ Checklist de Implementação

### Backend
- [ ] Criar função `get_relatorio_funil()`
- [ ] Testar cálculos de conversão
- [ ] Criar API Route `/api/relatorios/funil`
- [ ] Validar tenant isolation

### Frontend
- [ ] Criar tipos TypeScript
- [ ] Criar hook `use-relatorio-funil.ts`
- [ ] Implementar container
- [ ] Implementar 6 KPI cards
- [ ] Implementar 6 gráficos
- [ ] Testar funil visual

### Testes
- [ ] Validar cálculo de taxa de conversão
- [ ] Testar com diferentes períodos
- [ ] Validar motivos de pausa/fechamento

---

**Tempo Estimado:** 5-6 horas
**Prioridade:** 🟡 MÉDIA
**Status:** 📋 Especificação completa
