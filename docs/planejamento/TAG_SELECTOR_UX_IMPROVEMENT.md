# Melhoria de UX: Tag Selector Unificado

**Data:** 2025-12-29
**Status:** 🚧 Em Implementação
**Autor:** Claude Code

---

## 🎯 Objetivo

Criar um componente unificado de seleção de tags com UX melhorada, substituindo os componentes atuais (`TagTypeSelect` e `TagCheckbox`) por uma interface mais intuitiva e visual.

---

## 📋 Requisitos

### 1. **Header da Conversa** (Modo: Assign)

**Funcionalidade:** Atribuir/remover tags de uma conversa

**Comportamento:**
- Exibir label horizontal com TODAS as tags já aplicadas (intenção + checkout + falha)
- Botão "+ Adicionar" sempre visível à direita
- Ao clicar no botão: abre popover ABAIXO com tags disponíveis
- Tags agrupadas por tipo (Intenção, Checkout, Falha)
- Tags já aplicadas NÃO aparecem no popover
- Clicar em tag na label → REMOVE a tag (chama API)
- Clicar em tag no popover → ADICIONA a tag (chama API)
- UI otimista (atualiza antes da resposta do servidor)
- Toast de sucesso/erro

### 2. **Sidebar de Conversas** (Modo: Filter)

**Funcionalidade:** Filtrar conversas por tags

**Comportamento:**
- Exibir label horizontal com tags usadas como filtro
- Botão "+ Filtrar" sempre visível
- Ao clicar no botão: abre popover com TODAS as tags
- Checkbox ao lado de cada tag (mostra se está filtrada)
- Clicar em tag na label → REMOVE do filtro
- Clicar em tag no popover → ADICIONA/REMOVE do filtro (toggle)
- Filtra conversas client-side (estado local)
- Estado do filtro persistido durante navegação

### 3. **Card da Conversa** (Read-only)

**Funcionalidade:** Apenas exibir tags

**Comportamento:**
- Mini badges das tags aplicadas
- Não é clicável
- Layout horizontal com wrap

---

## 🎨 Wireframes ASCII

### Header da Conversa (Modo Assign)

```
┌─────────────────────────────────────────────────────────────────────┐
│  📞 João Silva • WhatsApp • Ativa • IA Ativada                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Tags:                                                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ [🏷️ Presencial ×] [✅ Checkout ×] [+ Adicionar tags ▼]        │ │ ← PopoverTrigger
│  └────────────────────────────────────────────────────────────────┘ │
│                       ↓ (ao clicar em "+ Adicionar")                │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Tags Disponíveis                                               │ │ ← PopoverContent
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│  │                                                                │ │
│  │ INTENÇÃO                                                       │ │
│  │ ┌──────────────────────────────────────────────────────────┐ │ │
│  │ │ 🏷️  Teoria                                    [Adicionar]│ │ │
│  │ └──────────────────────────────────────────────────────────┘ │ │
│  │ ┌──────────────────────────────────────────────────────────┐ │ │
│  │ │ 🏷️  Teoria + Estágio                          [Adicionar]│ │ │
│  │ └──────────────────────────────────────────────────────────┘ │ │
│  │                                                                │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│  │                                                                │ │
│  │ FALHA                                                          │ │
│  │ ┌──────────────────────────────────────────────────────────┐ │ │
│  │ │ ❌  Não Atendeu                                [Adicionar]│ │ │
│  │ └──────────────────────────────────────────────────────────┘ │ │
│  │ ┌──────────────────────────────────────────────────────────┐ │ │
│  │ │ ❌  Desistiu                                   [Adicionar]│ │ │
│  │ └──────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  💬 Mensagens                                                        │
└─────────────────────────────────────────────────────────────────────┘

INTERAÇÕES:
• Clicar em "Presencial ×" → Remove tag Presencial da conversa
• Clicar em "Checkout ×" → Remove tag Checkout da conversa
• Clicar em "Teoria [Adicionar]" → Adiciona tag Teoria, some do popover, aparece na label
```

### Sidebar (Modo Filter)

