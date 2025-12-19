# 📊 Sistema de Relatórios LIVIA - Documentação Completa

> Sistema modular de métricas e analytics de alta performance para gestão de conversas multi-canal com IA

**Versão:** 3.0
**Status:** 🟢 Pronto para implementação
**Última atualização:** 2025-12-19

---

## ⚠️ REGRA CRÍTICA DE DESENVOLVIMENTO

**OBRIGATÓRIO: Execute após CADA implementação de componente/feature:**

```bash
npm run lint && npx tsc --noEmit && npm run build
```

**❌ NÃO prossiga para próxima tarefa se algum comando falhar!**

Esta validação garante:
- ✅ Qualidade do código (ESLint)
- ✅ Type safety (TypeScript)
- ✅ Compilação sem erros (Build)

---

## 🎯 Visão Geral

Sistema de relatórios dividido em **3 módulos independentes** para análise detalhada de conversas, funil de conversão e categorização por tags.

### 📊 Estrutura do Sistema

```
📊 Relatórios (Sidebar Menu)
├─ 📈 Principal      → Overview geral + métricas principais
├─ 🎯 Funil         → Análise de conversão e status
└─ 🏷️  Tags          → Performance e distribuição de tags
```

### Principais Funcionalidades

✅ **Atualização Manual** - Botão "Atualizar" para refresh sob demanda
✅ **Filtros Temporais** - Hora, dia, semana, mês, ano (customizável)
✅ **Isolamento por Tenant** - RLS + validação em 3 camadas
✅ **Performance Otimizada** - Partial indexes + cache duplo
✅ **Visualizações Interativas** - 15+ gráficos com Recharts
✅ **Análise Granular** - 20+ KPIs críticos

---

## 📁 Estrutura de Rotas

```
/relatorios
├── /principal        # GET /relatorios/principal
├── /funil           # GET /relatorios/funil
└── /tags            # GET /relatorios/tags
```

### APIs Correspondentes

```
/api/relatorios
├── /principal/route.ts
├── /funil/route.ts
└── /tags/route.ts
```

---

## 📈 Relatório Principal

**Rota:** `/relatorios/principal`
**Objetivo:** Overview geral das operações

### KPIs (8 cards principais)

1. **Total de Conversas** - Contagem total no período
2. **Total de Mensagens** - Volume de mensagens trocadas
3. **Taxa de Satisfação** - % feedbacks positivos
4. **Média Msgs/Conversa** - Engajamento médio
5. **% IA Ativa** - Percentual de conversas com IA
6. **Tempo Médio Resposta** - SLA de primeira resposta
7. **Custo Total USD** - Gasto com tokens IA
8. **Taxa de Resolução** - % conversas fechadas com sucesso

### Gráficos

- 📊 **Conversas ao Longo do Tempo** (combo: bar + line)
- 🔥 **Heatmap de Volume** (dia × hora)
- 📱 **Distribuição por Canal** (donut chart)
- 🤖 **AI vs Humano** (comparative bar)
- 💰 **Análise de Custos** (combo: tokens + USD)

### Filtros Disponíveis

- Período: Hoje, Ontem, 7d, 30d, Mês atual, Custom
- Canal: Todos, WhatsApp, Telegram, Email, etc
- Granularidade: Hora, Dia, Semana, Mês, Ano

---

## 🎯 Relatório Funil

**Rota:** `/relatorios/funil`
**Objetivo:** Análise de conversão e jornada do cliente

### KPIs (6 métricas de conversão)

1. **Conversas Abertas** - Status = open
2. **Conversas Pausadas** - Status = paused
3. **Conversas Fechadas** - Status = closed
4. **Taxa de Conversão** - % closed / total
5. **Tempo Médio até Pausa** - Duração open → paused
6. **Tempo Médio até Fechamento** - Duração open → closed

### Gráficos

- 🔻 **Funil de Status** (funnel chart) - Open → Paused → Closed
- 📊 **Evolução de Status** (stacked area) - Timeline de status
- ⏱️ **Tempo Médio por Etapa** (horizontal bar)
- 📋 **Top Motivos de Pausa** (horizontal bar) - TOP 10
- ✅ **Top Motivos de Fechamento** (horizontal bar) - TOP 10
- 🔄 **Taxa de Reativação** (metric card + trend)

### Dados Utilizados

- `conversations.status` (open, paused, closed)
- `conversation_reasons_pauses_and_closures`
- `conversations.created_at`, `updated_at`
- Cálculo de transições de status

---

## 🏷️ Relatório Tags

**Rota:** `/relatorios/tags`
**Objetivo:** Análise de categorização e performance por tag

### KPIs (4 métricas de categorização)

