# Implementação N8N: Pause/Resume IA

**Data:** 2025-11-21 (Atualizado: 2025-11-22)
**Webhooks:** `/webhook/dev_pause_ia_conversation` e `/webhook/dev_resume_ia_conversation`

---

## 🎯 Objetivo

Implementar os webhooks no N8N para:
1. Pausar IA em uma conversa específica
2. Retomar IA em uma conversa específica

**Por que N8N?**
- ✅ Centraliza lógica de negócio
- ✅ Fácil adicionar side-effects (notificações, integrações, etc)
- ✅ Consistente com arquitetura geral (send-message, etc)
- ✅ Usa schema existente (sem migrations extras)

---

## 📋 Webhook 1: Pause IA

### Endpoint
```
POST https://acesse.ligeiratelecom.com.br/webhook/dev_pause_ia_conversation
```

### Payload (recebido da API Route)
```json
{
  "conversationId": "uuid-da-conversa",
  "tenantId": "uuid-do-tenant",
  "userId": "uuid-do-usuario-que-pausou",
  "reason": "Pausado pelo atendente via Livechat"
}
```

### Fluxo do Workflow N8N

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Webhook Trigger                                          │
│    Recebe payload da API Route                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Validar Payload                                          │
│    IF conversationId AND tenantId AND userId                │
│    ELSE: return { success: false, error: "Missing params" } │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Buscar Estado Atual (Supabase Query)                     │
│                                                              │
│    SELECT id, ia_active, status                             │
│    FROM conversations                                        │
│    WHERE id = {{conversationId}}                            │
│      AND tenant_id = {{tenantId}}                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Validar Estado                                           │
│    IF NOT found: return { success: false, error: "404" }    │
│    IF ia_active = false: return { success: false, ... }     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. UPDATE Conversa (Supabase)                               │
│                                                              │
│    UPDATE conversations                                     │
│    SET ia_active = false,                                   │
│        pause_notes = {{reason}},                            │
│        updated_at = NOW()                                   │
│    WHERE id = {{conversationId}}                            │
│      AND tenant_id = {{tenantId}}                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Responder Sucesso                                        │
│    return { success: true, message: "IA pausada" }          │
└─────────────────────────────────────────────────────────────┘
```

### Resposta Esperada
```json
{
  "success": true,
  "message": "IA pausada com sucesso"
}
```

### Resposta em Caso de Erro
```json
{
  "success": false,
  "error": "Descrição do erro"
}
```

---

## 📋 Webhook 2: Resume IA

### Endpoint
```
POST https://acesse.ligeiratelecom.com.br/webhook/dev_resume_ia_conversation
```

### Payload (recebido da API Route)
```json
{
  "conversationId": "uuid-da-conversa",
  "tenantId": "uuid-do-tenant",
  "userId": "uuid-do-usuario-que-retomou"
}
```

### Fluxo do Workflow N8N

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Webhook Trigger                                          │
│    Recebe payload da API Route                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Validar Payload                                          │
│    IF conversationId AND tenantId AND userId                │
│    ELSE: return { success: false, error: "Missing params" } │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Buscar Estado Atual (Supabase Query)                     │
│                                                              │
│    SELECT id, ia_active, status                             │
│    FROM conversations                                        │
│    WHERE id = {{conversationId}}                            │
│      AND tenant_id = {{tenantId}}                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Validar Estado                                           │
│    IF NOT found: return { success: false, error: "404" }    │
│    IF ia_active = true: return { success: false, ... }      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. UPDATE Conversa (Supabase)                               │
│                                                              │
│    UPDATE conversations                                     │
│    SET ia_active = true,                                    │
│        pause_notes = NULL,                                  │
│        updated_at = NOW()                                   │
│    WHERE id = {{conversationId}}                            │
│      AND tenant_id = {{tenantId}}                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Responder Sucesso                                        │
│    return { success: true, message: "IA retomada" }         │
└─────────────────────────────────────────────────────────────┘
```

### Resposta Esperada
```json
{
  "success": true,
  "message": "IA retomada com sucesso"
}
```

---

## 🗄️ Colunas da Tabela conversations (Schema Existente)

**Importante:** Usamos colunas que JÁ EXISTEM no schema. Não precisa migration!

### Colunas Relevantes:
```sql
conversations (
  id UUID,
  tenant_id UUID,
  contact_id UUID,
  channel_id UUID,

  -- ✅ Status da IA (boolean)
  ia_active BOOLEAN DEFAULT true,

  -- ✅ Status da conversa (enum: open, paused, closed)
  status conversation_status_enum,

  -- ✅ Notas sobre pausa (texto livre)
  pause_notes TEXT,

  -- ✅ Motivo da pausa (FK - opcional)
  conversation_pause_reason_id UUID REFERENCES conversation_reasons_pauses_and_closures(id),

  -- ✅ Metadados
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ
)
```

**Observação:** O histórico de mudanças fica implícito no `updated_at` e pode ser rastreado via logs do N8N ou logs da aplicação.

