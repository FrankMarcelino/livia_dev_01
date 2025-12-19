# 🔄 Plano de Refatoração - Relatórios LIVIA

> Divisão dos dados e componentes entre os três relatórios

**Data:** 2025-12-19
**Status:** 🟡 EM PLANEJAMENTO

---

## 📋 Visão Geral

### Situação Atual
- ✅ Backend 100% implementado (types, queries, helpers, API, hook, SQL)
- ✅ `/relatorios/principal` com dashboard completo (TODOS os dados)
- ✅ `/relatorios/funil` com placeholder
- ✅ `/relatorios/tags` com placeholder
- ✅ Sidebar com menu "Relatórios" e submenu funcionando
- ✅ Build passando sem erros

### Objetivo da Refatoração
Separar os dados e componentes de acordo com o propósito de cada relatório:
1. **Principal**: Métricas gerais e overview
2. **Funil**: Análise de conversão (Open → Paused → Closed)
3. **Tags**: Análise de categorização e performance por tag

---

## 🎯 Estrutura de Dados por Relatório

### 📊 RELATÓRIO PRINCIPAL (`/relatorios/principal`)

**KPIs (8 cards):**
1. Total de Conversas
2. Total de Mensagens
3. Taxa de Satisfação
4. Média Msgs/Conversa
5. % IA Ativa
6. Tempo Médio Resposta
7. Custo Total USD
8. Taxa de Resolução

**Gráficos:**
- Conversas ao Longo do Tempo (line/bar combo) - `conversations-chart.tsx` ✅
- Heatmap de Volume (hora × dia da semana) - `heatmap-chart.tsx` ✅
- Distribuição por Canal (donut chart) - **CRIAR**
- AI vs Humano (comparative bar) - **CRIAR**
- Análise de Custos (combo chart) - **CRIAR**

**Dados necessários:**
- `kpis` ✅
- `dailyConversations` ✅
- `heatmap` ✅
- `byChannel` (já vem do backend) ✅
- `aiVsHuman` (já calculado no helper) ✅
- `costOverTime` (já vem do backend) ✅

---

### 🎯 RELATÓRIO FUNIL (`/relatorios/funil`)

**KPIs (6 cards):**
1. Conversas Abertas (status = 'open')
2. Conversas Pausadas (status = 'paused')
3. Conversas Fechadas (status = 'closed')
4. Taxa de Conversão
5. Tempo Médio até Pausa
6. Tempo Médio até Fechamento

**Gráficos:**
- Funil de Status (funnel chart) - **CRIAR**
- Evolução de Status ao Longo do Tempo (stacked area) - **CRIAR**
- Tempo Médio por Etapa (bar chart horizontal) - **CRIAR**
- Top Motivos de Pausa (horizontal bar) - **CRIAR**
- Top Motivos de Fechamento (horizontal bar) - **CRIAR**
- Taxa de Reativação (metric card) - **CRIAR**

**Dados necessários:**
- `funnel` (já vem do backend) ✅
- `reasonsPauses` - **ADICIONAR AO BACKEND**
- `reasonsClosures` - **ADICIONAR AO BACKEND**
- `statusEvolution` - **ADICIONAR AO BACKEND**
- `avgTimeByStage` - **ADICIONAR AO BACKEND**

---

### 🏷️ RELATÓRIO TAGS (`/relatorios/tags`)

**KPIs (4 cards):**
1. Total de Tags Ativas
2. Conversas com Tag
3. Conversas sem Tag
4. Taxa de Categorização

**Gráficos:**
- Conversas por Tag ao Longo do Tempo (stacked bar) - `tags-chart.tsx` ✅ (já existe)
- TOP 10 Tags Mais Usadas (horizontal bar) - **CRIAR**
- Performance por Tag (table sortable) - **CRIAR**
- Distribuição de Tags (donut chart) - **CRIAR**
- Tags sem Uso (alert/list) - **CRIAR**
- Matriz de Co-ocorrência de Tags (heatmap) - **CRIAR** (opcional para MVP)

**Dados necessários:**
- `conversationsByTag` ✅
- `topTags` (já calculado no helper) ✅
- `tagPerformance` - **ADICIONAR AO BACKEND**
- `unusedTags` - **ADICIONAR AO BACKEND**
- `tagCooccurrence` - **ADICIONAR AO BACKEND** (opcional)

---

## 🔨 Plano de Implementação

### Fase 1: Refatorar Estrutura de Componentes ✅ (JÁ FEITO)

**Status:** ✅ Completo

Estrutura atual:
```
components/dashboard/
├── dashboard-container.tsx      ✅ Container principal
├── dashboard-header.tsx         ✅ Filtros de período
├── kpi-cards.tsx               ✅ 8 KPI cards
├── charts/
│   ├── conversations-chart.tsx  ✅ Combo bar + line
│   ├── tags-chart.tsx          ✅ Stacked bar
│   └── heatmap-chart.tsx       ✅ Grid hora × dia
```

---

### Fase 2: Completar Relatório Principal

**Prioridade:** 🔴 ALTA

