import type { Conversation, Contact, Tag } from './database-helpers';

/**
 * CRM Types - Feature Kanban Board
 *
 * Princípios SOLID:
 * - Single Responsibility: Tipos específicos para o módulo CRM
 * - Interface Segregation: Interfaces focadas e específicas
 */

/**
 * Conversa com suas tags e informações do contato
 * Usado no KanbanBoard para renderizar cards
 */
export interface ConversationWithTagsAndContact extends Conversation {
  contact: Contact;
  conversation_tags: Array<{
    tag: Tag;
  }>;
  lastMessage?: {
    content: string;
    timestamp: string;
  } | null;
}

/**
 * Estrutura de uma coluna no Kanban
 * Cada coluna representa uma tag
 */
export interface KanbanColumn {
  tag: Tag;
  conversations: ConversationWithTagsAndContact[];
  count: number;
}

/**
 * Filtros de status para o CRM
 * Define quais conversas são exibidas
 */
export type CRMStatusFilter = 'ia' | 'manual' | 'closed' | 'all';

/**
 * Props para componentes CRM
 */
export interface CRMFiltersProps {
  currentFilter: CRMStatusFilter;
  onFilterChange: (filter: CRMStatusFilter) => void;
  statusCounts: {
    open: number; // Mantido para compatibilidade, mas representa "ia"
    paused: number; // Mantido para compatibilidade, mas representa "manual"
    closed: number;
    all: number;
  };
}

export interface CRMKanbanBoardProps {
  initialTags: Tag[];
  initialConversations: ConversationWithTagsAndContact[];
  tenantId: string;
}

export interface CRMKanbanColumnProps {
  tag: Tag;
  conversations: ConversationWithTagsAndContact[];
  currentFilter: CRMStatusFilter;
}

export interface CRMConversationCardProps {
  conversation: ConversationWithTagsAndContact;
}
