# Plano de Refatoração: Livechat Realtime + Aplicação de SOLID

**Data:** 2025-11-23
**Status:** 📋 PLANEJAMENTO
**Prioridade:** CRÍTICA
**Impacto:** ALTO (corrige bug crítico + melhora arquitetura)

---

## 🚨 Problemas Identificados

### 1. **BUG CRÍTICO: Cards não atualizam em tempo real**

**Sintomas:**
- Chat funciona perfeitamente (mensagens aparecem em tempo real)
- Cards de conversa NÃO atualizam automaticamente
- É necessário refresh da página ou clicar em algum elemento

**Root Cause:**
```typescript
// contact-list.tsx linha 26-39
const adaptedContacts = useMemo(() => initialConversations.map((conv) => ({
  ...conv.contact,
  activeConversations: [conv],
})), [initialConversations]); // ❌ initialConversations nunca muda (vem do SSR)

const { contacts } = useRealtimeContactList(tenantId, adaptedContacts);

// contacts muda via realtime, MAS...
const conversations = contacts.flatMap((contact) =>
  (contact.activeConversations || []).map((conv) => ({
    ...conv,
    contact,
  }))
); // ❌ Esta transformação cria objetos deeply nested que React pode não detectar
```

**Problema:**
1. `initialConversations` vem do SSR e é **imutável** no client
2. Hook retorna `contacts` que muda via realtime
3. MAS a conversão de volta para `conversations` cria **referências instáveis**
4. React não detecta mudanças profundas em objetos nested
5. Componente não re-renderiza

---

### 2. **Violações do Princípio SOLID**

#### **S - Single Responsibility Principle (SRP)**
❌ **Violação:** `use-realtime-contact-list.ts` faz múltiplas responsabilidades:
- Gerenciar subscrições realtime
- Fazer queries adicionais ao Supabase (linha 65-69, 149-156)
- Ordenar dados (`sortContactsByLastMessage`)
- Transformar dados (adaptar tipos)

✅ **Correto:** Separar em:
- `useRealtimeSubscription`: Apenas gerenciar subscrições
- `useConversationList`: Gerenciar estado da lista
- `ConversationRepository`: Queries ao Supabase
- `ConversationSorter`: Lógica de ordenação

#### **O - Open/Closed Principle (OCP)**
❌ **Violação:** Para adicionar novo tipo de evento realtime, precisa modificar o hook inteiro

✅ **Correto:** Sistema de event handlers extensível:
```typescript
interface RealtimeEventHandler<T> {
  handle(payload: T, currentState: ConversationWithContact[]): ConversationWithContact[];
}

// Adicionar novo handler sem modificar código existente
handlers.register('conversation-insert', new ConversationInsertHandler());
```

#### **L - Liskov Substitution Principle (LSP)**
❌ **Violação:** `ContactWithConversations` e `ConversationWithContact` não são intercambiáveis
- Precisa de adaptações manuais (linhas 26-29, 118-121)
- Viola contrato de tipos

✅ **Correto:** Trabalhar apenas com `ConversationWithContact` (decisão já documentada)

#### **I - Interface Segregation Principle (ISP)**
❌ **Violação:** Tipos genéricos com campos opcionais desnecessários:
```typescript
interface ContactWithConversations {
  activeConversations?: (Conversation & { lastMessage?: Message })[];
  // activeConversations pode ou não existir? lastMessage pode ou não existir?
  // Componente precisa validar tudo
}
```

✅ **Correto:** Interfaces específicas para cada caso de uso:
```typescript
interface ConversationCardData {
  id: string;
  contact: ContactData; // Sempre presente
  lastMessage: MessagePreview | null; // Explicitamente nullable
  status: ConversationStatus;
  iaActive: boolean;
}
```

#### **D - Dependency Inversion Principle (DIP)**
❌ **Violação:** Componentes dependem diretamente do Supabase client:
```typescript
// use-realtime-contact-list.ts linha 14
import { createClient } from '@/lib/supabase/client';
const supabase = createClient(); // Acoplamento direto
```

✅ **Correto:** Abstrair em repositories/services:
```typescript
interface IRealtimeService {
  subscribe<T>(config: SubscriptionConfig): RealtimeChannel;
  unsubscribe(channel: RealtimeChannel): void;
}

interface IConversationRepository {
  getById(id: string): Promise<ConversationWithContact>;
  getByTenant(tenantId: string): Promise<ConversationWithContact[]>;
}
```

---

### 3. **Problemas de Performance**

❌ **Queries adicionais dentro de callbacks realtime:**
```typescript
// use-realtime-contact-list.ts linha 65-69
.on('UPDATE', async (payload) => {
  const { data: contactData } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', payload.new.contact_id)
    .single(); // ❌ Query adicional para cada UPDATE
});
```

**Impacto:**
- Latência adicional (100-300ms por evento)
- Possíveis race conditions
- Consumo desnecessário de recursos

✅ **Solução:** JOIN no realtime ou cache local de contatos

---

### 4. **Transformações de Dados Excessivas**

```
SSR Data (ConversationWithContact[])
  ↓ (transformação #1)
ContactWithConversations[] (adaptação)
  ↓ (hook realtime)
ContactWithConversations[] (atualizado)
  ↓ (transformação #2)
ConversationWithContact[] (conversão de volta)
  ↓ (transformação #3 - para cada item)
ContactWithConversations (adaptação por item)
```

**Problema:** 3 transformações desnecessárias causam:
- Overhead de CPU
- Referências instáveis
- Dificuldade de debugar
- React não detecta mudanças

