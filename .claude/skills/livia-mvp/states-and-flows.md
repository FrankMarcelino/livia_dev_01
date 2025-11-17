# Estados e Fluxos - LIVIA MVP

Documentação de máquinas de estado e fluxos de negócio do sistema LIVIA.

---

## 1. Estados de Conversa

### `conversation_status_enum`
```
'open' | 'paused' | 'closed'
```

### Diagrama de Estados

```
┌─────────┐
│  START  │
└────┬────┘
     │
     ▼
┌─────────┐   pause_by_user    ┌─────────┐
│  open   │───────────────────>│ paused  │
└─────────┘                     └─────────┘
     │                               │
     │                               │ resume
     │<──────────────────────────────┘
     │
     │ close_by_ia
     │ or
     │ close_by_user
     ▼
┌─────────┐
│ closed  │
└─────────┘
```

### Transições Permitidas

| De | Para | Ação | Quem Pode |
|----|------|------|-----------|
| `open` | `paused` | Pausar conversa | Usuário interno |
| `open` | `closed` | Encerrar | IA ou Usuário |
| `paused` | `open` | Retomar | Usuário interno |
| `paused` | `closed` | Encerrar | Usuário interno |
| `closed` | - | **FINAL** | - |

### Lógica de IA Ativa

```typescript
type ConversationState = {
  status: 'open' | 'paused' | 'closed';
  ia_active: boolean;
  ia_paused_by_user_id: string | null;
  ia_paused_at: Date | null;
};

// Estado 1: Conversa ativa com IA
{
  status: 'open',
  ia_active: true,
  ia_paused_by_user_id: null
}

// Estado 2: Conversa ativa, IA pausada manualmente
{
  status: 'open',
  ia_active: false,
  ia_paused_by_user_id: 'user-uuid',
  ia_paused_at: '2025-11-16T10:30:00Z'
}

// Estado 3: Conversa pausada (toda conversa)
{
  status: 'paused',
  ia_active: false, // IA também para
  conversation_pause_reason_id: 'reason-uuid'
}

// Estado 4: Conversa encerrada
{
  status: 'closed',
  ia_active: false,
  conversation_closure_reason_id: 'reason-uuid'
}
```

---

## 2. Estados de Synapse

### `synapse_status_enum`
```
'draft' | 'indexing' | 'publishing' | 'error'
```

### Diagrama de Estados

```
┌─────────┐
│  START  │
└────┬────┘
     │
     ▼
┌─────────┐   publish         ┌───────────┐
│  draft  │──────────────────>│ indexing  │
└─────────┘                    └───────────┘
     ▲                              │
     │                              │ n8n success
     │ unpublish                    ▼
     │                         ┌─────────────┐
     │                         │ publishing  │
     │                         └─────────────┘
     │                              │
     │                              │ is_enabled
     │                              │ toggle
     │                              ▼
     │                         ┌─────────────┐
     └─────────────────────────│  disabled   │
                               └─────────────┘
                                    │
                                    │ n8n error
┌───────┐                           │
│ error │<──────────────────────────┘
└───────┘
     │
     │ retry
     │
     ▼
┌───────────┐
│ indexing  │
└───────────┘
```

### Transições

| De | Para | Ação | Trigger |
|----|------|------|---------|
| `draft` | `indexing` | Publicar synapse | User clica "Publicar" |
| `indexing` | `publishing` | Indexação OK | n8n callback success |
| `indexing` | `error` | Erro na indexação | n8n callback error |
| `publishing` | `draft` | Despublicar | User clica "Despublicar" |
| `error` | `indexing` | Tentar novamente | User clica "Retry" |

### Campo Adicional: `is_enabled`

Independente do `status`, uma synapse pode ser desabilitada temporariamente:

```typescript
// Synapse publicada e ativa (IA usa)
{ status: 'publishing', is_enabled: true }

// Synapse publicada mas desabilitada (IA NÃO usa)
{ status: 'publishing', is_enabled: false }
```

