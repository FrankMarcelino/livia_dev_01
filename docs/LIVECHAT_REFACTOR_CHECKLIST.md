# ✅ Checklist: Refatoração Livechat Realtime + SOLID

**Objetivo:** Corrigir bug de atualização em tempo real dos cards e aplicar princípios SOLID

**Plano Completo:** [LIVECHAT_REALTIME_REFACTOR_SOLID.md](./LIVECHAT_REALTIME_REFACTOR_SOLID.md)

**Data de Início:** ___/___/2025
**Tempo Estimado Total:** 12-14 horas

---

## 📊 Progresso Geral

```
[0/8] Fases Concluídas
[0%] Progresso Total
```

**Status:**
- 🔴 Não iniciado
- 🟡 Em progresso
- 🟢 Concluído
- ⚠️ Bloqueado

---

## 🧪 Fase 0: Setup de Testes (30min)

**Status:** 🔴 Não iniciado
**Início:** ___:___  |  **Fim:** ___:___

### Tarefas

- [ ] Instalar dependências de teste
  ```bash
  npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
  ```

- [ ] Criar `vitest.config.ts`
  - [ ] Configurar plugin React
  - [ ] Configurar environment jsdom
  - [ ] Configurar alias `@`
  - [ ] Configurar setupFiles

- [ ] Criar `lib/__tests__/setup.ts`
  - [ ] Importar `@testing-library/jest-dom`
  - [ ] Mock do Supabase client

- [ ] Criar `lib/__tests__/mocks/supabase.ts`
  - [ ] Mock do createClient
  - [ ] Mock de queries (from, select, eq, etc)
  - [ ] Mock de realtime (channel, on, subscribe)

- [ ] Criar `lib/__tests__/fixtures/conversations.ts`
  - [ ] `mockConversation` (1 conversa completa)
  - [ ] `mockConversations` (array de conversas)
  - [ ] `mockContact` (dados de contato)
  - [ ] `mockMessage` (mensagem)

- [ ] Adicionar scripts ao `package.json`
  ```json
  {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
  ```

- [ ] Validar setup
  ```bash
  npm run test  # Deve rodar sem erros (0 testes por enquanto)
  ```

### ✅ Critério de Aceite
- [ ] `npm run test` roda sem erros
- [ ] Fixtures criadas e exportadas corretamente
- [ ] Mocks do Supabase funcionando

---

## 📦 Fase 1: Interfaces e Tipos (1h)

**Status:** 🔴 Não iniciado
**Início:** ___:___  |  **Fim:** ___:___

### Tarefas

- [ ] Criar `lib/repositories/interfaces/IConversationRepository.ts`
  - [ ] Interface `IConversationRepository`
  - [ ] Método `getById(id, tenantId)`
  - [ ] Método `getByTenant(tenantId, filters?)`
  - [ ] Método `getContactById(contactId, tenantId)`
  - [ ] JSDoc completo

- [ ] Criar `lib/services/interfaces/IRealtimeService.ts`
  - [ ] Interface `RealtimeSubscriptionConfig`
  - [ ] Interface `IRealtimeService`
  - [ ] Método `subscribe(config, callback)`
  - [ ] Método `unsubscribe(channel)`
  - [ ] JSDoc completo

- [ ] Criar `types/livechat-ui.ts`
  - [ ] Interface `ConversationCardData` (tipo UI otimizado)
  - [ ] Função `toCardData(conversation)` (converter para UI)
  - [ ] JSDoc com exemplos

- [ ] Criar `lib/services/realtime/handlers/BaseRealtimeHandler.ts`
  - [ ] Interface `RealtimeEventHandler<T>`
  - [ ] Interface `HandlerContext`
  - [ ] Método `handle(payload, currentState, context)`
  - [ ] JSDoc completo

### ✅ Critério de Aceite
- [ ] TypeScript compila sem erros: `npm run type-check`
- [ ] Todos os tipos exportados corretamente
- [ ] JSDoc completo em todas as interfaces

---

## 🗄️ Fase 2: Repositories (1.5h - TDD)

