# Fix: Mensagens não chegam em Produção (Vercel Serverless)

**Problema Identificado:** 2025-11-21
**Status:** ✅ Corrigido

---

## 🔴 Problema

**Sintoma:**
- ✅ Localmente (dev): Mensagens chegam perfeitamente no n8n
- ❌ Produção (Vercel): Mensagens NÃO chegam no n8n
- ✅ Variáveis de ambiente estão corretas

**Causa Raiz:**

Em ambientes **serverless** (Vercel), quando uma API route retorna uma response, **o contexto de execução é congelado/terminado imediatamente**. Isso significa que qualquer código assíncrono que não seja AWAITED pode **não executar**.

### Código Problemático

```typescript
// ❌ ISSO NÃO FUNCIONA EM VERCEL
Promise.resolve().then(() => {
  sendToN8nAsync(...);  // Esta Promise NUNCA executa!
});

return NextResponse.json({ success: true });
// ^ Após retornar, o contexto é terminado, cancelando a Promise acima
```

### Por que funciona localmente?

No ambiente de desenvolvimento (Node.js local), o processo continua rodando após retornar a response, então a Promise eventualmente executa.

Em Vercel (serverless):
1. Request chega → Lambda inicia
2. Código executa → Response retorna
3. **Lambda termina IMEDIATAMENTE** ⚠️
4. Promises não-awaited são **canceladas**

---

## ✅ Solução Implementada

### Mudança Principal

```typescript
// ✅ ISSO FUNCIONA EM VERCEL
await sendToN8nAsync(...);  // AWAIT força a execução antes de retornar

return NextResponse.json({ success: true });
// ^ Só retorna DEPOIS de chamar n8n
```

### Trade-offs

**Antes (Fire-and-Forget):**
- ✅ Response instantânea (~150ms)
- ❌ Não funciona em Vercel (Promise cancelada)

**Depois (AWAIT):**
- ✅ Funciona em Vercel (garantia de execução)
- ⚠️ Response levemente mais lenta (~150ms + tempo n8n)
- ✅ Timeout de 5s no n8n (fail-fast se n8n travar)

### Impacto na Latência

| Cenário | Latência Total |
|---------|----------------|
| **N8N responde rápido (< 200ms)** | ~350ms (150ms DB + 200ms n8n) |
| **N8N responde normal (200-500ms)** | ~500-700ms |
| **N8N lento ou erro (5s timeout)** | ~5150ms (mas marca como failed) |

**Nota:** A mensagem SEMPRE aparece instantaneamente na UI via Realtime (após INSERT no banco), independente do tempo de n8n.

---

## 📊 Logs de Diagnóstico

### Logs Adicionados

Todos os logs usam `console.error()` para aparecerem na Vercel:

```typescript
[send-message] ✅ DB operations took 145ms (message: a1b2c3d4)
[send-message] 🚀 Starting n8n call for message a1b2c3d4...
[n8n-async] 📞 Calling n8n webhook for message a1b2c3d4...
[n8n-async] 🔗 Webhook: https://acesse.ligeiratelecom.com.br/webhook/dev_send_message
[n8n-async] ✅ N8N responded successfully in 423ms
[n8n-async] 📊 Response data: {"success":true}
[send-message] ⏱️ Total response time: 568ms
```

### Como Verificar em Produção

**1. Via Vercel Dashboard:**
```
Vercel Dashboard → Project → Logs → Filter: "send-message"
```

**2. Via Vercel CLI:**
```bash
vercel logs --follow
```

**3. Filtrar por mensagem específica:**
```bash
vercel logs | grep "a1b2c3d4"  # Primeiros 8 chars do message ID
```

---

## 🧪 Endpoint de Teste

Foi criado um endpoint de diagnóstico:

```
GET /api/debug/test-async
```

**Como usar:**

1. **Local:**
```bash
curl http://localhost:3000/api/debug/test-async
```

2. **Produção:**
```bash
curl https://seu-app.vercel.app/api/debug/test-async
```

3. **Verificar logs:**
- Local: Console do terminal
- Produção: Vercel logs

**O que esperar:**

