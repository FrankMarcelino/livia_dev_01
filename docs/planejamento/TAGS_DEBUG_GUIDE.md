# Guia de Debug: Tags Não Aparecem no Header

**Data:** 2025-12-29
**Problema:** Tags não aparecem no header da conversa / Não é possível filtrar por tags

---

## 🐛 Sintomas Reportados

1. **Tags não aparecem no header:** Conversas que já têm tags marcadas no banco não mostram as tags selecionadas no header
2. **Filtro não funciona:** Ao marcar "Checkout Realizado", não consegue filtrar pela tag na coluna de preview

---

## 🔍 Diagnóstico

### Causa Raiz

Após migrar tags de `id_tenant` para `id_neurocore`, as queries estão retornando as tags corretamente, mas há 3 possíveis problemas:

1. **Migration SQL não executada** - Tags antigas ainda têm `id_neurocore = NULL`
2. **RLS Policy bloqueando** - Política de segurança pode estar bloqueando acesso às tags
3. **Filtro desatualizado** - Filtro de categorias usa `is_category` mas tags novas usam `tag_type`

---

## ✅ Correções Aplicadas

### 1. Queries Atualizadas

**Arquivo:** `lib/queries/livechat.ts`

Adicionadas as queries para buscar `conversation_tags` com todos os campos necessários:

```typescript
conversation_tags(
  id,
  tag_id,
  tag:tags(
    id,
    tag_name,
    tag_type,      // ✅ NOVO - Tipo da tag
    color,
    is_category,
    order_index,
    id_neurocore,  // ✅ DEBUG - Ver se migration foi executada
    id_tenant      // ✅ DEBUG - Ver tags antigas
  )
)
```

**Funções atualizadas:**
- `getConversationsWithContact()` - Já buscava tags, agora com `tag_type`
- `getConversation()` - **CORRIGIDO** - Agora busca `conversation_tags` (antes não buscava!)

---

## 🚀 Passos para Resolver

### Passo 1: Executar Migration SQL ⚠️ **OBRIGATÓRIO**

As tags antigas ainda têm `id_tenant` e `id_neurocore = NULL`. Execute a migration:

```bash
# Via Supabase Dashboard:
1. Abra: https://supabase.com/dashboard/project/wfrxwfbslhkkzkexyilx/sql
2. Copie o conteúdo de: sql/migrations/migrate_tags_to_neurocore.sql
3. Execute
```

**O que a migration faz:**
- Atualiza `id_neurocore` de todas as tags usando o `neurocore_id` do tenant
- Mantém `id_tenant` por segurança
- Mostra estatísticas de quantas tags foram migradas

---

### Passo 2: Verificar no Browser

Após executar a migration e fazer deploy do código:

#### A) Abrir DevTools do Browser

1. Abra o Livechat
2. Pressione `F12` (DevTools)
3. Vá para a aba **Console**
4. Selecione uma conversa que DEVERIA ter tags

#### B) Verificar se Tags Estão Sendo Retornadas

No console, você deverá ver algo como:

```javascript
// Conversa carregada:
{
  id: "conv-123",
  status: "open",
  conversation_tags: [  // ← Deve ter tags aqui!
    {
      id: "ct-1",
      tag_id: "tag-abc",
      tag: {
        id: "tag-abc",
        tag_name: "Presencial",
        tag_type: "description",
        color: "#3B82F6",
        is_category: true,
        id_neurocore: "neurocore-xyz",  // ← Deve estar preenchido!
        id_tenant: null  // ← ou ainda com valor antigo
      }
    }
  ]
}
```

**Cenários:**

| Cenário | Diagnóstico |
|---------|-------------|
| `conversation_tags: []` (vazio) | Tags não estão no banco OU migration não foi executada |
| `conversation_tags: [{ tag: null }]` | RLS policy bloqueando acesso às tags |
| `tag.id_neurocore = null` | Migration SQL NÃO foi executada |
| `tag.id_neurocore = "xxx"` | Migration OK! Problema está no frontend |

