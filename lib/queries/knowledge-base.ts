import { createClient } from '@/lib/supabase/server';
import type {
  Synapse,
  CreateSynapseData,
  UpdateSynapseData,
  SynapsesFilters,
  BaseConhecimento,
  BaseConhecimentoWithCount,
  BaseConhecimentoWithSynapses,
  BaseConhecimentoWithNeuroCore,
  CreateBaseConhecimentoData,
  UpdateBaseConhecimentoData,
} from '@/types/knowledge-base';

/**
 * Buscar todas as synapses de um tenant
 *
 * Princípio SOLID:
 * - Single Responsibility: Apenas busca synapses
 * - Dependency Inversion: Depende da abstração createClient
 */
export async function getSynapses(
  tenantId: string,
  filters?: SynapsesFilters
): Promise<Synapse[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synapses')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  // Aplicar filtros opcionais
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.is_enabled !== undefined) {
    query = query.eq('is_enabled', filters.is_enabled);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch synapses: ${error.message}`);
  }

  return (data || []) as Synapse[];
}

/**
 * Buscar synapse por ID
 */
export async function getSynapse(
  synapseId: string,
  tenantId: string
): Promise<Synapse | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synapses')
    .select('*')
    .eq('id', synapseId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch synapse: ${error.message}`);
  }

  return data as Synapse;
}

/**
 * Criar nova synapse (status: 'draft')
 */
export async function createSynapse(
  tenantId: string,
  baseConhecimentoId: string,
  data: CreateSynapseData
): Promise<Synapse> {
  const supabase = await createClient();

  const { data: synapse, error } = await supabase
    .from('synapses')
    .insert({
      tenant_id: tenantId,
      base_conhecimento_id: baseConhecimentoId,
      title: data.title,
      content: data.content,
      description: data.description || null,
      image_url: data.image_url || null,
      status: 'draft',
      is_enabled: false, // Nova synapse começa desabilitada
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create synapse: ${error.message}`);
  }

  return synapse as Synapse;
}

/**
 * Atualizar synapse existente
 */
export async function updateSynapse(
  synapseId: string,
  tenantId: string,
  data: UpdateSynapseData
): Promise<Synapse> {
  const supabase = await createClient();

  const { data: synapse, error } = await supabase
    .from('synapses')
    .update(data)
    .eq('id', synapseId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update synapse: ${error.message}`);
  }

  return synapse as Synapse;
}

/**
 * Deletar synapse
 */
export async function deleteSynapse(
  synapseId: string,
  tenantId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('synapses')
    .delete()
    .eq('id', synapseId)
    .eq('tenant_id', tenantId);

  if (error) {
    throw new Error(`Failed to delete synapse: ${error.message}`);
  }
}

/**
 * Toggle is_enabled de uma synapse
 */
export async function toggleSynapseEnabled(
  synapseId: string,
  tenantId: string,
  isEnabled: boolean
): Promise<Synapse> {
  return updateSynapse(synapseId, tenantId, { is_enabled: isEnabled });
}

/**
 * Buscar synapses de uma base específica
 *
 * Usado no BaseConhecimentoDialog para exibir synapses da base
 */
export async function getSynapsesByBase(
  baseConhecimentoId: string,
  tenantId: string,
  filters?: SynapsesFilters
): Promise<Synapse[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synapses')
    .select('*')
    .eq('base_conhecimento_id', baseConhecimentoId)
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  // Aplicar filtros opcionais
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.is_enabled !== undefined) {
    query = query.eq('is_enabled', filters.is_enabled);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch synapses: ${error.message}`);
  }

  return (data || []) as Synapse[];
}

// ============================================================================
// BASE DE CONHECIMENTO QUERIES
// ============================================================================

/**
 * Buscar todas as bases de conhecimento de um tenant com contagem de synapses
 *
 * Princípio SOLID:
 * - Single Responsibility: Apenas busca bases com contagem
 * - Performance: JOIN com count (evita N+1 queries)
 */
export async function getBaseConhecimentos(
  tenantId: string
): Promise<BaseConhecimentoWithCount[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('base_conhecimentos')
    .select(
      `
      *,
      synapses(count)
    `,
      { count: 'exact' }
    )
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch bases de conhecimento: ${error.message}`);
  }

  // Transform response para incluir synapses_count
  const basesWithCount: BaseConhecimentoWithCount[] = (data || []).map(
    (base) => ({
      ...base,
      synapses_count: base.synapses?.[0]?.count || 0,
    })
  );

  return basesWithCount;
}

