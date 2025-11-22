/**
 * Contact List Utilities
 *
 * Utilities para ordenação, formatação e manipulação da lista de contatos.
 * Segue Single Responsibility Principle - cada função tem uma única responsabilidade.
 */

import type { ContactWithConversations, ConversationWithContact } from '@/types/livechat';

/**
 * Opções de ordenação da lista de contatos
 */
export interface ContactListSortOptions {
  sortBy: 'last_message' | 'name' | 'status';
  order: 'asc' | 'desc';
}

/**
 * Ordena lista de contatos por última mensagem (mais recente primeiro)
 *
 * @param contacts - Lista de contatos a ordenar
 * @param options - Opções de ordenação (padrão: last_message desc)
 * @returns Lista ordenada (nova instância, não modifica original)
 *
 * @example
 * const sorted = sortContactsByLastMessage(contacts);
 * // Contatos com mensagem mais recente aparecem primeiro
 */
export function sortContactsByLastMessage(
  contacts: ContactWithConversations[],
  options: ContactListSortOptions = { sortBy: 'last_message', order: 'desc' }
): ContactWithConversations[] {
  // Criar cópia para não mutar original (immutability)
  return [...contacts].sort((a, b) => {
    // Pegar primeira conversa ativa de cada contato
    const aConv = a.activeConversations?.[0];
    const bConv = b.activeConversations?.[0];

    // Contatos sem conversa vão pro final
    if (!aConv && !bConv) return 0;
    if (!aConv) return 1;
    if (!bConv) return -1;

    // Pegar timestamp da última mensagem (ou criação da conversa como fallback)
    const aTime = aConv.lastMessage?.timestamp
      || aConv.last_message_at
      || aConv.created_at;
    const bTime = bConv.lastMessage?.timestamp
      || bConv.last_message_at
      || bConv.created_at;

    // Converter para timestamp numérico e comparar
    const comparison = new Date(bTime).getTime() - new Date(aTime).getTime();

    // Aplicar ordem (desc = mais recente primeiro, asc = mais antigo primeiro)
    return options.order === 'desc' ? comparison : -comparison;
  });
}

/**
 * Formata preview da mensagem (trunca se necessário)
 *
 * @param content - Conteúdo da mensagem
 * @param maxLength - Tamanho máximo (padrão: 50)
 * @returns Preview formatado
 *
 * @example
 * formatMessagePreview("Mensagem muito longa...", 10)
 * // "Mensagem m..."
 */
export function formatMessagePreview(
  content: string | null | undefined,
  maxLength = 50
): string {
  if (!content || content.trim() === '') {
    return 'Sem mensagens';
  }

  const trimmed = content.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.substring(0, maxLength)}...`;
}

/**
 * Formata timestamp como tempo relativo (Agora, 5m, 2h, 3d, 10/01)
 *
 * @param timestamp - ISO timestamp
 * @returns Tempo relativo formatado
 *
 * @example
 * formatRelativeTime("2025-01-22T10:00:00Z")
 * // Se agora é 10:05 -> "5m"
 * // Se agora é 12:00 -> "2h"
 * // Se agora é amanhã -> "1d"
 * // Se foi semana passada -> "15/01"
 */
export function formatRelativeTime(timestamp: string | null | undefined): string {
  if (!timestamp) return '';

  const now = new Date();
  const messageDate = new Date(timestamp);

  // Validar data
  if (isNaN(messageDate.getTime())) return '';

  const diffMs = now.getTime() - messageDate.getTime();

  // Futuro (erro de timezone ou clock)
  if (diffMs < 0) {
    return messageDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Menos de 1 minuto
  if (diffMins < 1) return 'Agora';

  // Menos de 1 hora (mostra minutos)
  if (diffMins < 60) return `${diffMins}m`;

  // Menos de 24 horas (mostra horas)
  if (diffHours < 24) return `${diffHours}h`;

  // Menos de 7 dias (mostra dias)
  if (diffDays < 7) return `${diffDays}d`;

  // Mais de 7 dias (mostra data DD/MM)
  return messageDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

/**
 * Formata horário completo (HH:MM)
 *
 * @param timestamp - ISO timestamp
 * @returns Horário formatado
 *
 * @example
 * formatMessageTime("2025-01-22T10:30:00Z")
 * // "10:30"
 */
export function formatMessageTime(timestamp: string | null | undefined): string {
  if (!timestamp) return '';

  const messageDate = new Date(timestamp);

  if (isNaN(messageDate.getTime())) return '';

  return messageDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Obtém timestamp mais recente de uma conversa
 *
 * @param conversation - Conversa com lastMessage
 * @returns Timestamp mais recente (ou null se não houver)
 */
export function getConversationLastTimestamp(
  conversation: {
    lastMessage?: { timestamp?: string } | null;
    last_message_at?: string | null;
    created_at?: string;
  } | null | undefined
): string | null {
  if (!conversation) return null;

  return (
    conversation.lastMessage?.timestamp ||
    conversation.last_message_at ||
    conversation.created_at ||
    null
  );
}

/**
 * Ordena lista de conversas por última mensagem (mais recente primeiro)
 *
 * NOVA FUNÇÃO (2025-11-22): Trabalha diretamente com conversas (não contatos).
 * Cada conversa é um card. Mesmo contato pode ter múltiplas conversas.
 *
 * Ver: docs/LIVECHAT_CONVERSATION_CARDS_REFACTOR.md
 *
 * @param conversations - Lista de conversas a ordenar
 * @param options - Opções de ordenação (padrão: last_message desc)
 * @returns Lista ordenada (nova instância, não modifica original)
 *
 * @example
 * const sorted = sortConversationsByLastMessage(conversations);
 * // Conversas com mensagem mais recente aparecem primeiro
 */
export function sortConversationsByLastMessage(
  conversations: ConversationWithContact[],
  options: ContactListSortOptions = { sortBy: 'last_message', order: 'desc' }
): ConversationWithContact[] {
  // Criar cópia para não mutar original (immutability)
  return [...conversations].sort((a, b) => {
    // Pegar timestamp da última mensagem (ou criação da conversa como fallback)
    const aTime = a.lastMessage?.timestamp || a.last_message_at || a.created_at;
    const bTime = b.lastMessage?.timestamp || b.last_message_at || b.created_at;

    // Conversas sem timestamp vão pro final
    if (!aTime && !bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;

    // Converter para timestamp numérico e comparar
    const comparison = new Date(bTime).getTime() - new Date(aTime).getTime();

    // Aplicar ordem (desc = mais recente primeiro, asc = mais antigo primeiro)
    return options.order === 'desc' ? comparison : -comparison;
  });
}
