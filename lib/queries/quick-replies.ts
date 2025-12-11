/**
 * Quick Replies Queries
 * Operações relacionadas a mensagens rápidas
 * Usa a tabela quick_reply_templates do banco
 */

import { createClient } from '@/lib/supabase/server';
import type {
  QuickReply,
  QuickReplyCreatePayload,
  QuickReplyUpdatePayload
} from '@/types/livechat';

/**
 * Mapeia dados do banco (quick_reply_templates) para o formato usado no código
 * icon → emoji, message → content
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFromDatabase(dbRow: any): QuickReply {
  return {
    id: dbRow.id,
    tenant_id: dbRow.tenant_id,
    emoji: dbRow.icon, // Mapear icon → emoji
    title: dbRow.title,
    content: dbRow.message, // Mapear message → content
    active: dbRow.active ?? true, // Default true para compatibilidade
    usage_count: dbRow.usage_count || 0,
    created_by: dbRow.created_by || '',
    created_at: dbRow.created_at,
    updated_at: dbRow.updated_at,
  };
}

/**
 * Mapeia dados do código para o formato do banco
 * emoji → icon, content → message
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToDatabase(data: Partial<QuickReply>): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped: any = {};

  if (data.id !== undefined) mapped.id = data.id;
  if (data.tenant_id !== undefined) mapped.tenant_id = data.tenant_id;
  if (data.emoji !== undefined) mapped.icon = data.emoji; // Mapear emoji → icon
  if (data.title !== undefined) mapped.title = data.title;
  if (data.content !== undefined) mapped.message = data.content; // Mapear content → message
  if (data.active !== undefined) mapped.active = data.active;
  if (data.usage_count !== undefined) mapped.usage_count = data.usage_count;
  if (data.created_by !== undefined) mapped.created_by = data.created_by;

  return mapped;
}

/**
 * Opções para busca de quick replies
 */
export interface GetQuickRepliesOptions {
  onlyActive?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Resultado da busca de quick replies com metadados de paginação
 */
export interface QuickRepliesResult {
  data: QuickReply[];
  total: number;
  hasMore: boolean;
}

/**
 * Busca quick replies do tenant com paginação e busca server-side
 * @param tenantId - ID do tenant (OBRIGATÓRIO para multi-tenancy)
 * @param options - Opções de busca e paginação
 * @returns Resultado com dados, total e flag hasMore
 */
export async function getQuickReplies(
  tenantId: string,
  options: GetQuickRepliesOptions = {}
): Promise<QuickRepliesResult> {
  const {
    onlyActive = true,
    limit = 50, // Default: 50 por página (balanço entre performance e UX)
    offset = 0,
    search
  } = options;

  const supabase = await createClient();

  let query = supabase
    .from('quick_reply_templates')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);

  if (onlyActive) {
    query = query.eq('active', true);
  }

  // Busca server-side (PostgreSQL ilike - case insensitive)
  if (search && search.trim()) {
    const searchTerm = search.trim();
    query = query.or(`title.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);
  }

  const { data, error, count } = await query
    .order('usage_count', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const total = count || 0;
  const quickReplies = (data || []).map(mapFromDatabase);

  return {
    data: quickReplies,
    total,
    hasMore: offset + limit < total
  };
}

/**
 * LEGACY: Busca todas as quick replies sem paginação
 * @deprecated Use getQuickReplies() com options para paginação
 */
export async function getAllQuickReplies(
  tenantId: string,
  onlyActive: boolean = true
): Promise<QuickReply[]> {
  const result = await getQuickReplies(tenantId, {
    onlyActive,
    limit: 1000 // Limite alto para compatibilidade
  });
  return result.data;
}

/**
 * Busca quick replies mais populares (top N)
 * @param tenantId - ID do tenant
 * @param limit - Número de quick replies a retornar (default: 5)
 */
export async function getPopularQuickReplies(
  tenantId: string,
  limit: number = 5
): Promise<QuickReply[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('quick_reply_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .order('usage_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(mapFromDatabase);
}

/**
 * Busca uma quick reply específica por ID
 * @param id - ID da quick reply
 * @param tenantId - ID do tenant (validação de acesso)
 */
export async function getQuickReplyById(
  id: string,
  tenantId: string
): Promise<QuickReply | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('quick_reply_templates')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    console.error('[getQuickReplyById] Error:', error);
    return null;
  }

  return mapFromDatabase(data);
}

/**
 * Cria nova quick reply
 * @param payload - Dados da quick reply
 * @param userId - ID do usuário que está criando
 */
export async function createQuickReply(
  payload: QuickReplyCreatePayload,
  userId: string
): Promise<QuickReply> {
  const supabase = await createClient();

  // Mapear dados do código para o formato do banco
  const dbData = mapToDatabase({
    tenant_id: payload.tenantId,
    emoji: payload.emoji || null,
    title: payload.title,
    content: payload.content,
    active: true, // Nasce ativa (conforme regra do print)
    usage_count: 0, // Nasce com 0 (conforme regra do print)
    created_by: userId,
  });

  const { data, error } = await supabase
    .from('quick_reply_templates')
    .insert(dbData)
    .select()
    .single();

  if (error) throw error;
  return mapFromDatabase(data);
}

/**
 * Atualiza uma quick reply existente
 * @param id - ID da quick reply
 * @param tenantId - ID do tenant (validação de acesso)
 * @param updates - Campos a atualizar
 */
export async function updateQuickReply(
  id: string,
  tenantId: string,
  updates: QuickReplyUpdatePayload
): Promise<QuickReply> {
  const supabase = await createClient();

  // Mapear dados do código para o formato do banco
  const dbUpdates = mapToDatabase(updates);

  const { data, error } = await supabase
    .from('quick_reply_templates')
    .update(dbUpdates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw error;
  return mapFromDatabase(data);
}

/**
 * Deleta uma quick reply
 * @param id - ID da quick reply
 * @param tenantId - ID do tenant (validação de acesso)
 */
export async function deleteQuickReply(
  id: string,
  tenantId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('quick_reply_templates')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) throw error;
  return true;
}

/**
 * Incrementa contador de uso de quick reply
 * @param id - ID do quick reply
 * @param tenantId - ID do tenant (validação de acesso)
 */
export async function incrementQuickReplyUsage(
  id: string,
  tenantId: string
): Promise<void> {
  const supabase = await createClient();

  // Buscar quick reply atual
  const quickReply = await getQuickReplyById(id, tenantId);
  if (!quickReply) {
    throw new Error('Quick reply not found');
  }

  // Incrementar usage_count
  const newCount = (quickReply.usage_count || 0) + 1;

  const { error } = await supabase
    .from('quick_reply_templates')
    .update({ usage_count: newCount })
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) throw error;
}

/**
 * Busca quick replies por título ou conteúdo
 * @param tenantId - ID do tenant
 * @param search - Termo de busca
 */
export async function searchQuickReplies(
  tenantId: string,
  search: string
): Promise<QuickReply[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('quick_reply_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .or(`title.ilike.%${search}%,message.ilike.%${search}%`) // Usar 'message' ao invés de 'content'
    .order('usage_count', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapFromDatabase);
}
