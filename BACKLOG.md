# Backlog - LIVIA MVP

Lista de tarefas técnicas pendentes e melhorias futuras.

---

## 🔴 Crítico (Segurança)

### [BACKLOG-001] Corrigir Políticas RLS da Tabela Users

**Prioridade:** Alta (Antes de produção)
**Status:** Pendente
**Criado em:** 2025-11-17

**Problema:**
- Tabela `users` tem políticas RLS causando recursão infinita
- Atualmente usando workaround com Service Role Key (bypassa RLS)
- Não é seguro para produção

**Solução:**
1. Executar SQL no Supabase Dashboard:
   ```sql
   -- Opção 1: Desabilitar RLS temporariamente
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;

   -- Opção 2: Corrigir políticas (ver scripts/fix-rls-users.sql)
   ```

2. Remover workaround do código:
   - `lib/supabase/admin.ts` - Deletar ou manter apenas para casos específicos
   - `app/actions/auth.ts` - Voltar a usar cliente normal
   - `app/livechat/page.tsx` - Voltar a usar cliente normal

**Arquivos relacionados:**
- `scripts/fix-rls-users.sql` - SQL de correção
- `scripts/check-user.js` - Script de diagnóstico
- `lib/supabase/admin.ts` - Cliente admin (remover após fix)

**Referências:**
- Commit: 3d40271 "fix: adicionar workaround RLS com admin client"
- DECISIONS.md - Adicionar decisão sobre RLS

---

## 🟡 Médio (Funcionalidades)

### [BACKLOG-002] Implementar Supabase Realtime

**Prioridade:** Média
**Status:** Não iniciado

**Descrição:**
- Subscribe em conversas para atualização automática
- Subscribe em mensagens para chat em tempo real
- Atualizar UI automaticamente quando houver novas mensagens

**Arquivos:**
- `lib/hooks/use-realtime-conversation.ts` - Já existe (implementar)
- `lib/hooks/use-realtime-messages.ts` - Já existe (implementar)

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
**Status:** Não iniciado

**Descrição:**
- Script para regenerar `types/database.ts` quando schema mudar
- Configurar CI/CD para atualizar types automaticamente

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

## 📝 Notas

- Itens marcados como **Crítico** devem ser resolvidos antes de deploy em produção
- Itens **Médio** e **Baixo** podem ser priorizados conforme necessidade
- Consultar DECISIONS.md antes de implementar mudanças arquiteturais
