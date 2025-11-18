# Status de Implementação - Livechat

**Última atualização:** 2025-11-17
**Status Geral:** ✅ MVP Funcional Completo

---

## Visão Geral

O Livechat é o centro operacional de atendimento da LIVIA, permitindo que usuários internos acompanhem e interajam com conversas em tempo real entre clientes e a IA.

---

## Funcionalidades Implementadas

### 1. Interface Principal ([app/livechat/page.tsx](../app/livechat/page.tsx))

**Layout:**
- ✅ Sidebar com lista de contatos
- ✅ Área principal de conversa
- ✅ Header com dados do usuário
- ✅ Layout responsivo e fluido

**Navegação:**
- ✅ Seleção de contato via URL query param
- ✅ Carregamento dinâmico de conversa e mensagens
- ✅ Estado vazio quando nenhum contato selecionado

### 2. Lista de Contatos ([components/livechat/contact-list.tsx](../components/livechat/contact-list.tsx))

- ✅ Exibe contatos com conversas ativas
- ✅ Destaque do contato selecionado
- ✅ Informações do contato (nome, canal)
- ✅ Scroll automático na lista

### 3. Visualização de Conversa ([components/livechat/conversation-view.tsx](../components/livechat/conversation-view.tsx))

**Mensagens:**
- ✅ Lista de mensagens em ordem cronológica
- ✅ Auto-scroll para mensagem mais recente
- ✅ Realtime - novas mensagens aparecem automaticamente
- ✅ Diferenciação visual por tipo de remetente (cliente/IA/atendente)

**Controles:**
- ✅ Input de mensagem com textarea expansível
- ✅ Botão de envio com loading state
- ✅ Atalho Enter para enviar (Shift+Enter para quebra de linha)
- ✅ Desabilita input quando conversa encerrada

### 4. Controles de Conversa ([components/livechat/conversation-controls.tsx](../components/livechat/conversation-controls.tsx))

**Status da Conversa:**
- ✅ Badge indicando status (Aberta/Pausada/Encerrada)
- ✅ Botão "Pausar Conversa" (quando aberta)
- ✅ Botão "Retomar Conversa" (quando pausada)
- ✅ Botão "Reabrir Conversa" (quando encerrada, com confirmação)

**Status da IA:**
- ✅ Badge indicando status (Ativa/Pausada)
- ✅ Botão "Pausar IA" (quando ativa)
- ✅ Botão "Retomar IA" (quando pausada)
- ✅ Controles desabilitados quando conversa pausada
- ✅ Seção oculta quando conversa encerrada

**Estados Visuais:**
- ✅ Badges coloridos (verde=ativo, amarelo=pausado, cinza=encerrado)
- ✅ Loading states durante operações
- ✅ Desabilita botões durante atualização

---

## API Routes Implementadas

### 5 Endpoints Funcionais

| Rota | Método | Função | Status |
|------|--------|--------|--------|
| `/api/n8n/send-message` | POST | Enviar mensagem manual via n8n | ✅ |
| `/api/conversations/pause-ia` | POST | Pausar IA em conversa específica | ✅ |
| `/api/conversations/resume-ia` | POST | Retomar IA em conversa específica | ✅ |
| `/api/conversations/pause` | POST | Pausar conversa completa | ✅ |
| `/api/conversations/resume` | POST | Retomar conversa pausada | ✅ |
| `/api/conversations/reopen` | POST | Reabrir conversa encerrada | ✅ |

### Endpoints de Feedback e Dados (Planejados)

| Rota | Método | Função | Status |
|------|--------|--------|--------|
| `/api/feedback/message` | POST | Registrar feedback de mensagem | ⏳ |
| `/api/contacts/update` | PATCH | Atualizar dados do contato | ⏳ |
| `/api/contacts/history` | GET | Histórico de alterações do contato | ⏳ |
| `/api/quick-replies` | GET | Listar mensagens rápidas | ⏳ |
| `/api/quick-replies/usage` | POST | Registrar uso de quick reply | ⏳ |
| `/api/quick-replies/create` | POST | Criar nova quick reply | ⏳ |

