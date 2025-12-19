# Dashboard LIVIA - Guia de Implementação

## 📋 Resumo

Este guia detalha todos os passos necessários para implementar o dashboard completo no projeto LIVIA MVP.

**Tempo estimado total:** 18-24 horas

---

## ✅ Pré-requisitos

- [x] Next.js 15 configurado
- [x] Supabase conectado
- [x] shadcn/ui instalado
- [x] Acesso ao Supabase Dashboard SQL Editor ou CLI

---

## 📦 1. Instalar Dependências (15 min)

### 1.1. Instalar Recharts

```bash
npm install recharts
npm install --save-dev @types/recharts
```

### 1.2. Instalar TanStack Query (React Query)

```bash
npm install @tanstack/react-query
```

### 1.3. Instalar date-fns (se não tiver)

```bash
npm install date-fns
```

### 1.4. Verificar instalação

```bash
npm list recharts @tanstack/react-query date-fns
```

---

## 🗄️ 2. Setup do Banco de Dados (30-45 min)

### 2.1. Executar Indexes (Supabase Dashboard)

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Crie uma nova query
4. Cole o conteúdo de `sql/dashboard/01_indexes.sql`
5. Execute

**⚠️ IMPORTANTE:** Use `CREATE INDEX CONCURRENTLY` para não bloquear a tabela em produção.

**Tempo estimado:** 10-20 min (dependendo do volume de dados)

```sql
-- Verificar se os indexes foram criados
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%dashboard%'
ORDER BY tablename, indexname;
```

### 2.2. Criar Função get_dashboard_data()

1. No **SQL Editor**, crie nova query
2. Cole o conteúdo de `sql/dashboard/02_function_get_dashboard_data.sql`
3. Execute

**Validação:**

```sql
-- Testar a função (substitua pelo seu tenant_id real)
SELECT get_dashboard_data(
  '123e4567-e89b-12d3-a456-426614174000'::UUID, -- seu tenant_id
  30,  -- últimos 30 dias
  NULL -- todos os canais
);
```

Se retornar JSON com estrutura completa, está funcionando!

### 2.3. Atualizar Tipos do Supabase (TypeScript)

```bash
# Se estiver usando Supabase CLI
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts

# OU através do Supabase Studio
# Dashboard > Settings > API > Generate types
```

---

## 🎨 3. Adicionar Variáveis CSS para Gráficos (5 min)

Adicione as variáveis de cor em `app/globals.css`:

```css
/* app/globals.css */
:root {
  /* ... outras variáveis existentes ... */

  /* Chart colors */
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
}

.dark {
  /* ... outras variáveis dark mode ... */

  /* Chart colors (dark mode) */
  --chart-1: 220 70% 60%;
  --chart-2: 160 60% 55%;
  --chart-3: 30 80% 65%;
  --chart-4: 280 65% 70%;
  --chart-5: 340 75% 65%;
}
```

---

## 🧩 4. Configurar React Query Provider (10 min)

### 4.1. Criar Provider

Crie `providers/query-provider.tsx`:

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 4.2. Adicionar ao Root Layout

Em `app/layout.tsx`:

```tsx
import { QueryProvider } from '@/providers/query-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>
          {/* ... outros providers ... */}
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

---

## 📄 5. Criar Página do Dashboard (15 min)

### 5.1. Criar estrutura de pastas

```bash
mkdir -p app/\(dashboard\)/dashboard
mkdir -p components/dashboard
mkdir -p components/dashboard/charts
mkdir -p components/dashboard/skeletons
```

### 5.2. Criar página (Server Component)

`app/(dashboard)/dashboard/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDashboardData } from '@/lib/queries/dashboard';
import { DashboardContainer } from '@/components/dashboard/dashboard-container';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  const tenantId = userData?.tenant_id;

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-destructive">Erro: Usuário sem tenant associado</p>
      </div>
    );
  }

  // Carregar dados iniciais (30 dias)
  const initialData = await getDashboardData({ tenantId, daysAgo: 30 });

  return <DashboardContainer initialData={initialData} tenantId={tenantId} />;
}
```

### 5.3. Criar loading.tsx

`app/(dashboard)/dashboard/loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-40" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-20" />
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
```

### 5.4. Criar error.tsx

`app/(dashboard)/dashboard/error.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <AlertCircle className="h-16 w-16 text-destructive" />
      <h2 className="text-2xl font-bold">Erro ao carregar dashboard</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
```

---

## 🎨 6. Implementar Componentes (PRÓXIMA ETAPA)

Agora que a base está pronta, você pode implementar os componentes:

### Ordem recomendada:

1. **Dashboard Container** (gerencia estado)
2. **Dashboard Header** (filtros)
3. **KPI Cards** (8 cards)
4. **Gráficos básicos** (Conversas, Tags, Heatmap)
5. **Gráficos avançados** (Funnel, Channels, etc)
6. **Skeletons** (loading states)

---

## 🧪 7. Testar Implementação

### ⚠️ IMPORTANTE: Validação Obrigatória Após Cada Implementação

**SEMPRE execute os seguintes comandos após QUALQUER alteração no código:**

```bash
# 1. Verificar ESLint (qualidade do código)
npm run lint

