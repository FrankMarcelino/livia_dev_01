# Migração: Tags Associadas ao Neurocore

**Data:** 2025-12-29
**Status:** ✅ Implementado

---

## 🎯 Objetivo

Alterar a lógica de associação de tags de **tenant** para **neurocore**.

### Por quê?

- Múltiplos tenants podem compartilhar o mesmo neurocore
- Tags são específicas do contexto/domínio do neurocore (agente de IA)
- Não faz sentido cada tenant ter suas próprias tags se compartilham o mesmo agente
- Simplifica a gestão de tags em ambientes multi-tenant

---

## 📊 Mudança de Estrutura

### Antes ❌
```
tags.id_tenant → tenant.id
```
Cada tenant tinha suas próprias tags, mesmo se compartilhasse o neurocore.

### Depois ✅
```
tags.id_neurocore → neurocore.id
tenant.neurocore_id → neurocore.id
```
Tags são compartilhadas entre todos os tenants de um mesmo neurocore.

---

## 🔧 Implementação

### 1. Helper de Autenticação

**Arquivo:** `lib/utils/auth-helpers.ts` (CRIADO)

```typescript
export async function getAuthenticatedUserData() {
  // 1. Buscar user.id da autenticação
  // 2. Buscar tenant_id do usuário
  // 3. Buscar neurocore_id do tenant

  return {
    userId,
    tenantId,
    neurocoreId
  };
}
```

**Benefícios:**
- Centraliza a lógica de busca do neurocore
- Reutilizável em toda a aplicação
- Type-safe com TypeScript

---

### 2. Queries Atualizadas

**Arquivo:** `lib/queries/livechat.ts`

#### Antes:
```typescript
export async function getAllTags(tenantId: string) {
  return await supabase
    .from('tags')
    .select('*')
    .eq('id_tenant', tenantId) // ❌
```

#### Depois:
```typescript
export async function getAllTags(neurocoreId: string) {
  return await supabase
    .from('tags')
    .select('*')
    .eq('id_neurocore', neurocoreId) // ✅
```

**Funções modificadas:**
- `getAllTags(neurocoreId)` - Busca todas as tags do neurocore
- `getCategories(neurocoreId)` - Busca categorias do neurocore

---

### 3. API Routes Atualizadas

#### A) `/api/conversations/update-tag`

**Arquivo:** `app/api/conversations/update-tag/route.ts`

**Mudanças:**
1. Busca `neurocore_id` do tenant
2. Valida tag usando `id_neurocore` ao invés de `id_tenant`

```typescript
// Novo fluxo:
// 1. Validar auth + tenant
// 2. Validar conversa
// 3. Buscar neurocore_id do tenant ← NOVO
// 4. Validar tag (usando id_neurocore)
// 5. Remover tag antiga do mesmo tipo
// 6. Adicionar nova tag
// 7. Retornar sucesso
```

#### B) `/api/conversations/update-category`

**Arquivo:** `app/api/conversations/update-category/route.ts`

**Mudanças:** Idênticas ao update-tag

---

### 4. Páginas do Dashboard

**Arquivo:** `app/(dashboard)/livechat/page.tsx`

#### Antes:
```typescript
const tenantId = userData.tenant_id;
const allTags = await getAllTags(tenantId); // ❌
```

#### Depois:
```typescript
const tenantId = userData.tenant_id;

// Buscar neurocore_id do tenant
const { data: tenantData } = await supabase
  .from('tenants')
  .select('neurocore_id')
  .eq('id', tenantId)
  .single();

const neurocoreId = tenantData.neurocore_id;
const allTags = await getAllTags(neurocoreId); // ✅
```

---

### 5. Script de Seed

**Arquivo:** `scripts/seed-livechat-categories.js`

#### Antes:
```javascript
const { data: tenant } = await supabase
  .from('tenants')
  .select('id, name') // ❌
  .single();

const categoryData = {
  ...category,
  id_tenant: tenant.id, // ❌
  active: true
};
```

#### Depois:
```javascript
const { data: tenant } = await supabase
  .from('tenants')
  .select('id, name, neurocore_id') // ✅
  .single();

const categoryData = {
  ...category,
  id_neurocore: tenant.neurocore_id, // ✅
  active: true
};
```

---

## 📋 Checklist de Implementação

- [x] Criar helper `auth-helpers.ts`
- [x] Atualizar `getAllTags()` e `getCategories()`
- [x] Atualizar API `/api/conversations/update-tag`
- [x] Atualizar API `/api/conversations/update-category`
- [x] Atualizar página `/livechat/page.tsx`
- [x] Atualizar script `seed-livechat-categories.js`
- [x] Validar TypeScript (0 erros)
- [x] Rodar build de produção
- [ ] **Migrar dados existentes no banco** ⚠️ (Próximo passo)
- [ ] Testar no browser

