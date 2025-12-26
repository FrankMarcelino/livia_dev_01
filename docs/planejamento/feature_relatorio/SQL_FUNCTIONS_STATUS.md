# Status das Funções SQL - Suporte a Date Range Personalizado

**Data de Auditoria**: 20/12/2025  
**Documentação técnica**: Status de implementação dos parâmetros `p_start_date` e `p_end_date`

---

## Resumo Executivo

| Função | Arquivo | Status | Prioridade |
|--------|---------|--------|-----------|
| `get_dashboard_data` | `sql/dashboard/02_function_get_dashboard_data.sql` | ✅ **IMPLEMENTADO** | Alta |
| `get_funil_data` | `sql/dashboard/03_function_funil.sql` | ⚠️ **PENDENTE** | Média |
| `get_tags_data` | `sql/dashboard/04_function_tags.sql` | ⚠️ **PENDENTE** | Média |

---

## 1. ✅ get_dashboard_data - IMPLEMENTADO

**Arquivo**: `sql/dashboard/02_function_get_dashboard_data.sql`  
**Status**: ✅ Totalmente implementado (atualizado em 2025-12-20)

### Assinatura Atual
```sql
CREATE OR REPLACE FUNCTION get_dashboard_data(
  p_tenant_id UUID,
  p_days_ago INTEGER DEFAULT 30,
  p_channel_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP DEFAULT NULL,  -- ✅ Implementado
  p_end_date TIMESTAMP DEFAULT NULL     -- ✅ Implementado
)
RETURNS JSON
```

### Lógica Implementada
```sql
-- Se custom date range é fornecido, usa ele; caso contrário usa days_ago
IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
  v_start_date := p_start_date;
  v_end_date := p_end_date;
ELSE
  v_end_date := CURRENT_TIMESTAMP;
  v_start_date := v_end_date - (p_days_ago || ' days')::INTERVAL;
END IF;
```

### ✅ Funcionalidades
- ✅ Aceita `p_start_date` e `p_end_date` como parâmetros opcionais
- ✅ Lógica condicional: date range customizado OU days_ago
- ✅ Retrocompatível (parâmetros opcionais com DEFAULT NULL)
- ✅ Utiliza timezone 'America/Sao_Paulo'
- ✅ Filtros aplicados corretamente nas CTEs

### 🎯 Resultado
**Função pronta para produção com suporte completo a date range personalizado.**

---

## 2. ⚠️ get_funil_data - PENDENTE

**Arquivo**: `sql/dashboard/03_function_funil.sql`  
**Status**: ⚠️ **Precisa ser atualizada**

### Assinatura Atual (ANTIGA)
```sql
CREATE OR REPLACE FUNCTION get_funil_data(
  p_tenant_id UUID,
  p_days_ago INTEGER DEFAULT 30,
  p_channel_id UUID DEFAULT NULL
  -- ❌ Faltam p_start_date e p_end_date
)
RETURNS JSON
```

### Lógica Atual (LIMITADA)
```sql
-- Atualmente APENAS usa days_ago (não aceita custom date range)
v_end_date := CURRENT_TIMESTAMP;
v_start_date := v_end_date - (p_days_ago || ' days')::INTERVAL;
```

### ⚠️ Problemas Identificados
- ❌ Não aceita `p_start_date` e `p_end_date`
- ❌ Frontend envia parâmetros que a função **ignora silenciosamente**
- ❌ Usuário seleciona date range personalizado mas função usa `p_days_ago`
- ❌ Inconsistência de dados entre dashboard principal e relatório de funil

### 🔧 Alterações Necessárias

#### 1. Atualizar assinatura da função
```sql
CREATE OR REPLACE FUNCTION get_funil_data(
  p_tenant_id UUID,
  p_days_ago INTEGER DEFAULT 30,
  p_channel_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP DEFAULT NULL,  -- ✨ ADICIONAR
  p_end_date TIMESTAMP DEFAULT NULL     -- ✨ ADICIONAR
)
RETURNS JSON
```

#### 2. Implementar lógica condicional
```sql
DECLARE
  v_start_date TIMESTAMP;
  v_end_date TIMESTAMP;
BEGIN
  -- ✨ NOVA LÓGICA: Prioriza custom date range
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    v_start_date := p_start_date;
    v_end_date := p_end_date;
  ELSE
    v_end_date := CURRENT_TIMESTAMP;
    v_start_date := v_end_date - (p_days_ago || ' days')::INTERVAL;
  END IF;
  
  -- Resto do código permanece igual
  WITH base_conversations AS (
    SELECT ...
    WHERE c.created_at >= v_start_date
      AND c.created_at <= v_end_date
      -- ...
  )
  -- ...
END;
```