---

## ✅ Solução Proposta: Arquitetura SOLID

### Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────┐
│                  PRESENTATION                        │
│  Components: ConversationList, ConversationCard     │
│              (Apenas UI, sem lógica de negócio)     │
└────────────────────┬────────────────────────────────┘
                     │ Props (ConversationCardData[])
┌────────────────────▼────────────────────────────────┐
│                   HOOKS LAYER                        │
│  • useConversationList (state management)           │
│  • useRealtimeConversations (subscription manager)  │
│              (Orquestração e estado)                │
└────────────────────┬────────────────────────────────┘
                     │ Chama services
┌────────────────────▼────────────────────────────────┐
│                  SERVICES LAYER                      │
│  • ConversationService                              │
│  • RealtimeEventHandlers                            │
│              (Lógica de negócio)                    │
└────────────────────┬────────────────────────────────┘
                     │ Chama repositories
┌────────────────────▼────────────────────────────────┐
│                REPOSITORIES LAYER                    │
│  • ConversationRepository                           │
│  • RealtimeSubscriptionManager                      │
│              (Acesso a dados)                       │
└────────────────────┬────────────────────────────────┘
                     │ Queries
┌────────────────────▼────────────────────────────────┐
│               INFRASTRUCTURE LAYER                   │
│  • Supabase Client                                  │
│  • Realtime Channels                                │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Estratégia de Testes

**PRINCÍPIO:** Cada fase de implementação deve incluir testes antes de prosseguir.

### Abordagem: TDD (Test-Driven Development)

Para cada camada, seguir o ciclo:
1. 🔴 **Red:** Escrever teste que falha
2. 🟢 **Green:** Implementar código mínimo para passar
3. 🔵 **Refactor:** Melhorar código mantendo testes verdes

### Stack de Testes

```typescript
// Configuração de testes
{
  "unitários": "Vitest",           // Repositories, Services, Handlers
  "hooks": "React Testing Library", // useRealtimeConversations
  "componentes": "React Testing Library + Vitest",
  "e2e": "Playwright" (opcional)
}
```

### Estrutura de Arquivos de Teste

```
lib/
├── repositories/
│   ├── ConversationRepository.ts
│   └── __tests__/
│       └── ConversationRepository.test.ts
├── services/
│   ├── ConversationListService.ts
│   └── __tests__/
│       └── ConversationListService.test.ts
├── services/realtime/handlers/
│   ├── ConversationUpdateHandler.ts
│   └── __tests__/
│       ├── ConversationUpdateHandler.test.ts
│       └── MessageInsertHandler.test.ts
└── hooks/
    ├── use-realtime-conversations.ts
    └── __tests__/
        └── use-realtime-conversations.test.ts
```

### Mocks e Fixtures

**Arquivo:** `lib/__tests__/fixtures/conversations.ts`

```typescript
export const mockConversation: ConversationWithContact = {
  id: 'conv-1',
  tenant_id: 'tenant-1',
  contact_id: 'contact-1',
  status: 'open',
  ia_active: true,
  last_message_at: '2025-11-23T10:00:00Z',
  created_at: '2025-11-23T09:00:00Z',
  updated_at: '2025-11-23T10:00:00Z',
  contact: {
    id: 'contact-1',
    name: 'João Silva',
    phone: '5511999999999',
    email: 'joao@example.com',
    status: 'active',
  },
  lastMessage: {
    id: 'msg-1',
    conversation_id: 'conv-1',
    content: 'Olá, tudo bem?',
    timestamp: '2025-11-23T10:00:00Z',
    sender_type: 'client',
    sender_user_id: null,
  },
};

export const mockConversations: ConversationWithContact[] = [
  mockConversation,
  // ... mais conversas de teste
];
```

**Arquivo:** `lib/__tests__/mocks/supabase.ts`

```typescript
import { vi } from 'vitest';

export const createMockSupabaseClient = () => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
  channel: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(),
  removeChannel: vi.fn(),
});
```

---

## 📋 Plano de Implementação

### **FASE 1: Criar Abstrações e Tipos (DIP + ISP)**

#### 1.0. Setup de Testes (TDD)

**PRIMEIRO:** Configurar ambiente de testes

**Arquivo:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./lib/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**Arquivo:** `lib/__tests__/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock do Supabase
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));
```

**Criar fixtures:**
- `lib/__tests__/fixtures/conversations.ts` (conforme exemplo acima)
- `lib/__tests__/mocks/supabase.ts` (conforme exemplo acima)

**Comando de teste:**
```bash
npm run test        # Rodar todos os testes
npm run test:watch  # Watch mode
npm run test:ui     # UI do Vitest
```

#### 1.1. Criar interfaces de repositórios
**Arquivo:** `lib/repositories/interfaces/IConversationRepository.ts`

```typescript
export interface IConversationRepository {
  /**
   * Busca conversa por ID (com validação de tenant)
   */
  getById(conversationId: string, tenantId: string): Promise<ConversationWithContact | null>;

  /**
   * Busca todas conversas do tenant (com filtros)
   */
  getByTenant(tenantId: string, filters?: ConversationFilters): Promise<ConversationWithContact[]>;

  /**
   * Busca dados do contato (sem query adicional no realtime)
   */
  getContactById(contactId: string, tenantId: string): Promise<Contact | null>;
}
```

#### 1.2. Criar interface de serviço realtime
**Arquivo:** `lib/services/interfaces/IRealtimeService.ts`

