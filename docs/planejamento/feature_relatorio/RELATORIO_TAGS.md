# 🏷️ Relatório Tags - Especificação Detalhada

**Rota:** `/relatorios/tags`
**API:** `/api/relatorios/tags`
**Função SQL:** `get_relatorio_tags()`

**Versão:** 1.0
**Última atualização:** 2025-12-19

---

## 🎯 Objetivo

Analisar a **categorização de conversas por tags**, identificar padrões de uso, performance de cada categoria e tags que frequentemente aparecem juntas.

---

## 📊 KPIs - 4 Métricas de Categorização

### 1. Total de Tags Ativas
**SQL:**
```sql
SELECT COUNT(*)
FROM tags
WHERE id_tenant = p_tenant_id
  AND active = true
```

**Formato:** Número inteiro
**Ícone:** `Tags`
**Cor:** `--primary`

---

### 2. Conversas com Tag
**SQL:**
```sql
SELECT COUNT(DISTINCT ct.conversation_id)
FROM conversation_tags ct
JOIN conversations c ON c.id = ct.conversation_id
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
  AND c.created_at <= p_end_date
```

**Formato:** Número inteiro
**Ícone:** `CheckCircle`
**Cor:** `--success`

---

### 3. Conversas sem Tag
**SQL:**
```sql
SELECT COUNT(*)
FROM conversations c
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
  AND c.created_at <= p_end_date
  AND NOT EXISTS (
    SELECT 1 FROM conversation_tags ct
    WHERE ct.conversation_id = c.id
  )
```

**Formato:** Número inteiro
**Ícone:** `AlertCircle`
**Cor:** `--warning`

---

### 4. Taxa de Categorização
**SQL:**
```sql
WITH totals AS (
  SELECT COUNT(*) AS total_conversations
  FROM conversations c
  WHERE c.tenant_id = p_tenant_id
    AND c.created_at >= p_start_date
),
tagged AS (
  SELECT COUNT(DISTINCT ct.conversation_id) AS total_tagged
  FROM conversation_tags ct
  JOIN conversations c ON c.id = ct.conversation_id
  WHERE c.tenant_id = p_tenant_id
    AND c.created_at >= p_start_date
)
SELECT
  ROUND(
    (SELECT total_tagged FROM tagged)::DECIMAL /
    NULLIF((SELECT total_conversations FROM totals), 0) * 100,
    1
  ) AS categorization_rate
```

**Formato:** Percentual (ex: 78.5%)
**Ícone:** `Percent`
**Cor:** `--success` se >70%, `--warning` se 40-70%, `--destructive` se <40%

---

## 📊 Gráficos - 6 Visualizações

### 1. Conversas por Tag ao Longo do Tempo (Stacked Bar)

**Tipo:** `BarChart` empilhado (Recharts)
**Componente:** `TagsOverTimeChart.tsx`

**Dados:**
```typescript
interface TagTimeSeriesData {
  date: string;
  [tagName: string]: string | number;  // Dinâmico por tag
}

// Exemplo:
// {
//   date: '2025-12-19',
//   'Suporte Técnico': 15,
//   'Vendas': 8,
//   'Financeiro': 5
// }
```

**SQL:**
```sql
WITH date_range AS (
  SELECT generate_series(
    p_start_date::DATE,
    p_end_date::DATE,
    '1 day'::INTERVAL
  )::DATE AS date
),
conversations_by_tag_by_date AS (
  SELECT
    DATE(c.created_at AT TIME ZONE 'America/Sao_Paulo') AS date,
    t.tag_name,
    COUNT(DISTINCT c.id) AS count
  FROM conversations c
  JOIN conversation_tags ct ON ct.conversation_id = c.id
  JOIN tags t ON t.id = ct.tag_id
  WHERE c.tenant_id = p_tenant_id
    AND c.created_at >= p_start_date
    AND c.created_at <= p_end_date
    AND t.active = true
  GROUP BY 1, 2
)
-- Pivot: transformar linhas em colunas
SELECT
  dr.date::TEXT,
  COALESCE(
    json_object_agg(
      COALESCE(cbd.tag_name, 'Sem Tag'),
      COALESCE(cbd.count, 0)
    ),
    '{}'::JSON
  ) AS tag_counts
FROM date_range dr
LEFT JOIN conversations_by_tag_by_date cbd ON cbd.date = dr.date
GROUP BY dr.date
ORDER BY dr.date
```

