# Backlog - LIVIA MVP

Lista de tarefas técnicas pendentes e melhorias futuras.

---

## 🔴 Crítico (Segurança)

### [BACKLOG-001] Corrigir Políticas RLS da Tabela Users

**Prioridade:** Alta (Antes de produção)
**Status:** ✅ Concluído
**Criado em:** 2025-11-17
**Concluído em:** 2025-11-17

**Problema resolvido:**
- ~~Tabela `users` tinha políticas RLS causando recursão infinita~~
- ~~Estava usando workaround com Service Role Key (bypassa RLS)~~

**Solução aplicada via MCP:**
1. ✅ Removidas todas as políticas problemáticas:
   - "Super_admin pode gerenciar todos os usuários" (causava recursão)
   - "User pode ver seus colegas de tenant" (causava recursão)

2. ✅ Criadas políticas seguras sem recursão:
   - "Users can read own data" - SELECT usando `auth.uid() = id`
   - "Users can update own data" - UPDATE usando `auth.uid() = id`

3. ✅ Workaround removido dos arquivos:
   - `app/actions/auth.ts` - Usando cliente normal
   - `app/livechat/page.tsx` - Usando cliente normal
   - `lib/queries/livechat.ts` - Todas as 5 funções usando cliente normal

**Migration aplicada:**
- `fix_users_rls_policies` - Executada via MCP Supabase

**Nota:** O arquivo `lib/supabase/admin.ts` foi mantido para casos futuros onde bypass de RLS seja necessário (ex: criação de usuários via backend).

---

## 🟡 Médio (Funcionalidades)

### [BACKLOG-002] Implementar Supabase Realtime

**Prioridade:** Média
**Status:** ✅ Concluído
**Concluído em:** 2025-11-17

**Descrição:**
- Subscribe em conversas para atualização automática
- Subscribe em mensagens para chat em tempo real
- Atualizar UI automaticamente quando houver novas mensagens

**Arquivos Implementados:**
- ✅ `lib/hooks/use-realtime-conversation.ts` - Hook implementado
- ✅ `lib/hooks/use-realtime-messages.ts` - Hook implementado
- ✅ `components/livechat/conversation-view.tsx` - Integração com hooks

---

### [BACKLOG-003] Implementar Quick Replies

**Prioridade:** Baixa
**Status:** Não iniciado

**Descrição:**
- Interface para gerenciar templates de respostas rápidas
- Incrementar contador de uso
- Usar templates durante o atendimento

---

### [BACKLOG-004] Implementar Base de Conhecimento

**Prioridade:** Alta
**Status:** Não iniciado

**Descrição:**
- CRUD de synapses
- Interface de gerenciamento
- Integração com webhook n8n para publicação/vetorização

---

### [BACKLOG-005] Implementar Treinamento Neurocore

**Prioridade:** Média
**Status:** Não iniciado

**Descrição:**
- Interface de teste de queries
- Visualização de synapses usadas
- Feedback de respostas da IA

---

## 🟢 Baixo (Melhorias)

### [BACKLOG-006] Gerar Types Supabase Automaticamente

**Prioridade:** Baixa
**Status:** ✅ Parcialmente Concluído
**Concluído em:** 2025-11-17

**Descrição:**
- ✅ Types regenerados via MCP Supabase (`generate_typescript_types`)
- ✅ Arquivo `types/database.ts` atualizado (1132 linhas)
- ⏳ Pendente: Criar script NPM para facilitar regeneração
- ⏳ Pendente: Configurar CI/CD para atualizar types automaticamente

**Como regenerar manualmente:**
```bash
# Usar MCP do Supabase via curl
curl -X POST -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  "https://mcp.supabase.com/mcp?project_ref=$SUPABASE_PROJECT_REF" \
  -d '{"method":"tools/call","params":{"name":"generate_typescript_types"}}'
```

---

### [BACKLOG-007] Implementar Middleware de Autenticação

**Prioridade:** Baixa
**Status:** Não iniciado

**Descrição:**
- Criar `middleware.ts` para proteger rotas automaticamente
- Evitar verificação manual de auth em cada página

---

### [BACKLOG-008] Adicionar Testes

**Prioridade:** Baixa (Após MVP)
**Status:** Não iniciado

**Descrição:**
- Testes unitários para Server Actions
- Testes E2E para fluxo de autenticação
- Testes de integração com Supabase

---

### [BACKLOG-009] Otimizações de Performance (Banco de Dados)

**Prioridade:** Média (Antes de escala)
**Status:** Identificado
**Criado em:** 2025-11-17

**Avisos detectados via MCP Supabase Advisors:**

1. **Unindexed Foreign Keys (25 ocorrências)**
   - Problema: Foreign keys sem índice podem impactar performance em queries com JOINs
   - Tabelas afetadas: `base_conhecimentos`, `channels`, `contacts`, `conversations`, `messages`, `feedbacks`, `synapses`, `tenants`, `users`, etc.
   - Impacto: INFO (não crítico para MVP)
   - Solução: Criar índices nas colunas de foreign keys mais consultadas

2. **Auth RLS Initialization Plan (35+ ocorrências)**
   - Problema: Políticas RLS re-avaliam `auth.uid()` para cada linha
   - Solução: Substituir `auth.uid()` por `(select auth.uid())` nas políticas
   - Exemplo:
     ```sql
     -- Antes (lento)
     USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()))

     -- Depois (rápido)
     USING (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid())))
     ```

3. **Function Search Path Mutable**
   - Função: `update_updated_at_column`
   - Solução: Definir `search_path` na função

4. **Leaked Password Protection Disabled**
   - Proteção contra senhas vazadas desabilitada
   - Solução: Habilitar via Dashboard Supabase → Authentication → Password Settings

**Quando implementar:**
- Índices: Quando houver degradação de performance em produção
- RLS optimization: Quando escalar para 10k+ linhas por tabela
- Password protection: Implementar antes de produção

---

## 📝 Notas

- Itens marcados como **Crítico** devem ser resolvidos antes de deploy em produção
- Itens **Médio** e **Baixo** podem ser priorizados conforme necessidade
- Consultar DECISIONS.md antes de implementar mudanças arquiteturais
