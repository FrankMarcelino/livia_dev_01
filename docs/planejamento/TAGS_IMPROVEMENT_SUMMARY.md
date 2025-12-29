# Melhorias na Feature de Tags

**Data:** 2025-12-29
**Status:** ✅ Implementado

---

## 🎯 Problema Identificado

### Bug Original
Tags de checkout não estavam sendo marcadas em contatos/conversas. A IA só conseguia marcar **uma tag por conversa**, quando na verdade deveria permitir:
- ✅ 1 tag de **intenção** (objetivo da conversa)
- ✅ 1 tag de **checkout** (sucesso)
- ✅ Ambas simultaneamente

### Causa Raiz
**Arquivo:** `app/api/conversations/update-category/route.ts:82-110`

A API removia **TODAS** as tags com `is_category=true` ao adicionar uma nova, impedindo que uma conversa tivesse múltiplas tags de tipos diferentes.

---

## 📊 Estrutura do Banco de Dados

### Tabela `tags`
```sql
CREATE TABLE tags (
  id uuid PRIMARY KEY,
  tag_name text NOT NULL,
  tag_type tag_type DEFAULT 'description',  -- Enum: 'description' | 'success' | 'fail'
  prompt_to_ai text,                         -- Miniprompt para a IA entender quando aplicar
  color text DEFAULT '#3b82f6',
  is_category boolean DEFAULT false,         -- Deprecated, usar tag_type
  id_tenant uuid NOT NULL,
  id_neurocore uuid,
  active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  change_conversation_status conversation_status_enum
);
```

### Enum `tag_type`
```sql
CREATE TYPE tag_type AS ENUM (
  'description',  -- Tag de intenção (objetivo da conversa)
  'success',      -- Tag de checkout (sucesso/venda realizada)
  'fail'          -- Tag de falha
);
```

### Relacionamento N-N
```sql
CREATE TABLE conversation_tags (
  id uuid PRIMARY KEY,
  conversation_id uuid REFERENCES conversations(id),
  tag_id uuid REFERENCES tags(id),
  created_at timestamp
);
```

---

## ✨ Solução Implementada

### 1. Atualização dos Types TypeScript

**Arquivo:** `types/database.ts`

Regenerado automaticamente do Supabase:
```bash
npx supabase gen types typescript --project-id wfrxwfbslhkkzkexyilx > types/database.ts
```

Agora inclui:
- ✅ Campo `tag_type: "description" | "success" | "fail" | null`
- ✅ Campo `change_conversation_status`
- ✅ Campo `id_neurocore`

### 2. Nova API Route: `/api/conversations/update-tag`

**Arquivo:** `app/api/conversations/update-tag/route.ts`

**Regra de Negócio:**
- Remove apenas tags do **MESMO tipo** ao adicionar uma nova
- Permite múltiplas tags de **tipos diferentes** simultaneamente

**Exemplo de uso:**
```typescript
// Adicionar tag de intenção
POST /api/conversations/update-tag
{
  "conversationId": "uuid",
  "tagId": "tag-intencao-uuid",  // tag com tag_type='description'
  "tenantId": "uuid"
}

// Adicionar tag de checkout (SEM remover a de intenção)
POST /api/conversations/update-tag
{
  "conversationId": "uuid",
  "tagId": "tag-checkout-uuid",  // tag com tag_type='success'
  "tenantId": "uuid"
}

// Resultado: Conversa com AMBAS as tags
```

### 3. Componente de UI: `TagTypeSelect`

**Arquivo:** `components/livechat/tag-type-select.tsx`

**Features:**
- Filtra tags automaticamente por tipo
- Permite remover tag (opção "Nenhuma")
- UI otimista com feedback de loading
- Suporta Realtime (sincroniza com mudanças)

**Props:**
```typescript
interface TagTypeSelectProps {
  conversationId: string;
  tenantId: string;
  tagType: 'description' | 'success' | 'fail';  // Tipo específico
  currentTag?: Tag | null;
  availableTags: Tag[];  // Todas as tags do tenant
  disabled?: boolean;
  label?: string;
}
```

**Exemplo de uso na UI:**
```tsx
<div className="flex flex-col gap-4">
  {/* Tag de Intenção */}
  <TagTypeSelect
    conversationId={conversation.id}
    tenantId={tenantId}
    tagType="description"
    currentTag={conversation.intentionTag}
    availableTags={allTags}
    label="Intenção da Conversa"
  />

  {/* Tag de Checkout */}
  <TagTypeSelect
    conversationId={conversation.id}
    tenantId={tenantId}
    tagType="success"
    currentTag={conversation.checkoutTag}
    availableTags={allTags}
    label="Checkout (Sucesso)"
  />

  {/* Tag de Falha */}
  <TagTypeSelect
    conversationId={conversation.id}
    tenantId={tenantId}
    tagType="fail"
    currentTag={conversation.failTag}
    availableTags={allTags}
    label="Marcação de Falha"
  />
</div>
```