#### 3. Validar queries
- Verificar se todos os filtros de data usam `v_start_date` e `v_end_date`
- Testar performance com ranges grandes (90+ dias)
- Validar cálculos de KPIs (taxa de conversão, etc.)

### 🎯 Impacto
**Média prioridade**: Não bloqueia dashboard principal, mas cria inconsistência no relatório de funil.

---

## 3. ⚠️ get_tags_data - PENDENTE

**Arquivo**: `sql/dashboard/04_function_tags.sql`  
**Status**: ⚠️ **Precisa ser atualizada**

### Assinatura Atual (ANTIGA)
```sql
CREATE OR REPLACE FUNCTION get_tags_data(
  p_tenant_id UUID,
  p_days_ago INTEGER DEFAULT 30,
  p_channel_id UUID DEFAULT NULL
  -- ❌ Faltam p_start_date e p_end_date
)
RETURNS JSON
```

### Lógica Atual (LIMITADA)
```sql
-- Atualmente APENAS usa days_ago (não aceita custom date range)
v_end_date := CURRENT_TIMESTAMP;
v_start_date := v_end_date - (p_days_ago || ' days')::INTERVAL;
```

### ⚠️ Problemas Identificados
- ❌ Não aceita `p_start_date` e `p_end_date`
- ❌ Frontend envia parâmetros que a função **ignora silenciosamente**
- ❌ Usuário seleciona date range personalizado mas função usa `p_days_ago`
- ❌ Inconsistência de dados entre dashboard principal e relatório de tags

### 🔧 Alterações Necessárias

#### 1. Atualizar assinatura da função
```sql
CREATE OR REPLACE FUNCTION get_tags_data(
  p_tenant_id UUID,
  p_days_ago INTEGER DEFAULT 30,
  p_channel_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP DEFAULT NULL,  -- ✨ ADICIONAR
  p_end_date TIMESTAMP DEFAULT NULL     -- ✨ ADICIONAR
)
RETURNS JSON
```

#### 2. Implementar lógica condicional
```sql
DECLARE
  v_start_date TIMESTAMP;
  v_end_date TIMESTAMP;
BEGIN
  -- ✨ NOVA LÓGICA: Prioriza custom date range
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    v_start_date := p_start_date;
    v_end_date := p_end_date;
  ELSE
    v_end_date := CURRENT_TIMESTAMP;
    v_end_date := v_end_date - (p_days_ago || ' days')::INTERVAL;
  END IF;
  
  -- Resto do código permanece igual
  WITH base_conversations AS (
    SELECT ...
    WHERE c.created_at >= v_start_date
      AND c.created_at <= v_end_date
      -- ...
  )
  -- ...
END;
```

#### 3. Validar queries
- Verificar se todos os filtros de data usam `v_start_date` e `v_end_date`
- Validar agregações de tags por período customizado
- Testar performance com ranges grandes (90+ dias)

### 🎯 Impacto
**Média prioridade**: Não bloqueia dashboard principal, mas cria inconsistência no relatório de tags.

---

## Plano de Ação

### Fase 1: Testes (Prioridade ALTA)
1. ✅ **get_dashboard_data**: Testar se date range customizado está funcionando
   - Testar no frontend com calendário
   - Validar dados retornados com diferentes ranges
   - Verificar cache invalidation no React Query

### Fase 2: Atualização SQL (Prioridade MÉDIA)
2. ⚠️ **get_funil_data**: Implementar suporte a date range
   - Atualizar assinatura da função
   - Implementar lógica condicional
   - Testar queries e KPIs
   - Deploy para desenvolvimento
   - Deploy para produção

3. ⚠️ **get_tags_data**: Implementar suporte a date range
   - Atualizar assinatura da função
   - Implementar lógica condicional
   - Testar queries e agregações
   - Deploy para desenvolvimento
   - Deploy para produção

### Fase 3: Validação End-to-End (Prioridade ALTA após Fase 2)
4. Testar integração completa
   - Dashboard principal com date range customizado
   - Relatório de funil com date range customizado
   - Relatório de tags com date range customizado
   - Validar consistência entre relatórios
   - Testar transições entre filtros (7dias → custom → 30dias)

---

## Riscos e Mitigações

### Risco 1: Inconsistência de Dados
**Problema**: Dashboard principal usa custom date range, mas relatórios usam days_ago.

**Impacto**: Usuário vê dados diferentes entre telas.

**Mitigação**: 
- ✅ Frontend já envia parâmetros corretos
- ⚠️ Atualizar funções SQL pendentes
- ✅ Usar `normalizeeDateRange()` para garantir timezone correto