**Status:** 🔴 Não iniciado
**Início:** ___:___  |  **Fim:** ___:___

### 🔴 Red: Escrever Testes

- [ ] Criar `lib/repositories/__tests__/ConversationRepository.test.ts`

- [ ] **Teste: getById**
  - [ ] Deve retornar conversa com contato e última mensagem
  - [ ] Deve retornar null se conversa não existir
  - [ ] Deve retornar null se tenant_id não bater

- [ ] **Teste: getContactById (cache)**
  - [ ] Deve retornar contato do cache se existir
  - [ ] Deve fazer query se não estiver no cache
  - [ ] clearCache deve limpar o cache

- [ ] **Rodar testes:** `npm run test -- ConversationRepository.test.ts`
  - [ ] Todos falhando (esperado - Red)

### 🟢 Green: Implementar Código

- [ ] Criar `lib/repositories/ConversationRepository.ts`
  - [ ] Class `ConversationRepository implements IConversationRepository`
  - [ ] Constructor (inicializar supabase client)
  - [ ] Propriedade `contactsCache` (Map)
  - [ ] Método `getById(id, tenantId)`
  - [ ] Método `getByTenant(tenantId, filters?)`
  - [ ] Método `getContactById(contactId, tenantId)` com cache
  - [ ] Método `clearCache()`
  - [ ] Singleton `export const conversationRepository`

- [ ] **Rodar testes:** `npm run test -- ConversationRepository.test.ts`
  - [ ] Todos passando (Green)

### 🔵 Refactor: Otimizar

- [ ] Revisar código
- [ ] Otimizar queries
- [ ] Melhorar tratamento de erros
- [ ] Adicionar logs (opcional)

### ✅ Critério de Aceite
- [ ] Todos os testes passando
- [ ] Coverage > 80%: `npm run test:coverage -- ConversationRepository`
- [ ] Cache funcionando (verificar testes)
- [ ] Sem erros de TypeScript

---

## ⚡ Fase 3: Event Handlers (2.5h - TDD)

**Status:** 🔴 Não iniciado
**Início:** ___:___  |  **Fim:** ___:___

### 🔴 Red: ConversationUpdateHandler

- [ ] Criar `lib/services/realtime/handlers/__tests__/ConversationUpdateHandler.test.ts`

- [ ] **Testes:**
  - [ ] Deve atualizar conversa existente mantendo dados anteriores
  - [ ] Deve adicionar conversa nova se não existir na lista
  - [ ] Deve retornar estado atual se não conseguir buscar conversa nova
  - [ ] Deve preservar contact e lastMessage ao atualizar

- [ ] **Rodar:** `npm run test -- ConversationUpdateHandler.test.ts`
  - [ ] Todos falhando (Red)

### 🟢 Green: ConversationUpdateHandler

- [ ] Criar `lib/services/realtime/handlers/ConversationUpdateHandler.ts`
  - [ ] Class `ConversationUpdateHandler implements RealtimeEventHandler<Conversation>`
  - [ ] Método `handle(payload, currentState, context)`
  - [ ] Lógica: verificar se conversa existe
  - [ ] Lógica: atualizar existente ou buscar nova
  - [ ] Preservar dados que não vêm no payload

- [ ] **Rodar:** `npm run test -- ConversationUpdateHandler.test.ts`
  - [ ] Todos passando (Green)

### 🔴 Red: MessageInsertHandler

- [ ] Criar `lib/services/realtime/handlers/__tests__/MessageInsertHandler.test.ts`

- [ ] **Testes:**
  - [ ] Deve atualizar lastMessage da conversa
  - [ ] Deve ignorar mensagem de conversa que não está na lista
  - [ ] Deve manter outras conversas inalteradas

- [ ] **Rodar:** `npm run test -- MessageInsertHandler.test.ts`
  - [ ] Todos falhando (Red)

### 🟢 Green: MessageInsertHandler