**Segurança:**
- ✅ Autenticação obrigatória em todas as rotas
- ✅ Validação de tenant_id
- ✅ Validação de payload
- ✅ Tratamento de erros robusto

---

## Realtime Supabase

### Hooks Implementados

**[use-realtime-messages.ts](../lib/hooks/use-realtime-messages.ts):**
- ✅ Subscribe em novas mensagens por conversation_id
- ✅ Busca informações do remetente (se atendente)
- ✅ Atualiza state local automaticamente
- ✅ Cleanup ao desmontar componente

**[use-realtime-conversation.ts](../lib/hooks/use-realtime-conversation.ts):**
- ✅ Subscribe em mudanças de estado da conversa
- ✅ Atualiza status, ia_active, e outros campos
- ✅ Propaga mudanças para UI instantaneamente
- ✅ Cleanup ao desmontar componente

---

## Regras de Negócio Implementadas

### Estados da Conversa

| Estado | Descrição | Transições Permitidas |
|--------|-----------|----------------------|
| `open` | Conversa ativa | → `paused`, → `closed` |
| `paused` | Conversa pausada pelo atendente | → `open` |
| `closed` | Conversa encerrada pela IA | → `open` (reabrir) |

### Controle de IA

- ✅ `ia_active: true` → IA responde automaticamente
- ✅ `ia_active: false` → IA não responde
- ✅ IA pode ser pausada/retomada independentemente do status da conversa
- ✅ Quando conversa é pausada, IA também é pausada
- ✅ Quando conversa é retomada, IA é reativada
- ✅ Quando conversa é reaberta, IA é reativada

### Validações

**Pausar Conversa:**
- ❌ Não pode pausar conversa já pausada
- ❌ Não pode pausar conversa encerrada
- ✅ Pausa IA automaticamente

**Retomar Conversa:**
- ❌ Não pode retomar conversa já aberta
- ❌ Não pode retomar conversa encerrada (usar reabrir)
- ✅ Reativa IA automaticamente

**Reabrir Conversa:**
- ❌ Apenas conversas `closed` podem ser reabertas
- ✅ Requer confirmação do usuário
- ✅ Reativa IA automaticamente

**Pausar/Retomar IA:**
- ❌ Controles desabilitados quando conversa pausada
- ❌ Controles ocultos quando conversa encerrada
- ✅ Funcionam normalmente quando conversa aberta

---

## Integração com n8n

### Webhooks Utilizados

1. **`/webhook/livia/send-message`**
   - Envia mensagem para canal (WhatsApp)
   - Insere registro na tabela `messages`
   - Notifica via Realtime

2. **`/webhook/livia/pause-conversation`**
   - Atualiza status da conversa para `paused`
   - Pausa IA automaticamente
   - Registra histórico de estado

3. **`/webhook/livia/resume-conversation`**
   - Atualiza status da conversa para `open`
   - Reativa IA
   - Usado também para reabrir conversas encerradas

4. **`/webhook/livia/pause-ia`**
   - Atualiza `ia_active = false`
   - Registra usuário e motivo da pausa
   - Mantém conversa aberta

5. **`/webhook/livia/resume-ia`**
   - Atualiza `ia_active = true`
   - Limpa dados de pausa

**Proxy via API Routes:**
- ✅ Todas chamadas passam por API Routes
- ✅ Webhooks n8n NUNCA expostos no client
- ✅ Validação de autenticação e tenant antes de chamar n8n

---

## Queries Supabase

### Queries Principais ([lib/queries/livechat.ts](../lib/queries/livechat.ts))

- ✅ `getContactsWithConversations()` - Lista contatos com conversas ativas
- ✅ `getConversation()` - Busca conversa por ID
- ✅ `getMessages()` - Busca mensagens de uma conversa

**Filtros:**
- ✅ Multi-tenancy (filtro por tenant_id)
- ✅ Apenas conversas ativas (status != closed)
- ✅ Ordenação cronológica

### Queries Planejadas (Feedback e Dados)

**Feedback de Mensagens:**
- ⏳ `createMessageFeedback()` - Insere feedback de mensagem
- ⏳ `getMessageFeedback()` - Busca feedback de uma mensagem específica
- ⏳ `hasUserFeedback()` - Verifica se usuário já deu feedback na mensagem

