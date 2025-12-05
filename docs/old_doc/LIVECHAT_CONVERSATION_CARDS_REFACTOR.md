# Refatoração: Cards por Conversa (não por Contato)

**Data:** 2025-11-22
**Status:** 📋 DOCUMENTADO - Implementação Futura
**Prioridade:** ALTA
**Impacto:** Médio-Alto (mudança arquitetural)

---

## 🚨 Problema Atual

Atualmente, o Livechat mostra **1 card por CONTATO**, agregando múltiplas conversas do mesmo contato em um único card.

**Comportamento atual (ERRADO):**
- Banco: João tem 2 conversas (1 fechada, 1 aberta)
- UI: 1 card mostrando "João" com apenas a conversa mais recente
- Resultado: 4 conversas "escondidas" não aparecem

**Exemplo:**
```
Banco de Dados:
- Conversa #1: João (closed) - 10/11/2025
- Conversa #2: João (open) - 22/11/2025

UI atual (ERRADO):
- Card 1: João → mostra só Conversa #2
```

---

## ✅ Comportamento Esperado (CORRETO)

Cada **CARD = uma CONVERSA** (não um contato).

**Razão:**
1. Cada conversa tem ID único e é independente
2. Quando encerrada, a conversa vira "cápsula" (fechada, imutável)
3. Se o mesmo contato retornar, cria-se uma **nova conversa** com novo ID
4. Mesmo contato pode ter múltiplos cards (um para cada conversa)

**Exemplo correto:**
```
Banco de Dados:
- Conversa #1: João (closed) - 10/11/2025
- Conversa #2: João (open) - 22/11/2025

UI esperada (CORRETO):
- Card 1: João - Conversa #1 (encerrada)
- Card 2: João - Conversa #2 (aberta)
```

---

## 🔍 Root Cause

A query em [lib/queries/livechat.ts](../lib/queries/livechat.ts) busca **CONTATOS** com JOIN para conversas:

```typescript
// ❌ ATUAL (Errado)
SELECT * FROM contacts
INNER JOIN conversations ON conversations.contact_id = contacts.id
```

**Problema:**
- Quando contato tem múltiplas conversas, Supabase retorna linhas duplicadas
- Código depois faz `.map()` mas **não desagrega** em cards separados
- Resultado: apenas primeira conversa de cada contato aparece

---

## 🛠️ Solução Proposta

### 1. Inverter a Query (Buscar Conversas, JOIN Contatos)

```typescript
// ✅ NOVO (Correto)
SELECT * FROM conversations
LEFT JOIN contacts ON contacts.id = conversations.contact_id
WHERE conversations.tenant_id = 'xxx'
```

**Retorno:** Array de **conversas** (não contatos)

### 2. Criar Novo Tipo

```typescript
// types/livechat.ts
export interface ConversationWithContact {
  // Campos da conversa
  id: string;
  status: 'open' | 'paused' | 'closed';
  ia_active: boolean;
  last_message_at: string;
  created_at: string;

  // Dados do contato (JOIN)
  contact: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    avatar_url?: string;
  };

  // Última mensagem
  lastMessage?: Message;
}
```

### 3. Nova Query Function

```typescript
// lib/queries/livechat.ts
export async function getConversationsWithContact(
  tenantId: string,
  filters?: ConversationFilters
): Promise<ConversationWithContact[]> {
  const supabase = await createClient();

  let query = supabase
    .from('conversations')
    .select(`
      *,
      contacts!inner(
        id,
        name,
        phone,
        email,
        avatar_url,
        status
      )
    `)
    .eq('tenant_id', tenantId);

  // Filtros
  if (!filters?.includeClosedConversations) {
    query = query.neq('status', 'closed');
  }

  const { data, error } = await query;
  if (error) throw error;

  // Buscar última mensagem de cada conversa
  const conversationIds = data.map(conv => conv.id);
  const { data: messagesData } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', conversationIds)
    .order('timestamp', { ascending: false });

  // Agrupar mensagens por conversa
  const lastMessageMap = new Map();
  messagesData?.forEach((msg) => {
    if (!lastMessageMap.has(msg.conversation_id)) {
      lastMessageMap.set(msg.conversation_id, msg);
    }
  });

  // Retornar conversas com contato e última mensagem
  return data.map((conv: any) => ({
    ...conv,
    contact: conv.contacts,
    lastMessage: lastMessageMap.get(conv.id) || null,
  }));
}
```