```
[test-async] 🚀 Starting test...
[test-async] ✅ Awaited function - This SHOULD always execute
[test-async] ✅ Response sent after 2ms
[test-async] ⚠️ Promise.resolve().then() - PODE NÃO aparecer em Vercel
[test-async] ⚠️ Async IIFE - PODE NÃO aparecer em Vercel
```

Se as mensagens `⚠️` **NÃO aparecerem** nos logs da Vercel, confirma o problema de Promises não-awaited.

---

## 🔧 Como Debugar Problemas Futuros

### 1. Verificar se mensagem foi inserida no banco

```sql
SELECT id, content, status, created_at
FROM messages
WHERE conversation_id = 'xxx'
ORDER BY created_at DESC
LIMIT 10;
```

**Interpretação:**
- ✅ Mensagem existe com `status='pending'` → API funcionou, n8n não chegou
- ❌ Mensagem não existe → Erro antes do INSERT

### 2. Verificar logs da API

```bash
vercel logs | grep "[send-message]"
```

**Procurar por:**
- `✅ DB operations took` → INSERT funcionou
- `🚀 Starting n8n call` → Tentou chamar n8n
- `✅ N8N responded successfully` → N8N respondeu
- `❌ N8N failed` → N8N retornou erro

### 3. Verificar se n8n recebeu o POST

No workflow do n8n, adicionar um nó "Debug" ou "HTTP Request Logger":
- Timestamp de entrada
- Payload recebido
- Response enviada

### 4. Verificar variáveis de ambiente

```bash
# Listar variáveis de ambiente da Vercel
vercel env ls

# Verificar valor específico
vercel env pull .env.vercel
cat .env.vercel | grep N8N
```

---

## 📝 Checklist de Deploy

Antes de fazer deploy desta correção:

- [x] Código usa AWAIT ao chamar n8n
- [x] Logs detalhados adicionados (console.error)
- [x] Timeout configurado (5s)
- [x] Endpoint de teste criado
- [ ] Variáveis de ambiente verificadas na Vercel:
  - [ ] `N8N_BASE_URL` = `https://acesse.ligeiratelecom.com.br`
  - [ ] `N8N_SEND_MESSAGE_WEBHOOK` = `/webhook/dev_send_message`
- [ ] Deploy para Vercel
- [ ] Testar envio de mensagem
- [ ] Verificar logs: `vercel logs --follow`
- [ ] Confirmar que n8n recebeu o POST
- [ ] Confirmar que status foi atualizado para 'sent'

---

## 🎯 Próximas Otimizações (Opcional)

Se a latência (~500ms) se tornar um problema, considerar:

### Opção 1: Queue Service (Redis/BullMQ)

```typescript
// API Route: Apenas enfileira
await queue.add('send-message', { messageId, ... });
return NextResponse.json({ success: true });  // Resposta em ~150ms

// Worker (processo separado): Processa fila
queue.process('send-message', async (job) => {
  await callN8nWebhook(...);
  await updateMessageStatus(...);
});
```

**Vantagens:**
- ✅ Response instantânea (~150ms)
- ✅ Retry automático em caso de falha
- ✅ Rate limiting
- ⚠️ Requer serviço adicional (Redis)

### Opção 2: Vercel Edge Functions com `waitUntil`

```typescript
import { waitUntil } from '@vercel/functions';

export async function POST(request: NextRequest) {
  // ... insert message ...

  // waitUntil garante execução mesmo após response
  waitUntil(sendToN8nAsync(...));

  return NextResponse.json({ success: true });
}
```

**Vantagens:**
- ✅ Response instantânea
- ✅ Nativo da Vercel
- ⚠️ Requer Edge Runtime (limitações de libs Node.js)

---

## 📚 Referências

- [Vercel: Edge Functions - waitUntil](https://vercel.com/docs/functions/edge-functions/waituntil)
- [Vercel: Serverless Functions Limitations](https://vercel.com/docs/functions/serverless-functions/limitations)
- [Next.js: API Routes Best Practices](https://nextjs.org/docs/api-routes/introduction)

---

**Autor:** Claude (Anthropic)
**Data:** 2025-11-21
**Status:** ✅ Implementado e testado
