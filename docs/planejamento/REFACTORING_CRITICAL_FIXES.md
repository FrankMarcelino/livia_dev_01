# Refatoração Crítica - LIVIA MVP

**Data de Criação:** 2025-12-04
**Última Atualização:** 2025-12-04 (Sessão interrompida - 52k tokens)
**Estimativa Total:** 5 horas
**Tempo Gasto:** ~1.5 horas
**Progresso:** 40% completo
**Objetivo:** Eliminar violações críticas de SOLID antes de implementar Agent Templates

---

## 🚀 STATUS ATUAL (2025-12-04)

### ✅ COMPLETO (Fase 1 - 100%)
- ✅ Hook `useApiCall` criado (`lib/hooks/use-api-call.ts`) - 125 linhas
- ✅ Hook `useDialogState` criado (`lib/hooks/use-dialog-state.ts`) - 67 linhas
- ✅ Arquivo de constantes criado (`config/constants.ts`) - 180 linhas
- ✅ Exports atualizados em `lib/hooks/index.ts`

### 🔄 EM PROGRESSO (Fase 2 - 15%)
- ✅ **`conversation-controls.tsx`** - COMPLETO (4 API calls refatorados, ~80 linhas reduzidas)
- ⏳ **`customer-data-panel.tsx`** - INICIADO (import adicionado, mas loadContact e saveContact ainda precisam ser refatorados)

### ⏸️ PENDENTE (Fase 2 - 85%)
Componentes que ainda precisam usar `useApiCall`:
- ⏳ `customer-data-panel.tsx` (finalizar - 2 calls restantes)
- ⏳ `quick-replies-panel.tsx` (2 calls)
- ⏳ `message-input.tsx` (1 call)
- ⏳ `message-feedback-buttons.tsx` (1 call)
- ⏳ `neurocore-chat.tsx` (1 call)
- ⏳ `quick-reply-dialog.tsx` (1 call)

### ⏸️ PENDENTE (Fase 3 - Dialog State)
Componentes que precisam usar `useDialogState`:
- ⏳ `quick-reply-dialog.tsx`
- ⏳ `quick-replies-panel.tsx`
- ⏳ `message-feedback-buttons.tsx`
- ⏳ `base-conhecimento-form-dialog.tsx`
- ⏳ `pause-ia-confirm-dialog.tsx`

### ⏸️ PENDENTE (Fase 4 - Magic Numbers)
- ⏳ Substituir magic numbers em 4 componentes

### ⏸️ PENDENTE (Fase 5 - Testes)
- ⏳ `npm run type-check`
- ⏳ `npm run lint`
- ⏳ `npm run build`
- ⏳ Testes manuais

### ⏸️ PENDENTE (Documentação)
- ⏳ Adicionar Decisão #021 em DECISIONS.md

---

## 📝 NOTAS PARA O PRÓXIMO AGENTE

### Arquivos Criados
1. `/home/frank/projeto/lib/hooks/use-api-call.ts` ✅
2. `/home/frank/projeto/lib/hooks/use-dialog-state.ts` ✅
3. `/home/frank/projeto/config/constants.ts` ✅
4. `/home/frank/projeto/lib/hooks/index.ts` (atualizado) ✅

### Arquivos Refatorados
1. `/home/frank/projeto/components/livechat/conversation-controls.tsx` ✅ COMPLETO
   - 4 API calls substituídos por `useApiCall`
   - ~80 linhas de código eliminadas
   - Loading states consolidados
   - Error handling padronizado

2. `/home/frank/projeto/components/livechat/customer-data-panel.tsx` ⏳ PARCIAL
   - Import do `useApiCall` adicionado
   - **PENDENTE:** Refatorar `loadContact()` (linha 55)
   - **PENDENTE:** Refatorar `saveContact()` (linha 134)

### Próximos Passos Recomendados
1. **Continuar Fase 2:** Finalizar `customer-data-panel.tsx` + refatorar os 5 componentes restantes
2. **Fase 3:** Refatorar dialog states (rápido - 30min estimado)
3. **Fase 4:** Substituir magic numbers (rápido - 20min estimado)
4. **Fase 5:** CRÍTICO - Rodar testes antes de finalizar
5. **Documentação:** Adicionar Decisão #021

