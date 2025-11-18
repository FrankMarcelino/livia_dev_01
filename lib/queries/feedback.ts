/**
 * Feedback Queries
 * Operações relacionadas a feedback de mensagens
 */

import { createClient } from '@/lib/supabase/server';
import type { MessageFeedback, MessageFeedbackPayload } from '@/types/livechat';

/**
 * Busca feedback de uma mensagem
 * @param messageId - ID da mensagem
 * @param userId - ID do usuário (para verificar se já deu feedback)
 */
export async function getMessageFeedback(
  messageId: string,
  userId: string
): Promise<MessageFeedback | null> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from('message_feedback')
    .select('*')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found - é esperado
      return null;
    }
    console.error('Error fetching feedback:', error);
    return null;
  }

  return data as MessageFeedback;
}

/**
 * Cria ou atualiza feedback de uma mensagem
 * @param payload - Dados do feedback
 * @param userId - ID do usuário que está dando feedback
 */
export async function upsertMessageFeedback(
  payload: MessageFeedbackPayload,
  userId: string
): Promise<MessageFeedback | null> {
  const supabase = await createClient();

  // Buscar feedback existente
  const existing = await getMessageFeedback(payload.messageId, userId);

  if (existing) {
    // Atualizar feedback existente
    const { data, error } = await (supabase as any)
      .from('message_feedback')
      .update({
        rating: payload.rating,
        comment: payload.comment || null,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating feedback:', error);
      return null;
    }

    return data as MessageFeedback;
  } else {
    // Criar novo feedback
    const { data, error } = await (supabase as any)
      .from('message_feedback')
      .insert({
        tenant_id: payload.tenantId,
        message_id: payload.messageId,
        conversation_id: payload.conversationId,
        rating: payload.rating,
        comment: payload.comment || null,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating feedback:', error);
      return null;
    }

    return data as MessageFeedback;
  }
}

/**
 * Busca todos os feedbacks de uma conversa
 * @param conversationId - ID da conversa
 */
export async function getConversationFeedbacks(
  conversationId: string
): Promise<MessageFeedback[]> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from('message_feedback')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversation feedbacks:', error);
    return [];
  }

  return (data || []) as MessageFeedback[];
}
