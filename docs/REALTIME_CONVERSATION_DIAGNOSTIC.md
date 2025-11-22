# Diagnóstico: Conversation Updates Não Aparecem em Realtime

**Data:** 2025-11-22
**Problema:** Coluna `ia_active` e `pause_notes` da tabela `conversations` não atualizam em tempo real no frontend

---

## 🔍 Causas Mais Prováveis

### 1. REPLICA IDENTITY (Mais Provável ⚠️)

**Problema:** Por padrão, PostgreSQL Realtime usa `REPLICA IDENTITY DEFAULT`, que **envia apenas a primary key + colunas alteradas** no `payload.new`.

**Impacto:**
```typescript
// UPDATE conversations SET ia_active = false WHERE id = '...'

// payload.new recebido pelo frontend:
{
  id: "...",           // ✅ Sempre enviado (PK)
  ia_active: false,    // ✅ Enviado (foi alterado)
  // ❌ Todas as outras colunas estão FALTANDO!
  // ❌ status: undefined
  // ❌ tenant_id: undefined
  // ❌ contact_id: undefined
  // ❌ etc...
}

// Quando fazemos setConversation(payload.new), sobrescrevemos
// o estado com um objeto INCOMPLETO!
```

**Solução:**
```sql
-- Fazer Realtime enviar TODAS as colunas, não apenas as alteradas
ALTER TABLE conversations REPLICA IDENTITY FULL;
```

---

### 2. RLS (Row Level Security) Bloqueando SELECT

**Problema:** Usuário autenticado pode ter permissão para UPDATE mas não para SELECT após UPDATE.

**Como Verificar:**
Execute o diagnóstico SQL em [scripts/diagnose-realtime.sql](../scripts/diagnose-realtime.sql) seção 4.

**Solução:**
```sql
-- Permitir SELECT para usuários autenticados
CREATE POLICY "Users can view conversations from their tenant"
ON conversations
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  )
);
```

---

### 3. Tabela Não Está na Publicação Realtime

**Problema:** Tabela `conversations` pode não estar habilitada para Realtime.

**Como Verificar:**
Execute seções 1-3 de [scripts/diagnose-realtime.sql](../scripts/diagnose-realtime.sql)

**Solução:**
```sql
-- Adicionar conversations à publicação do Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
```

---

## 🧪 Como Diagnosticar

### Passo 1: Executar SQL de Diagnóstico

1. Abra o Supabase SQL Editor:
   https://supabase.com/dashboard/project/wfrxwfbslhkkzkexyilx/sql/new

2. Cole o conteúdo de [scripts/diagnose-realtime.sql](../scripts/diagnose-realtime.sql)

3. Execute e analise resultados:

**Resultado Esperado (Bom ✅):**
```
-- Seção 1: REPLICA IDENTITY
| tablename      | replica_identity_status       |
|----------------|-------------------------------|
| conversations  | FULL (all columns)            | ✅
| messages       | DEFAULT (primary key)         |

-- Seção 2: Publicação ativa
| pubname           | puballtables | pubupdate |
|-------------------|--------------|-----------|
| supabase_realtime | false        | true      | ✅

-- Seção 3: Tabelas na publicação
| tablename      |
|----------------|
| conversations  | ✅
| messages       | ✅

-- Seção 4: RLS Policies (deve ter pelo menos 1 SELECT policy)
| policyname                              | cmd    |
|-----------------------------------------|--------|
| Users can view conversations...         | SELECT | ✅
```

**Resultado Problemático (Ruim ❌):**
```
-- ❌ REPLICA IDENTITY = DEFAULT (primary key)
| conversations  | DEFAULT (primary key)         | ❌ PROBLEMA!

-- ❌ conversations não está na publicação
(0 rows)  ❌ PROBLEMA!

-- ❌ Nenhuma policy de SELECT
(0 rows)  ❌ PROBLEMA!
```

---

### Passo 2: Testar Localmente com Logs

**Já implementado!** Os logs de debug foram adicionados em:
- [lib/hooks/use-realtime-conversation.ts](../lib/hooks/use-realtime-conversation.ts)

**Como testar:**

1. Rodar app localmente:
```bash
npm run dev
```

2. Abrir DevTools Console (F12)

3. Abrir uma conversa no Livechat

4. Verificar logs de subscrição:
```
[realtime-conversation] ✅ Subscribed to conversation: abc123...
```

5. Clicar em "Pausar IA"

6. Observar logs:

**Cenário A: Realtime funcionando ✅**
```javascript
[pause-ia] ✅ N8N responded successfully in 423ms

[realtime-conversation] UPDATE received: {
  conversationId: "abc123...",
  old: { id: "abc123...", ... },
  new: {
    id: "abc123...",
    tenant_id: "xyz...",
    contact_id: "...",
    status: "open",
    ia_active: false,        // ✅ Atualizado!
    pause_notes: "Pausado...", // ✅ Presente!
    // ... todas as outras colunas
  },
  ia_active: false,
  pause_notes: "Pausado..."
}
```

**Cenário B: REPLICA IDENTITY DEFAULT (problema!) ❌**
```javascript
[pause-ia] ✅ N8N responded successfully in 423ms

[realtime-conversation] UPDATE received: {
  conversationId: "abc123...",
  old: { id: "abc123..." },  // ⚠️ Apenas PK
  new: {
    id: "abc123...",
    ia_active: false,         // ✅ Enviado (foi alterado)
    pause_notes: "Pausado...", // ✅ Enviado (foi alterado)
    // ❌ FALTANDO: tenant_id, contact_id, status, etc!
  },
  ia_active: false,
  pause_notes: "Pausado..."
}
```

