/**
 * Queries para o sistema de Reativacao de Conversas
 *
 * Todas as queries usam createClient (server-side)
 * e filtram por tenant_id para garantir isolamento multi-tenant.
 *
 * NOTA: As tabelas de reativacao (tenant_reactivation_settings,
 * tenant_reactivation_rules_steps, tenant_reactivation_rules_steps_tags)
 * nao estao nos tipos gerados do Supabase.
 * Usamos type assertions temporariamente ate regenerar os tipos.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ReactivationSettings,
  ReactivationStep,
  ReactivationStepWithTags,
} from '@/types/reactivation';

// ===== SETTINGS =====

/**
 * Busca as configuracoes de reativacao do tenant
 */
export async function getReactivationSettings(
  tenantId: string
): Promise<ReactivationSettings | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tenant_reactivation_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching reactivation settings:', error);
    return null;
  }

  return data as ReactivationSettings | null;
}

// ===== STEPS =====

/**
 * Busca os steps de reativacao do tenant com tags populadas
 */
export async function getReactivationSteps(
  tenantId: string
): Promise<ReactivationStepWithTags[]> {
  const supabase = await createClient();

  // Buscar steps ordenados por sequence
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stepsData, error: stepsError } = await (supabase as any)
    .from('tenant_reactivation_rules_steps')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sequence', { ascending: true });

  if (stepsError) {
    console.error('Error fetching reactivation steps:', stepsError);
    return [];
  }

  if (!stepsData || stepsData.length === 0) {
    return [];
  }

  const steps = stepsData as ReactivationStep[];
  const stepIds = steps.map((s) => s.id);

  // Buscar associacoes step-tag
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stepTagsData, error: stepTagsError } = await (supabase as any)
    .from('tenant_reactivation_rules_steps_tags')
    .select('step_id, tag_id')
    .in('step_id', stepIds);

  if (stepTagsError) {
    console.error('Error fetching step tags:', stepTagsError);
    // Retorna steps sem tags
    return steps.map((step) => ({ ...step, tags: [] }));
  }

  const stepTags = (stepTagsData || []) as { step_id: string; tag_id: string }[];

  // Se nao ha tags associadas, retorna steps sem tags
  if (stepTags.length === 0) {
    return steps.map((step) => ({ ...step, tags: [] }));
  }

  // Buscar dados das tags
  const tagIds = [...new Set(stepTags.map((st) => st.tag_id))];
  const { data: tagsData, error: tagsError } = await supabase
    .from('tags')
    .select('id, tag_name, tag_type, color')
    .in('id', tagIds);

  if (tagsError) {
    console.error('Error fetching tags data:', tagsError);
    return steps.map((step) => ({ ...step, tags: [] }));
  }

  const tagsMap = new Map(
    ((tagsData || []) as { id: string; tag_name: string; tag_type: string; color: string | null }[]).map(
      (t) => [t.id, t]
    )
  );

  // Montar step -> tags
  const stepTagsMap = new Map<string, { id: string; tag_name: string; tag_type: string; color: string | null }[]>();
  for (const st of stepTags) {
    const tag = tagsMap.get(st.tag_id);
    if (tag) {
      const existing = stepTagsMap.get(st.step_id) || [];
      existing.push(tag);
      stepTagsMap.set(st.step_id, existing);
    }
  }

  return steps.map((step) => ({
    ...step,
    tags: stepTagsMap.get(step.id) || [],
  }));
}

// ===== TAGS DISPONIVEIS =====

/**
 * Busca todas as tags ativas disponiveis para o tenant
 * (via tenant -> neurocore_id -> tags)
 */
export async function getAvailableTagsForTenant(
  tenantId: string
): Promise<{ id: string; tag_name: string; tag_type: string; color: string | null }[]> {
  const supabase = await createClient();

  // Buscar neurocore_id do tenant
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .select('neurocore_id')
    .eq('id', tenantId)
    .single();

  if (tenantError || !tenantData?.neurocore_id) {
    console.error('Error fetching tenant neurocore_id:', tenantError);
    return [];
  }

  // Buscar tags ativas do neurocore
  const { data: tagsData, error: tagsError } = await supabase
    .from('tags')
    .select('id, tag_name, tag_type, color')
    .eq('id_neurocore', tenantData.neurocore_id)
    .eq('active', true)
    .order('tag_type', { ascending: true })
    .order('order_index', { ascending: true });

  if (tagsError) {
    console.error('Error fetching available tags:', tagsError);
    return [];
  }

  return (tagsData || []) as { id: string; tag_name: string; tag_type: string; color: string | null }[];
}
