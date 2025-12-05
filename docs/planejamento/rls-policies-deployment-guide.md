# Guia de Deploy: RLS Policies para Agent Templates

**Feature:** Meus Agentes IA - Row Level Security
**Migration:** `010_add_rls_policies_agents.sql`
**Data:** 2025-12-04

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Aplicando a Migration](#aplicando-a-migration)
4. [Testando as Policies](#testando-as-policies)
5. [Policies Criadas](#policies-criadas)
6. [Rollback](#rollback)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

A migration `010_add_rls_policies_agents.sql` cria **10 policies de RLS** para garantir isolamento multi-tenant nas tabelas:

- **agents** (2 policies)
- **agent_prompts** (4 policies)
- **agent_templates** (2 policies)
- **Super Admin policies** (3 policies adicionais)

### O que as Policies Garantem

✅ **Tenants** só podem ver agents do próprio neurocore
✅ **Tenants** só podem editar seus próprios prompts personalizados
✅ **Tenants** podem ver prompts base (para resetar)
✅ **Super Admins** têm acesso completo a tudo
❌ **Tenants** NÃO podem ver dados de outros tenants
❌ **Tenants** NÃO podem editar prompts base (id_tenant = NULL)

---

## ✅ Pré-requisitos

Antes de aplicar a migration:

1. ✅ Migration `009_add_template_id_to_agents.sql` aplicada
2. ✅ Migration `009a_cleanup_agent_prompts_duplicates.sql` aplicada (se necessário)
3. ✅ Supabase CLI instalado
4. ✅ Projeto Supabase configurado localmente

### Verificar Pré-requisitos

```bash
# 1. Verificar se Supabase CLI está instalado
supabase --version

# 2. Verificar se projeto está linkado
supabase status

# 3. Verificar migrations aplicadas
supabase migration list
```

---

## 🚀 Aplicando a Migration

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# 1. Navegar até o diretório do projeto
cd /home/frank/projeto

# 2. Verificar status do banco
supabase db diff

# 3. Aplicar a migration
supabase db push

# OU aplicar migration específica
supabase migration up --include-all
```

### Opção 2: Desenvolvimento Local (Supabase Local)

```bash
# 1. Iniciar Supabase local (se ainda não estiver rodando)
supabase start

# 2. Aplicar migration
supabase db reset

# OU aplicar apenas a migration específica
supabase migration up
```

### Opção 3: Produção via Dashboard

1. Acesse o **Supabase Dashboard**
2. Navegue até **SQL Editor**
3. Copie o conteúdo de `supabase/migrations/010_add_rls_policies_agents.sql`
4. Cole no editor e execute
5. Verifique os logs de saída

---

## 🧪 Testando as Policies

### 1. Executar Script de Teste Automatizado

```bash
# Executar script de verificação
node scripts/test-rls-policies.js
```

**Saída Esperada:**

```
🧪 TESTE DE RLS POLICIES - AGENT TEMPLATES
======================================================================

📋 1. Verificando se RLS está habilitado...
   ✅ RLS habilitado em agents
   ✅ RLS habilitado em agent_prompts
   ✅ RLS habilitado em agent_templates

📋 2. Listando policies criadas...
   ✓ agents → Tenants can view their own agents (SELECT)
   ✓ agents → Super Admins have full access to agents (ALL)
   [...]
   Total: 10 policies encontradas

📊 RESUMO DOS TESTES
   ✅ Testes passados: 6
   ❌ Testes falhados: 0
   📈 Taxa de sucesso: 100%
   🎉 TODAS AS VERIFICAÇÕES PASSARAM!
```

### 2. Testes Manuais (CRÍTICO!)

Você **DEVE** testar manualmente com usuários reais:

#### Teste 1: Isolamento entre Tenants

```bash
# 1. Login como Usuário do Tenant A
# 2. Acessar /meus-agentes
# 3. Verificar que vê apenas agents do próprio neurocore
# 4. Copiar ID de um agent exibido

# 5. Login como Usuário do Tenant B
# 6. Acessar /meus-agentes
# 7. Verificar que NÃO vê agents do Tenant A
# 8. Tentar acessar diretamente o ID do agent do Tenant A (deve falhar)
```

#### Teste 2: Edição de Prompts

```bash
# Como Tenant A
# 1. Editar um agent e salvar alterações
# 2. Verificar que salvou com sucesso

# Como Tenant B
# 1. Tentar editar um agent do Tenant A via API (deve falhar)
# 2. Editar um agent próprio (deve funcionar)
```

#### Teste 3: Super Admin

```bash
# Como Super Admin
# 1. Acessar Plataforma Admin
# 2. Verificar que consegue ver/editar agents de todos os tenants
# 3. Criar novos agent templates
# 4. Editar prompts base (id_tenant = NULL)
```

### 3. Teste via Supabase Dashboard

```sql
-- 1. No SQL Editor, executar como usuário específico
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub":"USER_ID_AQUI","role":"authenticated"}';

-- 2. Tentar buscar agents (deve retornar apenas do tenant do usuário)
SELECT * FROM agents;

-- 3. Tentar buscar agent_prompts
SELECT * FROM agent_prompts;

-- 4. Resetar role
RESET ROLE;
```

---

## 📚 Policies Criadas

### Tabela: `agents`

| Policy Name | Operation | Descrição |
|-------------|-----------|-----------|
| `Tenants can view their own agents` | SELECT | Tenants veem apenas agents do próprio neurocore |
| `Super Admins have full access to agents` | ALL | Super Admins têm acesso total |

### Tabela: `agent_prompts`

| Policy Name | Operation | Descrição |
|-------------|-----------|-----------|
| `Tenants can view their own prompts` | SELECT | Tenants veem seus prompts + prompts base |
| `Tenants can update their own prompts` | UPDATE | Tenants editam apenas seus prompts |
| `Tenants can insert their own prompts` | INSERT | Tenants podem criar novos prompts |
| `Super Admins have full access to agent_prompts` | ALL | Super Admins têm acesso total |

### Tabela: `agent_templates`

| Policy Name | Operation | Descrição |
|-------------|-----------|-----------|
| `Users can view active templates` | SELECT | Todos veem templates ativos (read-only) |
| `Super Admins have full access to agent_templates` | ALL | Super Admins têm acesso total |

---

## 🔄 Rollback

Se precisar reverter a migration:

### Opção 1: Via Supabase CLI

```bash
# Reverter última migration
supabase migration down
```

### Opção 2: Script SQL Manual

```sql
BEGIN;

-- Remover todas as policies
DROP POLICY IF EXISTS "Tenants can view their own agents" ON agents;
DROP POLICY IF EXISTS "Super Admins have full access to agents" ON agents;

DROP POLICY IF EXISTS "Tenants can view their own prompts" ON agent_prompts;
DROP POLICY IF EXISTS "Tenants can update their own prompts" ON agent_prompts;
DROP POLICY IF EXISTS "Tenants can insert their own prompts" ON agent_prompts;
DROP POLICY IF EXISTS "Super Admins have full access to agent_prompts" ON agent_prompts;

DROP POLICY IF EXISTS "Users can view active templates" ON agent_templates;
DROP POLICY IF EXISTS "Super Admins have full access to agent_templates" ON agent_templates;

-- Desabilitar RLS (CUIDADO!)
-- ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE agent_prompts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE agent_templates DISABLE ROW LEVEL SECURITY;

COMMIT;
```

⚠️ **ATENÇÃO:** Desabilitar RLS remove a segurança multi-tenant!

---

## 🔧 Troubleshooting

### Erro: "RLS policy violation"

**Sintoma:** Usuários não conseguem ver agents

**Solução:**

```sql
-- 1. Verificar se usuário tem tenant_id
SELECT id, email, tenant_id FROM users WHERE id = 'USER_ID';

-- 2. Verificar se tenant tem id_neurocore
SELECT id, name, id_neurocore FROM tenants WHERE id = 'TENANT_ID';

-- 3. Verificar se agents têm id_neurocore correto
SELECT id, name, id_neurocore FROM agents WHERE id_neurocore = 'NEUROCORE_ID';
```

### Erro: "Permission denied for table agents"

**Sintoma:** Acesso negado mesmo com RLS

**Solução:**

```sql
-- Verificar se RLS está realmente habilitado
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'agents';

-- Verificar policies existentes
SELECT * FROM pg_policies WHERE tablename = 'agents';

-- Re-aplicar migration se necessário
```

### Problema: Tenant vê agents de outros tenants

**Sintoma:** Isolamento falhou

**Causa Possível:** Dados corrompidos ou policy incorreta

**Solução:**

```sql
-- 1. Verificar join de tenant → neurocore → agents
SELECT
  u.email,
  t.name as tenant_name,
  t.id_neurocore,
  a.name as agent_name,
  a.id_neurocore
FROM users u
JOIN tenants t ON t.id = u.tenant_id
LEFT JOIN agents a ON a.id_neurocore = t.id_neurocore
WHERE u.id = 'USER_ID';

-- 2. Se id_neurocore não bate, corrigir dados
UPDATE tenants SET id_neurocore = 'CORRECT_ID' WHERE id = 'TENANT_ID';
```

### Performance Lenta

**Sintoma:** Queries muito lentas após RLS

**Solução:**

```sql
-- Verificar se índices existem
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('agents', 'agent_prompts');

-- Criar índices se necessário (já incluídos na migration 009)
CREATE INDEX IF NOT EXISTS idx_agents_neurocore ON agents(id_neurocore);
CREATE INDEX IF NOT EXISTS idx_agent_prompts_tenant ON agent_prompts(id_tenant);
```

---

## 📊 Verificação Final

Após aplicar a migration, execute:

```bash
# 1. Script de teste automatizado
node scripts/test-rls-policies.js

# 2. Verificar no Supabase Dashboard
# - Ir em Database → Policies
# - Verificar que as 10 policies aparecem

# 3. Teste manual com 2 usuários de tenants diferentes
# - Login Tenant A → ver apenas seus agents
# - Login Tenant B → NÃO ver agents do Tenant A

# 4. Build da aplicação
npm run build

# 5. Deploy para produção (se tudo OK)
```

---

## ✅ Checklist de Deploy

- [ ] Migration `009_add_template_id_to_agents.sql` aplicada
- [ ] Migration `010_add_rls_policies_agents.sql` aplicada
- [ ] Script de teste executado (`test-rls-policies.js`)
- [ ] Testes manuais realizados com 2 tenants diferentes
- [ ] Teste de Super Admin realizado
- [ ] Verificação de performance OK
- [ ] Build da aplicação passou sem erros
- [ ] Documentação atualizada
- [ ] Deploy em staging testado
- [ ] Deploy em produção (quando aprovado)

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs: `supabase logs`
2. Revisar este guia de troubleshooting
3. Executar `node scripts/verify-agent-schema.js`
4. Consultar documentação do Supabase: https://supabase.com/docs/guides/auth/row-level-security

---

**Data de Criação:** 2025-12-04
**Última Atualização:** 2025-12-04
**Versão:** 1.0