- [ ] Criar `lib/services/realtime/handlers/MessageInsertHandler.ts`
  - [ ] Class `MessageInsertHandler implements RealtimeEventHandler<Message>`
  - [ ] Método `handle(payload, currentState, context)`
  - [ ] Lógica: encontrar conversa por conversation_id
  - [ ] Lógica: atualizar lastMessage e last_message_at
  - [ ] Retornar novo array (imutabilidade)

- [ ] **Rodar:** `npm run test -- MessageInsertHandler.test.ts`
  - [ ] Todos passando (Green)

### 🔵 Refactor: Otimizar Handlers

- [ ] Revisar código duplicado
- [ ] Extrair base handler se necessário
- [ ] Melhorar performance (evitar loops desnecessários)

### ✅ Critério de Aceite
- [ ] Todos os testes passando: `npm run test -- handlers`
- [ ] Coverage > 90%: `npm run test:coverage -- handlers`
- [ ] Testes validam imutabilidade (não modifica estado original)
- [ ] Sem erros de TypeScript

---

## 🔧 Fase 4: Service Layer (1h - TDD)

**Status:** 🔴 Não iniciado
**Início:** ___:___  |  **Fim:** ___:___

### 🔴 Red: Escrever Testes

- [ ] Criar `lib/services/__tests__/ConversationListService.test.ts`

- [ ] **Testes:**
  - [ ] Deve retornar conversas ordenadas
  - [ ] Deve filtrar por search (nome e telefone)
  - [ ] Deve filtrar por status
  - [ ] Deve ordenar por última mensagem

- [ ] **Rodar:** `npm run test -- ConversationListService.test.ts`
  - [ ] Todos falhando (Red)

### 🟢 Green: Implementar Service

- [ ] Criar `lib/services/ConversationListService.ts`
  - [ ] Class `ConversationListService`
  - [ ] Constructor (recebe `IConversationRepository`)
  - [ ] Método `getConversations(tenantId, filters?)`
  - [ ] Método `filterConversations(conversations, filters)`
  - [ ] Método `sortConversations(conversations)`

- [ ] **Rodar:** `npm run test -- ConversationListService.test.ts`
  - [ ] Todos passando (Green)

### 🔵 Refactor

- [ ] Revisar lógica de filtros
- [ ] Otimizar ordenação

### ✅ Critério de Aceite
- [ ] Todos os testes passando
- [ ] Coverage > 80%
- [ ] Filtros funcionando corretamente

---

## 🪝 Fase 5: Hook Refatorado (2.5h - TDD)

**Status:** 🔴 Não iniciado
**Início:** ___:___  |  **Fim:** ___:___

### 🔴 Red: Escrever Testes

- [ ] Criar `lib/hooks/__tests__/use-realtime-conversations.test.tsx`

- [ ] **Testes:**
  - [ ] Deve inicializar com conversas ordenadas
  - [ ] Deve criar subscrições para conversations e messages
  - [ ] Deve atualizar estado quando initialConversations mudar
  - [ ] Deve remover channels ao desmontar

- [ ] **Rodar:** `npm run test -- use-realtime-conversations.test.tsx`
  - [ ] Todos falhando (Red)

### 🟢 Green: Implementar Hook

- [ ] Criar `lib/hooks/use-realtime-conversations.ts`
  - [ ] Hook `useRealtimeConversations(tenantId, initialConversations)`
  - [ ] State: `conversations` (ordenado)
  - [ ] Criar handlers (ConversationUpdateHandler, MessageInsertHandler)
  - [ ] Context para handlers (tenantId, repository)
  - [ ] useEffect: reset ao mudar initialConversations
  - [ ] useEffect: subscrições realtime
    - [ ] Channel: conversations (UPDATE)
    - [ ] Channel: messages (INSERT)
    - [ ] Cleanup: removeChannel
  - [ ] Return: `{ conversations }`

- [ ] **Rodar:** `npm run test -- use-realtime-conversations.test.tsx`
  - [ ] Todos passando (Green)

### 🔵 Refactor

- [ ] Otimizar subscrições (evitar recriar handlers)
- [ ] Melhorar cleanup
- [ ] Adicionar error handling (opcional)

