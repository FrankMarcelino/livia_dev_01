import { createClient } from '@/lib/supabase/server';
import type {
  KnowledgeDomain,
  BaseConhecimento,
  BaseConhecimentoWithDomain,
  DomainWithCount,
  CreateBaseConhecimentoData,
  UpdateBaseConhecimentoData,
} from '@/types/knowledge-base';

// ============================================================================
// KNOWLEDGE DOMAINS QUERIES
// ============================================================================

/**
 * Buscar todos os domínios de um neurocore
 */
export async function getDomains(neurocoreId: string): Promise<KnowledgeDomain[]> {
  const supabase = await createClient();

  // Tentar buscar domínios do neurocore específico
  const { data, error } = await supabase
    .from('knowledge_domains')
    .select('*')
    .eq('neurocore_id', neurocoreId)
    .eq('active', true)
    .order('domain', { ascending: true });

  if (error) {
    console.error('[getDomains] Erro ao buscar domínios:', error);
    throw new Error(`Failed to fetch knowledge domains: ${error.message}`);
  }

  // Se não encontrou nenhum, buscar TODOS os domínios ativos (fallback)
  if (!data || data.length === 0) {
    console.warn('[getDomains] Nenhum domínio encontrado para este neurocore, buscando todos os domínios ativos...');

    const { data: allDomains, error: allError } = await supabase
      .from('knowledge_domains')
      .select('*')
      .eq('active', true)
      .order('domain', { ascending: true });

    if (allError) {
      console.error('[getDomains] Erro ao buscar todos os domínios:', allError);
      throw new Error(`Failed to fetch all domains: ${allError.message}`);
    }

    if (allDomains && allDomains.length > 0) {
      console.warn('[getDomains] ⚠️ ATENÇÃO: Usando domínios de outros neurocores! Verifique o neurocore_id dos domínios.');
    }

    return (allDomains || []) as KnowledgeDomain[];
  }

  return (data || []) as KnowledgeDomain[];
}

/**
 * Buscar domínios com contagem de bases
 */
export async function getDomainsWithCount(
  neurocoreId: string,
  tenantId: string
): Promise<DomainWithCount[]> {
  const supabase = await createClient();

  // Buscar domínios do neurocore específico
  let { data: domains, error: domainsError } = await supabase
    .from('knowledge_domains')
    .select('*')
    .eq('neurocore_id', neurocoreId)
    .eq('active', true)
    .order('domain', { ascending: true });

  if (domainsError) {
    console.error('[getDomainsWithCount] Erro ao buscar domínios:', domainsError);
    throw new Error(`Failed to fetch domains: ${domainsError.message}`);
  }

  // Fallback: Se não encontrou domínios para este neurocore, buscar TODOS os domínios
  if (!domains || domains.length === 0) {
    console.warn('[getDomainsWithCount] Nenhum domínio encontrado para este neurocore, buscando todos os domínios ativos...');

    const { data: allDomains, error: allError } = await supabase
      .from('knowledge_domains')
      .select('*')
      .eq('active', true)
      .order('domain', { ascending: true });

    if (allError) {
      console.error('[getDomainsWithCount] Erro ao buscar todos os domínios:', allError);
      throw new Error(`Failed to fetch all domains: ${allError.message}`);
    }

    if (allDomains && allDomains.length > 0) {
      console.warn('[getDomainsWithCount] ⚠️ ATENÇÃO: Usando domínios de outros neurocores! Verifique o neurocore_id dos domínios.');
      domains = allDomains;
    } else {
      console.error('[getDomainsWithCount] Nenhum domínio ativo no sistema');
      return [];
    }
  }

  // Buscar contagem de bases para cada domínio
  const domainsWithCount = await Promise.all(
    domains.map(async (domain) => {
      const { count: totalCount, error: countError } = await supabase
        .from('base_conhecimentos')
        .select('*', { count: 'exact', head: true })
        .eq('domain', domain.id)
        .eq('tenant_id', tenantId);

      const { count: publishedCount, error: publishedError } = await supabase
        .from('base_conhecimentos')
        .select('*', { count: 'exact', head: true })
        .eq('domain', domain.id)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .not('base_conhecimentos_vectors', 'is', null);

      const { count: processingCount, error: processingError } = await supabase
        .from('base_conhecimentos')
        .select('*', { count: 'exact', head: true })
        .eq('domain', domain.id)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .is('base_conhecimentos_vectors', null);

      if (countError || publishedError || processingError) {
        console.error('[getDomainsWithCount] Erro ao contar bases:', {
          domain: domain.domain,
          countError,
          publishedError,
          processingError,
        });
      }

      return {
        ...domain,
        bases_count: totalCount || 0,
        published_count: publishedCount || 0,
        processing_count: processingCount || 0,
      };
    })
  );

  return domainsWithCount as DomainWithCount[];
}