```typescript
export interface RealtimeSubscriptionConfig {
  channel: string;
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  filter?: string;
}

export interface IRealtimeService {
  /**
   * Cria subscrição com callback tipado
   */
  subscribe<T>(
    config: RealtimeSubscriptionConfig,
    callback: (payload: RealtimePayload<T>) => void | Promise<void>
  ): RealtimeChannel;

  /**
   * Remove subscrição
   */
  unsubscribe(channel: RealtimeChannel): void;
}
```

#### 1.3. Criar tipos específicos (ISP)
**Arquivo:** `types/livechat-ui.ts`

```typescript
/**
 * Dados otimizados para renderizar card de conversa
 * (Interface Segregation - apenas o que a UI precisa)
 */
export interface ConversationCardData {
  id: string;
  status: ConversationStatus;
  iaActive: boolean;
  lastMessageAt: string;

  // Dados do contato (sempre presentes)
  contact: {
    id: string;
    name: string;
    phone: string;
    avatarUrl?: string;
  };

  // Preview da última mensagem (null se não houver)
  lastMessage: {
    id: string;
    content: string;
    timestamp: string;
    senderType: MessageSenderType;
  } | null;
}

/**
 * Converter de ConversationWithContact para ConversationCardData
 */
export function toCardData(conversation: ConversationWithContact): ConversationCardData {
  return {
    id: conversation.id,
    status: conversation.status,
    iaActive: conversation.ia_active,
    lastMessageAt: conversation.last_message_at || conversation.created_at,
    contact: {
      id: conversation.contact.id,
      name: conversation.contact.name,
      phone: conversation.contact.phone,
      avatarUrl: conversation.contact.avatar_url,
    },
    lastMessage: conversation.lastMessage ? {
      id: conversation.lastMessage.id,
      content: conversation.lastMessage.content,
      timestamp: conversation.lastMessage.timestamp,
      senderType: conversation.lastMessage.sender_type,
    } : null,
  };
}
```

---

### **FASE 2: Implementar Repositories (DIP)**

#### 2.1. ConversationRepository
**Arquivo:** `lib/repositories/ConversationRepository.ts`

```typescript
import { createClient } from '@/lib/supabase/client';
import type { IConversationRepository } from './interfaces/IConversationRepository';

export class ConversationRepository implements IConversationRepository {
  private supabase;

  // Cache local de contatos para evitar queries repetidas
  private contactsCache = new Map<string, Contact>();

  constructor() {
    this.supabase = createClient();
  }

  async getById(conversationId: string, tenantId: string): Promise<ConversationWithContact | null> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select(`
        *,
        contacts!inner(id, name, phone, email, avatar_url, status)
      `)
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) return null;

    // Buscar última mensagem
    const { data: lastMessageData } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    return {
      ...data,
      contact: data.contacts,
      lastMessage: lastMessageData || null,
    } as ConversationWithContact;
  }

  async getByTenant(tenantId: string, filters?: ConversationFilters): Promise<ConversationWithContact[]> {
    // Usar a query existente (já otimizada)
    // Mas retornar dados limpos sem transformações
    const conversations = await getConversationsWithContact(tenantId, filters);
    return conversations;
  }

  async getContactById(contactId: string, tenantId: string): Promise<Contact | null> {
    // Verificar cache primeiro
    if (this.contactsCache.has(contactId)) {
      return this.contactsCache.get(contactId)!;
    }

    const { data, error } = await this.supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) return null;

    // Adicionar ao cache
    this.contactsCache.set(contactId, data);
    return data;
  }

  clearCache() {
    this.contactsCache.clear();
  }
}

// Singleton instance
export const conversationRepository = new ConversationRepository();
```

#### 2.2. Testes do Repository (TDD)

**Arquivo:** `lib/repositories/__tests__/ConversationRepository.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversationRepository } from '../ConversationRepository';
import { mockConversation, mockConversations } from '@/lib/__tests__/fixtures/conversations';
import { createMockSupabaseClient } from '@/lib/__tests__/mocks/supabase';

// Mock do createClient
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => createMockSupabaseClient(),
}));

describe('ConversationRepository', () => {
  let repository: ConversationRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    repository = new ConversationRepository();
    (repository as any).supabase = mockSupabase;
    repository.clearCache();
  });

  describe('getById', () => {
    it('deve retornar conversa com contato e última mensagem', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockConversation, contacts: mockConversation.contact },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: mockConversation.lastMessage,
        error: null,
      });

      // Act
      const result = await repository.getById('conv-1', 'tenant-1');

      // Assert
      expect(result).toEqual(mockConversation);
      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'conv-1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
    });

    it('deve retornar null se conversa não existir', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      // Act
      const result = await repository.getById('invalid-id', 'tenant-1');

      // Assert
      expect(result).toBeNull();
    });

    it('deve retornar null se tenant_id não bater', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      // Act
      const result = await repository.getById('conv-1', 'wrong-tenant');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getContactById (cache)', () => {
    it('deve retornar contato do cache se existir', async () => {
      // Arrange
      const contact = mockConversation.contact;
      mockSupabase.single.mockResolvedValueOnce({ data: contact, error: null });

      // Act - primeira chamada (popula cache)
      await repository.getContactById('contact-1', 'tenant-1');

      // Act - segunda chamada (deve usar cache)
      const result = await repository.getContactById('contact-1', 'tenant-1');

      // Assert
      expect(result).toEqual(contact);
      expect(mockSupabase.from).toHaveBeenCalledTimes(1); // Apenas 1 query (primeira)
    });

    it('deve fazer query se não estiver no cache', async () => {
      // Arrange
      const contact = mockConversation.contact;
      mockSupabase.single.mockResolvedValueOnce({ data: contact, error: null });

      // Act
      const result = await repository.getContactById('contact-1', 'tenant-1');

      // Assert
      expect(result).toEqual(contact);
      expect(mockSupabase.from).toHaveBeenCalledWith('contacts');
    });

    it('clearCache deve limpar o cache', async () => {
      // Arrange
      const contact = mockConversation.contact;
      mockSupabase.single.mockResolvedValue({ data: contact, error: null });

      // Act
      await repository.getContactById('contact-1', 'tenant-1');
      repository.clearCache();
      await repository.getContactById('contact-1', 'tenant-1');

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledTimes(2); // Cache foi limpo, fez 2 queries
    });
  });
});
```