**Cenário C: Subscription não conectou ❌**
```javascript
// ❌ Nenhum log de "[realtime-conversation] ✅ Subscribed"
// OU
[realtime-conversation] ❌ Channel error: {...}
[realtime-conversation] ⏱️ Subscription timed out
```

---

### Passo 3: Verificar Network Tab

1. Abrir DevTools → Network → WS (WebSockets)

2. Clicar em "Pausar IA"

3. Verificar se há mensagem Realtime chegando:
```json
{
  "topic": "realtime:public:conversations",
  "event": "postgres_changes",
  "payload": {
    "data": {
      "id": "...",
      "ia_active": false,
      // ...
    },
    "commit_timestamp": "..."
  }
}
```

4. Se **NÃO** houver mensagem → Problema no servidor (RLS, publicação)
5. Se houver mensagem mas UI não atualiza → Problema no frontend

---

## ✅ Soluções Rápidas

### Solução 1: Ativar REPLICA IDENTITY FULL (Recomendado)

**Execute no Supabase SQL Editor:**
```sql
ALTER TABLE conversations REPLICA IDENTITY FULL;
```

**Por quê?**
Garante que `payload.new` contenha **TODAS as colunas**, não apenas as alteradas.

**Desvantagem:**
Aumenta ligeiramente o overhead do Realtime (envia mais dados). Mas para tabela `conversations` isso é negligível.

---

### Solução 2: Merge Manual no Hook (Alternativa)

Se não quiser usar REPLICA IDENTITY FULL, pode fazer merge manual:

```typescript
// lib/hooks/use-realtime-conversation.ts
(payload) => {
  console.log('[realtime-conversation] UPDATE received:', {
    conversationId: initialConversation.id,
    old: payload.old,
    new: payload.new,
    ia_active: payload.new.ia_active,
    pause_notes: payload.new.pause_notes,
  });

  // ✅ Merge com estado anterior ao invés de sobrescrever
  setConversation((prev) => ({
    ...prev,          // Manter colunas não alteradas
    ...payload.new,   // Sobrescrever apenas colunas alteradas
  }));
}
```

**Desvantagem:**
Se houver DELETE de uma coluna (set NULL), o merge pode manter o valor antigo incorretamente.

---

### Solução 3: Verificar/Criar RLS Policy

**Execute no Supabase SQL Editor:**
```sql
-- Ver policies existentes
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'conversations';

-- Se não houver policy de SELECT, criar:
CREATE POLICY "authenticated_users_can_select_conversations"
ON conversations
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  )
);
```

---

## 🎯 Checklist de Diagnóstico

Execute nesta ordem:

- [ ] **1. Execute diagnóstico SQL** ([scripts/diagnose-realtime.sql](../scripts/diagnose-realtime.sql))
  - [ ] Verificar REPLICA IDENTITY (deve ser FULL)
  - [ ] Verificar conversations está na publicação
  - [ ] Verificar existe policy de SELECT

- [ ] **2. Se REPLICA IDENTITY = DEFAULT:**
  - [ ] Executar `ALTER TABLE conversations REPLICA IDENTITY FULL;`
  - [ ] Testar novamente

- [ ] **3. Se conversations não está na publicação:**
  - [ ] Executar `ALTER PUBLICATION supabase_realtime ADD TABLE conversations;`
  - [ ] Testar novamente

- [ ] **4. Se não há RLS policy de SELECT:**
  - [ ] Criar policy conforme Solução 3
  - [ ] Testar novamente

- [ ] **5. Testar localmente com logs:**
  - [ ] `npm run dev`
  - [ ] Abrir console do navegador
  - [ ] Pausar IA e observar logs
  - [ ] Verificar se `payload.new` contém TODAS as colunas

- [ ] **6. Testar em produção (Vercel):**
  - [ ] Deploy e testar
  - [ ] Verificar logs do navegador em produção

---

## 📊 Logs Esperados (Funcionando)

### Console do Navegador:
```
[realtime-conversation] ✅ Subscribed to conversation: abc123...
[pause-ia] ✅ N8N responded successfully in 423ms
[realtime-conversation] UPDATE received: {
  conversationId: "abc123...",
  new: {
    id: "abc123...",
    tenant_id: "xyz...",
    ia_active: false,      ✅
    pause_notes: "Pausado...",
    status: "open",
    // ... todas as colunas presentes
  }
}
```

### Comportamento da UI:
- Badge muda instantaneamente de "IA Ativada" (verde) → "IA Desativada" (cinza)
- Botão muda de "Pausar IA" → "Retomar IA"
- Toast exibe "IA pausada com sucesso"

---

## 📝 Arquivos Relacionados

- [lib/hooks/use-realtime-conversation.ts](../lib/hooks/use-realtime-conversation.ts) - Hook com logs
- [scripts/diagnose-realtime.sql](../scripts/diagnose-realtime.sql) - SQL de diagnóstico
- [components/livechat/conversation-header.tsx](../components/livechat/conversation-header.tsx) - UI que exibe status
- [app/api/conversations/pause-ia/route.ts](../app/api/conversations/pause-ia/route.ts) - API que faz UPDATE

---

**Autor:** Claude (Anthropic)
**Data:** 2025-11-22
**Status:** 🔧 Diagnóstico pronto para execução