1. **Total de Tags Ativas** - Tags disponíveis
2. **Conversas com Tag** - Conversas categorizadas
3. **Conversas sem Tag** - Não categorizadas
4. **Taxa de Categorização** - % com tag / total

### Gráficos

- 📊 **Conversas por Tag ao Longo do Tempo** (stacked bar) - Cores customizadas
- 🏆 **TOP 10 Tags Mais Usadas** (horizontal bar)
- 📈 **Performance por Tag** (sortable table) - Satisfação, tempo, % IA
- 🎨 **Distribuição de Tags** (donut chart) - % de cada categoria
- 📉 **Tags sem Uso** (alert/list) - Tags inativas
- 🔀 **Matriz de Co-ocorrência** (heatmap) - Tags que aparecem juntas

### Dados Utilizados

- `tags` (tag_name, color, active)
- `conversation_tags` (relacionamento N:N)
- `conversations` (para métricas agregadas)

---

## ⏰ Sistema de Filtros Temporais

### Presets Disponíveis

```typescript
type PeriodPreset =
  | 'today'          // Hoje (00:00 até agora)
  | 'yesterday'      // Ontem (00:00 a 23:59)
  | 'last_7_days'    // Últimos 7 dias
  | 'last_30_days'   // Últimos 30 dias
  | 'this_month'     // Mês atual
  | 'last_month'     // Mês passado
  | 'this_year'      // Ano atual
  | 'custom'         // Range picker (início + fim)
```

### Granularidade Temporal

```typescript
type TimeGranularity =
  | 'hour'    // Agrupado por hora (últimas 24h)
  | 'day'     // Agrupado por dia (padrão)
  | 'week'    // Agrupado por semana
  | 'month'   // Agrupado por mês
  | 'year'    // Agrupado por ano
```

### Implementação no Header

```tsx
<div className="flex items-center gap-4">
  {/* Botão Atualizar */}
  <Button onClick={() => refetch()} disabled={isRefetching}>
    <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
  </Button>

  {/* Filtros de Período */}
  <Select value={period} onValueChange={setPeriod}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Selecione período" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="today">Hoje</SelectItem>
      <SelectItem value="last_7_days">Últimos 7 dias</SelectItem>
      <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
      <SelectItem value="this_month">Este mês</SelectItem>
      <SelectItem value="custom">Personalizado</SelectItem>
    </SelectContent>
  </Select>

  {/* Granularidade */}
  <Select value={granularity} onValueChange={setGranularity}>
    <SelectTrigger className="w-[120px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="hour">Por Hora</SelectItem>
      <SelectItem value="day">Por Dia</SelectItem>
      <SelectItem value="week">Por Semana</SelectItem>
      <SelectItem value="month">Por Mês</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

## 📁 Estrutura de Arquivos

```
projeto/
├── docs/planejamento/feature_relatorio/
│   ├── DASHBOARD_README.md                    # Este arquivo
│   ├── DASHBOARD_ARCHITECTURE.md              # Arquitetura geral
│   ├── DASHBOARD_DECISIONS.md                 # Decisões técnicas
│   ├── DASHBOARD_IMPLEMENTATION_GUIDE.md      # Guia implementação
│   ├── DASHBOARD_PROGRESS.md                  # Progresso
│   ├── RELATORIO_PRINCIPAL.md                 # Spec Principal
│   ├── RELATORIO_FUNIL.md                     # Spec Funil
│   └── RELATORIO_TAGS.md                      # Spec Tags
│
├── sql/relatorios/
│   ├── 01_indexes.sql                         # Indexes otimizados
│   ├── 02_function_relatorio_principal.sql    # Função Principal
│   ├── 03_function_relatorio_funil.sql        # Função Funil
│   └── 04_function_relatorio_tags.sql         # Função Tags
│
├── types/
│   ├── relatorios.ts                          # Tipos comuns
│   ├── relatorio-principal.ts                 # Tipos específicos
│   ├── relatorio-funil.ts
│   └── relatorio-tags.ts
│
├── lib/
│   ├── queries/
│   │   ├── relatorio-principal.ts             # Queries Principal
│   │   ├── relatorio-funil.ts                 # Queries Funil
│   │   └── relatorio-tags.ts                  # Queries Tags
│   └── utils/
│       └── relatorios-helpers.ts              # Helpers compartilhados
│
├── hooks/
│   ├── use-relatorio-principal.ts             # Hook React Query
│   ├── use-relatorio-funil.ts
│   └── use-relatorio-tags.ts
│
├── app/
│   ├── api/relatorios/
│   │   ├── principal/route.ts                 # API Principal
│   │   ├── funil/route.ts                     # API Funil
│   │   └── tags/route.ts                      # API Tags
│   │
│   └── (dashboard)/relatorios/
│       ├── layout.tsx                         # Layout compartilhado
│       ├── principal/
│       │   ├── page.tsx
│       │   └── loading.tsx
│       ├── funil/
│       │   ├── page.tsx
│       │   └── loading.tsx
│       └── tags/
│           ├── page.tsx
│           └── loading.tsx
│
└── components/relatorios/
    ├── shared/                                # Componentes compartilhados
    │   ├── relatorio-header.tsx               # Header com filtros
    │   ├── kpi-card.tsx                       # Card de KPI reutilizável
    │   └── empty-state.tsx
    │
    ├── principal/
    │   ├── principal-container.tsx
    │   ├── principal-kpis.tsx
    │   └── charts/                            # 5 gráficos
    │
    ├── funil/
    │   ├── funil-container.tsx
    │   ├── funil-kpis.tsx
    │   └── charts/                            # 6 gráficos
    │
    └── tags/
        ├── tags-container.tsx
        ├── tags-kpis.tsx
        └── charts/                            # 6 gráficos