/**
 * Buscar base de conhecimento por ID (sem synapses)
 */
export async function getBaseConhecimento(
  baseId: string,
  tenantId: string
): Promise<BaseConhecimento | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('base_conhecimentos')
    .select('*')
    .eq('id', baseId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch base de conhecimento: ${error.message}`);
  }

  return data as BaseConhecimento;
}

/**
 * Buscar base de conhecimento com synapses relacionadas
 *
 * Usado no BaseConhecimentoDialog para exibir base + synapses
 */
export async function getBaseConhecimentoWithSynapses(
  baseId: string,
  tenantId: string
): Promise<BaseConhecimentoWithSynapses | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('base_conhecimentos')
    .select(
      `
      *,
      synapses(*)
    `
    )
    .eq('id', baseId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch base with synapses: ${error.message}`);
  }

  return data as BaseConhecimentoWithSynapses;
}

/**
 * Buscar base de conhecimento com informações do NeuroCore
 *
 * Usado para exibir nome do NeuroCore no select disabled
 */
export async function getBaseConhecimentoWithNeuroCore(
  baseId: string,
  tenantId: string
): Promise<BaseConhecimentoWithNeuroCore | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('base_conhecimentos')
    .select(
      `
      *,
      neurocores(id, name)
    `
    )
    .eq('id', baseId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(
      `Failed to fetch base with neurocore: ${error.message}`
    );
  }

  return data as BaseConhecimentoWithNeuroCore;
}

/**
 * Criar nova base de conhecimento
 *
 * Nota: neurocore_id vem do tenant (relação 1:1)
 */
export async function createBaseConhecimento(
  tenantId: string,
  neurocoreId: string,
  data: CreateBaseConhecimentoData
): Promise<BaseConhecimento> {
  const supabase = await createClient();

  const { data: base, error } = await supabase
    .from('base_conhecimentos')
    .insert({
      tenant_id: tenantId,
      neurocore_id: neurocoreId,
      name: data.name,
      description: data.description || null,
      is_active: true, // Nova base começa ativa
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create base de conhecimento: ${error.message}`);
  }

  return base as BaseConhecimento;
}

/**
 * Atualizar base de conhecimento existente
 */
export async function updateBaseConhecimento(
  baseId: string,
  tenantId: string,
  data: UpdateBaseConhecimentoData
): Promise<BaseConhecimento> {
  const supabase = await createClient();

  const { data: base, error } = await supabase
    .from('base_conhecimentos')
    .update(data)
    .eq('id', baseId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update base de conhecimento: ${error.message}`);
  }

  return base as BaseConhecimento;
}

/**
 * Deletar base de conhecimento
 *
 * AVISO: Falhará se houver synapses relacionadas (constraint FK)
 */
export async function deleteBaseConhecimento(
  baseId: string,
  tenantId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('base_conhecimentos')
    .delete()
    .eq('id', baseId)
    .eq('tenant_id', tenantId);

  if (error) {
    // Erro específico de FK constraint
    if (error.code === '23503') {
      throw new Error(
        'Não é possível deletar base com synapses relacionadas. Delete ou mova as synapses primeiro.'
      );
    }
    throw new Error(`Failed to delete base de conhecimento: ${error.message}`);
  }
}

/**
 * Toggle is_active de uma base de conhecimento
 */
export async function toggleBaseConhecimentoActive(
  baseId: string,
  tenantId: string,
  isActive: boolean
): Promise<BaseConhecimento> {
  return updateBaseConhecimento(baseId, tenantId, { is_active: isActive });
}
