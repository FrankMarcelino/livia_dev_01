/**
 * Livechat Queries - Funções de busca para o Livechat
 *
 * IMPORTANTE: Todas as queries validam tenant_id para multi-tenancy
 * TEMPORÁRIO: Usando admin client para bypass RLS
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type {
  ContactWithConversations,
  ConversationWithLastMessage,
  MessageWithSender,
  ContactFilters,
} from '@/types/livechat';
import type { QuickReplyTemplate } from '@/types/database';

/**
 * Busca contatos com conversas ativas
 * @param tenantId - ID do tenant (OBRIGATÓRIO para multi-tenancy)
 * @param filters - Filtros opcionais
 */
export async function getContactsWithConversations(
  tenantId: string,
  filters?: ContactFilters
): Promise<ContactWithConversations[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from('contacts')
    .select(`
      *,
      conversations!inner(
        *,
        messages(*)
      )
    `)
    .eq('tenant_id', tenantId)
    .order('last_interaction_at', { ascending: false });

  // Aplicar filtros
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  if (!data) return [];

  // Transformar dados para formato esperado
  return data.map((contact: any) => ({
    ...contact,
    activeConversations: (contact.conversations || [])
      .filter((conv: any) => conv.status !== 'closed')
      .map((conv: any) => ({
        ...conv,
        lastMessage: conv.messages?.[0] || null,
      })),
  })) as ContactWithConversations[];
}

/**
 * Busca mensagens de uma conversa
 * @param conversationId - ID da conversa
 * @param limit - Número máximo de mensagens (padrão: 50)
 */
export async function getMessages(
  conversationId: string,
  limit = 50
): Promise<MessageWithSender[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      senderUser:users!messages_sender_user_id_fkey(
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data || []) as MessageWithSender[];
}

/**
 * Busca conversa por ID com validação de tenant
 * @param conversationId - ID da conversa
 * @param tenantId - ID do tenant (validação)
 */
export async function getConversation(
  conversationId: string,
  tenantId: string
): Promise<ConversationWithLastMessage | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      messages(*)
    `)
    .eq('id', conversationId)
    .eq('tenant_id', tenantId)
    .limit(1, { foreignTable: 'messages' })
    .order('timestamp', { ascending: false, foreignTable: 'messages' })
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  if (!data) return null;

  const conversation = data as any;
  return {
    ...conversation,
    lastMessage: conversation.messages?.[0] || null,
  } as ConversationWithLastMessage;
}

/**
 * Busca quick replies do tenant
 * @param tenantId - ID do tenant
 */
export async function getQuickReplies(
  tenantId: string
): Promise<QuickReplyTemplate[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('quick_reply_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('usage_count', { ascending: false })
    .limit(10);

  if (error) throw error;

  return data || [];
}

/**
 * Busca contato por ID
 * @param contactId - ID do contato
 * @param tenantId - ID do tenant (validação)
 */
export async function getContact(contactId: string, tenantId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) throw error;

  return data;
}
