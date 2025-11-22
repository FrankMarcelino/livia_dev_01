# Otimização do Envio de Mensagens - Análise e Correções

**Data:** 2025-11-21
**Status:** ✅ Concluído

---

## 🔍 Problemas Identificados

### 1. **Fetch sem Timeout** ⏱️

**Arquivo:** [lib/n8n/client.ts:27](../lib/n8n/client.ts#L27)

**Problema:**
```typescript
// ❌ ANTES: Sem timeout, poderia esperar infinitamente
const response = await fetch(`${N8N_BASE_URL}${webhookPath}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

**Impacto:** Se o n8n travasse ou tivesse latência alta, a requisição ficaria presa indefinidamente.

**Solução Aplicada:**
```typescript
// ✅ DEPOIS: Timeout de 10s (configurável) + AbortController
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);

const response = await fetch(`${N8N_BASE_URL}${webhookPath}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
  signal: controller.signal, // Cancela após timeout
});

clearTimeout(timeoutId);
```

---

### 2. **Múltiplas Queries Sequenciais** 🗄️

**Arquivo:** [app/api/n8n/send-message/route.ts:24-81](../app/api/n8n/send-message/route.ts#L24-L81)

**Problema:**
```typescript
// ❌ ANTES: 4 roundtrips ao banco antes de inserir a mensagem
Query 1: await supabase.auth.getUser()           // ~50-100ms
Query 2: await supabase.from('users').select()   // ~50-100ms
Query 3: await supabase.from('conversations')    // ~50-100ms
Query 4: await supabase.from('messages').insert() // ~50-100ms
// Total: ~200-400ms ANTES de chamar n8n
```

**Impacto:** Latência acumulada de ~200-400ms só em queries, ANTES mesmo de chamar o n8n.

**Solução Aplicada:**
```typescript
// ✅ DEPOIS: Reduzido para 3 queries (eliminou query de users)
Query 1: await supabase.auth.getUser()           // ~50-100ms
Query 2: await supabase.from('conversations')    // ~50-100ms (valida tenant)
Query 3: await supabase.from('messages').insert() // ~50-100ms
// Total: ~150-300ms (economia de 25-33%)

// Validação de tenant agora é feita direto na query de conversations:
.eq('tenant_id', tenantId) // Fail fast se tenant não bate
```

**Benefício:** Redução de 1 query = ~50-100ms de latência a menos.

---

### 3. **Função "Async" Não Verdadeiramente Assíncrona** 🔥

**Arquivo:** [app/api/n8n/send-message/route.ts:93](../app/api/n8n/send-message/route.ts#L93)

**Problema:**
```typescript
// ❌ ANTES: Chamada "assíncrona" mas ainda no mesmo contexto
sendToN8nAsync(...); // Não awaited, mas ainda bloqueia

// Problema: Em ambientes serverless (Vercel), quando a response
// é enviada, o contexto pode ser congelado, atrasando ou cancelando
// a execução da função assíncrona.
```

**Impacto:** Em produção (Vercel/serverless), a função poderia:
- Ser pausada/atrasada após a response
- Ter execução cancelada prematuramente
- Causar delay inesperado

**Solução Aplicada:**
```typescript
// ✅ DEPOIS: Desacoplamento completo via Promise.resolve()
Promise.resolve().then(() => {
  sendToN8nAsync(
    message.id,
    conversationId,
    content.trim(),
    tenantId,
    user.id,
    conversation.contact_id,
    conversation.channel_id
  );
});

// Isso garante que a chamada n8n rode em um microtask separado,
// APÓS a response ser enviada, sem bloquear o cliente.
```

**Benefício:** Chamada n8n realmente assíncrona, não bloqueia a response HTTP.

---

### 4. **Status como TEXT sem Constraint ENUM** 📊

**Arquivo:** `migrations/add-message-status.sql`

**Problema:**
```sql
-- ❌ ANTES: TEXT com CHECK constraint
ALTER TABLE messages
ADD COLUMN status TEXT DEFAULT 'sent'
CHECK (status IN ('pending', 'sent', 'failed', 'read'));
```

**Impacto:**
- Integridade de dados fraca (CHECK pode ser desabilitado)
- Performance subótima (comparação de strings)
- Não é autoexplicativo que N8N deve atualizar

**Solução Aplicada:**
```sql
-- ✅ DEPOIS: ENUM type nativo do PostgreSQL
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'failed', 'read');

ALTER TABLE messages
ALTER COLUMN status TYPE message_status
USING (status::message_status);

ALTER TABLE messages
ALTER COLUMN status SET DEFAULT 'pending'::message_status;

COMMENT ON COLUMN messages.status IS
'Message delivery status (ENUM). N8N is responsible for updating this field.';
```

**Benefícios:**
- ✅ Validação nativa do banco
- ✅ Performance superior (comparação de inteiros internamente)
- ✅ Type safety melhorado
- ✅ Documentação clara no schema

---

## 🚀 Melhorias Implementadas

### 1. **Logs de Performance**

```typescript
// Agora a API loga tempo de execução de cada fase
const startTime = Date.now();

// ... operações de banco ...

const dbTime = Date.now() - startTime;
console.log(`[send-message] DB operations took ${dbTime}ms`);

// ... response ...