```
┌─────────────────────────────────────┐
│ 💬 Conversas                        │
├─────────────────────────────────────┤
│                                     │
│ 🔍 [Buscar contato...]              │
│                                     │
│ Status:                             │
│ [Ativas (5)] [Pausadas (2)]        │
│ [Encerradas (3)] [Todas (10)]      │
│                                     │
│ Filtrar por Tags:                  │
│ ┌─────────────────────────────────┐ │
│ │ [🏷️ Presencial ×]               │ │ ← Tags ativas no filtro
│ │ [+ Filtrar por tags ▼]          │ │ ← PopoverTrigger
│ └─────────────────────────────────┘ │
│          ↓ (ao clicar)              │
│ ┌─────────────────────────────────┐ │
│ │ Todas as Tags                   │ │ ← PopoverContent
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│ │                                 │ │
│ │ INTENÇÃO                        │ │
│ │ ☑ Presencial                    │ │ ← Checkbox marcado
│ │ ☐ Teoria                        │ │
│ │ ☐ Teoria + Estágio              │ │
│ │                                 │ │
│ │ CHECKOUT                        │ │
│ │ ☐ Checkout Realizado            │ │
│ │                                 │ │
│ │ FALHA                           │ │
│ │ ☐ Não Atendeu                   │ │
│ │ ☐ Desistiu                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ 📋 Resultados (3 conversas)         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💬 João Silva                   │ │
│ │ [🏷️ Presencial] [✅ Checkout]   │ │ ← Tags da conversa
│ │ Olá, gostaria de...             │ │
│ │ 2min atrás                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💬 Maria Santos                 │ │
│ │ [🏷️ Presencial]                 │ │
│ │ Bom dia, preciso de...          │ │
│ │ 5min atrás                      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

INTERAÇÕES:
• Clicar em "Presencial ×" na label → Remove filtro
• Clicar em "☐ Teoria" no popover → Adiciona filtro, marca checkbox
• Clicar em "☑ Presencial" no popover → Remove filtro, desmarca checkbox
```

---

## 🏗️ Arquitetura de Componentes

### Hierarquia

```
TagSelector (Novo - componente principal)
├─ PopoverTrigger
│  ├─ SelectedTagsLabel (badges clicáveis)
│  └─ AddButton (+ Adicionar/Filtrar)
└─ PopoverContent
   └─ TagsList
      ├─ TagTypeSection (Intenção)
      │  └─ TagItem[]
      ├─ Separator
      ├─ TagTypeSection (Checkout)
      │  └─ TagItem[]
      ├─ Separator
      └─ TagTypeSection (Falha)
         └─ TagItem[]
```

---

## 📁 Estrutura de Arquivos

### Novos Arquivos

```
components/tags/
├─ tag-selector.tsx          # Componente principal
├─ tag-selector-trigger.tsx  # Trigger (label + botão)
├─ tag-selector-content.tsx  # Popover content
├─ tag-type-section.tsx      # Seção por tipo (Intenção/Checkout/Falha)
└─ tag-item.tsx              # Item individual no popover
```

### Arquivos Modificados

```
components/livechat/
├─ conversation-header.tsx   # Substituir TagTypeSelect/TagCheckbox por TagSelector
├─ contact-list.tsx          # Adicionar TagSelector para filtros
└─ contact-item.tsx          # Adicionar badges das tags (read-only)
```

### Arquivos Deprecados (não deletar ainda)

```
components/livechat/
├─ tag-type-select.tsx       # ⚠️ Deprecado - manter para rollback
└─ tag-checkbox.tsx          # ⚠️ Deprecado - manter para rollback
```

---

## 🎨 Design System

### Cores por Tipo de Tag

```typescript
const TAG_TYPE_CONFIG = {
  description: {
    label: 'Intenção',
    icon: Tag,
    emptyMessage: 'Nenhuma tag de intenção disponível',
  },
  success: {
    label: 'Checkout',
    icon: CheckCircle2,
    emptyMessage: 'Nenhuma tag de checkout disponível',
  },
  fail: {
    label: 'Falha',
    icon: XCircle,
    emptyMessage: 'Nenhuma tag de falha disponível',
  },
};
```

### Tamanhos de Badge

```typescript
const BADGE_SIZES = {
  xs: 'text-[10px] px-1.5 py-0.5',  // Card de conversa
  sm: 'text-xs px-2 py-1',          // Popover
  md: 'text-sm px-2.5 py-1',        // Label principal
};
```

---

## 🔧 API do Componente

### TagSelector Props

```typescript
interface TagSelectorProps {
  // Modo de operação
  mode: 'assign' | 'filter';

  // Tags selecionadas (assign: tags da conversa, filter: tags do filtro)
  selectedTags: Tag[];

  // Todas as tags disponíveis do neurocore
  availableTags: Tag[];

  // Callback quando tag é adicionada/removida
  onTagToggle: (tagId: string) => void | Promise<void>;

  // Loading state (enquanto chama API)
  isLoading?: boolean;

  // Desabilitar interação
  disabled?: boolean;

  // Placeholder do botão
  placeholder?: string;

  // Variant do popover
  variant?: 'default' | 'compact';

  // ID da conversa (apenas para modo assign)
  conversationId?: string;

  // ID do tenant (apenas para modo assign)
  tenantId?: string;
}
```

### TagSelector State