**Implementação:**
```tsx
// Extrair nomes de tags dinamicamente
const tagNames = [...new Set(
  data.flatMap(d => Object.keys(d).filter(k => k !== 'date'))
)];

// Atribuir cores baseadas em tags.color
const tagColors = new Map(
  tags.map(tag => [tag.tag_name, tag.color])
);

<BarChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Legend />
  {tagNames.map((tagName) => (
    <Bar
      key={tagName}
      dataKey={tagName}
      stackId="tags"
      fill={tagColors.get(tagName) || 'hsl(var(--muted))'}
    />
  ))}
</BarChart>
```

---

### 2. TOP 10 Tags Mais Usadas (Horizontal Bar)

**Tipo:** `BarChart` horizontal (Recharts)
**Componente:** `TopTagsChart.tsx`

**Dados:**
```typescript
interface TopTagData {
  tagName: string;
  count: number;
  percentage: number;
  color: string;    // Cor customizada da tag
}
```

**SQL:**
```sql
WITH total_tagged AS (
  SELECT COUNT(DISTINCT ct.conversation_id) AS total
  FROM conversation_tags ct
  JOIN conversations c ON c.id = ct.conversation_id
  WHERE c.tenant_id = p_tenant_id
    AND c.created_at >= p_start_date
)
SELECT
  t.tag_name AS tagName,
  COUNT(DISTINCT ct.conversation_id) AS count,
  ROUND(
    COUNT(DISTINCT ct.conversation_id)::DECIMAL /
    (SELECT total FROM total_tagged) * 100,
    1
  ) AS percentage,
  t.color
FROM conversation_tags ct
JOIN tags t ON t.id = ct.tag_id
JOIN conversations c ON c.id = ct.conversation_id
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
  AND c.created_at <= p_end_date
  AND t.active = true
GROUP BY t.tag_name, t.color
ORDER BY count DESC
LIMIT 10
```

**Implementação:**
```tsx
<BarChart data={data} layout="horizontal">
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis type="number" />
  <YAxis type="category" dataKey="tagName" width={150} />
  <Tooltip />
  <Bar dataKey="count">
    {data.map((entry, index) => (
      <Cell key={index} fill={entry.color} />
    ))}
    <LabelList
      dataKey="percentage"
      position="right"
      formatter={(value: number) => `${value}%`}
    />
  </Bar>
</BarChart>
```

---

### 3. Performance por Tag (Sortable Table)

**Tipo:** Tabela customizada (shadcn/ui Table)
**Componente:** `TagPerformanceTable.tsx`

**Dados:**
```typescript
interface TagPerformanceData {
  tagName: string;
  color: string;
  totalConversations: number;
  avgMessages: number;
  satisfactionRate: number;     // % feedbacks positivos
  aiActivePercentage: number;   // % com IA ativa
  avgResponseTime: number;      // Segundos
}
```

**SQL:**
```sql
SELECT
  t.tag_name AS tagName,
  t.color,
  COUNT(DISTINCT c.id) AS totalConversations,
  ROUND(AVG(msg_count.count), 1) AS avgMessages,
  ROUND(
    SUM(CASE WHEN f.feedback_type = 'like' THEN 1 ELSE 0 END)::DECIMAL /
    NULLIF(COUNT(f.id), 0) * 100,
    1
  ) AS satisfactionRate,
  ROUND(
    COUNT(*) FILTER (WHERE c.ia_active = true)::DECIMAL /
    NULLIF(COUNT(DISTINCT c.id), 0) * 100,
    1
  ) AS aiActivePercentage,
  ROUND(AVG(first_response_time.seconds)) AS avgResponseTime
FROM tags t
JOIN conversation_tags ct ON ct.tag_id = t.id
JOIN conversations c ON c.id = ct.conversation_id
LEFT JOIN (
  SELECT conversation_id, COUNT(*) as count
  FROM messages
  GROUP BY conversation_id
) msg_count ON msg_count.conversation_id = c.id
LEFT JOIN feedbacks f ON f.conversation_id = c.id
LEFT JOIN (
  SELECT
    conversation_id,
    EXTRACT(EPOCH FROM (
      MIN(timestamp) FILTER (WHERE sender_type IN ('ai', 'attendant')) -
      (SELECT created_at FROM conversations WHERE id = conversation_id)
    )) AS seconds
  FROM messages
  GROUP BY conversation_id
) first_response_time ON first_response_time.conversation_id = c.id
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
  AND c.created_at <= p_end_date
  AND t.active = true
GROUP BY t.tag_name, t.color
ORDER BY totalConversations DESC
```