**Dados do Cliente:**
- ⏳ `getContactData()` - Busca dados completos do contato (tabela `contacts`)
- ⏳ `updateContactData()` - Atualiza campos do contato
- ⏳ `getContactDataHistory()` - Busca histórico de alterações (`contact_data_changes`)
- ⏳ `logContactDataChange()` - Registra alteração de dado

**Quick Replies:**
- ⏳ `getQuickReplies()` - Lista todas quick replies do tenant
- ⏳ `getPopularQuickReplies()` - Busca N mais usadas (ORDER BY usage_count DESC)
- ⏳ `incrementQuickReplyUsage()` - Incrementa contador de uso
- ⏳ `createQuickReply()` - Cria nova mensagem rápida
- ⏳ `searchQuickReplies()` - Busca por título ou conteúdo

### Tabelas do Supabase Necessárias

**Tabelas Existentes (utilizadas):**
- ✅ `contacts` - Armazena dados dos clientes (populada pela IA)
- ✅ `conversations` - Conversas ativas
- ✅ `messages` - Mensagens das conversas
- ✅ `channels` - Canais de comunicação (WhatsApp, Instagram, etc.)

**Tabelas a Criar:**
- ⏳ `message_feedback` - Feedback de mensagens da IA
  ```sql
  CREATE TABLE message_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    message_id UUID NOT NULL REFERENCES messages(id),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
    comment TEXT,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

- ⏳ `contact_data_changes` - Histórico de alterações nos dados do contato
  ```sql
  CREATE TABLE contact_data_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    contact_id UUID NOT NULL REFERENCES contacts(id),
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