```typescript
interface TagSelectorState {
  // Popover aberto/fechado
  isOpen: boolean;

  // Loading individual por tag (UI otimista)
  loadingTags: Set<string>;

  // Busca dentro do popover (opcional)
  searchQuery: string;

  // Erro ao adicionar/remover tag
  error: string | null;
}
```

---

## 🔄 Fluxo de Dados

### Modo Assign (Header)

```
User clicks tag in label
         ↓
onTagToggle(tagId) called
         ↓
setState({ loadingTags: add(tagId) })  ← UI otimista
         ↓
API: POST /api/conversations/update-tag
     { conversationId, tagId: null, tenantId }
         ↓
     Success?
     ├─ Yes → Toast success
     │        router.refresh() ou realtime update
     │        setState({ loadingTags: remove(tagId) })
     │
     └─ No  → Toast error
              setState({ loadingTags: remove(tagId) })
              Revert UI (adiciona tag de volta)
```

### Modo Filter (Sidebar)

```
User clicks tag in popover
         ↓
onTagToggle(tagId) called
         ↓
setState({ selectedTags: toggle(tagId) })  ← Imediato (local)
         ↓
Filter conversations locally
         ↓
Update UI (lista de conversas filtrada)
```

---

## 🎯 Critérios de Aceitação

### Header (Modo Assign)

- [ ] ✅ Mostra todas as tags da conversa em uma linha horizontal
- [ ] ✅ Botão "+ Adicionar tags" sempre visível
- [ ] ✅ Popover abre ABAIXO do botão
- [ ] ✅ Tags agrupadas por tipo (Intenção, Checkout, Falha)
- [ ] ✅ Tags já aplicadas NÃO aparecem no popover
- [ ] ✅ Clicar em tag na label remove a tag (mostra X ao hover)
- [ ] ✅ Clicar em tag no popover adiciona a tag
- [ ] ✅ Tag adicionada some do popover e aparece na label
- [ ] ✅ Tag removida some da label e reaparece no popover
- [ ] ✅ Loading spinner na tag durante API call
- [ ] ✅ Toast de sucesso ao adicionar/remover
- [ ] ✅ Toast de erro se API falhar
- [ ] ✅ UI otimista (atualiza antes da resposta)
- [ ] ✅ Popover fecha após adicionar tag (opcional)
- [ ] ✅ Seções vazias não aparecem (se não houver tags daquele tipo)

### Sidebar (Modo Filter)

- [ ] ✅ Mostra tags do filtro em uma linha horizontal
- [ ] ✅ Botão "+ Filtrar por tags" sempre visível
- [ ] ✅ Popover abre ABAIXO do botão
- [ ] ✅ Tags agrupadas por tipo com checkboxes
- [ ] ✅ Checkboxes marcados para tags no filtro
- [ ] ✅ Clicar em tag na label remove do filtro
- [ ] ✅ Clicar em checkbox no popover adiciona/remove filtro
- [ ] ✅ Conversas filtradas em tempo real
- [ ] ✅ Contador de resultados atualizado
- [ ] ✅ Estado do filtro mantido durante navegação
- [ ] ✅ Popover permanece aberto ao clicar (não fecha)

### Cards de Conversa

- [ ] ✅ Mostra badges pequenos (xs) das tags
- [ ] ✅ Layout horizontal com wrap
- [ ] ✅ Não é clicável (read-only)
- [ ] ✅ Máximo de 3 tags visíveis (+ N mais se houver mais)

---

## 🧪 Casos de Teste

### Header (Assign)

1. **Adicionar primeira tag**
   - Estado inicial: nenhuma tag
   - Ação: clicar em "+ Adicionar", selecionar "Presencial"
   - Resultado: tag aparece na label, some do popover, API chamada

2. **Adicionar segunda tag**
   - Estado inicial: 1 tag (Presencial)
   - Ação: clicar em "+ Adicionar", selecionar "Checkout"
   - Resultado: 2 tags na label, ambas somem do popover

3. **Remover tag**
   - Estado inicial: 2 tags (Presencial, Checkout)
   - Ação: clicar em "Presencial ×"
   - Resultado: tag some da label, reaparece no popover, API chamada

4. **Erro de API**
   - Estado inicial: 1 tag
   - Ação: adicionar tag, API retorna erro
   - Resultado: toast de erro, tag não aparece na label

5. **Loading state**
   - Ação: adicionar tag, API demora
   - Resultado: spinner na tag, botão desabilitado

### Sidebar (Filter)

1. **Filtrar por 1 tag**
   - Ação: selecionar "Presencial"
   - Resultado: apenas conversas com tag Presencial aparecem

2. **Filtrar por múltiplas tags (AND)**
   - Ação: selecionar "Presencial" + "Checkout"
   - Resultado: apenas conversas com AMBAS as tags aparecem