**Rodar testes:**
```bash
npm run test -- ConversationRepository.test.ts
```

**Critério de aceite:**
✅ Todos os testes passando
✅ Coverage > 80% no repository
✅ Testes validam cache funcionando

---

### **FASE 3: Criar Event Handlers (SRP + OCP)**

#### 3.1. Base Handler
**Arquivo:** `lib/services/realtime/handlers/BaseRealtimeHandler.ts`

```typescript
export interface RealtimeEventHandler<T> {
  /**
   * Processa evento e retorna novo estado
   */
  handle(
    payload: RealtimePayload<T>,
    currentState: ConversationWithContact[],
    context: HandlerContext
  ): Promise<ConversationWithContact[]>;
}

export interface HandlerContext {
  tenantId: string;
  repository: IConversationRepository;
}
```

#### 3.2. ConversationUpdateHandler
**Arquivo:** `lib/services/realtime/handlers/ConversationUpdateHandler.ts`

```typescript
export class ConversationUpdateHandler implements RealtimeEventHandler<Conversation> {
  async handle(
    payload: RealtimePayload<Conversation>,
    currentState: ConversationWithContact[],
    context: HandlerContext
  ): Promise<ConversationWithContact[]> {
    const updatedConversation = payload.new;

    // Verificar se conversa existe na lista
    const existingIndex = currentState.findIndex(c => c.id === updatedConversation.id);

    if (existingIndex === -1) {
      // Conversa nova que não estava na lista - buscar dados completos
      const fullConversation = await context.repository.getById(
        updatedConversation.id,
        context.tenantId
      );

      if (!fullConversation) return currentState;

      // Adicionar no início (mais recente)
      return [fullConversation, ...currentState];
    }

    // Atualizar conversa existente (manter contact e lastMessage)
    const updated = [...currentState];
    updated[existingIndex] = {
      ...updated[existingIndex],
      ...updatedConversation,
      // Preservar dados que não vêm no payload do realtime
      contact: updated[existingIndex].contact,
      lastMessage: updated[existingIndex].lastMessage,
    };

    return updated;
  }
}
```

#### 3.3. MessageInsertHandler
**Arquivo:** `lib/services/realtime/handlers/MessageInsertHandler.ts`

```typescript
export class MessageInsertHandler implements RealtimeEventHandler<Message> {
  async handle(
    payload: RealtimePayload<Message>,
    currentState: ConversationWithContact[],
    context: HandlerContext
  ): Promise<ConversationWithContact[]> {
    const newMessage = payload.new;

    // Verificar se conversa existe na lista
    const conversationIndex = currentState.findIndex(
      c => c.id === newMessage.conversation_id
    );

    if (conversationIndex === -1) {
      // Mensagem de conversa que não está na lista (filtro)
      return currentState;
    }

    // Atualizar lastMessage e last_message_at
    const updated = [...currentState];
    updated[conversationIndex] = {
      ...updated[conversationIndex],
      lastMessage: newMessage,
      last_message_at: newMessage.timestamp,
    };

    return updated;
  }
}
```

#### 3.4. Testes dos Event Handlers (TDD)

**Arquivo:** `lib/services/realtime/handlers/__tests__/ConversationUpdateHandler.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversationUpdateHandler } from '../ConversationUpdateHandler';
import { mockConversation, mockConversations } from '@/lib/__tests__/fixtures/conversations';

describe('ConversationUpdateHandler', () => {
  let handler: ConversationUpdateHandler;
  let mockContext: any;

  beforeEach(() => {
    handler = new ConversationUpdateHandler();
    mockContext = {
      tenantId: 'tenant-1',
      repository: {
        getById: vi.fn(),
      },
    };
  });

  it('deve atualizar conversa existente mantendo dados anteriores', async () => {
    // Arrange
    const currentState = [mockConversation];
    const payload = {
      new: {
        ...mockConversation,
        status: 'paused', // Mudança de status
        ia_active: false,
      },
      old: mockConversation,
    };

    // Act
    const result = await handler.handle(payload, currentState, mockContext);

    // Assert
    expect(result[0].status).toBe('paused');
    expect(result[0].ia_active).toBe(false);
    expect(result[0].contact).toEqual(mockConversation.contact); // Manteve contact
    expect(result[0].lastMessage).toEqual(mockConversation.lastMessage); // Manteve lastMessage
  });

  it('deve adicionar conversa nova se não existir na lista', async () => {
    // Arrange
    const currentState = [mockConversation];
    const newConversation = { ...mockConversation, id: 'conv-2' };
    const payload = {
      new: newConversation,
      old: {},
    };

    mockContext.repository.getById.mockResolvedValue(newConversation);

    // Act
    const result = await handler.handle(payload, currentState, mockContext);

    // Assert
    expect(result.length).toBe(2);
    expect(result[0]).toEqual(newConversation); // Nova conversa no início
    expect(mockContext.repository.getById).toHaveBeenCalledWith('conv-2', 'tenant-1');
  });

  it('deve retornar estado atual se não conseguir buscar conversa nova', async () => {
    // Arrange
    const currentState = [mockConversation];
    const payload = {
      new: { ...mockConversation, id: 'conv-2' },
      old: {},
    };

    mockContext.repository.getById.mockResolvedValue(null);

    // Act
    const result = await handler.handle(payload, currentState, mockContext);

    // Assert
    expect(result).toEqual(currentState); // Estado não mudou
  });
});
```

