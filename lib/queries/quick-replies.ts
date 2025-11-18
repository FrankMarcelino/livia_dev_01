/**
 * Quick Replies Queries
 * Operações relacionadas a mensagens rápidas
 */

import { createClient } from '@/lib/supabase/server';
import type { QuickReply, QuickReplyCreatePayload } from '@/types/livechat';

/**
 * Busca quick replies do tenant ordenadas por uso
 * @param tenantId - ID do tenant (OBRIGATÓRIO para multi-tenancy)
 */
export async function getQuickReplies(tenantId: string): Promise<QuickReply[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('quick_reply_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('usage_count', { ascending: false });

  if (error) throw error;
  return (data || []) as QuickReply[];
}

/**
 * Incrementa contador de uso de quick reply
 * @param id - ID do quick reply
 */
export async function incrementQuickReplyUsage(id: string): Promise<void> {
  const supabase = await createClient();

  // Buscar valor atual
  const { data: current } = await supabase
    .from('quick_reply_templates')
    .select('usage_count')
    .eq('id', id)
    .single();

  const currentCount = (current as { usage_count?: number })?.usage_count || 0;

  // Incrementar
  const { error } = await supabase
    .from('quick_reply_templates')
    .update({ usage_count: currentCount + 1 })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Cria nova quick reply
 * @param payload - Dados da quick reply
 */
export async function createQuickReply(
  payload: QuickReplyCreatePayload
): Promise<QuickReply> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('quick_reply_templates')
    .insert({
      tenant_id: payload.tenantId,
      title: payload.title,
      message: payload.message,
      icon: payload.icon || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as QuickReply;
}