```

---

## 🚀 Quick Start

### 1. Instalar Dependências (5 min)

```bash
npm install recharts @tanstack/react-query date-fns
npm install --save-dev @types/recharts
```

### 2. Setup Banco de Dados (45 min)

**No Supabase SQL Editor:**

```sql
-- 1. Criar indexes (20-30 min)
-- Execute: sql/relatorios/01_indexes.sql

-- 2. Criar funções (5 min cada)
-- Execute: sql/relatorios/02_function_relatorio_principal.sql
-- Execute: sql/relatorios/03_function_relatorio_funil.sql
-- Execute: sql/relatorios/04_function_relatorio_tags.sql

-- 3. Testar cada função
SELECT get_relatorio_principal('YOUR_TENANT_ID'::UUID, 30, NULL);
SELECT get_relatorio_funil('YOUR_TENANT_ID'::UUID, 30);
SELECT get_relatorio_tags('YOUR_TENANT_ID'::UUID, 30);
```

### 3. Configurar React Query Provider (10 min)

```tsx
// providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,     // 5 minutos
            gcTime: 30 * 60 * 1000,        // 30 minutos
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 4. Adicionar ao Layout

```tsx
// app/layout.tsx
import { QueryProvider } from '@/providers/query-provider';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

### 5. Acessar Relatórios

```
http://localhost:3000/relatorios/principal
http://localhost:3000/relatorios/funil
http://localhost:3000/relatorios/tags
```

---

## ⚡ Performance

### Benchmarks Esperados

| Volume de Conversas | Query Time | Cache Hit Rate | Status |
|---------------------|------------|----------------|--------|
| 1k conversas | ~300-500ms | 85% | ✅ Excelente |
| 10k conversas | ~1-2s | 85% | ✅ Bom |
| 50k conversas | ~3-5s | 85% | ⚠️ Considerar cache |
| 100k+ conversas | ~8-10s+ | 85% | ❌ Materialized View necessária |

### Otimizações Implementadas

✅ **Partial Indexes** - Apenas últimos 90 dias (redução de 70%)
✅ **Composite Indexes** - Suporta filtros combinados
✅ **React Query Cache** - 5min stale time
✅ **HTTP Cache** - 5min max-age, private
✅ **Postgres CTEs** - Queries otimizadas
✅ **Função Postgres** - Cálculo server-side
✅ **Botão Refresh Manual** - Controle do usuário

### Quando Escalar

Considere Materialized Views quando:
- Tenant com >50k conversas/mês
- Query time consistente >3s
- Múltiplos usuários simultâneos (>10)

---

## 🔐 Segurança

### Defesa em Profundidade (3 camadas)

1. **Autenticação** - Supabase Auth obrigatória
2. **API Route** - Validação `tenant_id === user.tenant_id`
3. **RLS (Postgres)** - Row Level Security no banco

```typescript
// Layer 1: Auth Check
const { user } = await supabase.auth.getUser();
if (!user) return 401;

// Layer 2: Tenant Validation
const { data: userData } = await supabase
  .from('users')
  .select('tenant_id')
  .eq('id', user.id)
  .single();

if (!userData?.tenant_id) return 403;