3. **Remover filtro**
   - Estado: filtro ativo
   - Ação: clicar em tag na label
   - Resultado: filtro removido, todas conversas aparecem

4. **Nenhum resultado**
   - Ação: selecionar combinação sem resultados
   - Resultado: mensagem "Nenhuma conversa encontrada"

---

## 🚀 Implementação

### Fase 1: Componentes Base (1-2h)
- [ ] Instalar dependências shadcn (popover, command, scroll-area)
- [ ] Criar `TagSelector` básico
- [ ] Criar `TagSelectorTrigger` (label + botão)
- [ ] Criar `TagSelectorContent` (popover structure)
- [ ] Criar `TagTypeSection` (seção por tipo)
- [ ] Criar `TagItem` (item individual)

### Fase 2: Modo Assign (1-2h)
- [ ] Implementar lógica de toggle de tags
- [ ] Integrar com API `/api/conversations/update-tag`
- [ ] UI otimista + loading states
- [ ] Toast de sucesso/erro
- [ ] Substituir componentes antigos no header

### Fase 3: Modo Filter (1h)
- [ ] Implementar lógica de filtro local
- [ ] Estado do filtro (useState)
- [ ] Filtrar conversas client-side
- [ ] Integrar na sidebar

### Fase 4: Polimento (1h)
- [ ] Animações de transição
- [ ] Testes de casos extremos
- [ ] Responsividade mobile
- [ ] Acessibilidade (keyboard navigation)
- [ ] Documentação inline

### Fase 5: Testes (30min)
- [ ] Testar todos os casos de uso
- [ ] Validar UX com usuário
- [ ] Ajustes finais

**Estimativa Total:** 4-6 horas

---

## 📦 Dependências shadcn/ui

```bash
# Necessárias:
npx shadcn@latest add popover       # Para dropdown
npx shadcn@latest add scroll-area   # Para lista longa de tags
npx shadcn@latest add separator     # Para separar seções
npx shadcn@latest add checkbox      # Para modo filter

# Opcionais:
npx shadcn@latest add command       # Para busca dentro do popover
```

---

## 🎨 Variantes Visuais

### Variante Default (Desktop)

```
┌────────────────────────────────────────────┐
│ [🏷️ Tag1] [✅ Tag2] [+ Adicionar tags ▼] │  ← Altura: 40px
└────────────────────────────────────────────┘
```

### Variante Compact (Mobile/Sidebar)

```
┌──────────────────────────┐
│ [Tag1] [Tag2] [+ ▼]     │  ← Altura: 32px
└──────────────────────────┘
```

---

## 🔮 Melhorias Futuras

### v1.1 (Curto Prazo)
- [ ] Busca dentro do popover (filtrar tags)
- [ ] Atalhos de teclado (Ctrl+T para abrir)
- [ ] Histórico de tags mais usadas

### v1.2 (Médio Prazo)
- [ ] Drag & drop para reordenar tags
- [ ] Tags sugeridas pela IA
- [ ] Cores customizáveis por tag

### v2.0 (Longo Prazo)
- [ ] Tags hierárquicas (subcategorias)
- [ ] Tags com metadados (data de criação, quem aplicou)
- [ ] Analytics de uso de tags

---

## 📝 Notas de Implementação

### Performance
- Usar `useMemo` para filtrar tags disponíveis
- Debounce de busca no popover (se implementado)
- Lazy loading de tags se houver muitas (>50)

### Acessibilidade
- Labels ARIA adequados
- Navegação por teclado (Tab, Enter, Escape)
- Anúncio de mudanças para screen readers
- Contraste de cores (WCAG AA)

### Mobile
- Touch targets mínimos de 44x44px
- Popover fullscreen em telas pequenas
- Gestos de swipe para remover tags (opcional)

---

## ✅ Checklist Final

- [ ] Código implementado e testado
- [ ] TypeScript sem erros
- [ ] Build concluído com sucesso
- [ ] Testes manuais no browser
- [ ] Responsividade validada
- [ ] Acessibilidade validada
- [ ] Documentação atualizada
- [ ] Componentes antigos marcados como deprecated

---

## 🎉 Resultado Esperado

Após implementação, o usuário terá:

✅ **UX Superior:** Interface intuitiva e visual
✅ **Produtividade:** Adicionar/remover tags com 1 clique
✅ **Organização:** Todas as tags em um só lugar
✅ **Flexibilidade:** Funciona para atribuir e filtrar
✅ **Consistência:** Mesmo padrão em toda aplicação

---

**Status:** 📝 Documentado - Pronto para Implementação
**Próximo Passo:** Iniciar Fase 1 (Componentes Base)
