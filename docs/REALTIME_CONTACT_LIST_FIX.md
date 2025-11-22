# Fix: Realtime na Lista de Contatos/Conversas

**Data:** 2025-11-22
**Problema:** Lista de contatos na sidebar não atualizava em tempo real
**Status:** ✅ Implementado

---

## 🔍 Problema Identificado

### Sintomas

1. ❌ **Status da conversa não muda** na lista de contatos sem refresh
2. ❌ **Novas conversas não aparecem** automaticamente
3. ❌ **Mudanças em `ia_active` não refletem** na lista
4. ✅ **Área de mensagens funciona perfeitamente** (conversation-view)

### Causa Raiz

A arquitetura estava **sem Realtime na lista de contatos**:

```typescript
// ❌ ANTES: ContactList recebia prop estática do Server Component
<ContactList contacts={contacts} /> // Nunca atualiza!

// Server Component busca dados no servidor (executa 1x no page load)
const contacts = await getContactsWithConversations(tenantId);
```

**O que faltava:**
- Nenhum hook de Realtime subscrevendo mudanças em `conversations`
- Nenhum listener para novas conversas (INSERT)
- Nenhum listener para mudanças de status (UPDATE)
- Nenhum listener para novas mensagens (para atualizar timestamp)

---

## ✅ Solução Implementada

### 1. Novo Hook: `useRealtimeContactList`

Criado em [lib/hooks/use-realtime-contact-list.ts](../lib/hooks/use-realtime-contact-list.ts)

**Funcionalidades:**

#### a) Subscrição a Conversas (`conversations` table)

```typescript
// INSERT - Nova conversa criada
.on('INSERT', { table: 'conversations', filter: 'tenant_id=eq.{tenantId}' })
→ Busca contato relacionado
→ Adiciona à lista (ou atualiza conversa do contato existente)

// UPDATE - Status/ia_active mudou
.on('UPDATE', { table: 'conversations', filter: 'tenant_id=eq.{tenantId}' })
→ Atualiza conversa no state local
→ UI reflete mudança instantaneamente

// DELETE - Conversa removida (raro)
.on('DELETE', { table: 'conversations', filter: 'tenant_id=eq.{tenantId}' })
→ Remove conversa da lista
→ Remove contato se não tiver mais conversas
```

#### b) Subscrição a Mensagens (`messages` table)

```typescript
// INSERT - Nova mensagem (para atualizar timestamp)
.on('INSERT', { table: 'messages', filter: 'tenant_id=eq.{tenantId}' })
→ Atualiza `last_message_at` da conversa
→ Lista reordena automaticamente (conversas mais recentes no topo)
```

**Canais separados:**
- `tenant:{tenantId}:conversations` - Para mudanças em conversas
- `tenant:{tenantId}:messages` - Para novas mensagens

---

### 2. Modificações no `ContactList`

[components/livechat/contact-list.tsx](../components/livechat/contact-list.tsx)

**Mudanças:**

```diff
interface ContactListProps {
- contacts: ContactWithConversations[];
+ initialContacts: ContactWithConversations[]; // Renomeado
+ tenantId: string;                             // Novo
}

export function ContactList({
- contacts,
+ initialContacts,
+ tenantId,
  selectedContactId,
}: ContactListProps) {
+ // Hook de Realtime
+ const { contacts } = useRealtimeContactList(tenantId, initialContacts);

  // Resto do código usa 'contacts' (agora reativo!)
  const filteredContacts = contacts.filter(...);
}
```

**Fluxo:**
1. Server Component passa `initialContacts` (dados do SSR)
2. Hook inicializa state com `initialContacts`
3. Hook subscreve a mudanças via Realtime
4. State `contacts` é atualizado automaticamente
5. UI re-renderiza com novos dados

---

### 3. Modificações no `page.tsx`

[app/(dashboard)/livechat/page.tsx](../app/(dashboard)/livechat/page.tsx)

**Mudanças:**

```diff
<ContactList
- contacts={contacts}
+ initialContacts={contacts}
+ tenantId={tenantId}
  selectedContactId={selectedContactId}
/>
```

---

## 🔄 Fluxo Completo: Pausar IA

**Exemplo:** Atendente pausa IA em uma conversa

```
┌────────────────────────────────────────────────────────────┐
│ 1. Usuário: Clica "Pausar IA"                             │
│    components/livechat/conversation-header.tsx:28         │
└─────────────────────┬──────────────────────────────────────┘
                      │ POST /api/conversations/pause-ia
                      ↓
┌────────────────────────────────────────────────────────────┐
│ 2. API Route: Valida e chama N8N                          │
│    app/api/conversations/pause-ia/route.ts                │
└─────────────────────┬──────────────────────────────────────┘
                      │ POST /webhook/dev_pause_ia_conversation
                      ↓
┌────────────────────────────────────────────────────────────┐
│ 3. N8N: UPDATE conversations SET ia_active = false        │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ↓
┌────────────────────────────────────────────────────────────┐
│ 4. Supabase Realtime: Broadcast UPDATE event              │
└─────────┬────────────────────────┬─────────────────────────┘
          │                        │
          ↓                        ↓
┌──────────────────────┐  ┌──────────────────────────────────┐
│ 5a. conversation-view│  │ 5b. contact-list                 │
│                      │  │                                  │
│ useRealtimeConv...   │  │ useRealtimeContactList           │
│ ✅ Recebe UPDATE     │  │ ✅ Recebe UPDATE                 │
│                      │  │                                  │
│ Badge: "IA Pausada"  │  │ Status da conversa atualiza      │
│ Botão: "Retomar IA"  │  │ na lista (ambos os lugares!)     │
└──────────────────────┘  └──────────────────────────────────┘
```