- ⏳ `quick_replies` - Mensagens rápidas por tenant
  ```sql
  CREATE TABLE quick_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    usage_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

---

## Componentes UI

| Componente | Responsabilidade | Status |
|------------|------------------|--------|
| `ContactList` | Lista de contatos | ✅ |
| `ContactItem` | Item individual na lista | ✅ |
| `ConversationView` | Container principal da conversa | ✅ |
| `ConversationControls` | Controles de status e IA | ✅ |
| `MessageItem` | Exibição de mensagem individual | ✅ |
| `MessageInput` | Input para envio de mensagens | ✅ |

### Componentes Planejados (Feedback e Dados)

| Componente | Responsabilidade | Status |
|------------|------------------|--------|
| `MessageFeedbackButtons` | Botões 👍/👎 em mensagens da IA | ⏳ |
| `FeedbackModal` | Modal para feedback negativo detalhado | ⏳ |
| `CustomerDataPanel` | Painel lateral flutuante com dados do cliente | ⏳ |
| `CustomerDataForm` | Formulário de edição dos dados | ⏳ |
| `QuickRepliesPanel` | Painel de mensagens rápidas | ⏳ |
| `QuickReplyItem` | Item individual de quick reply | ⏳ |
| `QuickReplySearch` | Campo de busca/filtro de mensagens | ⏳ |

**Componentes shadcn/ui utilizados:**
- Button, Badge, ScrollArea, Separator, Textarea, Avatar
- **Novos:** Dialog, Input, Label, Toast, Popover, Command

---

## Pendências e Melhorias

### Crítico
- [ ] Corrigir RLS da tabela `users` (remover workaround admin client)
- [ ] Configurar webhooks n8n reais (atualmente mock)

### Melhorias UX
- [ ] Substituir `alert()` por toast notifications
- [ ] Adicionar skeleton loaders
- [ ] Adicionar animações de transição
- [ ] Indicador de "digitando..." para IA
- [ ] Mostrar timestamp das mensagens
- [ ] Formatação de mensagens (markdown?)

### Funcionalidades de Feedback e Captura de Dados

#### Sistema de Feedback de Mensagens
- [ ] **Avaliação de mensagens da IA**
  - [ ] Botões de feedback (👍/👎) em cada mensagem da IA
  - [ ] Modal de feedback detalhado para avaliações negativas
  - [ ] Campo para comentários opcionais
  - [ ] Registro de feedback na tabela `message_feedback`
  - [ ] Webhook para n8n processar feedback

- [ ] **Estrutura de dados:**
  ```typescript
  interface MessageFeedback {
    id: string
    message_id: string
    conversation_id: string
    rating: 'positive' | 'negative'
    comment?: string
    user_id: string // atendente que deu feedback
    created_at: string
  }
  ```

#### Captura de Dados do Cliente
- [ ] **Painel lateral flutuante**
  - [ ] Posicionamento fixo à direita (expansível ao hover)
  - [ ] Formulário de dados do cliente
  - [ ] **Busca dados da tabela `contacts`** (dados já capturados pela IA durante conversas)
  - [ ] Campos dinâmicos baseados no canal
  - [ ] Auto-save ao editar campos
  - [ ] **Botão "Copiar dados" no header** - Copia todos os dados formatados para área de transferência
  - [ ] Indicador visual de salvamento (sucesso/erro)

- [ ] **Campos de captura:**
  - [ ] Nome completo
  - [ ] Telefone/WhatsApp
  - [ ] E-mail
  - [ ] CPF/CNPJ
  - [ ] Endereço (CEP, Rua, Número, Complemento, Bairro, Cidade, UF)
  - [ ] Data de nascimento
  - [ ] Campos customizados por tenant (JSON dinâmico)

- [ ] **Validações:**
  - [ ] Formato de telefone (validação BR com DDD)
  - [ ] Formato de e-mail (regex padrão)
  - [ ] Validação de CPF/CNPJ (algoritmo verificador)
  - [ ] CEP (integração com API ViaCEP para auto-completar endereço)
  - [ ] Data de nascimento (maior de 18 anos se necessário)

- [ ] **Integração:**
  - [ ] **Origem dos dados:** Tabela `contacts` (populada pela IA via n8n)
  - [ ] Atualização em tempo real na tabela `contacts`
  - [ ] Webhook para sincronizar com CRM externo (opcional)
  - [ ] Histórico de alterações em tabela `contact_data_changes`
  - [ ] **Formato de cópia:** Texto formatado com quebras de linha
    ```
    Nome: João Silva
    Telefone/WhatsApp: (11) 98765-4321
    E-mail: joao@email.com
    CPF: 123.456.789-00
    Status: Conversando
    Último contato: 18/11/2025 10:30
    ```

#### Quick Replies (Mensagens Rápidas)
- [ ] **Painel de quick replies**
  - [ ] Atalho via botão ⚡ no input
  - [ ] Busca/filtro de mensagens
  - [ ] Atalhos de teclado (ex: `/` para abrir)
  - [ ] Indicador de uso/popularidade
  - [ ] Categorização de mensagens

- [ ] **Funcionalidades:**
  - [ ] Inserir mensagem ao clicar
  - [ ] Variáveis dinâmicas (ex: `{nome_cliente}`, `{protocolo}`)
  - [ ] Mensagens mais usadas em destaque
  - [ ] Registro de estatísticas de uso

- [ ] **Estrutura de dados:**
  ```typescript
  interface QuickReply {
    id: string
    tenant_id: string
    title: string
    content: string
    category?: string
    usage_count: number
    created_by: string
    created_at: string
  }
  ```

- [ ] **Endpoint de registro de uso:**
  - [ ] POST `/api/quick-replies/usage` - Incrementa contador
  - [ ] Webhook n8n: `/webhook/livia/usage-quick-message`

### Funcionalidades Extras
- [ ] Busca de mensagens
- [ ] Filtro de conversas (abertas/pausadas/encerradas)
- [ ] Histórico de conversas encerradas
- [ ] Notas internas na conversa
- [ ] Tags de categorização
- [ ] Estatísticas de atendimento

### Testes
- [ ] Testes unitários dos hooks
- [ ] Testes de integração das API routes
- [ ] Testes E2E do fluxo completo
- [ ] Testes de Realtime

---

## Fluxos de Uso Documentados

### Fluxo 1: Atendente Envia Mensagem
1. Atendente digita mensagem no input
2. Clica em Enviar (ou Enter)
3. `MessageInput` chama `/api/n8n/send-message`
4. API route valida auth e tenant
5. API route chama webhook n8n
6. n8n envia para WhatsApp e insere em `messages`
7. Realtime notifica client
8. `useRealtimeMessages` atualiza state
9. Nova mensagem aparece na UI

### Fluxo 2: Pausar IA
1. Atendente clica "Pausar IA"
2. `ConversationControls` chama `/api/conversations/pause-ia`
3. API route valida e chama webhook n8n
4. n8n atualiza `conversations.ia_active = false`
5. Realtime notifica client
6. `useRealtimeConversation` atualiza state
7. Badge muda para "Pausada" e botão vira "Retomar IA"

### Fluxo 3: Reabrir Conversa Encerrada
1. Atendente clica "Reabrir Conversa"
2. Confirmação aparece
3. Se confirmar, chama `/api/conversations/reopen`
4. API route valida estado (deve ser `closed`)
5. API route chama webhook n8n com flag `reopen: true`
6. n8n atualiza `status = 'open'` e `ia_active = true`
7. Realtime notifica client
8. UI atualiza badges e habilita controles

### Fluxo 4: Dar Feedback em Mensagem da IA (Planejado)
1. Atendente visualiza mensagem da IA no chat
2. Hover na mensagem exibe botões 👍 (positivo) e 👎 (negativo)
3. Atendente clica em um dos botões
4. **Se positivo:**
   - Registra feedback imediatamente
   - Ícone muda para indicar feedback dado
5. **Se negativo:**
   - Modal abre para comentário opcional
   - Atendente pode adicionar detalhes do problema
   - Confirma ou cancela
6. Componente chama `/api/feedback/message`
7. API route valida auth, tenant e verifica se mensagem existe
8. Insere registro na tabela `message_feedback`
9. Chama webhook n8n `/webhook/livia/message-feedback`
10. n8n processa feedback:
    - Registra analytics (taxa de aprovação)
    - Envia alerta se taxa negativa > threshold
    - Marca mensagem para revisão de treinamento
11. UI mostra toast de confirmação
12. Ícone de feedback permanece visível na mensagem

### Fluxo 5: Visualizar e Atualizar Dados do Cliente (Planejado)
**Visualização inicial:**
1. Atendente seleciona contato na lista
2. Painel lateral direito carrega automaticamente
3. Componente `CustomerDataPanel` busca dados da tabela `contacts` via query
4. **Dados exibidos são os que a IA já capturou** durante conversas anteriores
5. Formulário é preenchido com dados existentes
6. Se dados estiverem vazios, campos ficam em branco para preenchimento manual

**Copiar dados:**
7. Atendente clica no botão "Copiar dados" no header do painel
8. Sistema formata dados em texto:
   ```
   Nome: [nome]
   Telefone/WhatsApp: [telefone]
   E-mail: [email]
   CPF: [cpf]
   Status: [status]
   Último contato: [data/hora]
   ```
9. Usa `navigator.clipboard.writeText()` para copiar
10. Exibe toast: "Dados copiados para área de transferência"

**Atualização de dados:**
11. Atendente edita um campo (ex: corrige nome)
12. Input perde foco (onBlur) ou Debounce de 800ms
13. Componente valida campo:
    - Formato correto (telefone, email, CPF, etc.)
    - Campo obrigatório preenchido
14. **Se inválido:** Mostra erro abaixo do campo
15. **Se válido:**
    - Mostra indicador de salvamento
    - Chama `/api/contacts/update`
16. API route valida auth, tenant e permissões
17. Atualiza registro na tabela `contacts`
18. Insere registro de auditoria em `contact_data_changes`:
    ```typescript
    {
      contact_id, field_name, old_value,
      new_value, changed_by, changed_at
    }
    ```
19. Chama webhook n8n `/webhook/livia/contact-updated` (opcional)
20. n8n sincroniza com CRM externo se configurado
21. Realtime notifica outros atendentes visualizando mesmo contato
22. UI mostra ícone de sucesso ✓ no campo
23. Se houver erro, mostra ícone ⚠ e mensagem de erro

### Fluxo 6: Usar Quick Reply (Planejado)
**Abrir painel:**
1. Atendente clica no botão ⚡ no input de mensagem
   - Ou pressiona `/` no início do textarea
2. Painel de quick replies abre acima do input
3. Componente busca lista via `/api/quick-replies`
4. API retorna mensagens filtradas por tenant, ordenadas por `usage_count DESC`
5. Painel exibe:
   - Mensagens mais usadas no topo (badge "Popular")
   - Todas as mensagens abaixo
   - Indicador de quantas vezes foi usada

**Filtrar mensagens:**
6. Atendente digita no campo de busca do painel
7. Lista filtra em tempo real por `title` ou `content`
8. Pode navegar com setas ↑↓ do teclado
9. Enter seleciona mensagem destacada

**Selecionar e inserir:**
10. Atendente clica na mensagem ou pressiona Enter
11. Sistema processa variáveis dinâmicas:
    - `{nome_cliente}` → Nome do contato selecionado
    - `{protocolo}` → ID da conversa atual
    - `{data}` → Data atual formatada
    - `{hora}` → Hora atual formatada
    - Outras variáveis customizadas do tenant
12. Mensagem processada é inserida no textarea
13. Painel fecha automaticamente
14. Foco volta para textarea (cursor no final da mensagem)
15. Atendente pode editar antes de enviar

**Registro de uso (em background):**
16. Enquanto atendente edita, sistema chama `/api/quick-replies/usage`
17. API route incrementa `usage_count` da quick reply
18. Webhook n8n `/webhook/livia/usage-quick-message` registra:
    - Qual mensagem foi usada
    - Por qual atendente
    - Em qual conversa
    - Timestamp
19. Dados alimentam dashboard de analytics

---

## Arquitetura

```
┌─────────────────┐
│   Livechat UI   │
│  (Next.js SSR)  │
└────────┬────────┘
         │
         ├─ Server Component: Fetch inicial de dados
         │
         └─ Client Component: Interações e Realtime
                 │
                 ├─ Hooks: useRealtimeMessages, useRealtimeConversation
                 │
                 ├─ API Routes: /api/conversations/*, /api/n8n/*
                 │      │
                 │      ├─ Validação: Auth + Tenant
                 │      │
                 │      └─ Webhook n8n: Processamento assíncrono
                 │             │
                 │             ├─ WhatsApp/Instagram
                 │             │
                 │             └─ Supabase: Insert/Update
                 │
                 └─ Supabase Realtime
                        │
                        └─ Channels: messages, conversations
```

---

## Conclusão

O **Livechat está 100% funcional para o MVP**, com todas as funcionalidades essenciais implementadas:

✅ Visualização de conversas em tempo real
✅ Envio de mensagens manuais
✅ Controle completo de status (Conversa e IA)
✅ Realtime bidirecional (Supabase)
✅ Integração com n8n via webhooks
✅ Validações de segurança e regras de negócio
✅ UI intuitiva e responsiva

---

## Próximas Funcionalidades Planejadas

### Sistema de Feedback e Captura de Dados
As funcionalidades de **feedback de mensagens**, **captura e atualização de dados do cliente**, e **quick replies** estão documentadas e prontas para implementação. Principais benefícios:

✨ **Feedback de Mensagens:**
- Melhoria contínua da IA através de avaliações dos atendentes
- Analytics de performance das respostas automáticas
- Identificação de mensagens problemáticas para retreinamento

✨ **Captura de Dados do Cliente:**
- Visualização de dados capturados automaticamente pela IA
- Edição e validação de informações do cliente
- Histórico completo de alterações (auditoria)
- Cópia rápida para área de transferência
- Sincronização com CRM externo

✨ **Quick Replies:**
- Agilidade no atendimento com mensagens pré-definidas
- Variáveis dinâmicas personalizadas
- Analytics de mensagens mais utilizadas
- Atalhos de teclado para produtividade

**Próximo passo:** Escolher entre:
1. Implementar funcionalidades de Feedback e Dados documentadas neste arquivo
2. Implementar Base de Conhecimento (CRUD de Synapses)