---

## 🚨 AÇÃO NECESSÁRIA: Migração de Dados

### Migration 1: Migrar tags para neurocore ✅ (Executada)

As tags existentes tinham `id_tenant` preenchido e `id_neurocore` NULL.

**Arquivo:** `sql/migrations/migrate_tags_to_neurocore.sql`

```bash
# Via Supabase Dashboard:
1. Abrir: https://supabase.com/dashboard/project/wfrxwfbslhkkzkexyilx/sql
2. Copiar conteúdo de: sql/migrations/migrate_tags_to_neurocore.sql
3. Executar
```

**O que faz:**
- Atualiza `id_neurocore` de todas as tags usando o `neurocore_id` do tenant
- Mantém `id_tenant` por segurança
- Mostra estatísticas de quantas tags foram migradas

**Status:** ✅ Executada

---

### Migration 2: Remover coluna id_tenant ⚠️ (Pendente)

Agora que todas as tags têm `id_neurocore`, a coluna `id_tenant` não é mais necessária.

**Arquivo:** `sql/migrations/remove_tags_id_tenant.sql`

```bash
# Via Supabase Dashboard:
1. Abrir: https://supabase.com/dashboard/project/wfrxwfbslhkkzkexyilx/sql
2. Copiar conteúdo de: sql/migrations/remove_tags_id_tenant.sql
3. Executar
```

**O que faz:**
- Verifica se todas as tags têm `id_neurocore` (aborta se não tiver)
- Remove foreign key constraint `tags_id_tenant_fkey`
- Remove coluna `id_tenant` da tabela `tags`
- Mostra estatísticas de verificação

**IMPORTANTE:** Após executar, regenerar types do Supabase:
```bash
npx supabase gen types typescript --project-id wfrxwfbslhkkzkexyilx > types/database.ts
```

**Status:** ⚠️ Pendente de execução

---

## 🎯 Resultado Esperado

### Antes da Migração
```
Tenant A (neurocore_1) → Tags: [Tag1, Tag2]
Tenant B (neurocore_1) → Tags: [Tag3, Tag4]
Tenant C (neurocore_2) → Tags: [Tag5, Tag6]
```
Cada tenant tinha suas próprias tags ❌

### Depois da Migração
```
Neurocore 1 → Tags: [Tag1, Tag2, Tag3, Tag4]
  ├─ Tenant A (compartilha)
  └─ Tenant B (compartilha)

Neurocore 2 → Tags: [Tag5, Tag6]
  └─ Tenant C
```
Tags compartilhadas por neurocore ✅

---

## 📝 Arquivos Modificados

### Criados
- `lib/utils/auth-helpers.ts` - Helpers de autenticação
- `sql/migrations/migrate_tags_to_neurocore.sql` - Migration para migrar tags
- `sql/migrations/remove_tags_id_tenant.sql` - Migration para remover id_tenant
- `docs/planejamento/TAGS_NEUROCORE_MIGRATION.md` - Esta documentação
- `docs/planejamento/TAGS_DEBUG_GUIDE.md` - Guia de debug

### Modificados
- `lib/queries/livechat.ts` - Múltiplas alterações:
  - `getAllTags()` e `getCategories()` - Agora recebem neurocoreId
  - `getConversationsWithContact()` - Adicionado `tag_type` no SELECT de tags
  - `getConversation()` - Adicionado SELECT de `conversation_tags` (antes não buscava!)
  - Removido `.order()` deprecated para messages
- `app/api/conversations/update-tag/route.ts` - Validação com neurocore
- `app/api/conversations/update-category/route.ts` - Validação com neurocore
- `app/(dashboard)/livechat/page.tsx` - Busca neurocore antes de buscar tags
- `scripts/seed-livechat-categories.js` - Usa neurocore_id ao criar tags

---

## ✨ Benefícios

1. **Consistência**: Tenants do mesmo neurocore veem as mesmas tags
2. **Manutenção**: Alterar uma tag atualiza para todos os tenants do neurocore
3. **Escalabilidade**: Fácil adicionar novos tenants sem recriar tags
4. **Lógica de Negócio**: Tags são do domínio do agente (neurocore), não do tenant

---

## 🔮 Próximos Passos

1. **Executar migration SQL** - Atualizar tags existentes
2. **Testar no browser** - Validar que tags aparecem corretamente
3. **Atualizar N8N workflow** - Garantir que webhook usa neurocore_id
4. **Documentar para equipe** - Explicar mudança de lógica
