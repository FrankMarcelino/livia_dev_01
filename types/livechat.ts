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

// ============================================================================
// QUICK REPLIES
// ============================================================================

/**
 * Quick Reply do tenant
 */
export interface QuickReply {
  id: string;
  tenant_id: string;
  title: string;
  message: string;
  icon: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Payload para criar quick reply
 */
export interface QuickReplyCreatePayload {
  title: string;
  message: string;
  icon?: string;
  tenantId: string;
}

/**
 * Payload para incrementar uso de quick reply
 */
export interface QuickReplyUsagePayload {
  quickReplyId: string;
  tenantId: string;
}

// ============================================================================
// MESSAGE FEEDBACK
// ============================================================================

/**
 * Feedback de mensagem da IA
 */
export interface MessageFeedback {
  id: string;
  tenant_id: string;
  message_id: string;
  conversation_id: string;
  rating: 'positive' | 'negative';
  comment: string | null;
  user_id: string;
  created_at: string;
}

/**
 * Payload para criar feedback
 */
export interface MessageFeedbackPayload {
  messageId: string;
  conversationId: string;
  rating: 'positive' | 'negative';
  comment?: string;
  tenantId: string;
}

// ============================================================================
// CONTACT DATA
// ============================================================================

/**
 * Histórico de alteração de dados do contato
 */
export interface ContactDataChange {
  id: string;
  tenant_id: string;
  contact_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_at: string;
}

/**
 * Payload para atualizar campo do contato
 */
export interface ContactUpdatePayload {
  contactId: string;
  field: string;
  value: unknown;
  tenantId: string;
}