### ✅ Critério de Aceite
- [ ] Todos os testes passando
- [ ] Subscrições criadas corretamente
- [ ] Cleanup funciona (removeChannel chamado)
- [ ] Estado atualiza em tempo real (verificar nos testes)

---

## 🎨 Fase 6: Refatorar Componentes (2h)

**Status:** 🔴 Não iniciado
**Início:** ___:___  |  **Fim:** ___:___

### ConversationList (antiga ContactList)

- [ ] **Backup do arquivo antigo:**
  ```bash
  cp components/livechat/contact-list.tsx components/livechat/contact-list.OLD.tsx
  ```

- [ ] Atualizar `components/livechat/contact-list.tsx`
  - [ ] Renomear para `conversation-list.tsx`
  - [ ] Importar `useRealtimeConversations` (novo hook)
  - [ ] Remover useMemo de adaptação
  - [ ] Usar hook direto: `const { conversations } = useRealtimeConversations(...)`
  - [ ] Remover conversão de volta para conversations (flatMap)
  - [ ] Usar `conversations` diretamente nos filtros
  - [ ] Passar `toCardData(conversation)` para ConversationCard

- [ ] Atualizar imports em outros arquivos
  - [ ] `app/(dashboard)/livechat/page.tsx`
  - [ ] Outros componentes que importam ContactList

### ConversationCard (antiga ContactItem)

- [ ] **Backup do arquivo antigo:**
  ```bash
  cp components/livechat/contact-item.tsx components/livechat/contact-item.OLD.tsx
  ```

- [ ] Atualizar `components/livechat/contact-item.tsx`
  - [ ] Renomear para `conversation-card.tsx`
  - [ ] Props: `data: ConversationCardData` (tipo UI)
  - [ ] Remover lógica de `activeConversations[0]`
  - [ ] Usar `data.contact` diretamente
  - [ ] Usar `data.lastMessage` diretamente
  - [ ] Usar `data.status`, `data.iaActive` diretamente

### Atualizar index.ts

- [ ] Atualizar `components/livechat/index.ts`
  - [ ] Export `ConversationList`
  - [ ] Export `ConversationCard`
  - [ ] Deprecar exports antigos (comentar)

### ✅ Critério de Aceite - Teste Manual

- [ ] **Compilação:**
  ```bash
  npm run build
  ```
  - [ ] Build sem erros

- [ ] **Teste Manual:**
  ```bash
  npm run dev
  ```
  - [ ] Abrir `/livechat`
  - [ ] Verificar lista de conversas renderiza
  - [ ] Verificar dados corretos nos cards
  - [ ] Verificar filtros funcionam
  - [ ] Verificar busca funciona
  - [ ] Verificar click em card navega corretamente

- [ ] **React DevTools:**
  - [ ] Abrir React DevTools
  - [ ] Verificar componentes renderizam
  - [ ] Verificar props corretas
  - [ ] Não há re-renders desnecessários

---

## 🧪 Fase 7: Testes de Integração (1.5h)

**Status:** 🔴 Não iniciado
**Início:** ___:___  |  **Fim:** ___:___

### Teste E2E: Atualização em Tempo Real de Status

- [ ] **Preparação:**
  - [ ] Abrir `/livechat` em 2 abas do navegador
  - [ ] Selecionar mesma conversa nas duas abas
  - [ ] Abrir DevTools → Network → WS (WebSocket)

- [ ] **Teste: Pausar IA**
  - [ ] Aba 1: Clicar "Pausar IA"
  - [ ] Aba 2: Verificar badge muda para "IA Pausada" **SEM REFRESH**
  - [ ] DevTools: Verificar evento realtime recebido
  - [ ] ✅ **PASSOU:** Badge atualiza automaticamente

- [ ] **Teste: Retomar IA**
  - [ ] Aba 1: Clicar "Retomar IA"
  - [ ] Aba 2: Verificar badge volta para "IA Ativa" **SEM REFRESH**
  - [ ] ✅ **PASSOU:** Badge atualiza automaticamente

