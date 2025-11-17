/**
 * Livechat Types - Tipos compostos específicos do Livechat
 */

import type {
  Contact,
  Conversation,
  Message,
  User,
} from './database';

// ============================================================================
// COMPOSITE TYPES
// ============================================================================

/**
 * Contato com suas conversas ativas
 */
export interface ContactWithConversations extends Contact {
  activeConversations: ConversationWithLastMessage[];
}

/**
 * Conversa com última mensagem
 */
export interface ConversationWithLastMessage extends Conversation {
  lastMessage: Message | null;
}

/**
 * Mensagem com informações do remetente
 */
export interface MessageWithSender extends Message {
  senderUser?: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null;
}

/**
 * Conversa completa com contato e mensagens
 */
export interface ConversationWithDetails extends Conversation {
  contact: Contact;
  messages: MessageWithSender[];
}

// ============================================================================
// API PAYLOADS
// ============================================================================

/**
 * Payload para enviar mensagem manual
 */
export interface SendMessagePayload {
  conversationId: string;
  content: string;
  tenantId: string;
}

/**
 * Payload para pausar IA
 */
export interface PauseIAPayload {
  conversationId: string;
  tenantId: string;
  reason?: string;
}

/**
 * Payload para retomar IA
 */
export interface ResumeIAPayload {
  conversationId: string;
  tenantId: string;
}

/**
 * Payload para usar quick reply
 */
export interface UseQuickReplyPayload {
  quickReplyId: string;
  conversationId: string;
  tenantId: string;
}

// ============================================================================
// FILTERS
// ============================================================================

/**
 * Filtros para listagem de contatos
 */
export interface ContactFilters {
  search?: string; // Busca por nome ou phone
  status?: Contact['status'];
  limit?: number;
  offset?: number;
}

/**
 * Filtros para listagem de mensagens
 */
export interface MessageFilters {
  conversationId: string;
  limit?: number;
  before?: string; // timestamp
  after?: string; // timestamp
}

// ============================================================================
// UI STATE
// ============================================================================

/**
 * Estado de envio de mensagem
 */
export interface MessageSendState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Estado de controles da conversa
 */
export interface ConversationControlsState {
  isPausingIA: boolean;
  isResumingIA: boolean;
  error: string | null;
}