**Arquivo:** `lib/services/realtime/handlers/__tests__/MessageInsertHandler.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MessageInsertHandler } from '../MessageInsertHandler';
import { mockConversation } from '@/lib/__tests__/fixtures/conversations';

describe('MessageInsertHandler', () => {
  let handler: MessageInsertHandler;
  let mockContext: any;

  beforeEach(() => {
    handler = new MessageInsertHandler();
    mockContext = {
      tenantId: 'tenant-1',
      repository: {},
    };
  });

  it('deve atualizar lastMessage da conversa', async () => {
    // Arrange
    const currentState = [mockConversation];
    const newMessage = {
      id: 'msg-2',
      conversation_id: 'conv-1',
      content: 'Nova mensagem',
      timestamp: '2025-11-23T11:00:00Z',
      sender_type: 'client',
    };
    const payload = {
      new: newMessage,
      old: {},
    };

    // Act
    const result = await handler.handle(payload, currentState, mockContext);

    // Assert
    expect(result[0].lastMessage).toEqual(newMessage);
    expect(result[0].last_message_at).toBe('2025-11-23T11:00:00Z');
  });

  it('deve ignorar mensagem de conversa que não está na lista', async () => {
    // Arrange
    const currentState = [mockConversation];
    const newMessage = {
      id: 'msg-2',
      conversation_id: 'conv-999', // Conversa não existe
      content: 'Nova mensagem',
      timestamp: '2025-11-23T11:00:00Z',
      sender_type: 'client',
    };
    const payload = {
      new: newMessage,
      old: {},
    };

    // Act
    const result = await handler.handle(payload, currentState, mockContext);

    // Assert
    expect(result).toEqual(currentState); // Estado não mudou
  });

  it('deve manter outras conversas inalteradas', async () => {
    // Arrange
    const conversation2 = { ...mockConversation, id: 'conv-2' };
    const currentState = [mockConversation, conversation2];
    const newMessage = {
      id: 'msg-2',
      conversation_id: 'conv-1',
      content: 'Nova mensagem',
      timestamp: '2025-11-23T11:00:00Z',
      sender_type: 'client',
    };
    const payload = {
      new: newMessage,
      old: {},
    };

    // Act
    const result = await handler.handle(payload, currentState, mockContext);

    // Assert
    expect(result[1]).toEqual(conversation2); // conv-2 não mudou
    expect(result[0].lastMessage?.id).toBe('msg-2'); // conv-1 mudou
  });
});
```

**Rodar testes:**
```bash
npm run test -- handlers
```

**Critério de aceite:**
✅ Todos os testes dos handlers passando
✅ Coverage > 90% (handlers são lógica crítica)
✅ Testes validam imutabilidade (não modifica estado original)

---

### **FASE 4: Criar Service Layer (SRP)**

#### 4.1. ConversationListService
**Arquivo:** `lib/services/ConversationListService.ts`

```typescript
import { sortConversationsByLastMessage } from '@/lib/utils/contact-list';

export class ConversationListService {
  constructor(
    private repository: IConversationRepository
  ) {}

  /**
   * Busca conversas com ordenação automática
   */
  async getConversations(
    tenantId: string,
    filters?: ConversationFilters
  ): Promise<ConversationWithContact[]> {
    const conversations = await this.repository.getByTenant(tenantId, filters);
    return sortConversationsByLastMessage(conversations);
  }

  /**
   * Aplica filtros client-side (para casos específicos)
   */
  filterConversations(
    conversations: ConversationWithContact[],
    filters: {
      search?: string;
      status?: ConversationStatus;
    }
  ): ConversationWithContact[] {
    let filtered = conversations;

    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(conv =>
        conv.contact.name.toLowerCase().includes(query) ||
        conv.contact.phone.includes(query)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(conv => conv.status === filters.status);
    }

    return filtered;
  }

  /**
   * Ordena conversas
   */
  sortConversations(
    conversations: ConversationWithContact[]
  ): ConversationWithContact[] {
    return sortConversationsByLastMessage(conversations);
  }
}
```

---

### **FASE 5: Criar Hook Refatorado (SRP)**

#### 5.1. useRealtimeConversations
**Arquivo:** `lib/hooks/use-realtime-conversations.ts`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { conversationRepository } from '@/lib/repositories/ConversationRepository';
import { ConversationUpdateHandler } from '@/lib/services/realtime/handlers/ConversationUpdateHandler';
import { MessageInsertHandler } from '@/lib/services/realtime/handlers/MessageInsertHandler';
import { sortConversationsByLastMessage } from '@/lib/utils/contact-list';
import type { ConversationWithContact } from '@/types/livechat';
import type { Conversation, Message } from '@/types/database';

