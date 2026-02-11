/**
 * Tags CRUD Queries
 * Operações de gerenciamento de tags (criar, editar, deletar)
 * Separado de lib/queries/tags.ts (que é para analytics/RPC)
 *
 * NOTA: Os campos tenant_id, send_text e send_text_message existem no banco
 * mas NÃO estão em types/database.ts. Usamos `as any` temporariamente.
 */

import { createClient } from '@/lib/supabase/server';

export interface TagForManagement {
  id: string;
  tag_name: string;
  tag_type: 'description' | 'success' | 'fail' | null;
  color: string;
  active: boolean | null;
  prompt_to_ai: string | null;
  is_category: boolean | null;
  change_conversation_status: string | null;
  send_text: boolean;
  send_text_message: string | null;
  id_neurocore: string | null;
  tenant_id: string | null;
  order_index: number;
  created_at: string;
  isInherited: boolean;
}

export interface CreateTagPayload {
  tag_name: string;
  tag_type: 'description' | 'success' | 'fail';
  color: string;
  active: boolean;
  prompt_to_ai?: string | null;
  is_category: boolean;
  change_conversation_status?: string | null;
  send_text: boolean;
  send_text_message?: string | null;
  tenant_id: string;
}

export interface UpdateTagPayload {
  tag_name?: string;
  tag_type?: 'description' | 'success' | 'fail';
  color?: string;
  active?: boolean;
  prompt_to_ai?: string | null;
  is_category?: boolean;
  change_conversation_status?: string | null;
  send_text?: boolean;
  send_text_message?: string | null;
}

/**
 * Busca tags para gerenciamento: tags do tenant + tags herdadas do neurocore
 */
export async function getTagsForManagement(
  tenantId: string
): Promise<TagForManagement[]> {
  const supabase = await createClient();

  // Buscar neurocore_id do tenant
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .select('neurocore_id')
    .eq('id', tenantId)
    .single();

  if (tenantError || !tenantData) {
    console.error('[getTagsForManagement] Tenant não encontrado:', tenantError);
    throw new Error('Tenant não encontrado');
  }

  const neurocoreId = tenantData.neurocore_id;

  // Buscar tags do tenant (tenant_id = X)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tenantTags, error: tenantTagsError } = await (supabase as any)
    .from('tags')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('tag_type')
    .order('tag_name');

  if (tenantTagsError) {
    console.error('[getTagsForManagement] Erro ao buscar tags do tenant:', tenantTagsError);
    throw tenantTagsError;
  }

  // Buscar tags herdadas do neurocore (id_neurocore = neurocore_id do tenant)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: neurocoreTags, error: neurocoreTagsError } = await (supabase as any)
    .from('tags')
    .select('*')
    .eq('id_neurocore', neurocoreId)
    .is('tenant_id', null)
    .order('tag_type')
    .order('tag_name');

  if (neurocoreTagsError) {
    console.error('[getTagsForManagement] Erro ao buscar tags neurocore:', neurocoreTagsError);
    throw neurocoreTagsError;
  }

  // Mapear com flag isInherited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedTenantTags: TagForManagement[] = (tenantTags || []).map((tag: any) => ({
    ...tag,
    send_text: tag.send_text ?? false,
    send_text_message: tag.send_text_message ?? null,
    tenant_id: tag.tenant_id ?? null,
    isInherited: false,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedNeurocoreTags: TagForManagement[] = (neurocoreTags || []).map((tag: any) => ({
    ...tag,
    send_text: tag.send_text ?? false,
    send_text_message: tag.send_text_message ?? null,
    tenant_id: tag.tenant_id ?? null,
    isInherited: true,
  }));

  return [...mappedNeurocoreTags, ...mappedTenantTags];
}

/**
 * Busca tag por ID, validando acesso pelo tenant
 */
export async function getTagById(
  id: string,
  tenantId: string
): Promise<TagForManagement | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tags')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    console.error('[getTagById] Error:', error);
    return null;
  }

  return {
    ...data,
    send_text: data.send_text ?? false,
    send_text_message: data.send_text_message ?? null,
    tenant_id: data.tenant_id ?? null,
    isInherited: false,
  };
}

/**
 * Cria nova tag do tenant
 */
export async function createTag(
  payload: CreateTagPayload
): Promise<TagForManagement> {
  const supabase = await createClient();

  // Buscar neurocore_id do tenant (necessário para RLS policy)
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .select('neurocore_id')
    .eq('id', payload.tenant_id)
    .single();

  if (tenantError || !tenantData) {
    console.error('[createTag] Tenant não encontrado:', tenantError);
    throw new Error('Tenant não encontrado');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tags')
    .insert({
      tag_name: payload.tag_name,
      tag_type: payload.tag_type,
      color: payload.color,
      active: payload.active,
      prompt_to_ai: payload.prompt_to_ai || null,
      is_category: payload.is_category,
      change_conversation_status: payload.change_conversation_status || null,
      send_text: payload.send_text,
      send_text_message: payload.send_text_message || null,
      tenant_id: payload.tenant_id,
      id_neurocore: tenantData.neurocore_id,
      order_index: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('[createTag] Erro ao criar tag:', error);
    throw error;
  }

  return {
    ...data,
    send_text: data.send_text ?? false,
    send_text_message: data.send_text_message ?? null,
    tenant_id: data.tenant_id ?? null,
    isInherited: false,
  };
}

/**
 * Atualiza tag do tenant
 */
export async function updateTag(
  id: string,
  tenantId: string,
  updates: UpdateTagPayload
): Promise<TagForManagement> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tags')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('[updateTag] Erro ao atualizar tag:', error);
    throw error;
  }

  return {
    ...data,
    send_text: data.send_text ?? false,
    send_text_message: data.send_text_message ?? null,
    tenant_id: data.tenant_id ?? null,
    isInherited: false,
  };
}

/**
 * Deleta tag do tenant
 */
export async function deleteTag(
  id: string,
  tenantId: string
): Promise<boolean> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('tags')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[deleteTag] Erro ao deletar tag:', error);
    throw error;
  }
  return true;
}