---

### Passo 3: Verificar RLS Policies (Se Necessário)

Se `conversation_tags` retornar `tag: null`, pode ser problema de RLS:

```sql
-- Verificar policies da tabela tags:
SELECT * FROM pg_policies WHERE tablename = 'tags';

-- Possível policy bloqueadora:
CREATE POLICY "Tenants can view their tags"
ON tags FOR SELECT
USING (id_tenant = (
  SELECT tenant_id FROM users WHERE id = auth.uid()
));
```

**Problema:** Esta policy filtra por `id_tenant`, mas tags agora têm `id_neurocore`!

**Solução:** Atualizar policy para filtrar por neurocore:

```sql
-- Desabilitar policy antiga:
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;

-- OU atualizar policy:
DROP POLICY "Tenants can view their tags" ON tags;

CREATE POLICY "Tenants can view neurocore tags"
ON tags FOR SELECT
USING (id_neurocore IN (
  SELECT neurocore_id
  FROM tenants
  WHERE id = (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  )
));
```

---

## 🔧 Próximas Melhorias

### 1. Filtro de Tags por Tipo

O filtro atual só funciona para tags com `is_category=true` (tags antigas).

**Problema:** Não é possível filtrar por tags de checkout/intenção (que usam `tag_type`).

**Solução:** Adicionar filtro adicional por `tag_type`:

```typescript
// Adicionar em contact-list.tsx:
const [tagTypeFilter, setTagTypeFilter] = useState<'all' | 'description' | 'success' | 'fail'>('all');

const matchesTagType =
  tagTypeFilter === 'all' ||
  conversation.conversation_tags?.some(ct => ct.tag?.tag_type === tagTypeFilter);
```

### 2. Badges de Tags no Card

Mostrar mini-badges das tags aplicadas em cada card de conversa:

```typescript
// Em contact-item.tsx:
{conversation.conversation_tags?.map(ct => (
  <TagBadge key={ct.id} tag={ct.tag} size="xs" />
))}
```

---

## 📝 Resumo das Mudanças

### Arquivos Modificados

- `lib/queries/livechat.ts` - Adicionados campos `tag_type`, `id_neurocore`, `id_tenant` nas queries
- `docs/planejamento/TAGS_DEBUG_GUIDE.md` - Este guia

### Pendente

- [ ] **Executar migration SQL** no Supabase
- [ ] **Testar no browser** e verificar console
- [ ] **Atualizar RLS policies** (se necessário)
- [ ] **Adicionar filtro por tag_type** (melhoria futura)
- [ ] **Mostrar tags nos cards** (melhoria futura)

---

## 🆘 Se Ainda Não Funcionar

1. **Verificar no Console do Browser:**
   - Tags estão sendo retornadas?
   - `id_neurocore` está preenchido?
   - Há erros de RLS?

2. **Verificar no Supabase Dashboard:**
   - Migration foi executada?
   - Tags têm `id_neurocore` preenchido?
   - RLS está bloqueando acesso?

3. **Adicionar Logging Temporário:**

```typescript
// Em conversation-header.tsx:
useEffect(() => {
  console.log('[ConversationHeader] conversationTags:', conversationTags);
  console.log('[ConversationHeader] currentTags:', currentTags);
}, [conversationTags, currentTags]);
```

Isso mostrará exatamente o que o header está recebendo.

---

## ✅ Checklist de Debug

- [ ] Migration SQL executada no Supabase
- [ ] Build feito e deployed
- [ ] Console do browser mostra `conversation_tags` com dados
- [ ] Campo `tag.id_neurocore` está preenchido
- [ ] Tags aparecem no header da conversa
- [ ] Filtro de categorias funciona (para tags com `is_category=true`)
- [ ] (Futuro) Filtro por tipo funciona (para tags com `tag_type`)

