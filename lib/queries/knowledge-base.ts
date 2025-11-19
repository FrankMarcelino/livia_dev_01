import { createClient } from '@/lib/supabase/server';
import type {
  Synapse,
  CreateSynapseData,
  UpdateSynapseData,
  SynapsesFilters,
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