#### 2.1. Criar Componentes Faltantes

**Arquivos a criar:**
```
components/dashboard/charts/
├── channel-distribution.tsx     # Donut - distribuição por canal
├── ai-vs-human-chart.tsx       # Comparative bar
└── cost-analysis-chart.tsx     # Combo tokens + USD
```

**Dados já disponíveis:**
- `data.byChannel` (do backend)
- `data.aiVsHuman` (calculado no helper)
- `data.costOverTime` (do backend)

**Tempo estimado:** 3-4h

#### 2.2. Atualizar dashboard-container.tsx

Adicionar os 3 novos gráficos ao layout:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <ChannelDistribution data={data.byChannel} />
  <AIvsHumanChart data={data.aiVsHuman} />
</div>

<CostAnalysisChart data={data.costOverTime} />
```

**Tempo estimado:** 30min

**Validação obrigatória:**
```bash
npm run lint && npx tsc --noEmit && npm run build
```

---

### Fase 3: Implementar Relatório Funil

**Prioridade:** 🟡 MÉDIA

#### 3.1. Adicionar Dados ao Backend

**Arquivos a modificar:**
- `sql/dashboard/02_function_minimal.sql` - adicionar queries de funil
- `types/dashboard.ts` - adicionar tipos de funil
- `lib/queries/dashboard.ts` - processar dados de funil
- `lib/utils/dashboard-helpers.ts` - helpers de cálculo

**Novos dados:**
```typescript
interface FunnelData {
  statusBreakdown: {
    open: number;
    paused: number;
    closed: number;
  };
  conversionRate: number;
  avgTimeToPause: number; // segundos
  avgTimeToClose: number; // segundos
}

interface FunnelReasons {
  reasonsPauses: Array<{ reason: string; count: number }>;
  reasonsClosures: Array<{ reason: string; count: number }>;
}

interface StatusEvolution {
  date: string;
  open: number;
  paused: number;
  closed: number;
}
```

**Tempo estimado:** 2-3h

#### 3.2. Criar Componentes de Funil

**Arquivos a criar:**
```
components/funil/
├── funil-container.tsx         # Container principal do funil
├── funil-header.tsx           # Filtros (reutilizar dashboard-header)
├── funil-kpi-cards.tsx        # 6 KPIs específicos
└── charts/
    ├── status-funnel-chart.tsx      # Funil visual
    ├── status-evolution-chart.tsx   # Stacked area
    ├── time-by-stage-chart.tsx      # Horizontal bar
    ├── pause-reasons-chart.tsx      # Horizontal bar
    └── closure-reasons-chart.tsx    # Horizontal bar
```

**Tempo estimado:** 4-5h

#### 3.3. Criar Página do Funil

**Arquivo:** `app/(dashboard)/relatorios/funil/page.tsx`

Substituir placeholder por implementação real:

```tsx
export default async function RelatorioFunilPage() {
  // Buscar dados do usuário e tenant
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  const tenantId = userData?.tenant_id;

  if (!tenantId) {
    return <div>Erro: Usuário sem tenant</div>;
  }

  return <FunilContainer tenantId={tenantId} />;
}
```

**Tempo estimado:** 1h

**Validação obrigatória:**
```bash
npm run lint && npx tsc --noEmit && npm run build
```

---

### Fase 4: Implementar Relatório Tags

**Prioridade:** 🟡 MÉDIA

#### 4.1. Adicionar Dados ao Backend

**Arquivos a modificar:**
- `sql/dashboard/02_function_minimal.sql` - adicionar queries de tags
- `types/dashboard.ts` - adicionar tipos de tags
- `lib/queries/dashboard.ts` - processar dados de tags
- `lib/utils/dashboard-helpers.ts` - helpers de tags

**Novos dados:**
```typescript
interface TagsKPIs {
  totalActiveTags: number;
  conversationsWithTags: number;
  conversationsWithoutTags: number;
  categorizationRate: number; // percentual
}

interface TagPerformance {
  tagId: string;
  tagName: string;
  totalConversations: number;
  satisfaction: number;
  avgResponseTime: number;
  aiActivePercent: number;
}

interface UnusedTag {
  id: string;
  name: string;
  lastUsedAt: string | null;
}
```

**Tempo estimado:** 2-3h

#### 4.2. Criar Componentes de Tags

**Arquivos a criar:**
```
components/tags/
├── tags-container.tsx          # Container principal de tags
├── tags-header.tsx            # Filtros (reutilizar dashboard-header)
├── tags-kpi-cards.tsx         # 4 KPIs específicos
└── charts/
    ├── tags-over-time-chart.tsx    # Stacked bar (já existe em dashboard)
    ├── top-tags-chart.tsx          # Horizontal bar - TOP 10
    ├── tag-performance-table.tsx   # Table sortable
    ├── tags-distribution.tsx       # Donut chart
    └── unused-tags-alert.tsx       # Alert/List component