---

## 📋 Plano de Implementação

### Passo 1: Tipos
- [ ] Criar `ConversationWithContact` em `types/livechat.ts`
- [ ] Criar `ConversationFilters` interface
- [ ] Deprecar `ContactWithConversations` (manter para compatibilidade)

### Passo 2: Query
- [ ] Criar `getConversationsWithContact()` em `lib/queries/livechat.ts`
- [ ] Testar query retorna todas as conversas (10, não 6)
- [ ] Manter `getContactsWithConversations()` temporariamente

### Passo 3: Página Livechat
- [ ] Atualizar `app/(dashboard)/livechat/page.tsx`
- [ ] Chamar `getConversationsWithContact()` em vez de `getContactsWithConversations()`
- [ ] Passar `conversations` para ContactList

### Passo 4: Componente ContactList
- [ ] Renomear para `ConversationList` (ou manter nome por compatibilidade)
- [ ] Atualizar props: `conversations: ConversationWithContact[]`
- [ ] Renderizar cards de conversas (não contatos)
- [ ] Atualizar filtros para filtrar conversas

### Passo 5: Componente ContactCard
- [ ] Renomear para `ConversationCard` (ou manter nome)
- [ ] Atualizar props: `conversation: ConversationWithContact`
- [ ] Exibir dados do contato via `conversation.contact`
- [ ] Remover lógica de `activeConversations[0]`

### Passo 6: Hook Realtime
- [ ] Renomear `useRealtimeContactList` → `useRealtimeConversationList`
- [ ] Atualizar tipo: `ConversationWithContact[]`
- [ ] UPDATE conversation: atualizar conversa diretamente (não buscar em array)
- [ ] INSERT message: atualizar `lastMessage` da conversa

### Passo 7: Utils
- [ ] Renomear `sortContactsByLastMessage` → `sortConversationsByLastMessage`
- [ ] Adaptar para trabalhar com `ConversationWithContact`

### Passo 8: Limpeza
- [ ] Remover código antigo de contatos
- [ ] Atualizar documentação
- [ ] Testes manuais com múltiplas conversas

---

## 📊 Impacto Estimado

### Arquivos a Modificar:
1. `types/livechat.ts` - Novos tipos
2. `lib/queries/livechat.ts` - Nova query
3. `app/(dashboard)/livechat/page.tsx` - Chamada da query
4. `components/livechat/contact-list.tsx` - Props e renderização
5. `components/livechat/contact-card.tsx` - Props e exibição
6. `lib/hooks/use-realtime-contact-list.ts` - Tipo e lógica
7. `lib/utils/contact-list.ts` - Função de ordenação

### Risco:
- **Médio** - Mudança arquitetural mas sem mudar banco de dados
- Pode quebrar fluxos existentes se não testar bem

### Benefícios:
- ✅ Todas as conversas aparecem (10 em vez de 6)
- ✅ Comportamento correto (card = conversa)
- ✅ Facilita fluxo de encerrar/criar conversas
- ✅ Alinhado com modelo de dados

---

## 🧪 Critérios de Aceitação

Após implementar, verificar:

1. **Banco tem 10 conversas** → UI mostra 10 cards ✅
2. **João tem 2 conversas** → 2 cards com nome "João" ✅
3. **Filtro "Encerradas"** → mostra conversas com `status = closed` ✅
4. **Realtime UPDATE** → atualiza card correto ✅
5. **Realtime INSERT message** → atualiza preview da conversa ✅
6. **Ao clicar em card** → abre conversa correta ✅

---

## 📚 Referências

- [DECISIONS.md - Decisão #012](../DECISIONS.md#decisão-012-sistema-de-4-filtros-no-livechat)
- [REALTIME_DEBUG_2025-11-22.md](./REALTIME_DEBUG_2025-11-22.md)
- Conversa de debug: 2025-11-22

---

**Autor:** Claude + Frank
**Próxima Ação:** Implementar quando priorizado
**Estimativa:** 3-4 horas de desenvolvimento + testes