---

## 🧪 Testes

### Teste 1: Pausar IA (Sucesso)

**Request:**
```bash
curl -X POST https://acesse.ligeiratelecom.com.br/webhook/dev_pause_ia_conversation \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "real-conversation-id",
    "tenantId": "real-tenant-id",
    "userId": "real-user-id",
    "reason": "Teste de pausa"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "IA pausada com sucesso"
}
```

**Validações:**
```sql
-- Verificar UPDATE em conversations
SELECT ia_active, pause_notes, updated_at
FROM conversations
WHERE id = 'real-conversation-id';

-- Expected: ia_active = false, pause_notes = 'Teste de pausa'
```

### Teste 2: Retomar IA (Sucesso)

**Request:**
```bash
curl -X POST https://acesse.ligeiratelecom.com.br/webhook/dev_resume_ia_conversation \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "real-conversation-id",
    "tenantId": "real-tenant-id",
    "userId": "real-user-id"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "IA retomada com sucesso"
}
```

**Validações:**
```sql
-- Verificar UPDATE em conversations
SELECT ia_active, pause_notes, updated_at
FROM conversations
WHERE id = 'real-conversation-id';

-- Expected: ia_active = true, pause_notes = NULL
```

### Teste 3: Pausar IA que Já Está Pausada (Erro)

**Request:**
```bash
curl -X POST https://acesse.ligeiratelecom.com.br/webhook/dev_pause_ia_conversation \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "already-paused-conversation-id",
    "tenantId": "real-tenant-id",
    "userId": "real-user-id",
    "reason": "Teste de erro"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "IA já está pausada"
}
```

---

## 🔧 Configuração do N8N

### Credenciais do Supabase

**Tipo:** Supabase
**Nome:** `LIVIA Supabase`

**Configuração:**
- Host: `wfrxwfbslhkkzkexyilx.supabase.co`
- Service Role Key: `eyJhbGc...` (pegar do .env.local)

### Nós Recomendados

1. **Webhook** (Trigger)
   - Method: POST
   - Path: `/webhook/dev_pause_ia_conversation`
   - Response Mode: Last Node

2. **IF** (Validação)
   - Condições para validar payload

3. **Supabase** (Query - Buscar conversa)
   - Operation: Execute Query
   - Query: `SELECT id, ia_active, status FROM conversations WHERE id = $1 AND tenant_id = $2`
   - Parameters: `[{{$json.conversationId}}, {{$json.tenantId}}]`

4. **IF** (Validar estado)
   - Verificar se ia_active = true (para pause) ou false (para resume)

5. **Supabase** (Update - Atualizar conversa)
   - Operation: Execute Query
   - Query: SQL do UPDATE acima

6. **Respond to Webhook**
   - Response: `{ success: true, message: "..." }`

---

## 📊 Logs e Monitoramento

### Logs da API Route (Next.js)

```bash
# Ver chamadas para N8N
grep "[pause-ia]" logs
grep "[resume-ia]" logs

# Verificar tempo de resposta
grep "Total time" logs | grep "pause-ia"
```

**Exemplo de log esperado:**
```
[pause-ia] ✅ Validation took 145ms (conversation: a1b2c3d4)
[pause-ia] 🚀 Calling n8n webhook...
[pause-ia] ✅ N8N responded successfully in 423ms
[pause-ia] ⏱️ Total time: 568ms
```

### Logs do N8N

Adicionar nós "Debug" em pontos-chave:
- Após receber payload
- Após buscar conversa
- Após UPDATE
- Após INSERT de auditoria

---

## ⚠️ Comportamento de Fallback

Se o N8N falhar (timeout, erro, etc), a API Route faz **fallback direto no banco**:

```typescript
// Fallback: UPDATE direto (SEM auditoria)
UPDATE conversations
SET ia_active = false,
    ia_paused_by_user_id = userId,
    ia_paused_at = NOW(),
    ia_pause_reason = reason
WHERE id = conversationId
```

**Consequência:**
- ✅ Funcionalidade continua funcionando
- ❌ **SEM registro em `conversation_state_history`**
- ⚠️ API retorna `warning: "Auditoria não registrada devido a falha no n8n"`

**Como identificar fallback nos logs:**
```bash
grep "🔄 Using fallback" logs
```

---

## 🎯 Próximos Passos

1. **Implementar workflows no N8N**
   - `/webhook/dev_pause_ia_conversation`
   - `/webhook/dev_resume_ia_conversation`

3. **Testar localmente**
```bash
# 1. Pausar IA
curl -X POST http://localhost:3000/api/conversations/pause-ia \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"conversationId": "...", "tenantId": "...", "reason": "teste"}'

# 2. Verificar logs
npm run dev | grep "pause-ia"
```

4. **Deploy e testar em produção**
```bash
# Verificar logs da Vercel
vercel logs --follow | grep "pause-ia"
```

---

**Autor:** Claude (Anthropic)
**Data:** 2025-11-21
**Status:** 📝 Pronto para implementação no N8N