### Risco 2: Performance com Ranges Grandes
**Problema**: Queries podem ficar lentas com ranges > 90 dias.

**Impacto**: Timeout ou experiência ruim.

**Mitigação**:
- ✅ Frontend já limita a 365 dias
- ✅ Warning visual para ranges 90-365 dias
- 🔧 Adicionar índices se necessário (verificar explain analyze)
- 🔧 Considerar paginação para datasets muito grandes

### Risco 3: Timezone
**Problema**: Diferenças entre timezone do usuário e UTC do banco.

**Impacto**: Dados de dias "errados" podem aparecer.

**Mitigação**:
- ✅ Frontend usa `normalizeeDateRange()` para converter para UTC
- ✅ `get_dashboard_data` já usa timezone 'America/Sao_Paulo'
- ⚠️ Garantir que `get_funil_data` e `get_tags_data` também usem timezone correto

---

## Checklist de Deploy

### Antes de Atualizar Funções SQL
- [ ] Fazer backup das funções atuais
- [ ] Revisar código SQL com outro desenvolvedor
- [ ] Testar localmente com dados de desenvolvimento
- [ ] Validar que funções são retrocompatíveis (parâmetros opcionais)

### Deploy
- [ ] Executar scripts SQL em ambiente de desenvolvimento
- [ ] Testar frontend conectado ao desenvolvimento
- [ ] Validar queries com EXPLAIN ANALYZE
- [ ] Executar scripts SQL em produção (horário de baixo tráfego)
- [ ] Monitorar logs de erro nas primeiras horas

### Após Deploy
- [ ] Testar todas as combinações de filtros
- [ ] Validar métricas entre dashboard e relatórios
- [ ] Verificar performance (tempos de resposta)
- [ ] Coletar feedback dos usuários

---

## Comandos Úteis para Deploy

### Conectar ao Supabase
```bash
# Desenvolvimento
supabase db push --local

# Produção (via Migration)
supabase migration new add_custom_date_range_to_funil_and_tags
# Editar arquivo em supabase/migrations/
supabase db push
```

### Testar Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM get_funil_data(
  'tenant-uuid'::UUID,
  30,
  NULL,
  '2024-01-01 00:00:00'::TIMESTAMP,
  '2024-03-31 23:59:59'::TIMESTAMP
);
```

---

## Referências

- Função implementada: `sql/dashboard/02_function_get_dashboard_data.sql` (linhas 6-28)
- Funções pendentes: `sql/dashboard/03_function_funil.sql`, `sql/dashboard/04_function_tags.sql`
- Utilitário de timezone: `lib/utils/date-helpers.ts`
- Componente UI: `components/dashboard/dashboard-header.tsx`
- Planejamento geral: `docs/planejamento/feature_relatorio/CUSTOM_DATE_FILTER_IMPROVEMENTS.md`

---

## Notas de Implementação

### Pattern Recomendado
O pattern implementado em `get_dashboard_data` deve ser replicado:

```sql
-- 1. Adicionar parâmetros opcionais na assinatura
p_start_date TIMESTAMP DEFAULT NULL,
p_end_date TIMESTAMP DEFAULT NULL,

-- 2. Lógica condicional no início do DECLARE/BEGIN
IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
  v_start_date := p_start_date;
  v_end_date := p_end_date;
ELSE
  v_end_date := CURRENT_TIMESTAMP;
  v_start_date := v_end_date - (p_days_ago || ' days')::INTERVAL;
END IF;

-- 3. Usar v_start_date e v_end_date em todos os filtros WHERE
WHERE created_at >= v_start_date AND created_at <= v_end_date
```

### Retrocompatibilidade
✅ **Garantida**: Todos os parâmetros novos têm `DEFAULT NULL`, então chamadas existentes continuam funcionando:

```sql
-- Chamada antiga (ainda funciona)
SELECT * FROM get_funil_data('tenant-uuid'::UUID, 30);

-- Chamada nova (com custom date range)
SELECT * FROM get_funil_data(
  'tenant-uuid'::UUID, 
  30, 
  NULL, 
  '2024-01-01'::TIMESTAMP, 
  '2024-03-31'::TIMESTAMP
);
```

---

## Contato

Para dúvidas sobre a implementação:
- Revisar código da função `get_dashboard_data` (já implementada corretamente)
- Verificar `lib/utils/date-helpers.ts` para tratamento de timezone
- Consultar documentação do React Query para cache invalidation

---

**Última atualização**: 20/12/2025  
**Responsável pela auditoria**: Sistema de IA (Claude)  
**Próxima revisão**: Após deploy das funções pendentes




