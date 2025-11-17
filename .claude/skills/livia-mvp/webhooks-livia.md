# Webhooks n8n - LIVIA MVP WhatsApp

Documentação completa dos webhooks n8n específicos do projeto LIVIA (versão simplificada para MVP).

---

## Visão Geral

**Arquitetura:**
```
Frontend → API Route → n8n Webhook → Workflow → Callback (opcional)
```

**Regras:**
- NUNCA expor URLs de webhooks n8n diretamente no frontend
- Sempre usar API Routes como proxy
- Validar autenticação e tenant_id antes de chamar n8n
- Implementar callbacks para operações assíncronas

**MVP Simplificado:**
- ✅ **6 webhooks necessários** - Integração com WhatsApp e IA
- ❌ **2 webhooks removidos** - Substituídos por CRUD direto no Supabase
  - `neurocore-query` - Query de treinamento (CRUD no banco)
  - `use-quick-reply` - Uso de respostas rápidas (incrementar contador)

**Veja decisão arquitetural:** [DECISIONS.md - Decisão #005](../../../DECISIONS.md)

---

## Webhooks LIVIA (MVP WhatsApp)

### 1. Enviar Mensagem Manual

**Webhook n8n:**
```
POST https://n8n.example.com/webhook/livia/send-message
```

**API Route:**
```typescript
// app/api/n8n/send-message/route.ts
POST /api/n8n/send-message
```

**Payload:**
```typescript
{
  conversationId: string;
  content: string;
  tenantId: string;
  userId: string;
  channelId: string;
}
```

**Resposta:**
```typescript
{
  success: boolean;
  messageId: string;
  timestamp: string;
}
```

**Fluxo n8n:**
1. Recebe payload
2. Valida tenant/conversation
3. Envia mensagem ao provedor (WhatsApp, Instagram, etc)
4. Insere em `messages` table
5. Retorna confirmação

**Exemplo de chamada:**
```typescript
const response = await fetch('/api/n8n/send-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: 'conv-uuid',
    content: 'Olá! Como posso ajudar?',
    tenantId: 'tenant-uuid',
    userId: 'user-uuid',
    channelId: 'channel-uuid'
  })
});
```

---

### 2. Sincronizar Synapse

**Webhook n8n:**
```
POST https://n8n.example.com/webhook/livia/sync-synapse
```

**API Route:**
```typescript
POST /api/synapses/:id/sync
```

**Ações Suportadas:**
- `publish` - Publicar synapse (criar embeddings)
- `update` - Atualizar synapse (recriar embeddings)
- `disable` - Desabilitar temporariamente
- `enable` - Reabilitar
- `delete` - Remover permanentemente

**Payload:**
```typescript
{
  synapseId: string;
  action: 'publish' | 'update' | 'disable' | 'enable' | 'delete';
  tenantId: string;
  baseConhecimentoId: string;
  data?: {
    title?: string;
    content?: string;
    description?: string;
    image_url?: string;
  };
}
```

**Fluxo n8n (action: publish):**
1. Recebe synapse
2. Divide `content` em chunks
3. Gera embeddings (OpenAI ada-002)
4. Insere em `synapse_embeddings`
5. Atualiza `synapses.status = 'publishing'`
6. Callback para API Route com sucesso/erro

**Fluxo n8n (action: update):**
1. Deleta embeddings antigos (`synapse_id = X`)
2. Divide novo `content` em chunks
3. Gera novos embeddings
4. Insere em `synapse_embeddings`
5. Callback de sucesso

**Fluxo n8n (action: delete):**
1. Deleta embeddings (`synapse_id = X`)
2. Deleta synapse do banco
3. Callback de sucesso

**Callback:**
```typescript
POST /api/n8n/callback/synapse

{
  synapseId: string;
  status: 'success' | 'error';
  error?: string;
}
```

---

### 3. Pausar Conversa

**Webhook n8n:**
```
POST https://n8n.example.com/webhook/livia/pause-conversation
```

**API Route:**
```typescript
POST /api/conversations/:id/pause
```

**Payload:**
```typescript
{
  conversationId: string;
  pauseReasonId?: string;
  notes?: string;
  userId: string;
  tenantId: string;
}
```

**Resposta:**
```typescript
{
  success: boolean;
  conversation: {
    id: string;
    status: 'paused';
  };
}
```

**Fluxo:**
1. UPDATE `conversations` SET `status = 'paused'`
2. INSERT `conversation_state_history`
3. Notificar via Realtime

---

### 4. Retomar Conversa

**Webhook n8n:**
```
POST https://n8n.example.com/webhook/livia/resume-conversation
```

**API Route:**
```typescript
POST /api/conversations/:id/resume
```

**Payload:**
```typescript
{
  conversationId: string;
  userId: string;
  tenantId: string;
}
```

**Resposta:**
```typescript
{
  success: boolean;
  conversation: {
    id: string;
    status: 'open';
  };
}
```

---

### 5. Pausar IA (Conversa Específica)

**Webhook n8n:**
```
POST https://n8n.example.com/webhook/livia/pause-ia
```

**API Route:**
```typescript
POST /api/conversations/:id/pause-ia
```

**Payload:**
```typescript
{
  conversationId: string;
  userId: string;
  tenantId: string;
  reason?: string;
}
```

**Fluxo:**
1. UPDATE `conversations` SET
   - `ia_active = false`
   - `ia_paused_by_user_id = userId`
   - `ia_paused_at = now()`
   - `ia_pause_reason = reason`
2. INSERT `conversation_state_history`

**Diferença de "Pausar Conversa":**
- Pausar Conversa: Para TUDO (IA + usuário)
- Pausar IA: IA para, usuário continua atendendo manualmente

---

### 6. Retomar IA (Conversa Específica)

**Webhook n8n:**
```
POST https://n8n.example.com/webhook/livia/resume-ia
```

**API Route:**
```typescript
POST /api/conversations/:id/resume-ia
```

**Payload:**
```typescript
{
  conversationId: string;
  userId: string;
  tenantId: string;
}
```

**Fluxo:**
1. UPDATE `conversations` SET
   - `ia_active = true`
   - `ia_paused_by_user_id = null`
   - `ia_paused_at = null`
   - `ia_pause_reason = null`
2. INSERT `conversation_state_history`

---

## Webhooks Removidos do MVP (CRUD no Banco)

### ❌ Query Neurocore (Treinamento)
**Motivo:** Operação de CRUD no banco, não precisa integração n8n no MVP
**Alternativa:** Query direta no Supabase para salvar/listar queries de teste

### ❌ Usar Quick Reply
**Motivo:** Apenas incrementar contador `usage_count` no banco
**Alternativa:** UPDATE direto na tabela `quick_reply_templates`

---

## Webhooks de Callback (Incoming)

### 7. Webhook de Mensagem Recebida (Callback do Canal)

**Webhook n8n:**
```
POST https://n8n.example.com/webhook/livia/incoming-message
```

**Quem chama:** Provedor de canal (WhatsApp, Instagram, etc)

**Payload (varia por provedor):**
```typescript
{
  channelId: string;
  externalContactId: string;
  externalMessageId: string;
  content: string;
  timestamp: string;
  metadata?: {
    type: 'text' | 'image' | 'video' | 'audio';
    mediaUrl?: string;
  };
}
```

**Fluxo n8n:**
1. Identifica/cria `contact` (por `externalContactId`)
2. Identifica/cria `conversation`
3. Insere `message` (sender_type = 'customer')
4. Verifica `conversation.ia_active`
5. Se `ia_active = true`:
   - Gera resposta da IA (query neurocore)
   - Envia resposta ao cliente
   - Insere `message` (sender_type = 'ai')

---

## Queries Diretas no Supabase (Sem n8n)

### 8. Listar Mensagens (Histórico)

**API Route:**
```typescript
GET /api/conversations/:id/messages
```

**Query Params:**
```typescript
{
  limit?: number; // Default: 50
  offset?: number; // Default: 0
  before?: string; // timestamp
  after?: string; // timestamp
}
```

**Resposta:**
```typescript
{
  messages: Array<{
    id: string;
    conversation_id: string;
    sender_type: 'customer' | 'attendant' | 'ai' | 'system';
    sender_user_id?: string;
    sender_agent_id?: string;
    content: string;
    timestamp: string;
    feedback_type?: 'like' | 'dislike';
    feedback_text?: string;
  }>;
  total: number;
  hasMore: boolean;
}
```

**Fluxo:**
Busca direto no Supabase (sem passar por n8n para leitura simples).

---

### 9. Buscar Contatos com Conversas

**API Route:**
```typescript
GET /api/contacts
```

**Query Params:**
```typescript
{
  search?: string; // Busca por nome/phone
  status?: 'open' | 'with_ai' | 'paused' | 'closed';
  limit?: number;
  offset?: number;
}
```

**Resposta:**
```typescript
{
  contacts: Array<{
    id: string;
    name: string;
    phone: string;
    email?: string;
    status: string;
    last_interaction_at: string;
    activeConversations: Array<{
      id: string;
      status: 'open' | 'paused' | 'closed';
      ia_active: boolean;
      last_message: {
        content: string;
        timestamp: string;
        sender_type: string;
      };
    }>;
  }>;
  total: number;
}
```

**Fluxo:**
Busca direto no Supabase (Server Component ou API Route).

---

## Variáveis de Ambiente

```env
# n8n Webhooks Base URL
N8N_BASE_URL=https://n8n.example.com

# n8n Webhooks LIVIA (MVP WhatsApp - 6 webhooks necessários)
N8N_SEND_MESSAGE_WEBHOOK=/webhook/livia/send-message
N8N_SYNC_SYNAPSE_WEBHOOK=/webhook/livia/sync-synapse
N8N_PAUSE_CONVERSATION_WEBHOOK=/webhook/livia/pause-conversation
N8N_RESUME_CONVERSATION_WEBHOOK=/webhook/livia/resume-conversation
N8N_PAUSE_IA_WEBHOOK=/webhook/livia/pause-ia
N8N_RESUME_IA_WEBHOOK=/webhook/livia/resume-ia

# n8n Callback Configuration
N8N_CALLBACK_SECRET=your-random-secret-key
N8N_CALLBACK_BASE_URL=https://livia-app.example.com/api/n8n/callback
```

**Webhooks removidos do MVP:**
- ❌ `N8N_NEUROCORE_QUERY_WEBHOOK` - CRUD no banco
- ❌ `N8N_USE_QUICK_REPLY_WEBHOOK` - CRUD no banco

---

## Template de API Route

```typescript
// app/api/n8n/[action]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const N8N_BASE_URL = process.env.N8N_BASE_URL!;
const WEBHOOK_PATH = process.env.N8N_[ACTION]_WEBHOOK!;

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validar payload
    const body = await request.json();
    const { tenantId, ...rest } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    // 3. Validar tenant do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userData?.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Chamar webhook n8n
    const n8nResponse = await fetch(`${N8N_BASE_URL}${WEBHOOK_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...rest,
        tenantId,
        userId: user.id,
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n error: ${n8nResponse.status}`);
    }

    const data = await n8nResponse.json();

    // 5. Retornar resposta
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error calling n8n:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Callbacks do n8n

Quando n8n precisa notificar o frontend sobre conclusão assíncrona:

**Endpoint de Callback:**
```typescript
// app/api/n8n/callback/[type]/route.ts
POST /api/n8n/callback/synapse
POST /api/n8n/callback/message
```

**Autenticação:**
```typescript
// Usar shared secret
const N8N_CALLBACK_SECRET = process.env.N8N_CALLBACK_SECRET!;

if (request.headers.get('x-n8n-secret') !== N8N_CALLBACK_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Payload de Callback:**
```typescript
{
  type: 'synapse' | 'message';
  id: string; // ID do recurso
  status: 'success' | 'error';
  error?: string;
  data?: any;
}
```

**Ação:**
1. Validar secret
2. Atualizar registro no Supabase
3. Supabase Realtime notifica frontend automaticamente

---

## Timeouts e Retry

```typescript
// Para operações longas (geração de embeddings)
export const maxDuration = 60; // 60 segundos

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 55000);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ...
  });
  clearTimeout(timeoutId);
} catch (error) {
  if (error.name === 'AbortError') {
    return NextResponse.json({ error: 'Timeout' }, { status: 504 });
  }
  throw error;
}
```

---

## Logs e Monitoramento

```typescript
// Logar todas as chamadas para n8n
console.log('[n8n]', {
  webhook: WEBHOOK_PATH,
  tenantId,
  userId,
  timestamp: new Date().toISOString(),
});

// Em produção, usar serviço de logs (Sentry, Datadog, etc)
```

---

Documentação completa dos webhooks LIVIA! 🚀