---

## 3. Fluxo: Livechat - Pausar/Retomar IA

### Pausar IA em uma Conversa

```
┌──────────────────┐
│ User no Livechat │
└────────┬─────────┘
         │
         │ Clica "Pausar IA"
         ▼
┌────────────────────────────┐
│ Frontend: Dialog de Motivo │
└────────┬───────────────────┘
         │
         │ Seleciona motivo (opcional)
         ▼
┌──────────────────────────────────┐
│ POST /api/conversations/pause-ia │
└────────┬─────────────────────────┘
         │
         │ UPDATE conversations SET
         │   ia_active = false,
         │   ia_paused_by_user_id = user.id,
         │   ia_paused_at = now(),
         │   ia_pause_reason = 'motivo'
         ▼
┌───────────────────────────────────┐
│ INSERT conversation_state_history │
└────────┬──────────────────────────┘
         │
         │ from: ia_active=true
         │ to: ia_active=false
         ▼
┌─────────────────────────┐
│ Supabase Realtime Push  │
│ → Frontend atualiza UI  │
└─────────────────────────┘
```

### Retomar IA

```
┌──────────────────┐
│ User no Livechat │
└────────┬─────────┘
         │
         │ Clica "Retomar IA"
         ▼
┌───────────────────────────────────┐
│ POST /api/conversations/resume-ia │
└────────┬──────────────────────────┘
         │
         │ UPDATE conversations SET
         │   ia_active = true,
         │   ia_paused_by_user_id = null,
         │   ia_paused_at = null
         ▼
┌───────────────────────────────────┐
│ INSERT conversation_state_history │
└────────┬──────────────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Supabase Realtime Push   │
│ → IA volta a responder   │
└──────────────────────────┘
```

---

## 4. Fluxo: Envio de Mensagem Manual (Livechat)

```
┌──────────────────┐
│ User no Livechat │
└────────┬─────────┘
         │
         │ Digita mensagem e envia
         ▼
┌───────────────────────────────┐
│ POST /api/n8n/send-message    │
│                               │
│ Payload:                      │
│ - conversationId              │
│ - content                     │
│ - tenantId                    │
│ - userId                      │
└────────┬──────────────────────┘
         │
         │ API Route valida auth + tenant
         ▼
┌─────────────────────────────────┐
│ Chamar webhook n8n              │
│ /webhook/livia/send-message     │
└────────┬────────────────────────┘
         │
         │ n8n envia para canal (WhatsApp, etc)
         │ n8n registra no Supabase
         ▼
┌───────────────────────────────────┐
│ INSERT INTO messages (            │
│   conversation_id,                │
│   sender_type = 'attendant',      │
│   sender_user_id = user.id,       │
│   content                         │
│ )                                 │
└────────┬──────────────────────────┘
         │
         │ Supabase Realtime notifica
         ▼
┌─────────────────────────────────┐
│ Frontend recebe via Realtime    │
│ → Exibe mensagem no chat        │
└─────────────────────────────────┘
```

---

## 5. Fluxo: Publicar Synapse

```
┌────────────────────────────┐
│ User em Base Conhecimento  │
└────────┬───────────────────┘
         │
         │ Cria synapse (status: 'draft')
         │ Edita content, title, etc
         │ Clica "Publicar"
         ▼
┌───────────────────────────────────┐
│ POST /api/synapses/:id/publish    │
└────────┬──────────────────────────┘
         │
         │ UPDATE synapses SET
         │   status = 'indexing'
         ▼
┌──────────────────────────────────────┐
│ POST /webhook/n8n/sync-synapse       │
│                                      │
│ Payload:                             │
│ - synapseId                          │
│ - action: 'publish'                  │
│ - content                            │
│ - tenantId                           │
└────────┬─────────────────────────────┘
         │
         │ n8n processa:
         │ 1. Divide content em chunks
         │ 2. Gera embeddings (OpenAI)
         │ 3. Insere em synapse_embeddings
         ▼
┌────────────────────────────────────┐
│ INSERT INTO synapse_embeddings (   │
│   synapse_id,                      │
│   chunk_index,                     │
│   chunk_content,                   │
│   embedding                        │
│ )                                  │
└────────┬───────────────────────────┘
         │
         │ n8n callback para API Route
         ▼
┌───────────────────────────────────┐
│ POST /api/n8n/callback/synapse    │
│                                   │
│ Payload:                          │
│ - synapseId                       │
│ - status: 'success' | 'error'     │
└────────┬──────────────────────────┘
         │
         │ UPDATE synapses SET
         │   status = 'publishing' (ou 'error')
         ▼
┌──────────────────────────────┐
│ Supabase Realtime notifica   │
│ → Frontend atualiza status   │
└──────────────────────────────┘
```