- [ ] **Teste: Pausar Conversa**
  - [ ] Aba 1: Clicar "Pausar Conversa"
  - [ ] Aba 2: Verificar card muda cor para amarelo **SEM REFRESH**
  - [ ] Filtro "Aguardando": Conversa aparece
  - [ ] ✅ **PASSOU:** Card atualiza automaticamente

### Teste E2E: Preview de Mensagem

- [ ] **Preparação:**
  - [ ] Abrir `/livechat`
  - [ ] Selecionar conversa
  - [ ] Observar preview da última mensagem

- [ ] **Teste: Enviar Mensagem**
  - [ ] Enviar nova mensagem
  - [ ] Verificar preview atualiza no card **SEM REFRESH**
  - [ ] Verificar timestamp atualiza
  - [ ] Verificar card move para topo da lista (reordenação)
  - [ ] ✅ **PASSOU:** Preview e ordenação funcionam

- [ ] **Teste: Receber Mensagem (simular)**
  - [ ] Usar script para inserir mensagem no banco
  - [ ] Verificar preview atualiza **SEM REFRESH**
  - [ ] Verificar card move para topo
  - [ ] ✅ **PASSOU:** Realtime funciona bidirecional

### Teste de Performance

- [ ] **Medição de Latência:**
  - [ ] Abrir DevTools → Performance
  - [ ] Iniciar gravação
  - [ ] Pausar IA (trigger evento)
  - [ ] Parar gravação
  - [ ] Medir tempo: evento realtime → atualização UI
  - [ ] ✅ **META:** < 100ms

- [ ] **Verificar Queries Duplicadas:**
  - [ ] Abrir DevTools → Network
  - [ ] Filtrar por "supabase"
  - [ ] Pausar IA
  - [ ] Verificar se há queries duplicadas ao mesmo endpoint
  - [ ] ✅ **PASSOU:** Sem queries duplicadas

- [ ] **Verificar Cache de Contatos:**
  - [ ] Abrir console
  - [ ] Executar múltiplos eventos UPDATE
  - [ ] Verificar logs de queries
  - [ ] ✅ **PASSOU:** Cache evita queries repetidas

### ✅ Critério de Aceite
- [ ] Atualização em tempo real funciona sem refresh
- [ ] Preview de mensagens atualiza automaticamente
- [ ] Reordenação funciona (mais recente primeiro)
- [ ] Performance < 100ms
- [ ] Sem queries duplicadas
- [ ] Cache funcionando

---

## 🧹 Fase 8: Limpeza e Documentação (30min)

**Status:** 🔴 Não iniciado
**Início:** ___:___  |  **Fim:** ___:___

### Deprecar Arquivos Antigos

- [ ] Adicionar comentário de depreciação em:
  - [ ] `lib/hooks/use-realtime-contact-list.ts`
  - [ ] `components/livechat/contact-list.OLD.tsx` (se existir)
  - [ ] `components/livechat/contact-item.OLD.tsx` (se existir)

```typescript
/**
 * @deprecated Este arquivo foi substituído por use-realtime-conversations.ts
 * Mantido temporariamente para referência.
 * Será removido na versão X.X.X
 * @see lib/hooks/use-realtime-conversations.ts
 */
```

- [ ] Mover arquivos antigos para pasta `__deprecated__/`
  ```bash
  mkdir -p lib/hooks/__deprecated__
  mkdir -p components/livechat/__deprecated__
  ```

### Atualizar Documentação

- [ ] Atualizar `docs/LIVECHAT_STATUS.md`
  - [ ] Marcar bug de realtime como resolvido ✅
  - [ ] Adicionar seção "Refatoração SOLID"
  - [ ] Atualizar arquitetura
  - [ ] Adicionar referência ao plano de refatoração

- [ ] Criar `docs/LIVECHAT_ARCHITECTURE.md` (opcional)
  - [ ] Diagrama de camadas
  - [ ] Explicação de SOLID
  - [ ] Guia para adicionar novos event handlers

### Rodar Todos os Testes

- [ ] **Testes Unitários:**
  ```bash
  npm run test
  ```
  - [ ] Todos passando ✅