// ============================================================================
// BASE CONHECIMENTO QUERIES
// ============================================================================

/**
 * Buscar todas as bases de um domínio específico
 */
export async function getBasesByDomain(
  domainId: string,
  tenantId: string
): Promise<BaseConhecimento[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('base_conhecimentos')
    .select('*')
    .eq('domain', domainId)
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[getBasesByDomain] Erro ao buscar bases:', error);
    throw new Error(`Failed to fetch bases: ${error.message}`);
  }

  return (data || []) as BaseConhecimento[];
}

/**
 * Buscar base por ID
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
    throw new Error(`Failed to fetch base: ${error.message}`);
  }

  return data as BaseConhecimento;
}

/**
 * Buscar base com informações do domínio
 */
export async function getBaseConhecimentoWithDomain(
  baseId: string,
  tenantId: string
): Promise<BaseConhecimentoWithDomain | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('base_conhecimentos')
    .select(
      `
      *,
      knowledge_domains(*)
    `
    )
    .eq('id', baseId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch base with domain: ${error.message}`);
  }

  return data as BaseConhecimentoWithDomain;
}

/**
 * Criar nova base de conhecimento
 *
 * IMPORTANTE: Base começa com is_active=false e sem vector
 * O N8N será chamado depois para processar e ativar
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
      description: data.description,
      domain: data.domain,
      is_active: false, // Começa desativada até N8N processar
      base_conhecimentos_vectors: null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create base: ${error.message}`);
  }

  return base as BaseConhecimento;
}

/**
 * Atualizar base de conhecimento
 *
 * Se description mudar, reseta vector e is_active
 */
export async function updateBaseConhecimento(
  baseId: string,
  tenantId: string,
  data: UpdateBaseConhecimentoData,
  resetVector: boolean = false
): Promise<BaseConhecimento> {
  const supabase = await createClient();

  const updateData: {
    name?: string;
    domain?: string;
    description?: string;
    is_active?: boolean;
    base_conhecimentos_vectors?: string | null;
  } = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.domain !== undefined) updateData.domain = data.domain;

  // Se description mudou, reseta vector
  if (data.description !== undefined) {
    updateData.description = data.description;
    if (resetVector) {
      updateData.is_active = false;
      updateData.base_conhecimentos_vectors = null;
    }
  }

  const { data: base, error } = await supabase
    .from('base_conhecimentos')
    .update(updateData)
    .eq('id', baseId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update base: ${error.message}`);
  }

  return base as BaseConhecimento;
}

/**
 * Deletar base de conhecimento
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
    throw new Error(`Failed to delete base: ${error.message}`);
  }
}

/**
 * Toggle is_active (ativar/desativar sazonal)
 *
 * Mantém o vector intacto, só muda is_active
 */
export async function toggleBaseActive(
  baseId: string,
  tenantId: string,
  isActive: boolean
): Promise<BaseConhecimento> {
  const supabase = await createClient();

  const { data: base, error } = await supabase
    .from('base_conhecimentos')
    .update({ is_active: isActive })
    .eq('id', baseId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to toggle base active: ${error.message}`);
  }

  return base as BaseConhecimento;
}

/**
 * Atualizar base após N8N processar (callback)
 *
 * Chamado pelo webhook do N8N quando vetor é criado
 */
export async function updateBaseAfterVectorization(
  baseId: string,
  vectorId: string
): Promise<BaseConhecimento> {
  const supabase = await createClient();

  const { data: base, error } = await supabase
    .from('base_conhecimentos')
    .update({
      is_active: true,
      base_conhecimentos_vectors: vectorId,
    })
    .eq('id', baseId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update base after vectorization: ${error.message}`);
  }

  return base as BaseConhecimento;
}
