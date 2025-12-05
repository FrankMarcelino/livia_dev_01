# Notas de Implementação - Webhooks n8n

Notas importantes sobre a implementação dos webhooks n8n no LIVIA MVP.

---

## 1. Send Message (Enviar Mensagem)

**Webhook:** `/webhook/livia/send-message`

**Parâmetros:**
- `conversation_id` - ID da conversa
- `user_id` - Usuário logado no tenant
- `content` - Conteúdo da mensagem

**Fluxo de Implementação:**
1. **Salvar no banco PRIMEIRO**: Ao enviar uma mensagem manualmente, salvar imediatamente na tabela `messages`
2. **Realtime atualiza UI**: Por causa do Supabase Realtime, a tela do Livechat já será atualizada automaticamente
3. **Chamar n8n DEPOIS**: Mesmo assim, é necessário fazer a chamada ao n8n, porque é ele que está integrado ao mensageiro (WhatsApp) para que a mensagem de fato seja enviada para o app de mensagem do cliente

**Exemplo:**
```typescript
// 1. Salvar no banco
const { data: message } = await supabase.from('messages').insert({
  conversation_id,
  sender_type: 'attendant',
  sender_user_id: user_id,
  content,
  timestamp: new Date().toISOString()
});

// 2. UI já atualiza via Realtime

// 3. Chamar n8n para enviar ao WhatsApp
await fetch('/api/n8n/send-message', {
  method: 'POST',
  body: JSON.stringify({ conversation_id, user_id, content })
});
```

---

## 2. Sync Synapse (Publicar/Editar Synapse)

**Webhook:** `/webhook/livia/sync-synapse`

**Parâmetros:**
- `id` - ID da base de conhecimento
- `synapse_id` - ID da synapse
- `content` - Conteúdo da synapse

**Quando usar:**
- Ao **publicar** uma synapse (draft → publishing)
- Ao **republicar** uma synapse (editar conteúdo)
- Ao **desabilitar/remover** uma synapse

**Processo:**
1. n8n recebe a synapse
2. Divide o conteúdo em chunks
3. Gera embeddings (OpenAI)
4. Armazena na base vetorial externa
5. Atualiza status no Supabase

---

## 3. Neurocore Query (❌ Removido do MVP)

**Motivo:** É apenas CRUD no banco para salvar queries de teste.

**Implementação alternativa:**
- Query direta no Supabase para salvar/listar queries
- Não precisa integração com n8n no MVP
- Se necessário no futuro, adicionar webhook

---

## 4. Pause/Resume Conversation

**Webhooks:**
- `/webhook-test/pause_message_conversation` - Pausar conversa
- `/webhook/livia/resume-conversation` - Retomar conversa

**Parâmetros (pause):**
- `conversation_id` - ID da conversa
- `user_id` - Usuário logado no tenant
- `motivo` - Motivo da pausa (opcional)

**Parâmetros (resume):**
- `conversation_id` - ID da conversa
- `user_id` - Usuário logado no tenant

**Diferença entre Pause Conversation e Pause IA:**
- **Pause Conversation**: Para TUDO (IA para de responder + usuário marca como pausada)
- **Pause IA**: Apenas IA para, usuário continua atendendo manualmente

---

## 5. Pause/Resume IA (Conversa Específica)

**Webhooks:**
- `/webhook/livia/pause-ia` - Pausar IA em conversa específica
- `/webhook/livia/resume-ia` - Retomar IA em conversa específica

**Parâmetros (pause):**
- `conversation_id` - ID da conversa
- `user_id` - Usuário logado no tenant
- `motivo` - Motivo da pausa (opcional)

**Parâmetros (resume):**
- `conversation_id` - ID da conversa
- `user_id` - Usuário logado no tenant

**Comportamento:**
- Atualiza campo `ia_active` na tabela `conversations`
- Registra `ia_paused_by_user_id` e `ia_paused_at`
- n8n para de processar mensagens para esta conversa
- Usuário pode continuar atendendo manualmente

---

## 6. Pause/Resume IA (Tenant Completo)

**Conceito diferente:** Pausar IA em TODAS as conversas do tenant.

**Webhooks:**
- `/webhook/livia/pause-ia` (com `tenant_id` em vez de `conversation_id`)
- `/webhook/livia/resume-ia` (com `tenant_id` em vez de `conversation_id`)

**Parâmetros (pause):**
- `tenant_id` - ID do tenant
- `user_id` - Usuário logado no tenant
- `motivo` - Motivo da pausa (opcional)

**Parâmetros (resume):**
- `tenant_id` - ID do tenant
- `user_id` - Usuário logado no tenant

**Comportamento:**
- Atualiza TODAS as conversas do tenant (`ia_active = false`)
- n8n para de processar mensagens em TODAS conversas deste tenant
- Útil para emergências ou manutenção

---

## 7. Use Quick Reply (❌ Removido do MVP)

**Motivo:** É apenas CRUD no banco para incrementar contador.

**Implementação alternativa:**
```typescript
// Buscar template
const { data: template } = await supabase
  .from('quick_reply_templates')
  .select('*')
  .eq('id', quickReplyId)
  .single();

// Incrementar contador
await supabase
  .from('quick_reply_templates')
  .update({ usage_count: template.usage_count + 1 })
  .eq('id', quickReplyId);

// Enviar mensagem (reutilizar send-message)
await fetch('/api/n8n/send-message', {
  method: 'POST',
  body: JSON.stringify({
    conversation_id,
    user_id,
    content: template.content
  })
});
```

---

## Callbacks do n8n

**URL do workflow atual:**
```
https://edit.ligeiratelecom.com.br/workflow/kgrBDQK5MEFnOBd2
```

**Endpoint de callback no frontend:**
```
POST /api/n8n/callback/[type]
```

**Autenticação:**
- Header: `x-n8n-secret` com valor de `N8N_CALLBACK_SECRET`

**Tipos de callback:**
- `synapse` - Conclusão de vetorização
- `message` - Confirmação de envio

---

## Variáveis de Ambiente Configuradas

```env
N8N_BASE_URL=https://edit.ligeiratelecom.com.br
N8N_PAUSE_CONVERSATION_WEBHOOK=/webhook-test/pause_message_conversation
```

**Nota:** O webhook de pause conversation está em um path diferente (`/webhook-test/...`) em vez de `/webhook/livia/...`

---

## Boas Práticas

1. **Sempre salvar no banco ANTES** de chamar n8n
2. **Confiar no Realtime** para atualizar UI
3. **Validar tenant_id** antes de qualquer operação
4. **Usar API Routes** como proxy (nunca expor URLs n8n no client)
5. **Implementar retry** para chamadas n8n que falharem
6. **Logar todas as chamadas** para debugging

---

## Fluxo Recomendado para Mensagens

```
1. Usuário clica em "Enviar"
2. Frontend → API Route /api/n8n/send-message
3. API Route valida autenticação e tenant_id
4. API Route insere em messages (Supabase)
5. Supabase Realtime → Frontend (UI atualiza)
6. API Route → n8n webhook (envia ao WhatsApp)
7. n8n → WhatsApp Business API
8. WhatsApp entrega mensagem ao cliente
```

---

Documentação baseada nas notas originais do arquivo `.env.local`.