- [ ] **Coverage Report:**
  ```bash
  npm run test:coverage
  ```
  - [ ] Coverage geral > 80% ✅
  - [ ] Repositories > 80% ✅
  - [ ] Handlers > 90% ✅

- [ ] **Validação de Código:**
  ```bash
  npm run lint
  npm run type-check
  ```
  - [ ] Sem erros ✅

- [ ] **Build de Produção:**
  ```bash
  npm run build
  ```
  - [ ] Build sem erros ✅

### Commit Final

- [ ] **Git Status:**
  ```bash
  git status
  ```
  - [ ] Revisar todos os arquivos modificados

- [ ] **Git Commit:**
  ```bash
  git add .
  git commit -m "refactor(livechat): aplicar SOLID e corrigir bug de realtime nos cards

  - Corrigido bug crítico: cards não atualizavam em tempo real
  - Implementada arquitetura em camadas (SOLID)
  - Criados repositories, services e event handlers
  - Refatorado hook useRealtimeConversations
  - Adicionados testes unitários (coverage > 80%)
  - Performance < 100ms (evento → UI)
  - Sem queries duplicadas (cache de contatos)

  Refs: docs/LIVECHAT_REALTIME_REFACTOR_SOLID.md"
  ```

### ✅ Critério de Aceite
- [ ] Todos os testes passando
- [ ] Coverage > 80%
- [ ] Sem erros de lint/TypeScript
- [ ] Build de produção funciona
- [ ] Documentação atualizada
- [ ] Commit criado com mensagem descritiva

---

## 🎉 Validação Final

### Checklist de Funcionalidade

- [ ] ✅ Cards atualizam em tempo real sem refresh
- [ ] ✅ Preview de mensagens atualiza automaticamente
- [ ] ✅ Reordenação funciona (mais recente primeiro)
- [ ] ✅ Filtros (status) funcionam
- [ ] ✅ Busca funciona
- [ ] ✅ Click em card navega corretamente

### Checklist de Performance

- [ ] ✅ Sem queries duplicadas
- [ ] ✅ Performance <100ms do evento ao UI
- [ ] ✅ Cache de contatos funcionando
- [ ] ✅ Sem re-renders desnecessários

### Checklist de Qualidade

- [ ] ✅ Código segue SOLID
- [ ] ✅ Tipos bem definidos (sem `any` desnecessário)
- [ ] ✅ Testes passando (coverage > 80%)
- [ ] ✅ ESLint sem erros
- [ ] ✅ TypeScript compila sem erros

### Checklist de Arquitetura

- [ ] ✅ Separação clara de responsabilidades
- [ ] ✅ Fácil adicionar novos event handlers
- [ ] ✅ Fácil trocar implementação de repository
- [ ] ✅ Componentes desacoplados do Supabase

---

## 📈 Métricas

| Métrica | Meta | Real | Status |
|---------|------|------|--------|
| Tempo Total | 12-14h | ___h | ⏳ |
| Coverage | > 80% | ___% | ⏳ |
| Performance (realtime → UI) | < 100ms | ___ms | ⏳ |
| Bugs Encontrados | 0 | ___ | ⏳ |
| Testes Criados | ~50 | ___ | ⏳ |

---

## 🐛 Issues Encontrados

_Documentar problemas encontrados durante a implementação:_

1. **Issue #1:** ___
   - **Descrição:** ___
   - **Solução:** ___

2. **Issue #2:** ___
   - **Descrição:** ___
   - **Solução:** ___

---

## 📝 Notas de Implementação

_Anotações importantes durante a implementação:_

- ___
- ___
- ___

---

## ✅ Conclusão

**Data de Conclusão:** ___/___/2025
**Tempo Real:** ___h

**Status Final:** ⏳ Em Progresso / 🟢 Concluído

**Próximos Passos:**
- [ ] ___
- [ ] ___

---

**Criado por:** Claude + Frank
**Data:** 2025-11-23
**Baseado em:** [LIVECHAT_REALTIME_REFACTOR_SOLID.md](./LIVECHAT_REALTIME_REFACTOR_SOLID.md)
