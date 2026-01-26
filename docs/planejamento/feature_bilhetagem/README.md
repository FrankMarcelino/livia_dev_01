# Feature: Sistema de Bilhetagem - LIVIA

> Sistema completo de billing para controle de créditos, consumo e cobrança de uso de IA

---

## Indice

1. [Visao Geral](#visao-geral)
2. [Arquitetura](#arquitetura)
3. [Telas e Componentes](#telas-e-componentes)
4. [Principios SOLID](#principios-solid)
5. [Padroes do Projeto](#padroes-do-projeto)
6. [Ordem de Implementacao](#ordem-de-implementacao)
7. [Checklist de Qualidade](#checklist-de-qualidade)
8. [Status de Desenvolvimento](#status-de-desenvolvimento)

---

## Visao Geral

### Objetivo

Implementar sistema de billing para a plataforma LIVIA (Tenant) que permita:
- Visualizar saldo e creditos disponíveis
- Acompanhar extrato de transacoes (creditos/debitos)
- Analisar consumo por provider/sku/agente
- Recarregar creditos (MVP manual, sem Asaas)
- Configurar alertas de saldo baixo

### Contexto

**Duas aplicacoes:**
- **LIVIA (Tenant)**: `/home/frank/livia_dev_01` - Foco principal deste plano
- **Plataforma Admin**: Stack diferente - Mencionada apenas para contexto

**Banco de dados:** Supabase (schema ja aplicado)
- `wallets` - Carteira do tenant
- `ledger_entries` - Extrato contabil
- `usages` - Registro de uso
- `billing_notifications` - Fila de notificacoes
- `pricing_skus`, `pricing_components`, `pricing_component_prices` - Catalogo
- `markup_rules` - Regras de markup
- `fx_usd_brl_history` - Historico de cambio

### Modelo de Creditos

| Conceito | Valor |
|----------|-------|
| 1 credito | R$ 0,01 |
| R$ 100,00 | 10.000 creditos |
| Overdraft | 10% do saldo positivo |
| Disponivel | `saldo + floor(max(saldo,0) * 0.10)` |

---

## Arquitetura

### Estrutura de Diretorios

```
app/(dashboard)/
└── financeiro/
    ├── saldo/
    │   └── page.tsx              # Tela 1: Saldo & Creditos
    ├── extrato/
    │   └── page.tsx              # Tela 2: Extrato
    ├── consumo/
    │   └── page.tsx              # Tela 3: Consumo/Analytics
    └── recarregar/
        └── page.tsx              # Tela 4: Recarregar (MVP)

components/
└── billing/                      # Componentes da feature
    ├── wallet-balance-card.tsx
    ├── wallet-status-badge.tsx
    ├── ledger-table.tsx
    ├── ledger-filters.tsx
    ├── ledger-row-details.tsx
    ├── usage-summary-cards.tsx
    ├── usage-chart.tsx
    ├── recharge-instructions.tsx
    └── recharge-history.tsx

lib/queries/
└── billing.ts                    # Queries Supabase

hooks/
├── use-wallet-data.ts            # Hook TanStack Query
├── use-ledger-data.ts
└── use-usage-data.ts

types/
└── billing.ts                    # Types TypeScript
```

### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario acessa /financeiro/saldo                         │
│    ↓                                                        │
│ 2. Server Component autentica e obtem tenant_id             │
│    createClient() → auth.getUser() → users.tenant_id        │
│    ↓                                                        │
│ 3. Query server-side busca dados                            │
│    getWallet(tenantId) → wallets + computed fields          │
│    ↓                                                        │
│ 4. Client Component renderiza com TanStack Query            │
│    useWalletData() → cache + refetch                        │
│    ↓                                                        │
│ 5. Usuario interage (filtros, paginacao)                    │
│    React Query gerencia cache e invalidacao                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Telas e Componentes

### Tela 1: Saldo & Creditos

**Rota:** `/financeiro/saldo`
**Prioridade:** ALTA (MVP)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Saldo & Creditos                              [Atualizar]  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ SALDO ATUAL  │  │ DISPONIVEL   │  │ STATUS       │      │
│  │ R$ 150,00    │  │ R$ 165,00    │  │ OK/Low/Stop  │      │
│  │ 15.000 cred. │  │ +10% overd.  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  Consumo dos ultimos 7 dias                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ OpenAI       │ │ ElevenLabs   │ │ Total        │        │
│  │ R$ 45,00     │ │ R$ 12,00     │ │ R$ 57,00     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                             │
│  [Recarregar Creditos]                                      │
└─────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `WalletBalanceCard` - Card de saldo com valor e creditos
- `WalletStatusBadge` - Badge colorido (OK/Warning/Critical)
- `UsageSummaryMiniCards` - Mini cards de consumo por provider

**Dados:**
- Query: `getWallet(tenantId)` + `getUsageSummaryByProvider(tenantId, 7)`

---

### Tela 2: Extrato

**Rota:** `/financeiro/extrato`
**Prioridade:** ALTA (MVP)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Extrato                                                    │
├─────────────────────────────────────────────────────────────┤
│  Filtros:                                                   │
│  [Periodo ▼] [Tipo ▼] [Provider ▼] [Buscar...]             │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Data/Hora   │ Tipo  │ Valor     │ Saldo   │ Origem     ││
│  ├─────────────┼───────┼───────────┼─────────┼────────────┤│
│  │ 25/01 14:32 │ Deb   │ -R$ 0,15  │ R$150   │ usage      ││
│  │ 25/01 14:30 │ Deb   │ -R$ 0,08  │ R$150,15│ usage      ││
│  │ 24/01 10:00 │ Cred  │ +R$100,00 │ R$150,23│ purchase   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [< Anterior]                         Pagina 1/10 [Prox >] │
└─────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `LedgerFilters` - Filtros com Select e DatePicker
- `LedgerTable` - Tabela de transacoes
- `LedgerRowDetails` - Expandir linha (detalhes meta)
- Pagination (componente existente ou shadcn)

**Dados:**
- Query: `getLedgerEntries(tenantId, filters, limit, offset)`

---

### Tela 3: Consumo

**Rota:** `/financeiro/consumo`
**Prioridade:** MEDIA (Fase 2)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Consumo                                [Ultimos 30 dias ▼] │
├─────────────────────────────────────────────────────────────┤
│  Grafico de Consumo Diario                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │     ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄                         ││
│  │     Jan 1  Jan 8  Jan 15  Jan 22                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Top Providers/SKUs                                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ # │ Provider   │ SKU          │ Chamadas │ Gasto       ││
│  │ 1 │ openai     │ gpt-4.1-mini │ 1.234    │ R$ 45,00    ││
│  │ 2 │ elevenlabs │ tts_standard │ 456      │ R$ 12,00    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `UsageChart` - Grafico de linha (Recharts - ja instalado)
- `UsageByProviderTable` - Tabela de consumo agregado

**Dados:**
- Query: `getUsageDaily(tenantId, 30)` + `getUsageSummaryByProvider(tenantId, 30)`

---

### Tela 4: Recarregar Creditos (MVP)

**Rota:** `/financeiro/recarregar`
**Prioridade:** ALTA (MVP)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Recarregar Creditos                                        │
├─────────────────────────────────────────────────────────────┤
│  Saldo atual: R$ 150,00                                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Para recarregar creditos:                               ││
│  │                                                          ││
│  │ Entre em contato com nossa equipe financeira:           ││
│  │ Email: financeiro@livia.com.br                          ││
│  │ WhatsApp: (11) 99999-9999                               ││
│  │                                                          ││
│  │ Informe seu CNPJ e o valor desejado.                    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Historico de Recargas                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Data       │ Valor      │ Descricao                     ││
│  │ 24/01/2026 │ +R$ 100,00 │ Compra de creditos            ││
│  │ 15/01/2026 │ +R$ 200,00 │ Compra de creditos            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `RechargeInstructions` - Card com instrucoes de contato
- `RechargeHistory` - Tabela de recargas (ledger filtrado)

**Dados:**
- Query: `getWallet(tenantId)` + `getRechargeHistory(tenantId)`

---

## Contexto: Telas Admin (Referencia)

> **Nota:** Estas telas serao desenvolvidas na outra aplicacao (stack diferente).
> Listadas aqui apenas como referencia para contexto.

### Admin - Catalogo de Precos
- CRUD de `pricing_skus`, `pricing_components`, `pricing_component_prices`
- Versionar precos com vigencia (effective_range)

### Admin - Markup Rules
- CRUD de `markup_rules`
- Regras globais/tenant/provider/sku/agent

### Admin - Tenants & Wallets
- Visao operacional de todos os tenants
- Ajuste manual de saldo (credit_wallet)
- Desbloquear hard stop

### Admin - Auditoria (Usages)
- Tabela completa de `usages`
- Debug de inconsistencias

### Admin - Notificacoes
- Monitor da fila n8n
- Reprocessar falhas

### Admin - Simulador de Preco
- Quote antes de cobrar
- RPC sugerida: `quote_usage_v2`

---

## Principios SOLID

### Single Responsibility (SRP)

Cada componente tem uma unica responsabilidade:

```typescript
// BOM: Componente faz apenas uma coisa
WalletBalanceCard      → Renderiza card de saldo
WalletStatusBadge      → Renderiza badge de status
LedgerTable            → Renderiza tabela de transacoes
LedgerFilters          → Gerencia estado dos filtros

// RUIM: Componente faz muitas coisas
BillingPage            → Renderiza tudo + gerencia estado + faz queries
```

### Open/Closed (OCP)

Componentes extensiveis via props e callbacks:

```typescript
// BOM: Extensivel sem modificar
<LedgerTable
  entries={entries}
  onRowClick={handleExpand}      // Callback customizavel
  renderActions={customActions}  // Slot para acoes extras
/>

// RUIM: Precisa modificar o componente para cada caso
<LedgerTable entries={entries} showDeleteButton={true} />
```

### Liskov Substitution (LSP)

Componentes de tabela seguem contrato comum:

```typescript
// Todas as tabelas seguem o mesmo contrato
interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
}

// LedgerTable, UsageTable, RechargeTable - substituiveis
```

### Interface Segregation (ISP)

Props especificas por componente:

```typescript
// BOM: Props minimas e especificas
interface WalletBalanceCardProps {
  balance_credits: number;
  balance_brl: number;
}

interface WalletStatusBadgeProps {
  status: 'ok' | 'low' | 'critical';
}

// RUIM: Prop bag gigante
interface BillingProps {
  wallet: Wallet;
  ledger: LedgerEntry[];
  usages: Usage[];
  // ... 20 mais props
}
```

### Dependency Inversion (DIP)

Componentes dependem de abstracoes:

```typescript
// BOM: Depende de callbacks abstratos
<LedgerTable
  onRefresh={() => refetch()}     // Callback, nao implementacao
  onFilter={(f) => setFilters(f)} // Componente nao sabe de React Query
/>

// RUIM: Depende de implementacoes concretas
<LedgerTable queryClient={queryClient} />
```

---

## Padroes do Projeto

### NAO Reinventar a Roda

1. **Seguir padroes existentes** em `/components/dashboard`, `/components/crm`
2. **Reutilizar componentes** de `/components/ui` (shadcn)
3. **Copiar estrutura** de queries existentes em `/lib/queries`
4. **Usar hooks existentes** como `useApiCall`, TanStack Query

### Antes de Instalar Bibliotecas

**OBRIGATORIO: Consultar antes de instalar qualquer nova dependencia**

Bibliotecas ja disponiveis:
- UI: shadcn/ui (Button, Card, Table, Select, Dialog, etc.)
- Charts: Recharts (ja usado no dashboard)
- Queries: TanStack Query (React Query)
- Datas: date-fns
- Forms: React Hook Form + Zod
- Toast: Sonner

### Estrutura de Pagina (Padrao)

```typescript
// app/(dashboard)/financeiro/saldo/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getWallet } from '@/lib/queries/billing';
import { WalletDashboard } from '@/components/billing/wallet-dashboard';

export default async function SaldoPage() {
  // 1. Autenticacao
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. Obter tenant_id
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData?.tenant_id) {
    return <div>Erro: Tenant nao encontrado</div>;
  }

  // 3. Buscar dados server-side
  const wallet = await getWallet(userData.tenant_id);

  // 4. Renderizar Client Component
  return <WalletDashboard initialWallet={wallet} tenantId={userData.tenant_id} />;
}
```

### Estrutura de Query (Padrao)

```typescript
// lib/queries/billing.ts
import { createClient } from '@/lib/supabase/server';
import type { Wallet, WalletWithComputed } from '@/types/billing';

export async function getWallet(tenantId: string): Promise<WalletWithComputed | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    console.error('Error fetching wallet:', error);
    return null;
  }

  // Computar campos derivados
  return computeWalletFields(data as Wallet);
}
```

### Estrutura de Hook (Padrao)

```typescript
// hooks/use-wallet-data.ts
import { useQuery } from '@tanstack/react-query';

export function useWalletData(tenantId: string) {
  return useQuery({
    queryKey: ['wallet', tenantId],
    queryFn: () => fetchWallet(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,      // 5 minutos
    refetchOnWindowFocus: false,
  });
}

async function fetchWallet(tenantId: string) {
  const response = await fetch(`/api/billing/wallet?tenantId=${tenantId}`);
  if (!response.ok) throw new Error('Failed to fetch wallet');
  return response.json();
}
```

---

## Ordem de Implementacao

### Fase 1 - Core (MVP)

| # | Item | Arquivos | Dependencias |
|---|------|----------|--------------|
| 1.1 | Types | `types/billing.ts` | - |
| 1.2 | Queries | `lib/queries/billing.ts` | Types |
| 1.3 | Menu lateral | `components/layout/nav-items.tsx` | - |
| 1.4 | **Tela: Saldo** | `app/.../saldo/page.tsx` + componentes | Queries |
| 1.5 | **Tela: Extrato** | `app/.../extrato/page.tsx` + componentes | Queries |
| 1.6 | **Tela: Recarregar** | `app/.../recarregar/page.tsx` + componentes | Queries |

**Testes apos cada item:**
- ESLint: `npm run lint`
- TypeCheck: `npm run type-check`
- Build: `npm run build`

### Fase 2 - Analytics

| # | Item | Arquivos | Dependencias |
|---|------|----------|--------------|
| 2.1 | Hooks TanStack Query | `hooks/use-*.ts` | Queries |
| 2.2 | **Tela: Consumo** | `app/.../consumo/page.tsx` + componentes | Hooks |
| 2.3 | Graficos Recharts | Componentes de chart | Dados |

### Fase 3 - Notificacoes (Futuro)

| # | Item | Arquivos | Dependencias |
|---|------|----------|--------------|
| 3.1 | **Tela: Notificacoes** | `app/.../notificacoes/page.tsx` | Queries |
| 3.2 | Config. Alertas | API Route + UI | Queries |

---

## Checklist de Qualidade

### Antes de Cada Commit

```bash
# 1. Verificar tipos
npm run type-check

# 2. Verificar lint
npm run lint

# 3. Build de producao
npm run build
```

### Criterios de Aceite por Componente

- [ ] TypeScript sem erros (`any` proibido)
- [ ] Props tipadas com interface
- [ ] Responsivo (mobile-first)
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Acessibilidade (ARIA labels)

### Criterios de Aceite por Tela

- [ ] Autenticacao validada (redirect se nao logado)
- [ ] Tenant validado (RLS funciona)
- [ ] Dados carregam corretamente
- [ ] Filtros funcionam
- [ ] Paginacao funciona (se aplicavel)
- [ ] Responsivo em mobile
- [ ] Build passa sem erros

---

## Status de Desenvolvimento

**Ver arquivo:** [STATUS.md](./STATUS.md)

Tracking detalhado de:
- Etapas completadas
- Etapas em andamento
- Etapas pendentes
- Bloqueios e problemas

---

## Documentacao Relacionada

- [STATUS.md](./STATUS.md) - Status de desenvolvimento
- [../../bilhetagem.md](../../bilhetagem.md) - Documento original do ChatGPT
- [../../contexto/fluxo-edicao-prompts-tenant.md](../../contexto/fluxo-edicao-prompts-tenant.md) - Contexto Admin

---

**Criado em:** 2026-01-25
**Ultima atualizacao:** 2026-01-25
**Versao:** 1.0.0