---

## 6. Fluxo: Treinamento Neurocore (Query)

```
┌─────────────────────────────┐
│ User em Treinamento Neurocore│
└────────┬────────────────────┘
         │
         │ Digita pergunta
         ▼
┌────────────────────────────────────┐
│ POST /api/neurocore/query          │
│                                    │
│ Payload:                           │
│ - question                         │
│ - tenantId                         │
└────────┬───────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ POST /webhook/n8n/neurocore-query    │
│                                      │
│ Payload:                             │
│ - question                           │
│ - tenantId                           │
└────────┬─────────────────────────────┘
         │
         │ n8n:
         │ 1. Gera embedding da pergunta
         │ 2. Busca synapses similares (vector search)
         │ 3. Monta contexto
         │ 4. Chama LLM (GPT-4, Claude, etc)
         │ 5. Retorna resposta + synapses usadas
         ▼
┌──────────────────────────────────┐
│ Response {                       │
│   answer: "Resposta da IA",      │
│   synapsesUsed: [                │
│     { id, title, content, ... }, │
│     ...                          │
│   ]                              │
│ }                                │
└────────┬─────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Frontend exibe:                 │
│ - Resposta                      │
│ - Lista de synapses usadas      │
│ - Links para editar cada synapse│
└─────────────────────────────────┘
```

---

## 7. Fluxo: Editar Synapse do Treinamento

```
┌─────────────────────────────┐
│ User no Treinamento Neurocore│
│ vê synapse usada             │
└────────┬────────────────────┘
         │
         │ Clica "Editar" na synapse
         ▼
┌──────────────────────────────┐
│ Abre modal de edição         │
│ com conteúdo da synapse      │
└────────┬─────────────────────┘
         │
         │ Edita content
         │ Clica "Salvar"
         ▼
┌────────────────────────────────┐
│ PUT /api/synapses/:id          │
│                                │
│ Payload:                       │
│ - content (novo)               │
│ - title, description, etc      │
└────────┬───────────────────────┘
         │
         │ UPDATE synapses
         ▼
┌────────────────────────────────────┐
│ Dispara sync com n8n               │
│ POST /webhook/n8n/sync-synapse     │
│                                    │
│ action: 'update'                   │
└────────┬───────────────────────────┘
         │
         │ n8n:
         │ 1. Deleta embeddings antigos
         │ 2. Recria embeddings
         │ 3. Atualiza base vetorial
         ▼
┌──────────────────────────────┐
│ Callback de sucesso          │
│ → Synapse atualizada         │
└──────────────────────────────┘
```

---

## 8. Estados de Contact

### `contact_status_enum`
```
'open' | 'with_ai' | 'paused' | 'closed'
```

### Transições

```
┌──────┐   primeira_mensagem   ┌──────────┐
│ open │──────────────────────>│ with_ai  │
└──────┘                        └──────────┘
                                     │
                                     │ pause_conversation
                                     ▼
                                ┌────────┐
                                │ paused │
                                └────────┘
                                     │
                                     │ close_all_conversations
                                     ▼
                                ┌────────┐
                                │ closed │
                                └────────┘
```