const totalTime = Date.now() - startTime;
console.log(`[send-message] Total response time: ${totalTime}ms`);
```

**Benefício:** Fácil monitoramento de onde está o gargalo.

---

### 2. **Timeout Configurável para N8N**

```typescript
// Timeout padrão reduzido para 5s (era 10s)
const result = await callN8nWebhook(
  N8N_SEND_MESSAGE_WEBHOOK,
  payload,
  { timeout: 5000 } // 5 segundos máximo
);
```

**Benefício:** Fail fast - se n8n demorar mais que 5s, aborta e marca como failed.

---

### 3. **Logs Detalhados de N8N**

```typescript
// Logs completos do tempo de resposta do n8n
const n8nStartTime = Date.now();

console.log(`[n8n-async] Calling n8n for message ${messageId.slice(0, 8)}...`);

// ... chamada n8n ...

const n8nTime = Date.now() - n8nStartTime;

if (result.success) {
  console.log(`[n8n-async] N8N responded successfully in ${n8nTime}ms`);
} else {
  console.error(`[n8n-async] N8N failed after ${n8nTime}ms:`, result.error);
}
```

**Benefício:** Visibilidade completa de quanto tempo o n8n leva para responder.

---

## 📈 Resultados Esperados

### Antes das Otimizações
```
┌─────────────────────┬─────────┐
│ Fase                │ Tempo   │
├─────────────────────┼─────────┤
│ Parse body          │ ~10ms   │
│ getUser()           │ ~50ms   │
│ SELECT users        │ ~50ms   │ ← Removido
│ SELECT conversation │ ~50ms   │
│ INSERT message      │ ~50ms   │
│ Aguardar n8n        │ ~500ms+ │ ← Bloqueante
├─────────────────────┼─────────┤
│ TOTAL               │ ~710ms+ │
└─────────────────────┴─────────┘
```

### Depois das Otimizações
```
┌─────────────────────┬─────────┐
│ Fase                │ Tempo   │
├─────────────────────┼─────────┤
│ Parse body          │ ~10ms   │
│ getUser()           │ ~50ms   │
│ SELECT conversation │ ~50ms   │ ✅ Valida tenant direto
│ INSERT message      │ ~50ms   │
│ Response HTTP       │ ~10ms   │
├─────────────────────┼─────────┤
│ TOTAL (cliente)     │ ~170ms  │ ✅ 76% mais rápido
├─────────────────────┼─────────┤
│ N8N (background)    │ ~500ms+ │ ✅ Não bloqueia
└─────────────────────┴─────────┘
```

**Ganho:** De ~710ms para ~170ms = **redução de 76% na latência percebida**

---

## 🎯 Checklist de Deploy

- [x] Criar ENUM `message_status` no banco
- [x] Atualizar coluna `messages.status` para usar ENUM
- [x] Adicionar timeout ao fetch do n8n
- [x] Otimizar queries da API route
- [x] Implementar logs de performance
- [x] Desacoplar chamada n8n da response HTTP
- [ ] **Executar migration no Supabase** (ver [MIGRATION_003_STATUS_ENUM.md](./MIGRATION_003_STATUS_ENUM.md))
- [ ] Regenerar types do Supabase (`npm run supabase:types`)
- [ ] Testar envio de mensagem em produção
- [ ] Monitorar logs de performance (`[send-message]` e `[n8n-async]`)

---

## 🔧 Como Debugar Delay no N8N

Se ainda houver delay após essas otimizações, verifique:

### 1. **Logs da API Route**
```bash
# Procurar por logs de performance
grep "[send-message]" /var/log/app.log
grep "[n8n-async]" /var/log/app.log
```

**Exemplo de saída esperada:**
```
[send-message] DB operations took 145ms
[send-message] Total response time: 167ms
[n8n-async] Calling n8n for message a1b2c3d4...
[n8n-async] N8N responded successfully in 423ms
```

### 2. **Verificar se N8N está recebendo o POST**

No workflow do n8n, adicione um nó "Debug" logo após o webhook:
- Timestamp de entrada
- Tempo de processamento
- Timestamp de saída

### 3. **Verificar Latência de Rede**

```bash
# Testar latência para o n8n
time curl -X POST https://edit.ligeiratelecom.com.br/webhook/send_message \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### 4. **Verificar se N8N está processando de forma síncrona**

O n8n pode estar:
- Enviando para WhatsApp de forma síncrona (bloqueante)
- Fazendo queries lentas no banco
- Aguardando confirmação da API do WhatsApp

**Solução:** Configurar n8n para:
1. Receber webhook → Responder HTTP 200 imediatamente
2. Processar envio para WhatsApp em background
3. Atualizar status da mensagem via UPDATE assíncrono

---

## 📝 Arquivos Modificados

| Arquivo | Mudanças |
|---------|----------|
| [lib/n8n/client.ts](../lib/n8n/client.ts) | ✅ Timeout + AbortController |
| [app/api/n8n/send-message/route.ts](../app/api/n8n/send-message/route.ts) | ✅ Queries otimizadas + logs + async desacoplado |
| [migrations/003_message_status_enum.sql](../migrations/003_message_status_enum.sql) | ✅ ENUM type criado |

---

## 🎉 Próximos Passos

1. **Executar migration** no Supabase (ver [instruções](./MIGRATION_003_STATUS_ENUM.md))
2. **Monitorar logs** em produção para ver tempos reais
3. **Otimizar n8n** se ainda houver delay (processar webhook de forma assíncrona)
4. **Configurar queue** (Redis/BullMQ) se necessário para alta carga

---

**Autor:** Claude (Anthropic)
**Data:** 2025-11-21
**Status:** ✅ Pronto para Deploy