**Implementação:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead onClick={() => handleSort('tagName')}>Tag</TableHead>
      <TableHead onClick={() => handleSort('totalConversations')}>Total</TableHead>
      <TableHead onClick={() => handleSort('avgMessages')}>Média Msgs</TableHead>
      <TableHead onClick={() => handleSort('satisfactionRate')}>Satisfação</TableHead>
      <TableHead onClick={() => handleSort('aiActivePercentage')}>% IA</TableHead>
      <TableHead onClick={() => handleSort('avgResponseTime')}>Tempo Resposta</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {sortedData.map((row) => (
      <TableRow key={row.tagName}>
        <TableCell>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: row.color }}
            />
            {row.tagName}
          </div>
        </TableCell>
        <TableCell>{row.totalConversations}</TableCell>
        <TableCell>{row.avgMessages}</TableCell>
        <TableCell>{row.satisfactionRate}%</TableCell>
        <TableCell>{row.aiActivePercentage}%</TableCell>
        <TableCell>{formatDuration(row.avgResponseTime)}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### 4. Distribuição de Tags (Donut Chart)

**Tipo:** `PieChart` (Recharts)
**Componente:** `TagDistributionChart.tsx`

**Dados:**
```typescript
interface TagDistributionData {
  tagName: string;
  count: number;
  percentage: number;
  color: string;
}
```

**SQL:** Mesmo SQL do gráfico 2 (TOP 10), mas incluindo todas as tags.

**Implementação:**
```tsx
<PieChart>
  <Pie
    data={data}
    dataKey="count"
    nameKey="tagName"
    cx="50%"
    cy="50%"
    innerRadius={60}
    outerRadius={100}
    label={({ percentage }) => `${percentage}%`}
  >
    {data.map((entry, index) => (
      <Cell key={index} fill={entry.color} />
    ))}
  </Pie>
  <Tooltip />
  <Legend />
</PieChart>
```

---

### 5. Tags sem Uso (Alert/List)

**Tipo:** Alert customizado com lista
**Componente:** `UnusedTagsAlert.tsx`

**Dados:**
```typescript
interface UnusedTagData {
  tagName: string;
  color: string;
  lastUsed: string | null;  // Data da última utilização
  daysInactive: number;      // Dias sem uso
}
```

**SQL:**
```sql
SELECT
  t.tag_name AS tagName,
  t.color,
  MAX(c.created_at) AS lastUsed,
  EXTRACT(DAY FROM (NOW() - MAX(c.created_at)))::INT AS daysInactive
FROM tags t
LEFT JOIN conversation_tags ct ON ct.tag_id = t.id
LEFT JOIN conversations c ON c.id = ct.conversation_id
  AND c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
WHERE t.id_tenant = p_tenant_id
  AND t.active = true
GROUP BY t.tag_name, t.color
HAVING MAX(c.created_at) IS NULL  -- Nunca usada
   OR MAX(c.created_at) < (NOW() - INTERVAL '30 days')  -- Sem uso há 30+ dias
ORDER BY daysInactive DESC NULLS FIRST
```

**Implementação:**
```tsx
{unusedTags.length > 0 && (
  <Alert variant="warning">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Tags Inativas</AlertTitle>
    <AlertDescription>
      <p className="mb-2">
        {unusedTags.length} tag(s) sem uso no período:
      </p>
      <ul className="list-disc list-inside space-y-1">
        {unusedTags.map((tag) => (
          <li key={tag.tagName} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            <span>{tag.tagName}</span>
            {tag.lastUsed && (
              <span className="text-xs text-muted-foreground">
                (última vez: {formatDate(tag.lastUsed)})
              </span>
            )}
          </li>
        ))}
      </ul>
      <Button
        variant="link"
        className="mt-2 p-0 h-auto"
        onClick={() => navigate('/configuracoes/tags')}
      >
        Gerenciar tags →
      </Button>
    </AlertDescription>
  </Alert>
)}
```

---

### 6. Matriz de Co-ocorrência de Tags (Heatmap)

**Tipo:** Grid customizado (similar ao heatmap de volume)
**Componente:** `TagCooccurrenceMatrix.tsx`

**Objetivo:** Mostrar quais tags aparecem juntas nas mesmas conversas.

**Dados:**
```typescript
interface TagCooccurrenceData {
  tag1: string;
  tag2: string;
  count: number;        // Quantas conversas têm ambas
  color1: string;
  color2: string;
}
```

**SQL:**
```sql
-- Pares de tags que aparecem juntas
SELECT
  t1.tag_name AS tag1,
  t2.tag_name AS tag2,
  t1.color AS color1,
  t2.color AS color2,
  COUNT(DISTINCT ct1.conversation_id) AS count
FROM conversation_tags ct1
JOIN conversation_tags ct2 ON ct2.conversation_id = ct1.conversation_id
  AND ct1.tag_id < ct2.tag_id  -- Evitar duplicatas (A,B) == (B,A)
JOIN tags t1 ON t1.id = ct1.tag_id
JOIN tags t2 ON t2.id = ct2.tag_id
JOIN conversations c ON c.id = ct1.conversation_id
WHERE c.tenant_id = p_tenant_id
  AND c.created_at >= p_start_date
  AND c.created_at <= p_end_date
  AND t1.active = true
  AND t2.active = true
GROUP BY t1.tag_name, t2.tag_name, t1.color, t2.color
HAVING COUNT(DISTINCT ct1.conversation_id) >= 2  -- Mínimo 2 ocorrências
ORDER BY count DESC
LIMIT 50  -- Top 50 combinações
```

**Implementação:**
```tsx
// Criar matriz simétrica tag × tag
const uniqueTags = [...new Set([
  ...data.map(d => d.tag1),
  ...data.map(d => d.tag2)
])];

const matrix: Map<string, Map<string, number>> = new Map();

// Inicializar
uniqueTags.forEach(tag => {
  matrix.set(tag, new Map());
  uniqueTags.forEach(otherTag => {
    matrix.get(tag)!.set(otherTag, 0);
  });
});

// Preencher com dados (simétrico)
data.forEach(({ tag1, tag2, count }) => {
  matrix.get(tag1)!.set(tag2, count);
  matrix.get(tag2)!.set(tag1, count);  // Espelhar
});

const maxCount = Math.max(...data.map(d => d.count), 1);

return (
  <div className="overflow-x-auto">
    <div className="inline-block">
      {/* Header */}
      <div className="flex">
        <div className="w-32" />
        {uniqueTags.map(tag => (
          <div
            key={tag}
            className="w-24 text-xs text-center transform -rotate-45"
          >
            {tag}
          </div>
        ))}
      </div>

      {/* Linhas */}
      {uniqueTags.map(tag1 => (
        <div key={tag1} className="flex items-center">
          <div className="w-32 text-sm pr-2">{tag1}</div>
          {uniqueTags.map(tag2 => {
            const count = matrix.get(tag1)!.get(tag2)!;
            const intensity = count / maxCount;

            return (
              <div
                key={`${tag1}-${tag2}`}
                className="w-24 h-12 border flex items-center justify-center text-xs cursor-pointer hover:opacity-80"
                style={{
                  backgroundColor:
                    tag1 === tag2
                      ? 'hsl(var(--muted))'
                      : `hsl(var(--primary) / ${intensity})`,
                }}
                title={`${tag1} + ${tag2}: ${count} conversas`}
              >
                {count > 0 && count}
              </div>
            );
          })}
        </div>
      ))}

      {/* Legenda */}
      <div className="mt-4 text-xs text-muted-foreground">
        💡 Números mostram quantas conversas têm ambas as tags
      </div>
    </div>
  </div>
);
```

---

## 🎨 Layout da Página

```tsx
// components/relatorios/tags/tags-container.tsx

export function TagsContainer() {
  const [filters, setFilters] = useState({
    period: 'last_30_days',
    granularity: 'day',
  });

  const { data, isLoading, refetch, isRefetching } = useRelatorioTags(filters);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <RelatorioHeader
        title="Relatório Tags"
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={refetch}
        isRefreshing={isRefetching}
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Tags Ativas" value={data?.kpis.totalActiveTags} icon={Tags} />
        <KPICard title="Conversas com Tag" value={data?.kpis.taggedConversations} icon={CheckCircle} />
        <KPICard title="Conversas sem Tag" value={data?.kpis.untaggedConversations} icon={AlertCircle} />
        <KPICard
          title="Taxa Categorização"
          value={`${data?.kpis.categorizationRate}%`}
          icon={Percent}
        />
      </div>

      {/* Tags sem Uso (se houver) */}
      {data?.unusedTags && data.unusedTags.length > 0 && (
        <UnusedTagsAlert tags={data.unusedTags} />
      )}

      {/* Conversas por Tag ao Longo do Tempo */}
      <Card>
        <CardHeader>
          <CardTitle>Conversas por Tag ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <TagsOverTimeChart data={data?.timeSeriesData} loading={isLoading} />
        </CardContent>
      </Card>

      {/* Grid 2 colunas: TOP 10 + Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>TOP 10 Tags Mais Usadas</CardTitle>
          </CardHeader>
          <CardContent>
            <TopTagsChart data={data?.topTags} loading={isLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <TagDistributionChart data={data?.distributionData} loading={isLoading} />
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <TagPerformanceTable data={data?.performanceData} loading={isLoading} />
        </CardContent>
      </Card>

      {/* Matriz de Co-ocorrência */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Co-ocorrência de Tags</CardTitle>
          <p className="text-sm text-muted-foreground">
            Identifique quais tags aparecem juntas nas mesmas conversas
          </p>
        </CardHeader>
        <CardContent>
          <TagCooccurrenceMatrix data={data?.cooccurrenceData} loading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🔧 Função SQL Completa

```sql
-- sql/relatorios/04_function_relatorio_tags.sql

CREATE OR REPLACE FUNCTION get_relatorio_tags(
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
      (SELECT COUNT(*) FROM tags WHERE id_tenant = p_tenant_id AND active = true) AS totalActiveTags,
      COUNT(DISTINCT ct.conversation_id) AS taggedConversations,
      (
        SELECT COUNT(*)
        FROM conversations c
        WHERE c.tenant_id = p_tenant_id
          AND c.created_at >= p_start_date
          AND c.created_at <= p_end_date
          AND NOT EXISTS (
            SELECT 1 FROM conversation_tags ct2
            WHERE ct2.conversation_id = c.id
          )
      ) AS untaggedConversations,
      ROUND(
        COUNT(DISTINCT ct.conversation_id)::DECIMAL /
        NULLIF((
          SELECT COUNT(*) FROM conversations
          WHERE tenant_id = p_tenant_id
            AND created_at >= p_start_date
        ), 0) * 100,
        1
      ) AS categorizationRate
    FROM conversation_tags ct
    JOIN conversations c ON c.id = ct.conversation_id
    WHERE c.tenant_id = p_tenant_id
      AND c.created_at >= p_start_date
      AND c.created_at <= p_end_date
  ),

  -- Time series
  time_series AS (
    -- SQL do gráfico 1
  ),

  -- Top tags
  top_tags AS (
    -- SQL do gráfico 2
  ),

  -- Performance
  performance AS (
    -- SQL do gráfico 3
  ),

  -- Distribution
  distribution AS (
    -- SQL do gráfico 4
  ),

  -- Unused tags
  unused AS (
    -- SQL do gráfico 5
  ),

  -- Cooccurrence
  cooccurrence AS (
    -- SQL do gráfico 6
  )

  SELECT json_build_object(
    'kpis', (SELECT row_to_json(kpis.*) FROM kpis),
    'timeSeriesData', (SELECT json_agg(time_series.*) FROM time_series),
    'topTags', (SELECT json_agg(top_tags.*) FROM top_tags),
    'performanceData', (SELECT json_agg(performance.*) FROM performance),
    'distributionData', (SELECT json_agg(distribution.*) FROM distribution),
    'unusedTags', (SELECT json_agg(unused.*) FROM unused),
    'cooccurrenceData', (SELECT json_agg(cooccurrence.*) FROM cooccurrence)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

---

## 💡 Insights da Matriz de Co-ocorrência

A matriz revela padrões interessantes:

### Exemplo de Insights
```
              Suporte  Vendas  Financeiro  Urgente
Suporte          -      12        8          25
Vendas          12       -        5           3
Financeiro       8       5        -          15
Urgente         25       3       15           -
```

**Interpretação:**
- **Suporte + Urgente (25):** Muitos casos urgentes são técnicos
- **Suporte + Vendas (12):** Possível upsell durante suporte
- **Financeiro + Urgente (15):** Cobranças urgentes

**Ações:**
- Criar tag "Suporte Urgente" combinada
- Treinar IA para identificar oportunidades de venda no suporte
- Priorizar atendimento financeiro urgente

---

## ✅ Checklist de Implementação

### Backend
- [ ] Criar função `get_relatorio_tags()`
- [ ] Testar pivot de tags por data
- [ ] Criar API Route `/api/relatorios/tags`
- [ ] Otimizar query de co-ocorrência

### Frontend
- [ ] Criar tipos TypeScript
- [ ] Criar hook `use-relatorio-tags.ts`
- [ ] Implementar container
- [ ] Implementar 4 KPI cards
- [ ] Implementar 6 gráficos
- [ ] Testar cores customizadas por tag
- [ ] Testar matriz de co-ocorrência

### Testes
- [ ] Validar cálculos de categorização
- [ ] Testar com muitas tags (>20)
- [ ] Validar cores customizadas
- [ ] Testar matriz com diferentes combinações

---

**Tempo Estimado:** 5-6 horas
**Prioridade:** 🟢 BAIXA (pode ser última implementação)
**Status:** 📋 Especificação completa