---

## 🔄 Mapeamento de Tipos

| Tipo no Banco | Significado | Uso |
|---------------|-------------|-----|
| `description` | Tag de Intenção | Objetivo da conversa (ex: "Interessado em Produto X") |
| `success` | Tag de Checkout | Sucesso/venda realizada (ex: "Compra Realizada") |
| `fail` | Tag de Falha | Conversas que falharam (uso futuro) |

---

## 🤖 Como a IA Aplica Tags

1. **Agente de Intenção** (no fluxo N8N):
   - Lê o `prompt_to_ai` de cada tag
   - Analisa o contexto da conversa
   - Decide qual tag aplicar baseado no miniprompt

2. **Exemplo de `prompt_to_ai`:**
```sql
-- Tag de Intenção
INSERT INTO tags (tag_name, tag_type, prompt_to_ai) VALUES (
  'Interessado em Curso',
  'description',
  'Aplicar esta tag quando o cliente demonstrar interesse em conhecer ou se matricular em algum curso'
);

-- Tag de Checkout
INSERT INTO tags (tag_name, tag_type, prompt_to_ai) VALUES (
  'Matrícula Realizada',
  'success',
  'Aplicar esta tag quando o cliente confirmar a matrícula ou pagamento'
);
```

3. **N8N Workflow:**
   - Recebe mensagem do cliente
   - Envia para agente de intenção
   - Agente analisa e retorna tag_id
   - N8N chama `/api/conversations/update-tag`

---

## 📝 Exemplo Prático

### Cenário: Conversa de Venda Bem-Sucedida

**Estado Inicial:**
```json
{
  "conversation_id": "conv-123",
  "tags": []
}
```

**1. Cliente demonstra interesse (IA aplica tag de intenção):**
```bash
POST /api/conversations/update-tag
{
  "conversationId": "conv-123",
  "tagId": "tag-interesse-produto-x",  # tag_type='description'
  "tenantId": "tenant-1"
}
```

**Estado após:**
```json
{
  "conversation_id": "conv-123",
  "tags": [
    { "tag_name": "Interessado em Produto X", "tag_type": "description" }
  ]
}
```

**2. Cliente finaliza compra (IA aplica tag de checkout):**
```bash
POST /api/conversations/update-tag
{
  "conversationId": "conv-123",
  "tagId": "tag-compra-realizada",  # tag_type='success'
  "tenantId": "tenant-1"
}
```

**Estado final:**
```json
{
  "conversation_id": "conv-123",
  "tags": [
    { "tag_name": "Interessado em Produto X", "tag_type": "description" },
    { "tag_name": "Compra Realizada", "tag_type": "success" }
  ]
}
```

✅ **Agora a conversa tem AMBAS as tags simultaneamente!**

---

## 🚀 Próximos Passos

### Implementações Futuras

1. **Tag de Suporte Bem-Sucedido**
   - Adicionar novo valor ao enum: `'support_success'`
   - Criar tags específicas para suporte

2. **Analytics de Tags**
   - Dashboard com funil de conversão
   - Taxa de checkout por intenção
   - Identificação de gargalos

3. **Regras Automáticas**
   - Mudar status da conversa baseado em tag
   - Notificações para equipe quando checkout aplicado
   - Integração com CRM externo

---

## ✅ Checklist de Implementação

- [x] Atualizar `types/database.ts` com campos faltantes
- [x] Corrigir erros de tipo no código existente
- [x] Verificar mapeamento de `tag_type` com negócio
- [x] Criar nova API `/api/conversations/update-tag`
- [x] Criar componente `TagTypeSelect`
- [x] Validar TypeScript (0 erros)
- [x] Documentar solução

---

## 📚 Arquivos Modificados/Criados

### Criados
- `app/api/conversations/update-tag/route.ts` - Nova API
- `components/livechat/tag-type-select.tsx` - Componente UI
- `docs/planejamento/TAGS_IMPROVEMENT_SUMMARY.md` - Esta documentação

### Modificados
- `types/database.ts` - Regenerado do Supabase
- `lib/__tests__/fixtures/conversations.ts` - Adicionado campos `consecutive_reactivations` e `total_reactivations`
- `lib/hooks/use-realtime-conversations.ts` - Type cast para `conversation_tags`
- `lib/queries/dashboard.ts` - Corrigido tipo de `p_channel_id`
- `lib/queries/funil.ts` - Removido `@ts-expect-error` desnecessário
- `lib/queries/tags.ts` - Removido `@ts-expect-error` desnecessário

---

## 🎉 Resultado

✅ **Bug corrigido:** Agora é possível marcar tags de intenção + checkout simultaneamente
✅ **Código type-safe:** 0 erros TypeScript
✅ **API genérica:** Suporta todos os tipos de tags (description, success, fail)
✅ **UI componentizada:** Fácil de usar em qualquer parte do sistema
✅ **Escalável:** Preparado para novos tipos de tags no futuro
