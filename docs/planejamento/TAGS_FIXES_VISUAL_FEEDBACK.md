# Correções: Feedback Visual e Tag Presencial

**Data:** 2025-12-29
**Status:** ✅ Corrigido

---

## 🐛 Problemas Identificados

### 1. Falta de Feedback Visual
**Sintoma:** Após selecionar uma tag no dropdown, não havia feedback visual mostrando qual tag foi escolhida. Era necessário clicar no select novamente para ver a tag selecionada.

**Causa:** O componente `TagTypeSelect` estava usando `currentTag` (que vem das props) no `SelectValue`, mas após a seleção essa prop só era atualizada após o `router.refresh()`, causando um delay visual.

### 2. Tag "Presencial" Não Aparecia
**Sintoma:** A tag "Presencial" (categoria do Livechat) não aparecia nos dropdowns.

**Causa:** As tags antigas foram criadas sem o campo `tag_type`, ficando com valor `NULL` no banco. O filtro `tag.tag_type === 'description'` não incluía tags com `NULL`.

---

## ✅ Soluções Implementadas

### 1. Correção do Feedback Visual

**Arquivo:** `components/livechat/tag-type-select.tsx:65-66, 142-146`

**Antes:**
```tsx
// Usava currentTag que só atualizava após router.refresh()
{currentTag && <TagBadge tag={currentTag} size="sm" />}
```

**Depois:**
```tsx
// Adicionado variável computada
const selectedTag = tagsOfType.find(tag => tag.id === selectedValue);

// SelectValue agora usa selectedTag (atualiza imediatamente)
{selectedTag ? (
  <TagBadge tag={selectedTag} size="sm" />
) : (
  <span className="text-muted-foreground">Carregando...</span>
)}
```

**Resultado:** Feedback visual instantâneo ao selecionar uma tag! ✅

---

### 2. Correção da Tag "Presencial"

#### A) Migration SQL

**Arquivo:** `sql/migrations/fix_tags_tag_type.sql`

```sql
-- Atualizar tags com is_category=true para ter tag_type='description'
UPDATE tags
SET tag_type = 'description'
WHERE tag_type IS NULL
  AND is_category = true;

-- Atualizar demais tags para ter tag_type='description' por padrão
UPDATE tags
SET tag_type = 'description'
WHERE tag_type IS NULL
  AND (is_category = false OR is_category IS NULL);
```

**Como executar:**
```bash
# Opção 1: Via Supabase Dashboard
1. Abrir Supabase Dashboard
2. SQL Editor
3. Copiar conteúdo de sql/migrations/fix_tags_tag_type.sql
4. Executar

# Opção 2: Via CLI (se configurado)
npx supabase db execute -f sql/migrations/fix_tags_tag_type.sql
```

#### B) Seed Atualizado

**Arquivo:** `scripts/seed-livechat-categories.js:19, 27, 35`

**Antes:**
```javascript
{
  tag_name: 'Presencial',
  color: '#3B82F6',
  is_category: true
  // tag_type AUSENTE ❌
}
```

**Depois:**
```javascript
{
  tag_name: 'Presencial',
  color: '#3B82F6',
  is_category: true,
  tag_type: 'description' // ✅ Adicionado
}
```

**Resultado:** Novas tags criadas já terão `tag_type` definido! ✅

---

## 📋 Checklist de Implementação

- [x] Corrigir feedback visual no `TagTypeSelect`
- [x] Criar migration SQL para atualizar tags existentes
- [x] Atualizar seed script para incluir `tag_type`
- [x] Validar TypeScript (0 erros)
- [ ] **Executar migration no banco de dados** ⚠️ (Pendente)
- [ ] Testar no browser

---

## 🚀 Para Testar

### 1. Executar a Migration (IMPORTANTE!)

```bash
# Conectar ao Supabase Dashboard e executar:
# sql/migrations/fix_tags_tag_type.sql
```

### 2. Rodar o Dev Server

```bash
npm run dev
```

### 3. Testar no Browser

1. **Abrir Livechat**
2. **Selecionar uma conversa**
3. **No header da conversa:**
   - Ver 3 dropdowns: Intenção, Checkout, Falha
   - Tag "Presencial" deve aparecer no dropdown de Intenção ✅
4. **Selecionar tag de Intenção:**
   - Clicar no dropdown
   - Selecionar "Presencial"
   - **Badge deve aparecer IMEDIATAMENTE** no select ✅
5. **Selecionar tag de Checkout:**
   - Clicar no segundo dropdown
   - Selecionar qualquer tag de checkout
   - **Ambas as tags devem ficar visíveis simultaneamente** ✅

---

## 🎯 Resultado Esperado

### Antes ❌
```
[Selecionar intenção ▼]  [Selecionar checkout ▼]
      ↓ clica
[Selecionar intenção ▼]  ← Sem feedback visual
      ↓ clica novamente
[✓ Presencial        ▼]  ← Agora aparece
```

### Depois ✅
```
[Selecionar intenção ▼]  [Selecionar checkout ▼]
      ↓ clica
[✓ Presencial        ▼]  ← Feedback IMEDIATO!
```

---

## 📝 Arquivos Modificados

### Criados
- `sql/migrations/fix_tags_tag_type.sql` - Migration para corrigir tags existentes
- `docs/planejamento/TAGS_FIXES_VISUAL_FEEDBACK.md` - Esta documentação

### Modificados
- `components/livechat/tag-type-select.tsx:65-66, 142-146` - Feedback visual corrigido
- `scripts/seed-livechat-categories.js:19, 27, 35` - Incluído `tag_type`

---

## ⚠️ AÇÃO NECESSÁRIA

**IMPORTANTE:** Execute a migration SQL no banco de dados:

```bash
# Arquivo: sql/migrations/fix_tags_tag_type.sql
#
# Isso vai atualizar as tags existentes para ter tag_type='description'
# Sem isso, as tags antigas (Presencial, Teoria, etc) não aparecerão
```

---

## ✨ Melhorias Futuras

1. **Criar UI para gerenciar tags:**
   - CRUD de tags pelo dashboard
   - Definir tipo (intenção, checkout, falha) ao criar
   - Editar miniprompt (`prompt_to_ai`)

2. **Indicador visual de sucesso:**
   - Animação ao selecionar tag
   - Toast com preview da tag selecionada

3. **Sugestões inteligentes:**
   - IA sugere tags baseado no contexto da conversa
   - Preview antes de aplicar