**Resultado:**
- ✅ Badge na conversation-view muda
- ✅ Status na contact-list muda
- ✅ Ambos **SEM refresh**, em tempo real!

---

## 🧪 Como Testar

### Teste 1: Mudança de Status (Pausar/Retomar IA)

1. Abra Livechat em **2 abas do navegador** (ou 2 janelas)
2. Ambas logadas no mesmo tenant
3. Na aba 1: Selecione uma conversa
4. Na aba 2: Fique na lista de contatos (sem selecionar conversa)
5. **Ação:** Na aba 1, clique "Pausar IA"
6. **Resultado esperado:**
   - ✅ Aba 1: Badge muda para "IA Pausada"
   - ✅ Aba 2: Status na lista atualiza **instantaneamente**
7. **Ação:** Na aba 1, clique "Retomar IA"
8. **Resultado esperado:**
   - ✅ Aba 1: Badge muda para "IA Ativada"
   - ✅ Aba 2: Status na lista atualiza **instantaneamente**

**Logs esperados no console:**
```
[realtime-contact-list] ✅ Subscribed to conversations
[realtime-contact-list] ✅ Subscribed to messages
[realtime-contact-list] Conversation updated: {
  id: "abc123...",
  status: "open",
  ia_active: false
}
```

---

### Teste 2: Nova Conversa

**Pré-requisito:** N8N deve criar novas conversas via webhook

1. Abra Livechat
2. Mantenha lista de contatos visível
3. **Ação:** Envie mensagem para número novo via WhatsApp (simular novo cliente)
4. **Resultado esperado:**
   - ✅ Novo contato/conversa **aparece na lista automaticamente**
   - ✅ Sem precisar dar refresh

**Logs esperados:**
```
[realtime-contact-list] New conversation: xyz789...
```

---

### Teste 3: Nova Mensagem (Atualiza Timestamp)

1. Abra Livechat
2. Selecione uma conversa antiga (última mensagem há 5 minutos)
3. **Ação:** Envie mensagem nessa conversa (via input ou N8N)
4. **Resultado esperado:**
   - ✅ Conversa **sobe para o topo da lista** (ordenação por last_message_at)
   - ✅ Timestamp atualiza

**Logs esperados:**
```
[realtime-contact-list] New message in conversation: abc123...
```

---

## 📊 Arquivos Modificados/Criados

| Arquivo | Tipo | Mudanças |
|---------|------|----------|
| [lib/hooks/use-realtime-contact-list.ts](../lib/hooks/use-realtime-contact-list.ts) | ✅ Criado | Hook de Realtime para lista |
| [lib/hooks/index.ts](../lib/hooks/index.ts) | 📝 Modificado | Export do novo hook |
| [components/livechat/contact-list.tsx](../components/livechat/contact-list.tsx) | 📝 Modificado | Usa hook de Realtime |
| [app/(dashboard)/livechat/page.tsx](../app/(dashboard)/livechat/page.tsx) | 📝 Modificado | Passa tenantId para ContactList |

---

## 🔧 Possíveis Problemas e Soluções

### Problema 1: Lista não atualiza mesmo com hooks

**Causa:** REPLICA IDENTITY da tabela pode estar em DEFAULT (envia apenas PK + colunas alteradas)

**Solução:**
```sql
ALTER TABLE conversations REPLICA IDENTITY FULL;
```

Ver guia completo: [REALTIME_CONVERSATION_DIAGNOSTIC.md](./REALTIME_CONVERSATION_DIAGNOSTIC.md)

---

### Problema 2: Subscription não conecta

**Logs:**
```
[realtime-contact-list] ❌ Conversations channel error: ...
```

**Verificar:**
1. **RLS Policies** - Usuário tem SELECT em conversations?
2. **Publicação Realtime** - Tabela conversations está habilitada?

```sql
-- Verificar publicação
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'conversations';
```

**Solução:** Executar [scripts/diagnose-realtime.sql](../scripts/diagnose-realtime.sql)

---

### Problema 3: Performance com muitas conversas

**Sintoma:** App fica lento com 100+ conversas ativas

**Otimizações:**

1. **Virtualização da lista:**
```typescript
// Usar react-window ou react-virtual
import { FixedSizeList } from 'react-window';
```

2. **Paginação server-side:**
```typescript
// Buscar apenas N primeiras conversas
const contacts = await getContactsWithConversations(tenantId, { limit: 50 });
```

3. **Debounce de updates:**
```typescript
// Em useRealtimeContactList, debounce setContacts
import { useDebouncedCallback } from 'use-debounce';
```

---

## 🎯 Próximos Passos

- [ ] Testar com múltiplos usuários simultâneos
- [ ] Adicionar indicador visual de "atualizando..." (skeleton)
- [ ] Implementar ordenação customizável (por nome, timestamp, status)
- [ ] Adicionar filtros avançados (canal, tags, atribuído a)
- [ ] Monitorar performance com muitas conversas (> 100)

---

## 📝 Observações Importantes

1. **Duas subscrições por tenant:**
   - `conversations` channel - Para mudanças em conversas
   - `messages` channel - Para atualizar timestamps

2. **Cleanup automático:**
   - Hooks fazem `removeChannel()` ao desmontar
   - Evita memory leaks

3. **Compatibilidade com Server Components:**
   - Hook recebe `initialContacts` do SSR
   - Mantém benefícios de SSR (SEO, performance inicial)
   - Adiciona reatividade no client

4. **Multi-tenancy:**
   - Filtro `tenant_id=eq.{tenantId}` garante isolamento
   - Usuários só veem conversas do próprio tenant

---

**Autor:** Claude (Anthropic)
**Data:** 2025-11-22
**Status:** ✅ Implementado e documentado