/**
 * Hook para gerenciar subscrições realtime de conversas
 *
 * PRINCÍPIOS SOLID:
 * - SRP: Apenas gerencia subscrições e estado
 * - DIP: Depende de abstrações (handlers)
 * - OCP: Extensível via handlers
 */
export function useRealtimeConversations(
  tenantId: string,
  initialConversations: ConversationWithContact[]
) {
  const [conversations, setConversations] = useState<ConversationWithContact[]>(
    sortConversationsByLastMessage(initialConversations)
  );

  const supabase = createClient();

  // Handlers (injeção de dependência)
  const conversationUpdateHandler = new ConversationUpdateHandler();
  const messageInsertHandler = new MessageInsertHandler();

  // Context para handlers
  const handlerContext = {
    tenantId,
    repository: conversationRepository,
  };

  useEffect(() => {
    // Reset quando initial data muda
    setConversations(sortConversationsByLastMessage(initialConversations));
  }, [initialConversations]);

  useEffect(() => {
    // === SUBSCRIPTION: Conversas (UPDATE) ===
    const conversationsChannel = supabase
      .channel(`tenant:${tenantId}:conversations`)
      .on<Conversation>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          // Delegar para handler (SRP)
          const updated = await conversationUpdateHandler.handle(
            payload,
            conversations,
            handlerContext
          );

          // Reordenar e atualizar estado
          setConversations(sortConversationsByLastMessage(updated));
        }
      )
      .subscribe();

    // === SUBSCRIPTION: Mensagens (INSERT) ===
    const messagesChannel = supabase
      .channel(`tenant:${tenantId}:messages`)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Delegar para handler (SRP)
          const updated = await messageInsertHandler.handle(
            payload,
            conversations,
            handlerContext
          );

          // Reordenar e atualizar estado
          setConversations(sortConversationsByLastMessage(updated));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [tenantId]); // Apenas tenantId - conversations via closure

  return { conversations };
}
```

**PROBLEMA RESOLVIDO:**
- ✅ Sem transformações de tipo
- ✅ Estado atualiza diretamente `ConversationWithContact[]`
- ✅ React detecta mudanças (novo array com `sortConversationsByLastMessage`)
- ✅ Cards atualizam em tempo real

#### 5.2. Testes do Hook (React Testing Library)

**Arquivo:** `lib/hooks/__tests__/use-realtime-conversations.test.tsx`

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRealtimeConversations } from '../use-realtime-conversations';
import { mockConversations } from '@/lib/__tests__/fixtures/conversations';

// Mock do Supabase client
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(),
};

const mockSupabase = {
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// Mock dos handlers
vi.mock('@/lib/services/realtime/handlers/ConversationUpdateHandler');
vi.mock('@/lib/services/realtime/handlers/MessageInsertHandler');

describe('useRealtimeConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve inicializar com conversas ordenadas', () => {
    // Act
    const { result } = renderHook(() =>
      useRealtimeConversations('tenant-1', mockConversations)
    );

    // Assert
    expect(result.current.conversations).toEqual(mockConversations);
  });

  it('deve criar subscrições para conversations e messages', () => {
    // Act
    renderHook(() =>
      useRealtimeConversations('tenant-1', mockConversations)
    );

    // Assert
    expect(mockSupabase.channel).toHaveBeenCalledWith('tenant:tenant-1:conversations');
    expect(mockSupabase.channel).toHaveBeenCalledWith('tenant:tenant-1:messages');
    expect(mockChannel.subscribe).toHaveBeenCalledTimes(2);
  });

  it('deve atualizar estado quando initialConversations mudar', () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ conversations }) => useRealtimeConversations('tenant-1', conversations),
      { initialProps: { conversations: mockConversations } }
    );

    const newConversations = [...mockConversations];
    newConversations[0] = { ...newConversations[0], status: 'paused' };

    // Act
    rerender({ conversations: newConversations });

    // Assert
    waitFor(() => {
      expect(result.current.conversations[0].status).toBe('paused');
    });
  });

  it('deve remover channels ao desmontar', () => {
    // Act
    const { unmount } = renderHook(() =>
      useRealtimeConversations('tenant-1', mockConversations)
    );

    unmount();

    // Assert
    expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(2);
  });
});
```

**Rodar testes:**
```bash
npm run test -- use-realtime-conversations.test.tsx
```

**Critério de aceite:**
✅ Testes do hook passando
✅ Validar subscrições criadas
✅ Validar cleanup ao desmontar
✅ Validar reatividade ao mudar props

---

### **FASE 6: Refatorar Componentes (SRP)**

#### 6.1. ConversationList (antiga ContactList)
**Arquivo:** `components/livechat/conversation-list.tsx`