### Padrão de Refatoração Aplicado

**ANTES:**
```tsx
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    if (!response.ok) throw new Error('Erro');
    const result = await response.json();
    toast.success('Sucesso!');
    onUpdate?.();
  } catch (error) {
    console.error('Erro:', error);
    toast.error('Erro ao processar');
  } finally {
    setIsLoading(false);
  }
};
```

**DEPOIS:**
```tsx
import { useApiCall } from '@/lib/hooks';

const apiCall = useApiCall('/api/endpoint', 'POST', {
  successMessage: 'Sucesso!',
  errorMessage: 'Erro ao processar',
  onSuccess: () => onUpdate?.(),
});

const handleAction = async () => {
  await apiCall.execute({ data });
};

// Usar apiCall.isLoading no JSX
```

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Problemas Identificados](#problemas-identificados)
3. [Soluções Propostas](#soluções-propostas)
4. [Cronograma de Implementação](#cronograma-de-implementação)
5. [Checklist de Implementação](#checklist-de-implementação)
6. [Testes](#testes)
7. [Critérios de Aceitação](#critérios-de-aceitação)
8. [Exemplos de Código](#exemplos-de-código)

---

## 🎯 Visão Geral

### Contexto

Análise da codebase identificou **2 problemas críticos** que afetam:
- ✅ 12+ componentes (violação de DIP - Dependency Inversion Principle)
- ✅ 5 padrões de código duplicado (violação de DRY - Don't Repeat Yourself)
- ✅ Inconsistências em error handling
- ✅ Magic numbers espalhados pelo código

### Objetivo

Refatorar código existente para:
1. **Eliminar API calls diretas** nos componentes (criar abstração)
2. **Eliminar código duplicado** (dialog state, loading state)
3. **Centralizar constantes** (magic numbers)
4. **Garantir que Agent Templates** já nasça com código limpo

### Benefícios

- ✅ **Testabilidade**: Hooks podem ser testados isoladamente
- ✅ **Manutenibilidade**: Mudanças em API calls em um lugar só
- ✅ **Consistência**: Mesmo padrão de error handling em toda app
- ✅ **DRY**: Elimina 200+ linhas de código duplicado
- ✅ **SOLID**: Componentes seguem Dependency Inversion Principle

---

## 🔴 Problemas Identificados

### Problema #1: Violação de DIP (Dependency Inversion Principle)

**Severidade:** CRÍTICA
**Arquivos Afetados:** 12 componentes

**Componentes com API calls diretas:**
1. `components/livechat/customer-data-panel.tsx` (4 calls)
2. `components/livechat/conversation-controls.tsx` (4 calls)
3. `components/livechat/message-feedback-buttons.tsx` (1 call)
4. `components/livechat/quick-replies-panel.tsx` (2 calls)
5. `components/livechat/message-input.tsx` (1 call)
6. `components/neurocore/neurocore-chat.tsx` (1 call)
7. `components/livechat/quick-reply-dialog.tsx` (1 call)
8. `components/knowledge-base/base-conhecimento-form-dialog.tsx` (estimado: 1 call)

**Padrão Repetido (15+ linhas por ocorrência):**
```tsx
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      throw new Error('Erro na requisição');
    }

    const result = await response.json();
    toast.success('Sucesso!');
    onSuccess?.();
  } catch (error) {
    console.error('Erro:', error);
    toast.error('Erro ao processar');
  } finally {
    setIsLoading(false);
  }
};
```

**Total de Código Duplicado:** ~180 linhas (12 componentes × 15 linhas)

---

### Problema #2: Dialog State Duplicado

**Severidade:** ALTA
**Arquivos Afetados:** 5+ componentes

**Componentes com dialog state:**
1. `components/livechat/quick-reply-dialog.tsx`
2. `components/livechat/quick-replies-panel.tsx`
3. `components/livechat/message-feedback-buttons.tsx`
4. `components/livechat/pause-ia-confirm-dialog.tsx`
5. `components/knowledge-base/base-conhecimento-form-dialog.tsx`

**Padrão Repetido (10+ linhas por ocorrência):**
```tsx
const [open, setOpen] = useState(false);
const [editing, setEditing] = useState<Item | null>(null);

const handleOpen = (item?: Item) => {
  if (item) setEditing(item);
  setOpen(true);
};

const handleClose = () => {
  setOpen(false);
  setEditing(null);
};
```

**Total de Código Duplicado:** ~50 linhas (5 componentes × 10 linhas)

---

### Problema #3: Error Handling Inconsistente

**Severidade:** MÉDIA
**Arquivos Afetados:** 12+ componentes

**3 Padrões Diferentes:**
- ❌ `alert()` + `console.error()` (conversation-controls.tsx)
- ❌ `toast.error()` + `console.error()` (message-input.tsx)
- ❌ Apenas `console.error()` (quick-replies-panel.tsx)

**Problema:** Não há consistência na UX de erros.

---

### Problema #4: Magic Numbers

**Severidade:** BAIXA
**Arquivos Afetados:** 5+ componentes

**Exemplos:**
```tsx
// quick-replies-panel.tsx:169
const top3Ids = allQuickReplies.slice(0, 3); // Por que 3?

// message-input.tsx:98
await new Promise((resolve) => setTimeout(resolve, 300)); // Por que 300ms?

// neurocore-chat.tsx:78
return updated.slice(-20); // Por que 20?

// conversation-view.tsx:55
const MIN_LOADING_TIME = 150; // Por que 150ms?
```

---

## ✅ Soluções Propostas

### Solução #1: Hook `useApiCall`

**Objetivo:** Abstrair todas as chamadas de API, eliminar código duplicado.

**Funcionalidades:**
- ✅ Loading state automático
- ✅ Error handling consistente
- ✅ Success callback opcional
- ✅ Retry logic preparado (futuro)
- ✅ Timeout configurável

**Arquivo:** `lib/hooks/use-api-call.ts`

**Benefícios:**
- Reduz 180+ linhas de código duplicado
- Centraliza error handling
- Facilita testes (mock o hook, não fetch global)
- Permite adicionar retry/timeout facilmente

---

### Solução #2: Hook `useDialogState`

**Objetivo:** Gerenciar estado de dialogs/modals de forma consistente.

**Funcionalidades:**
- ✅ Open/close state
- ✅ Item editing state
- ✅ Reset automático ao fechar
- ✅ Type-safe com generics

**Arquivo:** `lib/hooks/use-dialog-state.ts`

**Benefícios:**
- Reduz 50+ linhas de código duplicado
- Padrão consistente em todos os dialogs
- Menos bugs (esquecer de resetar state)

---

### Solução #3: Arquivo de Constantes

**Objetivo:** Centralizar magic numbers e configurações.

**Arquivo:** `config/constants.ts`

**Categorias:**
- `API_CONFIG` - Delays, timeouts, retry
- `UI_CONFIG` - Min loading times, animations
- `PAGINATION` - Items per page, limits
- `QUICK_REPLIES` - Top count, max usage

**Benefícios:**
- Fácil ajustar valores sem procurar no código
- Documentação clara do porquê de cada valor
- Type-safe com TypeScript

---

## 📅 Cronograma de Implementação

### Sprint 1: Criar Abstrações (2h)

**Tarefa 1.1:** Criar `useApiCall` hook (1h)
- Implementar hook base
- Adicionar types TypeScript
- Adicionar testes unitários (opcional)

**Tarefa 1.2:** Criar `useDialogState` hook (30min)
- Implementar hook base
- Adicionar types com generics

**Tarefa 1.3:** Criar arquivo de constantes (30min)
- Extrair todos os magic numbers
- Organizar por categoria
- Adicionar comentários explicativos

---

### Sprint 2: Refatorar Componentes (2.5h)

**Tarefa 2.1:** Refatorar componentes com API calls (2h)

**Ordem de refatoração:**
1. `conversation-controls.tsx` - 4 calls (mais complexo)
2. `customer-data-panel.tsx` - 4 calls
3. `quick-replies-panel.tsx` - 2 calls
4. `message-input.tsx` - 1 call
5. `message-feedback-buttons.tsx` - 1 call
6. `neurocore-chat.tsx` - 1 call
7. `quick-reply-dialog.tsx` - 1 call

**Tarefa 2.2:** Refatorar dialogs (30min)
1. `quick-reply-dialog.tsx`
2. `quick-replies-panel.tsx`
3. `message-feedback-buttons.tsx`
4. `base-conhecimento-form-dialog.tsx`
5. `pause-ia-confirm-dialog.tsx`

---

### Sprint 3: Testes e Validação (30min)

**Tarefa 3.1:** Executar testes (20min)
- ✅ `npm run type-check` (TypeScript)
- ✅ `npm run lint` (ESLint)
- ✅ `npm run build` (Build production)

**Tarefa 3.2:** Testes manuais (10min)
- ✅ Testar 1 componente de cada tipo refatorado
- ✅ Verificar error handling funciona
- ✅ Verificar loading states funcionam

---

### Sprint 4: Documentação (30min)

**Tarefa 4.1:** Atualizar DECISIONS.md
- Adicionar Decisão #021: Abstração de API Calls

**Tarefa 4.2:** Atualizar BACKLOG.md
- Marcar refatoração como concluída

**Tarefa 4.3:** Criar exemplos no código
- Adicionar JSDoc nos hooks
- Adicionar comentários de uso

---

## ✅ Checklist de Implementação

### Fase 1: Criar Hooks e Constantes ✅ COMPLETO

- [x] **Criar `lib/hooks/use-api-call.ts`** ✅
  - [x] Interface `UseApiCallOptions`
  - [x] Interface `UseApiCallResult`
  - [x] Função `useApiCall<T>`
  - [x] Loading state management
  - [x] Error handling com toast
  - [x] Success callback + clearError
  - [x] JSDoc documentation
  - [x] Export no `lib/hooks/index.ts`

- [x] **Criar `lib/hooks/use-dialog-state.ts`** ✅
  - [x] Interface `UseDialogStateResult<T>`
  - [x] Função `useDialogState<T>`
  - [x] Open/close handlers
  - [x] Item editing state (generic T)
  - [x] Reset logic com animation delay
  - [x] JSDoc documentation completa
  - [x] Export no `lib/hooks/index.ts`

- [x] **Criar `config/constants.ts`** ✅
  - [x] `DIALOG_ANIMATION_DELAY` + `SEARCH_DEBOUNCE_DELAY`
  - [x] `TOAST_SUCCESS_DURATION` + `TOAST_ERROR_DURATION`
  - [x] `MAX_NEUROCORE_QUERIES` + `MAX_TOP_QUICK_REPLIES`
  - [x] `MIN_QUERY_LENGTH` + validações
  - [x] `CONVERSATION_STATUS` + `SYNAPSE_STATUS` + enums
  - [x] JSDoc comments completos + type exports

---

### Fase 2: Refatorar Componentes (API Calls)

**Para cada componente:**
1. [ ] Import `useApiCall` hook
2. [ ] Substituir `fetch()` direto por `useApiCall`
3. [ ] Remover `useState` de loading
4. [ ] Remover bloco try/catch (hook gerencia)
5. [ ] Testar funcionamento
6. [ ] Commit individual

**Lista de componentes:**

- [x] **`conversation-controls.tsx`** (4 calls) ✅ COMPLETO
  - [x] Substituir `handlePauseIAConfirm`
  - [x] Substituir `handlePauseConversation`
  - [x] Substituir `handleResumeConversation`
  - [x] Substituir `handleReopenConversation`
  - [x] Remover 4 blocos try/catch (~80 linhas)
  - [ ] Testar todos os botões (PENDENTE)

- [ ] **`customer-data-panel.tsx`** (2 calls) ⏳ INICIADO
  - [ ] Substituir `loadContact` (linha 55)
  - [ ] Substituir `saveContact` (linha 134)
  - [x] Import de `useApiCall` adicionado
  - [ ] Simplificar loading state

- [ ] **`quick-replies-panel.tsx`** (2 calls)
  - [ ] Substituir `handleUseQuickReply`
  - [ ] Substituir `handleDelete`

- [ ] **`message-input.tsx`** (1 call)
  - [ ] Substituir envio de mensagem
  - [ ] Manter lógica de auto-pause IA

- [ ] **`message-feedback-buttons.tsx`** (1 call)
  - [ ] Substituir envio de feedback

- [ ] **`neurocore-chat.tsx`** (1 call)
  - [ ] Substituir query submission

- [ ] **`quick-reply-dialog.tsx`** (1 call)
  - [ ] Substituir save/create

---

### Fase 3: Refatorar Componentes (Dialog State)

**Para cada componente:**
1. [ ] Import `useDialogState` hook
2. [ ] Substituir `useState` de open/editing
3. [ ] Usar `handleOpen`/`handleClose` do hook
4. [ ] Remover lógica de reset manual
5. [ ] Testar funcionamento
6. [ ] Commit individual

**Lista de componentes:**

- [ ] **`quick-reply-dialog.tsx`**
  - [ ] Substituir open/editing state
  - [ ] Usar hook handlers

- [ ] **`quick-replies-panel.tsx`**
  - [ ] Substituir dialog state do delete confirmation

- [ ] **`message-feedback-buttons.tsx`**
  - [ ] Substituir dialog state do feedback

- [ ] **`base-conhecimento-form-dialog.tsx`**
  - [ ] Substituir open/editing state

- [ ] **`pause-ia-confirm-dialog.tsx`**
  - [ ] Substituir open state (não tem editing)

---

### Fase 4: Substituir Magic Numbers

- [ ] **`quick-replies-panel.tsx`**
  - [ ] Substituir `slice(0, 3)` por `QUICK_REPLIES_CONFIG.TOP_COUNT`

- [ ] **`message-input.tsx`**
  - [ ] Substituir `setTimeout(300)` por `API_CONFIG.DEBOUNCE_DELAY`

- [ ] **`neurocore-chat.tsx`**
  - [ ] Substituir `slice(-20)` por `NEUROCORE_CONFIG.MAX_HISTORY`

- [ ] **`conversation-view.tsx`**
  - [ ] Substituir `MIN_LOADING_TIME = 150` por `UI_CONFIG.MIN_LOADING_TIME`

---

### Fase 5: Testes

- [ ] **TypeScript Type Check**
  - [ ] Executar: `npm run type-check`
  - [ ] Verificar: Zero erros
  - [ ] Corrigir qualquer type error

- [ ] **ESLint**
  - [ ] Executar: `npm run lint`
  - [ ] Verificar: Zero erros críticos
  - [ ] Corrigir warnings (se possível)

- [ ] **Build Production**
  - [ ] Executar: `npm run build`
  - [ ] Verificar: Build completa sem erros
  - [ ] Verificar: Sem warnings graves
  - [ ] Anotar build time (comparar com baseline ~14-18s)

- [ ] **Testes Manuais**
  - [ ] Testar conversation controls (pause/resume)
  - [ ] Testar quick replies (usar, editar, deletar)
  - [ ] Testar message feedback (like/dislike)
  - [ ] Testar customer data panel (save)
  - [ ] Testar neurocore query submission
  - [ ] Verificar loading states aparecem
  - [ ] Verificar error handling funciona (forçar erro)
  - [ ] Verificar toast notifications aparecem

---

### Fase 6: Documentação

- [ ] **Atualizar DECISIONS.md**
  - [ ] Adicionar Decisão #021: Abstração de API Calls com useApiCall
  - [ ] Incluir: Contexto, Opções, Decisão, Consequências, Exemplos

- [ ] **Atualizar BACKLOG.md**
  - [ ] Adicionar item: BACKLOG-016: Refatoração Crítica de SOLID
  - [ ] Marcar como concluído

- [ ] **Atualizar este documento**
  - [ ] Marcar todas as checkboxes
  - [ ] Adicionar seção "Resultados" com métricas finais

- [ ] **Criar exemplos de uso**
  - [ ] Adicionar JSDoc examples nos hooks
  - [ ] Adicionar comentários inline em 1-2 componentes refatorados

---

## 🧪 Testes

### Testes Automatizados

#### 1. TypeScript Type Check
```bash
npm run type-check
```

**Critério de Aceitação:**
- ✅ Zero erros de tipo
- ✅ Todos os tipos inferidos corretamente

**Se houver erros:**
- Verificar imports corretos dos hooks
- Verificar generics de `useApiCall<T>` e `useDialogState<T>`
- Verificar types das constantes

---

#### 2. ESLint
```bash
npm run lint
```

**Critério de Aceitação:**
- ✅ Zero erros críticos
- ⚠️ Warnings aceitáveis (max 5)

**Se houver erros:**
- Verificar imports não usados
- Verificar variáveis não usadas após refatoração
- Executar `npm run lint -- --fix` para auto-fix

---

#### 3. Build Production
```bash
npm run build
```

**Critério de Aceitação:**
- ✅ Build completa sem erros
- ✅ Build time entre 12-20s (baseline: 14-18s)
- ⚠️ Warnings aceitáveis se não afetarem funcionalidade

**Métricas a coletar:**
- Build time total
- Tamanho do bundle (se disponível)
- Número de warnings

---

### Testes Manuais

#### Checklist de Funcionalidades

**Livechat - Conversation Controls:**
- [ ] Pausar IA funciona
- [ ] Retomar IA funciona
- [ ] Pausar conversa funciona
- [ ] Retomar conversa funciona
- [ ] Reabrir conversa encerrada funciona
- [ ] Loading states aparecem
- [ ] Toast de sucesso aparece
- [ ] Toast de erro aparece (forçar erro desligando backend)

**Livechat - Quick Replies:**
- [ ] Abrir painel de quick replies funciona
- [ ] Usar quick reply insere no input
- [ ] Editar quick reply salva corretamente
- [ ] Deletar quick reply funciona
- [ ] Dialog de confirmação aparece
- [ ] Loading states funcionam

**Livechat - Message Feedback:**
- [ ] Like em mensagem funciona
- [ ] Dislike abre modal de comentário
- [ ] Salvar feedback com comentário funciona
- [ ] Loading state aparece

**Livechat - Customer Data Panel:**
- [ ] Load contact data funciona
- [ ] Save contact data funciona
- [ ] Validação de campos funciona
- [ ] Toast de sucesso/erro aparecem

**Neurocore:**
- [ ] Submit query funciona
- [ ] Loading state aparece
- [ ] Response renderiza corretamente
- [ ] Error handling funciona

**Knowledge Base:**
- [ ] Criar base funciona
- [ ] Editar base funciona
- [ ] Dialog state gerenciado corretamente

---

### Testes de Regressão

**Verificar que nada quebrou:**
- [ ] Sidebar funciona (collapse/expand)
- [ ] Navegação entre páginas funciona
- [ ] Realtime continua funcionando (mensagens aparecem)
- [ ] Filters no livechat funcionam (Ativas/Aguardando/Todas)
- [ ] CRM Kanban carrega corretamente
- [ ] Profile page carrega
- [ ] Logout funciona

---

## ✅ Critérios de Aceitação

### Critérios Funcionais

1. **API Calls Abstraídos**
   - ✅ Nenhum componente usa `fetch()` diretamente
   - ✅ Todos usam `useApiCall` hook
   - ✅ Error handling consistente em todos

2. **Dialog State Unificado**
   - ✅ Todos os dialogs usam `useDialogState`
   - ✅ Padrão consistente de open/close
   - ✅ Reset automático ao fechar

3. **Constantes Centralizadas**
   - ✅ Zero magic numbers no código refatorado
   - ✅ Todos os valores em `config/constants.ts`
   - ✅ Comentários explicativos presentes

4. **Testes Passam**
   - ✅ Type-check: 0 erros
   - ✅ Lint: 0 erros críticos
   - ✅ Build: completa sem erros
   - ✅ Testes manuais: todas funcionalidades OK

---

### Critérios Não-Funcionais

1. **Performance**
   - ✅ Build time não aumentou >10%
   - ✅ Nenhuma regressão de performance perceptível

2. **Manutenibilidade**
   - ✅ Código mais limpo e legível
   - ✅ Menos linhas de código total (~230 linhas eliminadas)
   - ✅ Padrões consistentes

3. **Documentação**
   - ✅ Hooks têm JSDoc completo
   - ✅ Constantes têm comentários explicativos
   - ✅ DECISIONS.md atualizado
   - ✅ Este documento completo

---

## 📝 Exemplos de Código

### Exemplo 1: Hook `useApiCall`

**Implementação (`lib/hooks/use-api-call.ts`):**
```tsx
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface UseApiCallOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export interface UseApiCallResult<T> {
  execute: (body?: any) => Promise<T | null>;
  isLoading: boolean;
  error: Error | null;
}

export function useApiCall<T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options?: UseApiCallOptions<T>
): UseApiCallResult<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (body?: any): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        const data = await response.json();

        // Success callback
        if (options?.onSuccess) {
          options.onSuccess(data);
        }

        // Success toast
        if (options?.successMessage) {
          toast.success(options.successMessage);
        }

        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        console.error(`[useApiCall] ${method} ${url}:`, error);

        // Error callback
        if (options?.onError) {
          options.onError(error);
        }

        // Error toast
        toast.error(options?.errorMessage || error.message);

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [url, method, options]
  );

  return { execute, isLoading, error };
}
```

**Uso no componente:**
```tsx
// ANTES (15+ linhas)
const [isLoading, setIsLoading] = useState(false);

const handlePauseIA = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/conversations/pause-ia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, tenantId }),
    });

    if (!response.ok) throw new Error('Erro ao pausar IA');

    toast.success('IA pausada com sucesso');
    onUpdate?.();
  } catch (error) {
    console.error(error);
    alert('Erro ao pausar IA');
  } finally {
    setIsLoading(false);
  }
};

// DEPOIS (3 linhas)
const { execute: pauseIA, isLoading } = useApiCall(
  '/api/conversations/pause-ia',
  'POST',
  {
    successMessage: 'IA pausada com sucesso',
    onSuccess: () => onUpdate?.(),
  }
);

const handlePauseIA = () => pauseIA({ conversationId, tenantId });
```

---

### Exemplo 2: Hook `useDialogState`

**Implementação (`lib/hooks/use-dialog-state.ts`):**
```tsx
import { useState, useCallback } from 'react';

export interface DialogState<T> {
  open: boolean;
  item: T | null;
  handleOpen: (item?: T) => void;
  handleClose: () => void;
  setItem: (item: T | null) => void;
}

export function useDialogState<T = any>(): DialogState<T> {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<T | null>(null);

  const handleOpen = useCallback((data?: T) => {
    if (data) {
      setItem(data);
    }
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    // Reset item after animation completes
    setTimeout(() => setItem(null), 200);
  }, []);

  return {
    open,
    item,
    handleOpen,
    handleClose,
    setItem,
  };
}
```

**Uso no componente:**
```tsx
// ANTES (10 linhas)
const [open, setOpen] = useState(false);
const [editing, setEditing] = useState<QuickReply | null>(null);

const handleOpen = (reply?: QuickReply) => {
  if (reply) setEditing(reply);
  setOpen(true);
};

const handleClose = () => {
  setOpen(false);
  setEditing(null);
};

// DEPOIS (1 linha)
const dialog = useDialogState<QuickReply>();

// Uso:
<Button onClick={() => dialog.handleOpen(reply)}>Editar</Button>
<Dialog open={dialog.open} onOpenChange={dialog.handleClose}>
  {/* ... */}
</Dialog>
```

---

### Exemplo 3: Arquivo de Constantes

**Implementação (`config/constants.ts`):**
```tsx
/**
 * Configurações centralizadas da aplicação LIVIA MVP
 *
 * Todos os valores "mágicos" devem estar aqui com comentários explicativos.
 */

export const API_CONFIG = {
  /**
   * Delay antes de fazer debounce em inputs de busca
   * Valor: 300ms - tempo suficiente para usuário parar de digitar
   */
  DEBOUNCE_DELAY: 300,

  /**
   * Timeout padrão para chamadas de API
   * Valor: 30000ms (30s) - tempo máximo esperado para n8n responder
   */
  DEFAULT_TIMEOUT: 30000,
} as const;

export const UI_CONFIG = {
  /**
   * Tempo mínimo de loading para evitar "flash" na UI
   * Valor: 150ms - imperceptível mas evita flicker
   */
  MIN_LOADING_TIME: 150,

  /**
   * Delay para fechar toast de sucesso automaticamente
   * Valor: 3000ms (3s) - tempo suficiente para usuário ler
   */
  TOAST_AUTO_DISMISS: 3000,
} as const;

export const QUICK_REPLIES_CONFIG = {
  /**
   * Quantidade de quick replies "top" (mais usadas) a destacar
   * Valor: 3 - cabe bem na UI sem poluir
   */
  TOP_COUNT: 3,

  /**
   * Máximo de quick replies a exibir na lista de "mais usadas"
   * Valor: 10 - balance entre utilidade e performance
   */
  MAX_POPULAR_DISPLAY: 10,
} as const;

export const NEUROCORE_CONFIG = {
  /**
   * Máximo de queries no histórico local (não persiste no banco)
   * Valor: 20 - evita problemas de performance com arrays grandes
   */
  MAX_HISTORY: 20,

  /**
   * Timeout para query ao n8n
   * Valor: 30000ms (30s) - queries podem demorar (busca vetorial + LLM)
   */
  QUERY_TIMEOUT: 30000,
} as const;

export const PAGINATION = {
  /**
   * Itens por página em listas/tabelas
   * Valor: 50 - balance entre performance e UX (menos paginação)
   */
  ITEMS_PER_PAGE: 50,

  /**
   * Máximo de synapses antes de recomendar paginação
   * Valor: 100 - performance começa a degradar após isso
   */
  SYNAPSE_WARNING_THRESHOLD: 100,
} as const;
```

**Uso no componente:**
```tsx
// ANTES
const top3Ids = allQuickReplies.slice(0, 3);

// DEPOIS
import { QUICK_REPLIES_CONFIG } from '@/config/constants';
const topIds = allQuickReplies.slice(0, QUICK_REPLIES_CONFIG.TOP_COUNT);
```

---

## 📊 Métricas Esperadas

### Antes da Refatoração

| Métrica | Valor |
|---------|-------|
| Componentes com API calls diretas | 12 |
| Componentes com dialog state duplicado | 5 |
| Linhas de código duplicado | ~230 |
| Magic numbers | 5+ |
| Padrões de error handling | 3 diferentes |
| Build time | 14-18s |

### Depois da Refatoração (Esperado)

| Métrica | Valor | Delta |
|---------|-------|-------|
| Componentes com API calls diretas | 0 | -12 ✅ |
| Componentes com dialog state duplicado | 0 | -5 ✅ |
| Linhas de código duplicado | 0 | -230 ✅ |
| Magic numbers | 0 | -5+ ✅ |
| Padrões de error handling | 1 (consistente) | -2 ✅ |
| Build time | 14-19s | +0-1s ⚠️ (aceitável) |
| Hooks criados | 2 | +2 |
| Arquivos de config criados | 1 | +1 |

---

## 🚀 Próximos Passos (Pós-Refatoração)

Após completar esta refatoração:

1. **Implementar Agent Templates UI**
   - Já terá padrões corretos desde o início
   - Usar `useApiCall` para todas as operações
   - Usar `useDialogState` para formulários
   - Seguir constantes para magic numbers

2. **Adicionar Testes Unitários** (Opcional)
   - Testes para `useApiCall`
   - Testes para `useDialogState`
   - Mock fácil (sem mockar fetch global)

3. **Melhorias Futuras**
   - Adicionar retry logic no `useApiCall`
   - Adicionar timeout configurável
   - Criar hook `useApiMutation` para operações com cache invalidation

---

## 📚 Referências

- **SOLID Principles**: https://en.wikipedia.org/wiki/SOLID
- **DRY Principle**: https://en.wikipedia.org/wiki/Don%27t_repeat_yourself
- **React Hooks Best Practices**: https://react.dev/learn/reusing-logic-with-custom-hooks
- **TypeScript Generics**: https://www.typescriptlang.org/docs/handbook/2/generics.html

---

## 📝 Notas de Implementação

### Decisões Tomadas Durante Implementação

_(Atualizar conforme decisões forem tomadas durante a implementação)_

- [ ] Decisão sobre timeout padrão de API calls
- [ ] Decisão sobre retry logic (implementar agora ou depois?)
- [ ] Decisão sobre logging (console.error vs serviço centralizado)

### Problemas Encontrados

_(Documentar problemas e soluções durante implementação)_

### Melhorias Identificadas

_(Anotar melhorias adicionais identificadas durante refatoração)_

---

**Status:** 📋 Planejamento Completo - Pronto para Implementação
**Última Atualização:** 2025-12-04