---

## 9. Estados de Message

Mensagens não têm enum de estado, mas usam `sender_type`:

```typescript
type MessageSenderType =
  | 'customer'   // Cliente final
  | 'attendant'  // Usuário interno
  | 'ai'         // Agente de IA
  | 'system';    // Sistema (ex: "Conversa pausada")

// Validações:
// - sender_type = 'ai' → sender_agent_id NOT NULL
// - sender_type = 'attendant' → sender_user_id NOT NULL
// - sender_type = 'customer' → ambos NULL
// - sender_type = 'system' → ambos NULL
```

---

## 10. Regras de Negócio

### Pausar IA em Conversa

**Quem pode:**
- Usuários do tenant (role: 'user')

**Quando:**
- Conversa com `status = 'open'`
- `ia_active = true`

**Efeito:**
- `ia_active = false`
- `ia_paused_by_user_id = user.id`
- `ia_paused_at = now()`
- Registra em `conversation_state_history`

**IA para de responder:**
- n8n verifica `ia_active` antes de enviar resposta
- Se `false`, pula processamento de IA

---

### Retomar IA em Conversa

**Quem pode:**
- Usuários do tenant

**Quando:**
- Conversa com `ia_active = false`
- `ia_paused_by_user_id IS NOT NULL`

**Efeito:**
- `ia_active = true`
- `ia_paused_by_user_id = null`
- `ia_paused_at = null`
- Registra em `conversation_state_history`

---

### Publicar Synapse

**Quem pode:**
- Usuários do tenant com módulo 'knowledge_manager'

**Quando:**
- Synapse com `status = 'draft'`
- `content` não vazio

**Efeito:**
- `status = 'indexing'`
- Dispara webhook n8n
- n8n processa e atualiza para `status = 'publishing'`
- Embeddings criados em `synapse_embeddings`

---

### Desabilitar Synapse (Temporário)

**Diferença de Despublicar:**
- **Desabilitar**: `is_enabled = false` (mantém `status = 'publishing'`)
  - Embeddings permanecem na base
  - IA **não usa** nas respostas
  - Pode reabilitar instantaneamente

- **Despublicar**: `status = 'draft'`
  - Embeddings **removidos** da base vetorial
  - Precisa republicar para usar novamente

---

## 11. Validações de Estado

### Conversa

```typescript
// Não pode pausar conversa já pausada
if (conversation.status === 'paused') {
  throw new Error('Conversa já está pausada');
}

// Não pode retomar conversa não pausada
if (conversation.status !== 'paused') {
  throw new Error('Conversa não está pausada');
}

// Não pode pausar IA se já estiver pausada
if (!conversation.ia_active) {
  throw new Error('IA já está pausada nesta conversa');
}
```

### Synapse

```typescript
// Só pode publicar draft
if (synapse.status !== 'draft') {
  throw new Error('Synapse já foi publicada');
}

// Precisa ter conteúdo para publicar
if (!synapse.content || synapse.content.trim() === '') {
  throw new Error('Synapse precisa ter conteúdo para ser publicada');
}
```

---

## 12. Integração com Supabase Realtime

### Subscriptions Recomendadas

**Livechat:**
```typescript
// Novas mensagens na conversa
supabase
  .channel(`conversation:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, handleNewMessage)
  .subscribe();

// Mudanças de estado da conversa
supabase
  .channel(`conversation:${conversationId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'conversations',
    filter: `id=eq.${conversationId}`
  }, handleConversationUpdate)
  .subscribe();
```

**Base de Conhecimento:**
```typescript
// Mudanças em synapses
supabase
  .channel(`synapses:${tenantId}`)
  .on('postgres_changes', {
    event: '*', // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'synapses',
    filter: `tenant_id=eq.${tenantId}`
  }, handleSynapseChange)
  .subscribe();
```

---

Essa documentação cobre todos os estados e fluxos principais do LIVIA MVP! 🚀