```typescript
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConversationCard } from './conversation-card';
import { Search } from 'lucide-react';
import { useRealtimeConversations } from '@/lib/hooks/use-realtime-conversations';
import { toCardData } from '@/types/livechat-ui';
import type { ConversationWithContact } from '@/types/livechat';
import type { ConversationStatus } from '@/types/database';

interface ConversationListProps {
  initialConversations: ConversationWithContact[];
  selectedConversationId?: string;
  tenantId: string;
}

export function ConversationList({
  initialConversations,
  selectedConversationId,
  tenantId,
}: ConversationListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'all'>('all');

  // ✅ Hook retorna tipo correto direto
  const { conversations } = useRealtimeConversations(tenantId, initialConversations);

  // ✅ Filtros aplicados no tipo correto
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv =>
        conv.contact.name.toLowerCase().includes(query) ||
        conv.contact.phone.includes(query)
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

    return filtered;
  }, [conversations, searchQuery, statusFilter]);

  // ✅ Contadores baseados no estado realtime
  const statusCounts = useMemo(() => ({
    all: conversations.length,
    open: conversations.filter(c => c.status === 'open').length,
    paused: conversations.filter(c => c.status === 'paused').length,
    closed: conversations.filter(c => c.status === 'closed').length,
  }), [conversations]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={statusFilter === 'open' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('open')}
          >
            Ativas ({statusCounts.open})
          </Badge>
          <Badge
            variant={statusFilter === 'paused' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('paused')}
          >
            Aguardando ({statusCounts.paused})
          </Badge>
          <Badge
            variant={statusFilter === 'closed' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('closed')}
          >
            Encerradas ({statusCounts.closed})
          </Badge>
          <Badge
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('all')}
          >
            Todas ({statusCounts.all})
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery
              ? 'Nenhuma conversa encontrada'
              : 'Nenhuma conversa ativa'}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              data={toCardData(conversation)} // ✅ Conversão para tipo UI
              isSelected={selectedConversationId === conversation.id}
              onClick={() => router.push(`/livechat?conversation=${conversation.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

**MELHORIAS:**
- ✅ Sem transformações de tipo (useMemo desnecessários removidos)
- ✅ Estado realtime funciona corretamente
- ✅ React detecta mudanças
- ✅ Cards atualizam automaticamente

#### 6.2. ConversationCard (antiga ContactItem)
**Arquivo:** `components/livechat/conversation-card.tsx`

```typescript
'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  formatMessagePreview,
  formatRelativeTime,
} from '@/lib/utils/contact-list';
import type { ConversationCardData } from '@/types/livechat-ui';

interface ConversationCardProps {
  data: ConversationCardData; // ✅ Tipo específico da UI (ISP)
  isSelected?: boolean;
  onClick?: () => void;
}

export function ConversationCard({
  data,
  isSelected = false,
  onClick,
}: ConversationCardProps) {
  const initials = data.contact.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const messagePreview = formatMessagePreview(data.lastMessage?.content);
  const timeDisplay = formatRelativeTime(data.lastMessageAt);

  const statusColors = {
    open: 'bg-green-600',
    paused: 'bg-yellow-600',
    closed: 'bg-gray-400',
  };

  const statusLabels = {
    open: 'Conversa Ativa',
    paused: 'Conversa Aguardando',
    closed: 'Encerrada',
  };

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer hover:bg-accent transition-colors',
        isSelected && 'bg-accent border-primary'
      )}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium truncate">{data.contact.name}</span>
            {timeDisplay && (
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {timeDisplay}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground truncate mb-2">
            {messagePreview}
          </p>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn('text-white', statusColors[data.status])}
            >
              {statusLabels[data.status]}
            </Badge>
            {!data.iaActive && (
              <Badge variant="outline">IA Desativada</Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
```

**MELHORIAS:**
- ✅ Props tipadas especificamente (ISP)
- ✅ Sem lógica de transformação
- ✅ Apenas UI pura

---

## 🧪 Testes de Validação

### Testes Funcionais

1. **Atualização em tempo real de status:**
   - [ ] Pausar conversa → Card atualiza badge sem refresh
   - [ ] Retomar conversa → Card atualiza badge sem refresh
   - [ ] Pausar IA → Card mostra "IA Desativada" sem refresh

2. **Atualização de preview de mensagem:**
   - [ ] Enviar mensagem → Preview atualiza sem refresh
   - [ ] Mensagem recebida → Preview atualiza sem refresh
   - [ ] Reordenação automática → Card move para topo sem refresh

3. **Performance:**
   - [ ] Medir latência: evento realtime → atualização UI (deve ser <100ms)
   - [ ] Verificar se há queries duplicadas no Network tab
   - [ ] Validar que cache de contatos funciona

### Testes de Arquitetura

1. **SOLID:**
   - [ ] Cada classe tem apenas uma responsabilidade
   - [ ] Novos handlers podem ser adicionados sem modificar código existente
   - [ ] Componentes dependem de interfaces, não implementações
   - [ ] Tipos específicos para cada camada

2. **Manutenibilidade:**
   - [ ] Adicionar novo evento realtime sem modificar hook
   - [ ] Trocar Supabase por outro provider modificando apenas repository

---

## 📊 Impacto Estimado

### Arquivos a Criar:
1. `lib/repositories/interfaces/IConversationRepository.ts`
2. `lib/repositories/ConversationRepository.ts`
3. `lib/services/interfaces/IRealtimeService.ts`
4. `lib/services/ConversationListService.ts`
5. `lib/services/realtime/handlers/BaseRealtimeHandler.ts`
6. `lib/services/realtime/handlers/ConversationUpdateHandler.ts`
7. `lib/services/realtime/handlers/MessageInsertHandler.ts`
8. `types/livechat-ui.ts`

### Arquivos a Modificar:
1. `lib/hooks/use-realtime-conversations.ts` (refatorar)
2. `components/livechat/conversation-list.tsx` (refatorar)
3. `components/livechat/conversation-card.tsx` (refatorar)

### Arquivos a Deprecar (manter temporariamente):
1. `lib/hooks/use-realtime-contact-list.ts`
2. `components/livechat/contact-list.tsx`
3. `components/livechat/contact-item.tsx`

### Estimativa:
- **Desenvolvimento:** 6-8 horas
- **Testes:** 2-3 horas
- **Total:** 8-11 horas

### Risco:
- **Baixo-Médio** - Refatoração incremental com tipos bem definidos

---

## 🎯 Próximos Passos

### Ordem de Implementação (TDD):

**IMPORTANTE:** Cada fase inclui testes ANTES de prosseguir para a próxima.

#### Fase 0: Setup (30min)
- [ ] Configurar Vitest
- [ ] Criar arquivos de setup de testes
- [ ] Criar fixtures e mocks
- [ ] Adicionar scripts de teste ao package.json
  ```json
  {
    "scripts": {
      "test": "vitest",
      "test:watch": "vitest --watch",
      "test:ui": "vitest --ui",
      "test:coverage": "vitest --coverage"
    }
  }
  ```

#### Fase 1: Interfaces e Tipos (1h)
- [ ] Criar `IConversationRepository` interface
- [ ] Criar `IRealtimeService` interface
- [ ] Criar tipos em `types/livechat-ui.ts`
- [ ] ✅ **Validar:** TypeScript compila sem erros

#### Fase 2: Repositories (1.5h)
- [ ] 🔴 Escrever testes do `ConversationRepository`
- [ ] 🟢 Implementar `ConversationRepository`
- [ ] 🔵 Refatorar (cache, otimizações)
- [ ] ✅ **Rodar:** `npm run test -- ConversationRepository.test.ts`
- [ ] ✅ **Validar:** Coverage > 80%

#### Fase 3: Event Handlers (2.5h)
- [ ] 🔴 Escrever testes do `ConversationUpdateHandler`
- [ ] 🟢 Implementar `ConversationUpdateHandler`
- [ ] 🔴 Escrever testes do `MessageInsertHandler`
- [ ] 🟢 Implementar `MessageInsertHandler`
- [ ] 🔵 Refatorar (extrair base handler se necessário)
- [ ] ✅ **Rodar:** `npm run test -- handlers`
- [ ] ✅ **Validar:** Coverage > 90% (lógica crítica)

#### Fase 4: Service Layer (1h)
- [ ] 🔴 Escrever testes do `ConversationListService`
- [ ] 🟢 Implementar `ConversationListService`
- [ ] ✅ **Rodar:** `npm run test -- ConversationListService.test.ts`
- [ ] ✅ **Validar:** Todos os testes passando

#### Fase 5: Hook Refatorado (2.5h)
- [ ] 🔴 Escrever testes do `useRealtimeConversations`
- [ ] 🟢 Implementar `useRealtimeConversations`
- [ ] 🔵 Refatorar (otimizar subscrições)
- [ ] ✅ **Rodar:** `npm run test -- use-realtime-conversations.test.tsx`
- [ ] ✅ **Validar:** Subscrições funcionando, cleanup correto

#### Fase 6: Componentes (2h)
- [ ] Refatorar `ConversationList` (usar novo hook)
- [ ] Refatorar `ConversationCard` (usar tipo UI)
- [ ] ✅ **Teste manual:** Abrir Livechat, verificar renderização
- [ ] ✅ **DevTools:** Verificar re-renders desnecessários

#### Fase 7: Testes de Integração (1.5h)
- [ ] **Teste E2E: Atualização em tempo real**
  - Simular UPDATE de conversa (pausar IA)
  - Validar badge atualiza sem refresh
- [ ] **Teste E2E: Preview de mensagem**
  - Simular INSERT de mensagem
  - Validar preview atualiza e card reordena
- [ ] **Teste de Performance**
  - Medir latência realtime → UI
  - Validar < 100ms

#### Fase 8: Limpeza e Documentação (30min)
- [ ] Deprecar arquivos antigos (adicionar comentários)
- [ ] Atualizar `LIVECHAT_STATUS.md`
- [ ] Rodar todos os testes: `npm run test`
- [ ] Gerar relatório de coverage: `npm run test:coverage`
- [ ] ✅ **Validar:** Coverage geral > 80%

---

### Critérios de Aceite Final:

#### Funcionalidade
✅ Cards atualizam em tempo real sem refresh
✅ Preview de mensagens atualiza automaticamente
✅ Reordenação funciona (mais recente primeiro)
✅ Filtros (status) funcionam
✅ Busca funciona

#### Performance
✅ Sem queries duplicadas
✅ Performance <100ms do evento ao UI
✅ Cache de contatos funcionando

#### Qualidade de Código
✅ Código segue SOLID
✅ Tipos bem definidos (sem `any` desnecessário)
✅ Testes passando (coverage > 80%)
✅ ESLint sem erros
✅ TypeScript compila sem erros

#### Arquitetura
✅ Separação clara de responsabilidades
✅ Fácil adicionar novos event handlers
✅ Fácil trocar implementação de repository
✅ Componentes desacoplados do Supabase

---

## 📝 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Rodar Next.js
npm run test:watch       # Testes em watch mode

# Testes
npm run test             # Rodar todos os testes
npm run test:coverage    # Coverage report
npm run test:ui          # UI interativa do Vitest

# Validação
npm run lint             # ESLint
npm run type-check       # TypeScript
npm run build            # Build de produção

# Debug de Realtime
# Abrir DevTools → Network → WS (WebSocket)
# Filtrar por "realtime" para ver eventos
```

---

**Autor:** Claude + Frank
**Última Atualização:** 2025-11-23
**Tempo Estimado Total:** 12-14 horas (incluindo testes)