```

**Tempo estimado:** 4-5h

#### 4.3. Criar Página de Tags

**Arquivo:** `app/(dashboard)/relatorios/tags/page.tsx`

Similar ao funil, substituir placeholder.

**Tempo estimado:** 1h

**Validação obrigatória:**
```bash
npm run lint && npx tsc --noEmit && npm run build
```

---

### Fase 5: Otimizações e Refinamentos

**Prioridade:** 🟢 BAIXA

#### 5.1. Criar Hook Específico para Cada Relatório

**Arquivos a criar:**
```
hooks/
├── use-dashboard-data.ts     # Principal (já existe) ✅
├── use-funil-data.ts        # Específico para funil
└── use-tags-data.ts         # Específico para tags
```

**Motivação:**
- Endpoints diferentes (`/api/dashboard`, `/api/funil`, `/api/tags`)
- Cache separado por tipo de relatório
- Queries otimizadas por contexto

**Tempo estimado:** 2h

#### 5.2. Criar API Routes Específicas

**Arquivos a criar:**
```
app/api/
├── dashboard/route.ts    # Já existe ✅
├── funil/route.ts       # Nova rota para dados de funil
└── tags/route.ts        # Nova rota para dados de tags
```

**Tempo estimado:** 1-2h

#### 5.3. Loading Skeletons

**Arquivos a criar:**
```
components/dashboard/skeletons/
├── kpi-skeleton.tsx
├── chart-skeleton.tsx
└── table-skeleton.tsx
```

**Tempo estimado:** 1h

#### 5.4. Error Handling

- Criar `error.tsx` em cada rota de relatório
- Implementar error boundaries
- Feedback visual de erros

**Tempo estimado:** 1h

---

## 📊 Resumo de Esforço

| Fase | Descrição | Tempo Estimado | Prioridade |
|------|-----------|----------------|------------|
| 1 | Refatorar Estrutura | ✅ Completo | - |
| 2 | Completar Principal | 4-5h | 🔴 ALTA |
| 3 | Implementar Funil | 7-9h | 🟡 MÉDIA |
| 4 | Implementar Tags | 7-9h | 🟡 MÉDIA |
| 5 | Otimizações | 5-6h | 🟢 BAIXA |
| **TOTAL** | | **23-29h** | |

---

## 🎯 Ordem de Implementação Recomendada

### Sprint 1: Relatório Principal Completo (1 semana)
1. ✅ Backend completo (JÁ FEITO)
2. ✅ 3 gráficos básicos (JÁ FEITO)
3. ⏳ 3 gráficos restantes (canal, AI vs Humano, custos)
4. ⏳ Validação e testes

**Objetivo:** Entregar relatório principal 100% funcional

### Sprint 2: Relatório Funil (1 semana)
1. Adicionar dados de funil ao backend
2. Criar componentes de funil
3. Implementar página de funil
4. Validação e testes

**Objetivo:** Entregar análise de conversão completa

### Sprint 3: Relatório Tags (1 semana)
1. Adicionar dados de tags ao backend
2. Criar componentes de tags
3. Implementar página de tags
4. Validação e testes

**Objetivo:** Entregar análise de categorização completa

### Sprint 4: Refinamentos (3-4 dias)
1. Separar hooks e API routes
2. Loading skeletons
3. Error handling
4. Performance optimization
5. Testes end-to-end

**Objetivo:** Polimento e otimização geral

---

## ⚠️ Regras de Validação

### OBRIGATÓRIO após CADA implementação:

```bash
npm run lint && npx tsc --noEmit && npm run build
```

### Critérios de Aceite:
- ✅ ESLint sem erros
- ✅ TypeScript sem erros
- ✅ Build com sucesso
- ✅ Componente renderiza corretamente
- ✅ Dados carregam do backend
- ✅ Responsivo (mobile, tablet, desktop)
- ✅ Performance < 2s carregamento inicial

---

## 📝 Próximos Passos Imediatos

### Para continuar AGORA:

**Opção A: Completar Relatório Principal**
- Implementar 3 gráficos faltantes
- Tempo: 4-5h
- Resultado: 1 relatório 100% funcional

**Opção B: Implementar Relatório Funil**
- Adicionar dados ao backend
- Criar componentes
- Tempo: 7-9h
- Resultado: 2 relatórios funcionais (principal com 3 gráficos + funil completo)

**Opção C: Implementar Relatório Tags**
- Adicionar dados ao backend
- Criar componentes
- Tempo: 7-9h
- Resultado: 2 relatórios funcionais (principal com 3 gráficos + tags completo)

**Recomendação:** Opção A (completar principal primeiro) para ter um relatório totalmente funcional antes de expandir.

---

## 📚 Referências

- **Documentação:** `docs/planejamento/feature_relatorio/`
- **Tipos:** `types/dashboard.ts`
- **Queries:** `lib/queries/dashboard.ts`
- **Helpers:** `lib/utils/dashboard-helpers.ts`
- **API:** `app/api/dashboard/route.ts`
- **Hook:** `hooks/use-dashboard-data.ts`

---

**Última Atualização:** 2025-12-19 19:45
**Autor:** Claude Code
**Status:** Aguardando decisão sobre próximos passos