# 2. Verificar tipos TypeScript (type safety)
npx tsc --noEmit

# 3. Testar build (compilação)
npm run build
```

**✅ Só prossiga se todos os 3 comandos passarem sem erros!**

---

### 7.1. Testar API Route

```bash
# Em outro terminal, inicie o servidor
npm run dev

# Teste a API (substitua tenant_id)
curl "http://localhost:3000/api/dashboard?tenantId=YOUR_TENANT_ID&daysAgo=30"
```

### 7.2. Testar Função Postgres

No Supabase Dashboard:

```sql
-- Verificar performance da query
EXPLAIN ANALYZE
SELECT get_dashboard_data(
  'YOUR_TENANT_ID'::UUID,
  30,
  NULL
);
```

**Performance alvo:**
- < 500ms com 1k conversas
- < 2s com 10k conversas
- < 5s com 100k conversas

### 7.3. Verificar Indexes

```sql
-- Ver quais indexes estão sendo usados
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM conversations
WHERE tenant_id = 'YOUR_TENANT_ID'::UUID
  AND created_at >= NOW() - INTERVAL '30 days';
```

---

## 🚀 8. Deploy Checklist

### 8.1. Verificações de Código (OBRIGATÓRIO)

**Execute SEMPRE antes de cada commit ou pull request:**

```bash
# 1. ESLint - Qualidade do código
npm run lint

# 2. TypeScript - Verificação de tipos
npx tsc --noEmit

# 3. Build - Compilação sem erros
npm run build
```

**❌ NUNCA faça commit se algum desses comandos falhar!**

### 8.2. Checklist de Produção

Antes de fazer deploy para produção:

- [ ] ✅ `npm run lint` passou sem erros
- [ ] ✅ `npx tsc --noEmit` passou sem erros
- [ ] ✅ `npm run build` executou com sucesso
- [ ] Todos os indexes criados com `CONCURRENTLY`
- [ ] Função `get_dashboard_data()` testada e funcionando
- [ ] API Route protegida com autenticação
- [ ] Validação de `tenant_id` implementada
- [ ] React Query Provider configurado
- [ ] Cache configurado (5min no API, 5min no React Query)
- [ ] Error boundaries implementados
- [ ] Loading states implementados
- [ ] Responsividade testada (mobile, tablet, desktop)
- [ ] Performance validada (< 2s carregamento inicial)
- [ ] Logs de erro configurados

---

## 📊 9. Monitoramento Pós-Deploy

### 9.1. Queries Lentas

```sql
-- Ver queries mais lentas do dashboard
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%get_dashboard_data%'
ORDER BY mean_time DESC
LIMIT 10;
```

### 9.2. Cache Hit Rate

```sql
-- Verificar eficiência dos indexes
SELECT
  schemaname,
  tablename,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%dashboard%'
ORDER BY idx_scan DESC;
```

---

## 🆘 Troubleshooting

### Problema: Query muito lenta

**Solução:**
1. Verificar se indexes foram criados: `\di public.idx_*`
2. Analisar tabelas: `ANALYZE conversations;`
3. Reduzir período de busca (testar com 7 dias)
4. Considerar materialized view

### Problema: Erro "Function does not exist"

**Solução:**
1. Verificar se função foi criada: `\df get_dashboard_data`
2. Verificar schema correto: `public.get_dashboard_data`
3. Recriar função executando SQL novamente

### Problema: Dados não aparecem

**Solução:**
1. Verificar autenticação: `tenant_id` correto?
2. Verificar RLS: usuário tem permissão?
3. Testar query manualmente no SQL Editor
4. Verificar logs do browser (Network tab)

---

## 📚 Referências Rápidas

### Arquivos Criados

```
types/dashboard.ts                    # Tipos TypeScript
lib/queries/dashboard.ts              # Queries Supabase
lib/utils/dashboard-helpers.ts        # Helpers de formatação
hooks/use-dashboard-data.ts           # Hook React Query
app/api/dashboard/route.ts            # API Route
app/(dashboard)/dashboard/page.tsx    # Página principal
sql/dashboard/01_indexes.sql          # Indexes otimizados
sql/dashboard/02_function_get_dashboard_data.sql  # Função Postgres
```

### Comandos Úteis

```bash
# Instalar dependências
npm install recharts @tanstack/react-query date-fns

# Regenerar tipos Supabase
npx supabase gen types typescript --project-id YOUR_ID > types/database.ts

# Testar build
npm run build

# Verificar tipos
npx tsc --noEmit
```

---

## 🎯 Próximos Passos

Após completar este guia, você terá:

✅ Backend completo (Postgres + API)
✅ Types e queries implementados
✅ Hook React Query configurado
✅ Estrutura de páginas criada

**Faltando:**
- [ ] Implementar componentes visuais (KPIs, gráficos)
- [ ] Adicionar interatividade (filtros, tooltips)
- [ ] Styling e responsividade
- [ ] Testes end-to-end

Quer que eu continue implementando os componentes visuais?