// Layer 3: RLS (automático no Postgres)
WHERE tenant_id = userData.tenant_id
```

### Compliance

✅ LGPD/GDPR compliant
✅ Sem exposição de dados sensíveis
✅ Logs auditáveis
✅ Cache privado (`Cache-Control: private`)

---

## 🛠️ Stack Técnica

### Backend
- **Postgres 15+** - Banco de dados
- **Supabase** - Auth, RPC, RLS
- **Postgres Functions** - Queries otimizadas
- **Partial Indexes** - Performance

### Frontend
- **Next.js 15** - App Router
- **Recharts** - Gráficos (~50kb)
- **TanStack Query** - State + Cache
- **shadcn/ui** - Componentes
- **Tailwind CSS** - Styling

### DevOps
- **Vercel** - Deploy
- **Supabase Cloud** - Database hosting

---

## 📚 Documentação Adicional

| Documento | Conteúdo | Quando Ler |
|-----------|----------|-----------|
| **DASHBOARD_ARCHITECTURE.md** | Arquitetura completa, SQL, tipos | Antes de implementar |
| **DASHBOARD_IMPLEMENTATION_GUIDE.md** | Passo-a-passo detalhado | Durante implementação |
| **DASHBOARD_DECISIONS.md** | Decisões técnicas, trade-offs | Para entender "por quê" |
| **RELATORIO_PRINCIPAL.md** | Especificação detalhada Principal | Implementar Principal |
| **RELATORIO_FUNIL.md** | Especificação detalhada Funil | Implementar Funil |
| **RELATORIO_TAGS.md** | Especificação detalhada Tags | Implementar Tags |
| **DASHBOARD_PROGRESS.md** | Tracking de progresso | Acompanhamento |

---

## ✅ Checklist de Implementação

### Backend (1h)
- [ ] Instalar dependências
- [ ] Executar `01_indexes.sql`
- [ ] Executar funções SQL (02, 03, 04)
- [ ] Testar cada função com tenant real
- [ ] Verificar indexes criados

### Frontend - Setup (30 min)
- [ ] Configurar React Query Provider
- [ ] Adicionar variáveis CSS (chart colors)
- [ ] Criar estrutura de pastas
- [ ] Criar layout compartilhado

### Frontend - Relatório Principal (6h)
- [ ] Implementar container + header
- [ ] Implementar 8 KPI cards
- [ ] Implementar 5 gráficos
- [ ] Testar filtros e atualização
- [ ] **Validar:** `npm run lint && npx tsc --noEmit && npm run build`

### Frontend - Relatório Funil (5h)
- [ ] Implementar container + header
- [ ] Implementar 6 KPI cards
- [ ] Implementar 6 gráficos
- [ ] Testar funil de conversão
- [ ] **Validar:** `npm run lint && npx tsc --noEmit && npm run build`

### Frontend - Relatório Tags (5h)
- [ ] Implementar container + header
- [ ] Implementar 4 KPI cards
- [ ] Implementar 6 gráficos (com cores customizadas)
- [ ] Testar matriz de co-ocorrência
- [ ] **Validar:** `npm run lint && npx tsc --noEmit && npm run build`

### Testes (2h)
- [ ] Testar todas as APIs
- [ ] Validar tenant isolation
- [ ] Testar filtros temporais
- [ ] Validar performance

### Deploy (1h)
- [ ] **OBRIGATÓRIO:** `npm run lint` (sem erros)
- [ ] **OBRIGATÓRIO:** `npx tsc --noEmit` (sem erros)
- [ ] **OBRIGATÓRIO:** `npm run build` (sucesso)
- [ ] Deploy staging
- [ ] Smoke tests produção

**⚠️ REGRA CRÍTICA:** Após CADA implementação de componente/feature, execute:
```bash
npm run lint && npx tsc --noEmit && npm run build
```
NÃO prossiga se algum comando falhar!

**Tempo Total Estimado:** ~20-24 horas

---

## 🎯 Próximos Passos

1. **Revisar arquitetura detalhada** → `DASHBOARD_ARCHITECTURE.md`
2. **Seguir guia de implementação** → `DASHBOARD_IMPLEMENTATION_GUIDE.md`
3. **Implementar backend** (SQL + APIs)
4. **Implementar frontend** (componentes por relatório)
5. **Testar e validar**
6. **Deploy**

---

## 🆘 Troubleshooting

### Função não encontrada
```sql
-- Verificar se funções foram criadas
\df get_relatorio_principal
\df get_relatorio_funil
\df get_relatorio_tags
```

### Query lenta
1. Verificar indexes: `\di public.idx_*`
2. Analisar tabelas: `ANALYZE conversations;`
3. Reduzir período de teste
4. Considerar materialized view

### Dados não aparecem
```sql
-- Verificar dados no período
SELECT COUNT(*) FROM conversations
WHERE tenant_id = 'YOUR_ID'
  AND created_at >= NOW() - INTERVAL '30 days';
```

---

**🚀 Sistema de Relatórios LIVIA v3.0** - Built with ❤️ for data-driven teams

**Última atualização:** 2025-12-19
**Status:** 🟢 Pronto para implementação
